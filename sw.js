// Service Worker PEM-Pro v3
const CACHE_NAME = 'pem-pro-v3';
const ASSETS = [
    'index.html',
    'manifest.json',
    'icons/icon-72.png',
    'icons/icon-96.png',
    'icons/icon-128.png',
    'icons/icon-144.png',
    'icons/icon-152.png',
    'icons/icon-192.png',
    'icons/icon-384.png',
    'icons/icon-512.png'
];

// Install: cache semua aset statis
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('[SW] Caching aset');
            return cache.addAll(ASSETS).catch(err => {
                console.warn('[SW] Gagal cache beberapa aset:', err);
            });
        })
    );
    self.skipWaiting();
});

// Activate: hapus cache lama
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Fetch: strategi cache-first untuk aset statis, network-first untuk lainnya
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // Untuk aset lokal (relative URL) gunakan cache-first
    if (url.origin === location.origin) {
        event.respondWith(
            caches.match(event.request).then(cached => {
                return cached || fetch(event.request).then(response => {
                    // Cache respons yang berhasil
                    if (response && response.status === 200) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    }
                    return response;
                });
            }).catch(() => {
                    // Offline fallback
                    if (event.request.mode === 'navigate') {
                        return caches.match('index.html');
                    }
                    return new Response('Offline', { status: 503 });
            })
        );
    } else {
        // Untuk external link, langsung fetch
        event.respondWith(fetch(event.request));
    }
});
