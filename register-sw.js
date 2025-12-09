// Service Worker Registration Script
// This file registers the service worker with proper error handling

// Check if browser supports service workers
if ('serviceWorker' in navigator) {
  // Wait for page to load before registering
  window.addEventListener('load', function() {
    console.log('[PWA] Page loaded, registering service worker...');
    
    // Register service worker
    navigator.serviceWorker.register('./service-worker.js')
      .then(function(registration) {
        console.log('[PWA] Service Worker registered with scope:', registration.scope);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('[PWA] New service worker found:', newWorker);
          
          newWorker.addEventListener('statechange', () => {
            console.log('[PWA] New service worker state:', newWorker.state);
            
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New update available
              console.log('[PWA] New content is available; please refresh.');
              
              // Optional: Show update notification to user
              showUpdateNotification();
            }
          });
        });
      })
      .catch(function(error) {
        console.error('[PWA] Service Worker registration failed:', error);
      });
    
    // Check if page is controlled by a service worker
    if (navigator.serviceWorker.controller) {
      console.log('[PWA] This page is controlled by a service worker');
    }
    
    // Listen for controller change
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[PWA] Service worker controller changed');
    });
  });
  
  // Handle messages from service worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('[PWA] Message from Service Worker:', event.data);
    
    // Handle different message types
    switch (event.data.type) {
      case 'CACHE_UPDATED':
        console.log('[PWA] Cache updated:', event.data.payload);
        break;
      case 'OFFLINE_STATUS':
        updateOfflineStatus(event.data.isOffline);
        break;
    }
  });
  
  // Check online/offline status
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  function updateOnlineStatus() {
    const isOnline = navigator.onLine;
    console.log('[PWA] Online status changed:', isOnline ? 'Online' : 'Offline');
    
    // Send status to service worker
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'ONLINE_STATUS',
        isOnline: isOnline
      });
    }
    
    // Update UI if needed
    updateOfflineStatus(!isOnline);
  }
  
  function updateOfflineStatus(isOffline) {
    if (isOffline) {
      console.log('[PWA] App is offline');
      // You could show an offline indicator here
    } else {
      console.log('[PWA] App is online');
    }
  }
  
  // Function to show update notification
  function showUpdateNotification() {
    // Optional: Implement a UI notification asking user to refresh
    // This is a simple example using alert - you might want a nicer UI
    if (confirm('Une nouvelle version est disponible. Voulez-vous recharger la page?')) {
      window.location.reload();
    }
  }
  
  // Send initial online status
  setTimeout(() => {
    updateOnlineStatus();
  }, 1000);
  
} else {
  console.warn('[PWA] Service workers are not supported in this browser');
}