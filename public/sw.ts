import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// Custom Service Worker for Push Notifications

// Install event
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installed');
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activated');
    event.waitUntil(self.clients.claim());
});

// Push event - Handle incoming push notifications
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push notification received', event);

    if (!event.data) {
        console.log('Push event but no data');
        return;
    }

    try {
        const data = event.data.json();
        console.log('Push data:', data);

        const title = data.title || 'Modern Mahall';
        const options: NotificationOptions = {
            body: data.body || 'You have a new notification',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            vibrate: [200, 100, 200],
            data: data.data || {},
            tag: data.data?.type || 'notification',
            requireInteraction: false,
            silent: false, // Ensure sound is enabled
            renotify: true, // Allow re-notification with same tag
        };

        console.log('Attempting to show notification:', title, options);

        event.waitUntil(
            self.registration.showNotification(title, options)
                .then(() => {
                    console.log('✓ Notification displayed successfully:', title);
                })
                .catch((error) => {
                    console.error('❌ Failed to display notification:', error);
                })
        );
    } catch (error) {
        console.error('Error handling push event:', error);
    }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event.notification);

    event.notification.close();

    // Open the app when notification is clicked
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If app is already open, focus it
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise, open a new window
            if (self.clients.openWindow) {
                return self.clients.openWindow('/');
            }
        })
    );
});

// Message event - Handle messages from the app
self.addEventListener('message', (event) => {
    console.log('Service Worker: Message received', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

export { };
