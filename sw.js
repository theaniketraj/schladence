const CACHE_NAME = 'study-planner-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/manifest.json',
  '/modules/storage.js',
  '/modules/modal.js',
  '/modules/search.js',
  '/modules/notifications.js',
  '/modules/data.js',
  '/modules/onboarding.js',
  '/modules/dashboard.js',
  '/modules/subjects.js',
  '/modules/timetable.js',
  '/modules/homework.js',
  '/modules/attendance.js',
  '/modules/topics.js',
  '/modules/study.js',
  '/modules/calendar.js',
  '/modules/notes.js',
  '/modules/exams.js',
  '/modules/navigation.js',
  '/modules/theme.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  globalThis.skipWaiting();
});

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
  globalThis.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version if found
      if (response) {
        return response;
      }

      // Otherwise fetch from network
      return fetch(event.request).then((networkResponse) => {
        // Don't cache third-party requests or non-GET requests here for simplicity
        if (!event.request.url.startsWith(self.location.origin) || event.request.method !== 'GET') {
          return networkResponse;
        }

        // Cache the dynamically fetched resources
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      });
    }).catch(() => {
      // Fallback for failed network request when not in cache
      // Could return an offline page here if applicable
      if (event.request.mode === 'navigate') {
        return caches.match('/index.html');
      }
    })
  );
});

self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/assets/icons/icon-192x192.png',
      badge: '/assets/icons/icon-192x192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '2'
      }
    };
    event.waitUntil(
      globalThis.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // Check if there is already a window/tab open with the target URL
      for (const element of windowClients) {
        let client = element;
        // If so, just focus it.
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, then open the target URL in a new window/tab.
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
