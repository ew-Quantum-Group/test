// Service Worker for Eduwell SVT Platform
// Version: 1.0
// Cache Strategy: Cache-First for static assets, Network-First for API calls

const CACHE_NAME = 'eduwell-svt-v1.0';
const OFFLINE_URL = 'offline.html';

// Static assets to cache immediately on install
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
// This event fires when the service worker is first installed
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  // Skip waiting to activate immediately
  self.skipWaiting();
  
  // Pre-cache static assets
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] All assets cached');
      })
      .catch((error) => {
        console.error('[Service Worker] Cache installation failed:', error);
      })
  );
});

// ========== ACTIVATE EVENT ==========
// This event fires when the service worker is activated
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  // Claim clients immediately
  event.waitUntil(clients.claim());
  
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  console.log('[Service Worker] Activated and ready to handle fetches');
});

// ========== FETCH EVENT ==========
// This event fires for every network request
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  
  // Skip cross-origin requests and non-GET requests
  if (requestUrl.origin !== self.location.origin || event.request.method !== 'GET') {
    return;
  }
  
  // Handle navigation requests (HTML pages)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If network fails, return offline page
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }
  
  // Handle API calls - Network First strategy
  if (event.request.url.includes('/api/') || event.request.url.includes('jsonplaceholder')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the API response for future use
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseClone);
            });
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Handle static assets - Cache First strategy
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached version
          console.log('[Service Worker] Serving from cache:', event.request.url);
          return cachedResponse;
        }
        
        // Not in cache, fetch from network
        return fetch(event.request)
          .then((response) => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Cache the new resource
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch((error) => {
            console.log('[Service Worker] Fetch failed; returning offline page:', error);
            
            // For image requests, return a placeholder
            if (event.request.destination === 'image') {
              return caches.match('./assets/images/appicon.png');
            }
            
            // For CSS/JS, return empty response
            if (event.request.destination === 'style' || 
                event.request.destination === 'script') {
              return new Response('', {
                status: 408,
                statusText: 'Network error'
              });
            }
          });
      })
  );
});

// ========== BACKGROUND SYNC ==========
// This handles background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-forms') {
    event.waitUntil(syncForms());
  }
});

// Example background sync function
function syncForms() {
  // This would sync any forms submitted while offline
  console.log('[Service Worker] Syncing forms...');
  return Promise.resolve();
}

// ========== PUSH NOTIFICATIONS ==========
// This handles push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Eduwell SVT';
  const options = {
    body: data.body || 'Nouveau contenu disponible!',
    icon: './assets/images/icon-192x192.png',
    badge: './assets/images/icon-96x96.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || './'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open
        for (const client of clientList) {
          if (client.url === event.notification.data.url && 'focus' in client) {
            return client.focus();
          }
        }
        // Open a new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url);
        }
      })
  );
});