// Service Worker for Push Notifications
const CACHE_NAME = 'ezystaff-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  const options = {
    body: 'Default notification body',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: {},
    actions: [
      {
        action: 'view',
        title: 'Visualizza',
        icon: '/pwa-192x192.png'
      },
      {
        action: 'close',
        title: 'Chiudi'
      }
    ]
  };

  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.title = data.title || 'EZYSTAFF - Notifica Turno';
    options.data = data;
  }

  event.waitUntil(
    self.registration.showNotification(options.title || 'EZYSTAFF', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const data = event.notification.data || {};
  
  if (event.action === 'view' || !event.action) {
    // Open the app and navigate to relevant page
    const urlToOpen = data.url || '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Check if app is already open
          for (let i = 0; i < clientList.length; i++) {
            const client = clientList[i];
            if (client.url.includes(self.location.origin)) {
              client.focus();
              client.postMessage({ 
                action: 'navigate', 
                url: urlToOpen,
                notificationData: data 
              });
              return;
            }
          }
          // If no client is open, open a new one
          return clients.openWindow(urlToOpen);
        })
    );
  }
});