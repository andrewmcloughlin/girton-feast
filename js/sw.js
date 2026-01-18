// Service Worker for Girton Feast PWA
const CACHE_NAME = 'girton-feast-v2';
const urlsToCache = [
    '/girton-feast/',
    '/girton-feast/index.html',
    '/girton-feast/css/style.css',
    '/girton-feast/js/script.js',
    '/girton-feast/js/email-protection.js',
    '/girton-feast/sponsors.json',
    '/girton-feast/components/navbar.html',
    '/girton-feast/components/footer.html',
    '/girton-feast/pages/contact.html',
    '/girton-feast/pages/main-event.html',
    '/girton-feast/pages/entertainment.html',
    '/girton-feast/pages/food.html',
    '/girton-feast/pages/gallery.html',
    '/girton-feast/pages/getting-here.html',
    '/girton-feast/pages/map.html',
    '/girton-feast/pages/stalls.html',
    '/girton-feast/info/stall-holders.html',
    '/girton-feast/info/caterers-info.html',
    '/girton-feast/info/ride-vendors-info.html',
    '/girton-feast/images/mascot.png',
    '/girton-feast/images/hero.png',
    '/girton-feast/images/helping-goose.svg',
    '/girton-feast/images/rule-the-world-jump.png',
    '/girton-feast/images/silly_goose.svg',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
    'https://fonts.googleapis.com/css2?family=Sigmar+One&family=Poller+One&family=Poppins:wght@400;700&display=swap'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request);
            }
            )
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
