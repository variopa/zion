# Deploying ZION (React/Vite) to cPanel

This guide details how to deploy your built React application to a cPanel shared hosting environment.

## 1. Prepare the Build
Run the build command in your local project terminal:
```bash
npm run build
```
This will create a `dist` folder in your project directory containing the production-ready files.

## 2. Check the Output
Ensure the `dist` folder contains:
- `index.html`
- `assets/` (folder with JS/CSS)
- `manifest.webmanifest` (or `manifest.json`)
- `sw.js` (Service Worker)

## 3. .htaccess (Already Included)
The `.htaccess` file has been added to your `public` folder, so it will be automatically included in the `dist` folder when you build.

This file handles client-side routing to prevent "404 Not Found" errors when refreshing pages.

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>
```

> **Note:** If you are deploying to a subdirectory (e.g., `yourdomain.com/app`), change `RewriteBase /` to `RewriteBase /app/` and `RewriteRule . /index.html [L]` to `RewriteRule . /app/index.html [L]`.

## 4. Upload to cPanel
1.  **Log in to cPanel** and open **File Manager**.
2.  Navigate to `public_html` (or your subdomain folder).
3.  **Upload** the contents of your `dist` folder (files and folders).
    - You can zip the contents of `dist`, upload the zip, and then extract it on the server for speed.
4.  Ensure `.htaccess` is present (you may need to enable "Show Hidden Files" in File Manager settings).

## 5. Verify PWA
- Go to your website on a mobile device.
- You should see the prompt to "Add to Home Screen".
- The address bar should match your `theme_color` (Orange).
