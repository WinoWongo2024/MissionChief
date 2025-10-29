// === PWA Update Strategy: Cache-and-Update / Cache-First ===

// 1. **VERSION CONTROL:** Update this string every time you make changes to your HTML, CSS, or JS. 
// This forces the browser to recognize it as a new Service Worker and trigger the update process.
const CACHE_VERSION = 'dispa-v2.1.0-data-update-oct25';

const CACHE_NAME = `dispa-cache-${CACHE_VERSION}`;

// The list of all assets that should be cached for offline use.
const ASSETS_TO_CACHE = [
    '/', // Required for GitHub Pages or root URL access
    '/index.html',
    '/manifest.json',
    // The main code files:
    // '/script.js', // If you move your <script> contents to a file
    // '/style.css', // If you move your <style> contents to a file
    
    // External Dependencies (Chart.js and Tailwind CDN links MUST be included):
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js',
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800;900&display=swap',
    
    // PWA Icons (if you created the folder structure)
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];


// --- INSTALLATION PHASE ---
self.addEventListener('install', (event) => {
    // Force the new service worker to immediately activate and take control
    // This is key for the "instant update" requirement on deployment.
    self.skipWaiting(); 
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching app shell');
                // Use a try/catch or fetch/add combination for external assets
                return cache.addAll(ASSETS_TO_CACHE.filter(url => url.startsWith('/') || url.startsWith('http')));
            })
            .catch((error) => {
                 console.error('[Service Worker] Failed to cache critical assets:', error);
            })
    );
});


// --- ACTIVATION PHASE ---
self.addEventListener('activate', (event) => {
    // When a new service worker is installed, delete old caches
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((name) => {
                    // Delete caches that don't match the current CACHE_NAME
                    return name.startsWith('dispa-cache-') && name !== CACHE_NAME;
                }).map((name) => {
                    console.log(`[Service Worker] Deleting old cache: ${name}`);
                    return caches.delete(name);
                })
            );
        })
    );
    // Claim control of all pages right away
    event.waitUntil(self.clients.claim());
});


// --- FETCHING PHASE (Cache-First, Network-Fallback) ---
self.addEventListener('fetch', (event) => {
    // We only handle GET requests and ignore cross-origin requests unless they are in our cache list
    if (event.request.method !== 'GET') return;
    
    // Check if the request should be served from the cache first
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return the response from the cache
                if (response) {
                    return response;
                }
                
                // No cache hit - fetch from the network
                return fetch(event.request).catch(() => {
                    // Fallback in case of complete network failure and asset not cached
                    // Since this is a live dashboard, a fallback page is not necessary, just show the browser error.
                });
            })
    );
});
