self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    return caches.delete(cacheName);
                })
            );
        }).then(() => {
            self.clients.claim();
            return self.registration.unregister();
        })
    );
});

self.addEventListener('fetch', (e) => {
    // Pass through all requests to network
    e.respondWith(fetch(e.request));
});
