const API_BASE_URL = 'https://modern-mahall-two.vercel.app/api';

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return 'denied';
    }

    const permission = await Notification.requestPermission();
    return permission;
}

/**
 * Register service worker and subscribe to push notifications
 */
export async function subscribeToPushNotifications(userId: string): Promise<boolean> {
    try {
        // Check if service worker is supported
        if (!('serviceWorker' in navigator)) {
            console.warn('Service workers are not supported');
            return false;
        }

        // Wait for service worker to be ready
        const registration = await navigator.serviceWorker.ready;

        // Get VAPID public key from server
        const response = await fetch(`${API_BASE_URL}/notifications/vapid-public-key`);
        const { publicKey } = await response.json();

        // Subscribe to push notifications
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource
        });

        // Send subscription to server
        await fetch(`${API_BASE_URL}/notifications/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId,
                subscription: subscription.toJSON()
            })
        });

        console.log('✓ Subscribed to push notifications');
        return true;
    } catch (error) {
        console.error('Failed to subscribe to push notifications:', error);
        return false;
    }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(userId: string): Promise<boolean> {
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            await subscription.unsubscribe();

            // Remove subscription from server
            await fetch(`${API_BASE_URL}/notifications/unsubscribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId })
            });
        }

        console.log('✓ Unsubscribed from push notifications');
        return true;
    } catch (error) {
        console.error('Failed to unsubscribe:', error);
        return false;
    }
}

/**
 * Get notification history for a user
 */
export async function getNotificationHistory(userId: string): Promise<any[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/notifications/history/${userId}`);
        const notifications = await response.json();
        return notifications;
    } catch (error) {
        console.error('Failed to fetch notification history:', error);
        return [];
    }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
    try {
        await fetch(`${API_BASE_URL}/notifications/mark-read/${notificationId}`, {
            method: 'POST'
        });
    } catch (error) {
        console.error('Failed to mark notification as read:', error);
    }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
        await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId })
        });
    } catch (error) {
        console.error('Failed to mark all as read:', error);
    }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
    try {
        const response = await fetch(`${API_BASE_URL}/notifications/unread-count/${userId}`);
        const { count } = await response.json();
        return count;
    } catch (error) {
        console.error('Failed to get unread count:', error);
        return 0;
    }
}

/**
 * Helper function to convert VAPID key
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray as Uint8Array;
}
