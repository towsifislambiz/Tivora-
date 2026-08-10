importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize Firebase App in Service Worker using same credentials
firebase.initializeApp({
  apiKey: "AIzaSyA3rVPzDS-Caf_DdCcgReYdR3zRi11rMT8",
  authDomain: "tivora-2abd2.firebaseapp.com",
  projectId: "tivora-2abd2",
  storageBucket: "tivora-2abd2.firebasestorage.app",
  messagingSenderId: "134721635663",
  appId: "1:134721635663:web:78bdcc75c0281e0a71713a"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.data?.title || payload.notification?.title || 'Tivora Notification';
  const notificationOptions = {
    body: payload.data?.body || payload.notification?.body || 'New message on Tivora',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    data: payload.data || {},
    tag: payload.data?.conversationId || payload.data?.callId || 'tivora-notif'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  let targetUrl = '/';

  if (data.conversationId) {
    targetUrl = `/#messages`;
  } else if (data.callId) {
    targetUrl = `/#call/${data.callId}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
