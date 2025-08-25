// DineLink Service Worker for PWA functionality
const CACHE_NAME = 'dinelink-v1';
const urlsToCache = [
  '/',
  '/offline',
  '/manifest.json',
  // Add other static assets you want to cache
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('DineLink: Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('DineLink: Cache failed:', error);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        return fetch(event.request).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response for caching
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // If both network and cache fail, show offline page for navigation requests
          if (event.request.destination === 'document') {
            return caches.match('/offline');
          }
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('DineLink: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline actions (when user performs actions while offline)
self.addEventListener('sync', (event) => {
  if (event.tag === 'dinelink-sync') {
    event.waitUntil(
      // Handle offline actions like event creation, orders, payments
      syncOfflineActions()
    );
  }
});

// Push notifications for group dining events
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New dining event update!',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: 'View Event',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('DineLink', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('DineLink: Notification click received.');

  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Sync offline actions function
async function syncOfflineActions() {
  try {
    // Get offline actions from IndexedDB
    // Sync them with the server
    // Clear synced actions
    console.log('DineLink: Syncing offline actions...');
  } catch (error) {
    console.error('DineLink: Sync failed:', error);
  }
}