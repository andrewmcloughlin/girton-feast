// Service Worker for Girton Feast PWA
const CACHE_NAME = 'girton-feast-v5'
const PRE_CACHE_RESOURCES = [
  './',
  './index.html',
  './css/style.css',
  './js/script.js',
  './js/email-protection.js',
  './sw.js',
  // JSON Data
  './vendors.json',
  './entertainment.json',
  './sponsors.json',
  // Pages
  './pages/contact.html',
  './entertainment.html',
  './pages/gallery.html',
  './map.html',
  './pages/stalls.html',
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
  // External Libraries
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css',
  'https://unpkg.com/leaflet/dist/leaflet.css',
  'https://unpkg.com/leaflet/dist/leaflet.js',
  'https://fonts.googleapis.com/css2?family=Sigmar+One&family=Poller+One&family=Poppins:wght@400;700&family=Glass+Antiqua&family=Comfortaa:wght@300..700&family=DynaPuff:wght@400..700&display=swap'
]

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Pre-caching resources')
      return Promise.allSettled(
        PRE_CACHE_RESOURCES.map(url => {
          return cache.add(url).catch(err => {
            console.warn(`SW: Failed to cache ${url}:`, err)
          })
        })
      )
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Deleting old cache', cacheName)
            return caches.delete(cacheName)
          }
          return Promise.resolve()
        })
      )
    })
  )
  return self.clients.claim()
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // Only handle same-origin or allowed CDN requests
  const isSameOrigin = url.origin === self.location.origin
  const isAllowedCDN = [
    'cdn.jsdelivr.net',
    'cdnjs.cloudflare.com',
    'unpkg.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com'
  ].some(domain => url.hostname.includes(domain))

  if (!isSameOrigin && !isAllowedCDN) return

  // Strategy: Stale-While-Revalidate for most, Network-First for navigation
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME)

      // For navigation, try network first to ensure fresh content
      if (event.request.mode === 'navigate' && isSameOrigin) {
        try {
          const networkResponse = await fetch(event.request)
          if (networkResponse.ok) {
            cache.put(event.request, networkResponse.clone())
          }
          return networkResponse
        } catch (error) {
          const cachedResponse = await cache.match(event.request)
          if (cachedResponse) return cachedResponse
          // If no cache, we let it fail or provide a generic offline page if we had one
          throw error
        }
      }

      // For everything else: Stale-While-Revalidate
      const cachedResponse = await cache.match(event.request)
      const fetchPromise = fetch(event.request).then(async (networkResponse) => {
        if (networkResponse.ok) {
          cache.put(event.request, networkResponse.clone())
        }
        return networkResponse
      }).catch(() => {
        return cachedResponse || new Response('Network error occurred', {
          status: 408,
          headers: { 'Content-Type': 'text/plain' }
        })
      })

      return cachedResponse || fetchPromise
    })()
  )
})
