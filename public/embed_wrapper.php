<?php
// public/embed_wrapper.php

// 1. Security & Configuration
header("Access-Control-Allow-Origin: *"); // Allow fetch from React app
header("Access-Control-Allow-Origin: *"); // Allow fetch from React app
header("X-Frame-Options: ALLOWALL"); // Allow framing by our own app
error_reporting(E_ALL); // ENABLE DEBUGGING
ini_set('display_errors', 1);

// DEBUG LOGGING
function log_debug($msg) {
    file_put_contents('debug_proxy.txt', date('[Y-m-d H:i:s] ') . $msg . "\n", FILE_APPEND);
}

$target_url = isset($_GET['url']) ? $_GET['url'] : '';
log_debug("Hit proxy with URL: " . $target_url);

if (empty($target_url)) {
    die('<div style="color:white;background:black;height:100vh;display:flex;align-items:center;justify-content:center;font-family:sans-serif;">No signal.</div>');
}

// Ensure URL is valid
if (!filter_var($target_url, FILTER_VALIDATE_URL)) {
    die('Invalid URL');
}

// 2. The Masquerade (Header Masking)
$user_agents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0"
];
$random_ua = $user_agents[array_rand($user_agents)];

// 3. The Fetcher (cURL with SSL bypassing for speed/compatibility)
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $target_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true); // Follow redirects to get to the real player
curl_setopt($ch, CURLOPT_USERAGENT, $random_ua);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Performance + compatibility
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);
$html = curl_exec($ch);
$final_url = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL); // Get the actual URL after redirects
curl_close($ch);

if (!$html) {
    die("Failed to retrieve stream.");
}

// 4. The Scrubber (Regex Ad Removal)
// Remove aggressive ad scripts known to infest these players
$patterns = [
    '/<script[^>]*>(.*?)popads(.*?)(<\/script>)/is',
    '/<script[^>]*>(.*?)propeller(.*?)(<\/script>)/is',
    '/<script[^>]*>(.*?)adsterra(.*?)(<\/script>)/is',
    '/<script[^>]*>(.*?)onmousedown(.*?)(<\/script>)/is',
    '/<script[^>]*>(.*?)monetag(.*?)(<\/script>)/is',
    '/<script[^>]*>(.*?)window\.open(.*?)(<\/script>)/is', // Aggressive!
];
$html = preg_replace($patterns, '<!-- AD SCRUBBED -->', $html);


// 5. The Link Fixer (Base Tag Injection)
// Extract domain from final URL to set as base for relative paths (css/js/images)
$url_parts = parse_url($final_url);
$base_url = $url_parts['scheme'] . '://' . $url_parts['host'];
if (isset($url_parts['path'])) {
    // If path ends in a file (e.g. /play.html), strip it. If dir, keep it.
    $path = dirname($url_parts['path']);
    if ($path === '/' || $path === '\\') $path = '';
    $base_url .= $path . '/';
}

$base_tag = '<base href="' . $final_url . '">'; // Use full final URL as base is safer for some players

// Inject Base Tag just after <head>
if (stripos($html, '<head>') !== false) {
    $html = str_ireplace('<head>', '<head>' . $base_tag, $html);
} else {
    // Fallback if no head
    $html = $base_tag . $html;
}

// 6. The Enforcer (Custom CSS & Kill Switch JS)
$custom_code = <<<EOT
<style>
    /* Force compliance */
    html, body { 
        margin: 0 !important; 
        padding: 0 !important; 
        width: 100vw !important; 
        height: 100vh !important; 
        overflow: hidden !important; 
        background: black !important;
    }
    /* Hide common ad overlays */
    #ad, .ad, [id*="banner"], [class*="banner"], [id*="pop"], [class*="pop"] {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
    }
    /* Ensure player is on top */
    video, iframe, #player {
        position: relative !important;
        z-index: 9999 !important;
    }
</style>
<script>
    // THE KILL SWITCH
    (function() {
        console.log("🛡️ ZION Embed Wrapper Active");
        
        // 1. Neutering window.open (Stops Popups)
        window.open = function() {
            console.log("🚫 Popup Blocked by Wrapper");
            return null;
        };

        // 2. Anti-Redirect (Stops Hijacking)
        window.onbeforeunload = function() {
            // Prevent frame busting
            return false;
        };

        // 3. DOM Purge (Removes Ad Elements)
        setInterval(function() {
            var junk = document.querySelectorAll('iframe[src*="ad"], div[style*="z-index: 2147483647"]');
            junk.forEach(el => el.remove());
        }, 1000);
    })();
</script>
EOT;

// Inject Enforcer before </body>
if (stripos($html, '</body>') !== false) {
    $html = str_ireplace('</body>', $custom_code . '</body>', $html);
} else {
    $html .= $custom_code;
}

// 7. Served
echo $html;
?>
