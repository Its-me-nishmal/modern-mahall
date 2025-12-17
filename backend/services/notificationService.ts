import webpush from 'web-push';
import { readData, writeData } from '../db/fsdb.js';
import { getVapidKeys } from '../utils/vapidKeys.js';

interface PushSubscription {
    userId: string;
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
    createdAt: string;
}

interface NotificationHistory {
    id: string;
    userId: string;
    title: string;
    body: string;
    type: string;
    data?: any;
    timestamp: string;
    read: boolean;
}

/**
 * Initialize web-push with VAPID keys
 * Must be called after environment variables are loaded
 */
export function initializeWebPush() {
    try {
        const vapidKeys = getVapidKeys();
        webpush.setVapidDetails(
            vapidKeys.subject,
            vapidKeys.publicKey,
            vapidKeys.privateKey
        );
        console.log('✓ Web-push initialized with VAPID keys');
    } catch (error) {
        console.error('Failed to initialize web-push:', error);
        throw error;
    }
}

/**
 * Save a push subscription for a user
 */
export async function saveSubscription(userId: string, subscription: any): Promise<void> {
    const subscriptions = await readData<PushSubscription[]>('subscriptions.json') || [];

    // Remove existing subscription for this user
    const filtered = subscriptions.filter(sub => sub.userId !== userId);

    // Add new subscription
    filtered.push({
        userId,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        createdAt: new Date().toISOString()
    });

    await writeData('subscriptions.json', filtered);
}

/**
 * Remove a push subscription for a user
 */
export async function removeSubscription(userId: string): Promise<void> {
    const subscriptions = await readData<PushSubscription[]>('subscriptions.json') || [];
    const filtered = subscriptions.filter(sub => sub.userId !== userId);
    await writeData('subscriptions.json', filtered);
}

/**
 * Get subscription for a specific user
 */
export async function getSubscription(userId: string): Promise<PushSubscription | null> {
    const subscriptions = await readData<PushSubscription[]>('subscriptions.json') || [];
    return subscriptions.find(sub => sub.userId === userId) || null;
}

/**
 * Send push notification to a specific user
 */
export async function sendNotification(
    userId: string,
    title: string,
    body: string,
    data?: any
): Promise<boolean> {
    try {
        const subscription = await getSubscription(userId);

        if (!subscription) {
            console.log(`No subscription found for user ${userId}`);
            return false;
        }

        const payload = JSON.stringify({
            title,
            body,
            data: data || {},
            timestamp: new Date().toISOString()
        });

        const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: subscription.keys
        };

        await webpush.sendNotification(pushSubscription, payload);

        // Save to notification history
        await saveNotificationHistory(userId, title, body, data?.type || 'general', data);

        console.log(`✓ Notification sent to user ${userId}: ${title}`);
        return true;
    } catch (error: any) {
        console.error(`❌ Failed to send notification to user ${userId}:`, {
            error: error.message,
            stack: error.stack,
            statusCode: error.statusCode,
            body: error.body
        });
        return false;
    }
}

/**
 * Send push notification to multiple users
 */
export async function sendBulkNotification(
    userIds: string[],
    title: string,
    body: string,
    data?: any
): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const userId of userIds) {
        const result = await sendNotification(userId, title, body, data);
        if (result) {
            success++;
        } else {
            failed++;
        }
    }

    console.log(`Bulk notification sent: ${success} success, ${failed} failed`);
    return { success, failed };
}

/**
 * Send notification to all subscribed users
 */
export async function sendNotificationToAll(
    title: string,
    body: string,
    data?: any
): Promise<{ success: number; failed: number }> {
    const subscriptions = await readData<PushSubscription[]>('subscriptions.json') || [];
    const userIds = subscriptions.map(sub => sub.userId);
    return sendBulkNotification(userIds, title, body, data);
}

/**
 * Save notification to history
 */
export async function saveNotificationHistory(
    userId: string,
    title: string,
    body: string,
    type: string,
    data?: any
): Promise<void> {
    const notifications = await readData<NotificationHistory[]>('notifications.json') || [];

    notifications.push({
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        title,
        body,
        type,
        data,
        timestamp: new Date().toISOString(),
        read: false
    });

    await writeData('notifications.json', notifications);
}

/**
 * Get notification history for a user
 */
export async function getNotificationHistory(userId: string): Promise<NotificationHistory[]> {
    const notifications = await readData<NotificationHistory[]>('notifications.json') || [];
    return notifications
        .filter(notif => notif.userId === userId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
    const notifications = await readData<NotificationHistory[]>('notifications.json') || [];
    const notification = notifications.find(n => n.id === notificationId);

    if (notification) {
        notification.read = true;
        await writeData('notifications.json', notifications);
    }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<void> {
    const notifications = await readData<NotificationHistory[]>('notifications.json') || [];

    notifications.forEach(notif => {
        if (notif.userId === userId) {
            notif.read = true;
        }
    });

    await writeData('notifications.json', notifications);
}

/**
 * Get unread count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
    const notifications = await readData<NotificationHistory[]>('notifications.json') || [];
    return notifications.filter(notif => notif.userId === userId && !notif.read).length;
}
