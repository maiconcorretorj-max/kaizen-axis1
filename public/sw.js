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

// No fetch listener. We want the browser to handle all requests natively
// to avoid stalling file uploads (POSTs with stream bodies).
