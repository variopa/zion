import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useLocation } from 'react-router-dom';

/**
 * High-Traffic Optimized Analytics Hook
 * - Uses localStorage caching to prevent DB spam (1 event per movie/path per day)
 * - Fetches and caches Geo-IP region data
 * - Non-blocking asynchronous execution
 */
export function usePlatformMetrics(movieTitle = null) {
    const location = useLocation();
    const sessionIdRef = useRef(null);
    const heartbeatIntervalRef = useRef(null);
    const regionRef = useRef('Unknown');

    // Initialize session ID and Region
    useEffect(() => {
        const initTracking = async () => {
            // 1. Session ID Setup
            let sid = localStorage.getItem('zion_session_id');
            if (!sid) {
                // HTTP safe random ID
                sid = 'session_' + Math.random().toString(36).substr(2, 9) + Date.now();
                localStorage.setItem('zion_session_id', sid);
            }
            sessionIdRef.current = sid;

            // 2. Region Geo-IP Fetch (Cached)
            let cachedRegion = localStorage.getItem('zion_region_info');
            if (!cachedRegion) {
                try {
                    const res = await fetch('https://ipapi.co/json/');
                    if (res.ok) {
                        const data = await res.json();
                        const regionObj = {
                            city: data.city,
                            country: data.country_name,
                            country_code: data.country_code,
                            isp: data.org
                        };
                        cachedRegion = JSON.stringify(regionObj);
                        localStorage.setItem('zion_region_info', cachedRegion);
                    } else {
                        cachedRegion = JSON.stringify({ city: 'Global', country: 'Global' });
                    }
                } catch (e) {
                    cachedRegion = JSON.stringify({ city: 'Global', country: 'Global' });
                }
            }
            regionRef.current = JSON.parse(cachedRegion);

            // 3. Trigger initial view track AFTER init
            trackPageView();
        };

        // Fire and forget
        initTracking();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Track Page Views (Debounced via LocalStorage)
    const trackPageView = async () => {
        if (!sessionIdRef.current) return;
        const path = location.pathname;

        // Skip Admin Routes entirely
        if (path.startsWith('/birthna')) return;

        // Anti-Spam Check: Have we tracked this specific path today?
        const todayStr = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
        const cacheKey = `zion_tracked_${path}_${todayStr}`;

        if (localStorage.getItem(cacheKey) === 'true') {
            // User already counted for this page today. Skip DB call entirely.
            return;
        }

        try {
            const userAgent = navigator.userAgent;
            let deviceType = 'Desktop';
            if (/Mobi|Android/i.test(userAgent)) deviceType = 'Mobile';
            else if (/Tablet|iPad/i.test(userAgent)) deviceType = 'Tablet';

            // Mark as tracked locally BEFORE network request to prevent rapid double-fires
            localStorage.setItem(cacheKey, 'true');

            // Fire and forget to Supabase
            await supabase.from('site_traffic_logs').insert([{
                session_id: sessionIdRef.current,
                path: path,
                movie_title: movieTitle,
                device_type: deviceType,
                region_info: regionRef.current
            }]);
        } catch (error) {
            // Silently fail on network/duplicate errors to not crash frontend
            console.warn('Analytics silent fail:', error.message);
        }
    };

    // Re-evaluate on path change (if already init)
    useEffect(() => {
        if (sessionIdRef.current) {
            trackPageView();
        }
    }, [location.pathname, movieTitle]);

    // Live Session Heartbeat (Only active on movie/tv watch pages)
    useEffect(() => {
        if (!movieTitle || !sessionIdRef.current) return;

        const sendHeartbeat = async () => {
            try {
                const userAgent = navigator.userAgent;
                let deviceType = 'Desktop';
                if (/Mobi|Android/i.test(userAgent)) deviceType = 'Mobile';

                await supabase.from('active_presence').upsert({
                    session_id: sessionIdRef.current,
                    current_path: location.pathname,
                    movie_title: movieTitle,
                    device_type: deviceType,
                    region_info: regionRef.current,
                    last_heartbeat: new Date().toISOString()
                }, { onConflict: 'session_id' });
            } catch (error) {
                // Ignore silent heartbeat failures
            }
        };

        // Initial heartbeat
        sendHeartbeat();

        // Send heartbeat every 30 seconds
        heartbeatIntervalRef.current = setInterval(sendHeartbeat, 30000);

        return () => {
            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
            }
        };
    }, [movieTitle, location.pathname]);
}
