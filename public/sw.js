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
