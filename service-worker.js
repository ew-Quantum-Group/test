// Service Worker for Eduwell SVT Platform
// Version: 1.0
// Cache Strategy: Cache-First for static assets

const CACHE_NAME = 'eduwell-svt-v1.3';
const OFFLINE_URL = 'offline.html';
const DESTINATION_URL = 'https://edu-well.netlify.app/quizqcm/svtapp';

// URLs to cache on install
const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './register-sw.js',
  './offline.html',
  './manifest.json',
  './assets/images/appicon.png',
  './assets/images/icon-192x192.png',
  './assets/images/icon-512x512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// ========== INSTALL EVENT ==========
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  // Force activation of new service worker
  self.skipWaiting();
  
  // Pre-cache critical resources
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS)
          .then(() => {
            console.log('[SW] All assets cached successfully');
            return self.skipWaiting();
          })
          .catch((error) => {
            console.error('[SW] Cache addAll failed:', error);
          });
      })
  );
});

// ========== ACTIVATE EVENT ==========
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  // Clean up old caches
  event.waitUntil(
    Promise.all([
      // Claim clients immediately
      clients.claim(),
      
      // Clean old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
  
  console.log('[SW] Activated and ready');
});

// ========== FETCH EVENT ==========
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // Skip cross-origin requests (except CDN)
  if (url.origin !== self.location.origin && 
      !url.href.includes('cdnjs.cloudflare.com')) {
    return;
  }
  
  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('./index.html')
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              return caches.match(OFFLINE_URL);
            });
        })
    );
    return;
  }
  
  // For all other requests, use cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached response if found
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Otherwise fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone response for caching
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch((error) => {
            console.log('[SW] Fetch failed:', error);
            
            // For images, return a fallback
            if (event.request.destination === 'image') {
              return caches.match('./assets/images/appicon.png');
            }
            
            // For CSS, return cached version if available
            if (event.request.destination === 'style') {
              return caches.match('./style.css');
            }
            
            // For JS, return cached version if available
            if (event.request.destination === 'script') {
              return caches.match('./script.js');
            }
            
            return null;
          });
      })
  );
});

// ========== MESSAGE EVENT ==========
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ========== BACKGROUND SYNC ==========
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
});

// ========== PUSH NOTIFICATIONS ==========
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: 'Nouveau contenu disponible sur Eduwell SVT!',
    icon: './assets/images/icon-192x192.png',
    badge: './assets/images/appicon.png',
    vibrate: [200, 100, 200],
    data: {
      url: './index.html'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('Eduwell SVT', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes('./index.html') && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('./index.html');
        }
      })
  );
});
