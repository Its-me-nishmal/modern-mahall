import webpush from 'web-push';
import db from '../db/index.js';
import { getVapidKeys } from '../utils/vapidKeys.js';
import { INotification } from '../db/interface.js';

interface PushSubscription {
    userId: string;
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
    createdAt: string;
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
    await db.createSubscription({
        id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        createdAt: new Date()
    });
}

/**
 * Remove a push subscription for a user
 */
export async function removeSubscription(userId: string): Promise<void> {
    const subscriptions = await db.getSubscriptionsByUserId(userId);
    for (const sub of subscriptions) {
        await db.deleteSubscription(sub.id);
    }
}

/**
 * Get subscription for a specific user
 * Returns the first one found
 */
export async function getSubscription(userId: string): Promise<PushSubscription | null> {
    const subscriptions = await db.getSubscriptionsByUserId(userId);
    if (subscriptions.length === 0) return null;

    const sub = subscriptions[0];
    return {
        userId: sub.userId,
        endpoint: sub.endpoint,
        keys: sub.keys,
        createdAt: sub.createdAt.toISOString()
    };
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

        // Save to notification history (in-app notification)
        await saveNotificationHistory(userId, title, body, data?.type || 'general', data);

        if (!subscription) {
            console.log(`No subscription found for user ${userId} (saved to history only)`);
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
    const subscriptions = await db.getAllSubscriptions();
    // Unique user IDs
    const userIds = [...new Set(subscriptions.map(sub => sub.userId))];
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
    await db.createNotification({
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title,
        message: body,
        type: (['info', 'warning', 'success', 'error'].includes(type) ? type : 'info') as any,
        recipients: [userId],
        createdAt: new Date(),
        readBy: []
    });
}

/**
 * Get notification history for a user
 */
export async function getNotificationHistory(userId: string): Promise<any[]> {
    const notifications = await db.getNotificationsByRecipient(userId);

    return notifications
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map(n => ({
            id: n.id,
            userId: userId,
            title: n.title,
            body: n.message,
            type: n.type,
            data: {},
            timestamp: n.createdAt.toISOString(),
            read: n.readBy.includes(userId)
        }));
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
    const notification = await db.getNotificationById(notificationId);

    if (notification) {
        // Since we don't have the user ID from the request params (only notificationId),
        // we try to infer it if there's only one recipient.
        // This is a limitation of the current API design vs the new database schema.
        if (notification.recipients.length === 1) {
            await db.markNotificationAsRead(notificationId, notification.recipients[0]);
        } else {
            // If we really can't determine the user, we might need to update the API route 
            // to pass userId, but for now we'll do a "safe" guess or just log warning.
            // Actually, the `markNotificationAsRead` in `notificationRoutes.ts` does NOT extract userId from auth (req.user).
            // It just calls this service method. 
            // Let's assume for now that if we can't find the user, we can't mark it read.
            console.warn(`Cannot fully mark notification ${notificationId} as read: userId unknown in context.`);
        }
    }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<void> {
    const notifications = await db.getNotificationsByRecipient(userId);
    for (const notif of notifications) {
        if (!notif.readBy.includes(userId)) {
            await db.markNotificationAsRead(notif.id, userId);
        }
    }
}

/**
 * Get unread count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
    const notifications = await db.getNotificationsByRecipient(userId);
    return notifications.filter(n => !n.readBy.includes(userId)).length;
}
