const CACHE_NAME = 'financepro-cache-v2';
const OFFLINE_URL = '/~offline';

const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Add offline fallback if it exists, otherwise ignore error
      return cache.addAll(ASSETS_TO_CACHE).catch(err => console.warn('Cache add error', err));
    }).then(() => self.skipWaiting())
  );
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
    }).then(() => self.clientsClaim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  // Exclude API requests from caching
  if (event.request.url.includes('/api/')) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.open(CACHE_NAME).then((cache) => {
          return cache.match(OFFLINE_URL).then((response) => {
             return response || new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
          });
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then((response) => {
        // Only cache basic responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Exclude Next.js hot-reloading requests from cache
        if (event.request.url.includes('/_next/webpack-hmr')) return response;
        
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      }).catch(() => {
        // Return a fallback if applicable
        return new Response('', { status: 408, statusText: 'Request Timeout' });
      });
    })
  );
});

self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const title = data.title || 'Dica do Fin 🤖';
      const options = {
        body: data.body || 'Você tem uma nova notificação.',
        icon: '/logo.png',
        badge: '/icon-192x192.png',
        data: {
          url: data.url || '/'
        },
        actions: data.actions || []
      };
      event.waitUntil(
        self.registration.showNotification(title, options)
      );
    } catch (e) {
      const text = event.data.text();
      event.waitUntil(
        self.registration.showNotification('Dica do Fin 🤖', {
          body: text,
          icon: '/logo.png',
          badge: '/icon-192x192.png'
        })
      );
    }
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  let urlToOpen = event.notification.data?.url || '/';
  
  if (event.action) {
    if (event.action === 'speak_fin') {
      urlToOpen = '/?startVoice=true';
    } else if (event.action.startsWith('increase_limit_')) {
      const goalId = event.action.replace('increase_limit_', '');
      urlToOpen = `/?increaseLimit=${goalId}`;
    }
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let client of clientList) {
        if (client.url.includes(location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
