// Service Worker for Girton Feast PWA
const CACHE_NAME = 'girton-feast-v3'
const PRE_CACHE_RESOURCES = [
  './',
  './index.html',
  './css/style.css',
  './js/script.js',
  './js/email-protection.js',
  './js/sw.js',
  // JSON Data
  './vendors.json',
  './entertainment.json',
  './sponsors.json',
  './beer-tent.json',
  // Pages
  './pages/contact.html',
  './pages/entertainment.html',
  './pages/food.html',
  './pages/gallery.html',
  './pages/getting-here.html',
  './pages/map.html',
  './pages/stalls.html',
  './pages/beer-tent.html',
  './pages/agenda-map.html',
  // Info Pages
  './info/stall-holders.html',
  './info/caterers-info.html',
  './info/ride-vendors-info.html',
  // Components
  './components/navbar.html',
  './components/footer.html',
  './components/mobile-nav.html',
  // Images (Core UI)
  './images/mascot.png',
  './images/hero.png',
  './images/helping-goose.svg',
  './images/rule-the-world-jump.png',
  './images/silly_goose.svg',
  './images/girton-feast-logo-text.svg',
  './images/goose_golf.svg',
  // External Libraries (Pre-caching core versions)
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css',
  'https://unpkg.com/leaflet/dist/leaflet.css',
  'https://unpkg.com/leaflet/dist/leaflet.js',
  'https://fonts.googleapis.com/css2?family=Sigmar+One&family=Poller+One&family=Poppins:wght@400;700&display=swap'
]

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache')
        // We use addAll but catch individual failures to avoid the whole pre-cache failing
        // if one tiny asset is missing during development.
        return Promise.allSettled(
          PRE_CACHE_RESOURCES.map(url => cache.add(url))
        ).then(results => {
          const failed = results.filter(r => r.status === 'rejected')
          if (failed.length > 0) {
            console.warn('Some resources failed to pre-cache:', failed.map(f => f.reason))
          }
          return cache
        })
      })
  )
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Strategy: Stale-While-Revalidate
  // We serve the cached version immediately, but also fetch the latest from the network
  // and update the cache in the background.
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchedResponse = fetch(event.request).then((networkResponse) => {
          // Only cache successful GET requests
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic' && event.request.method === 'GET') {
            cache.put(event.request, networkResponse.clone())
          }
          return networkResponse
        }).catch(() => {
          // If network fails, return cached response if we have it
          return cachedResponse
        })

        return cachedResponse || fetchedResponse
      })
    })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME]
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName)
          }
          return null
        })
      )
    })
  )
})
