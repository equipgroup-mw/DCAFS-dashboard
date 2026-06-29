// Unique identifier for this specific PWA
const CACHE_NAME = 'dcafs-dashboard-v2.0.0';
const UNIQUE_ID = 'dcafs-malawi-2026';

// Clean up old caches on install
self.addEventListener('install', (event) => {
  console.log('🔄 DCAFS Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 DCAFS Service Worker: Caching app shell');
      return cache.addAll([
        '/',
        '/index.html',
        '/DCAFS.html',
        '/EQUIP.html',
        '/manifest.json',
        '/DCAFS.png',
        '/EQUIP.png',
        '/EquipLogo.png'
      ]);
    }).then(() => {
      console.log('✅ DCAFS Service Worker: Installation complete');
      // Force activation without waiting
      return self.skipWaiting();
    })
  );
});

// Activate and clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 DCAFS Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Delete any cache that doesn't match our current cache name
            return cacheName !== CACHE_NAME;
          })
          .map((cacheName) => {
            console.log('🗑️ DCAFS Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      console.log('✅ DCAFS Service Worker: Activation complete');
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Network-first strategy for HTML, Cache-first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return;
  
  // Network-first for HTML pages (always get latest)
  if (request.headers.get('Accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the latest version
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // If offline, serve from cache
          return caches.match(request);
        })
    );
    return;
  }
  
  // Cache-first for static assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached response and update cache in background
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, networkResponse.clone());
            });
          }
          return networkResponse;
        }).catch(() => {
          // Network failed, cached response already returned
        });
        
        return cachedResponse;
      }
      
      // Not in cache, fetch from network
      return fetch(request).then((networkResponse) => {
        // Cache successful responses
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      });
    })
  );
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      version: CACHE_NAME,
      id: UNIQUE_ID,
      timestamp: Date.now()
    });
  }
});

console.log('🎯 DCAFS Service Worker loaded:', {
  cache: CACHE_NAME,
  id: UNIQUE_ID
});
