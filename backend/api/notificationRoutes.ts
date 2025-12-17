import express, { Request, Response } from 'express';
import {
    saveSubscription,
    removeSubscription,
    getNotificationHistory,
    markNotificationAsRead,
    markAllAsRead,
    getUnreadCount,
    sendNotification,
    sendNotificationToAll
} from '../services/notificationService.js';
import { getVapidKeys } from '../utils/vapidKeys.js';

const router = express.Router();

/**
 * GET /api/notifications/vapid-public-key
 * Get the public VAPID key for push subscription
 */
router.get('/vapid-public-key', (req: Request, res: Response) => {
    try {
        const vapidKeys = getVapidKeys();
        res.json({ publicKey: vapidKeys.publicKey });
    } catch (error) {
        res.status(500).json({ message: 'Failed to get VAPID key', error: (error as Error).message });
    }
});

/**
 * POST /api/notifications/subscribe
 * Save a push subscription for a user
 */
router.post('/subscribe', async (req: Request, res: Response) => {
    const { userId, subscription } = req.body;

    if (!userId || !subscription) {
        return res.status(400).json({ message: 'userId and subscription are required' });
    }

    try {
        await saveSubscription(userId, subscription);
        res.json({ message: 'Subscription saved successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to save subscription', error: (error as Error).message });
    }
});

/**
 * POST /api/notifications/unsubscribe
 * Remove a push subscription for a user
 */
router.post('/unsubscribe', async (req: Request, res: Response) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ message: 'userId is required' });
    }

    try {
        await removeSubscription(userId);
        res.json({ message: 'Subscription removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to remove subscription', error: (error as Error).message });
    }
});

/**
 * GET /api/notifications/history/:userId
 * Get notification history for a user
 */
router.get('/history/:userId', async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
        const history = await getNotificationHistory(userId);
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: 'Failed to get notification history', error: (error as Error).message });
    }
});

/**
 * POST /api/notifications/mark-read/:notificationId
 * Mark a notification as read
 */
router.post('/mark-read/:notificationId', async (req: Request, res: Response) => {
    const { notificationId } = req.params;

    try {
        await markNotificationAsRead(notificationId);
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to mark notification as read', error: (error as Error).message });
    }
});

/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read for a user
 */
router.post('/mark-all-read', async (req: Request, res: Response) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ message: 'userId is required' });
    }

    try {
        await markAllAsRead(userId);
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to mark all as read', error: (error as Error).message });
    }
});

/**
 * GET /api/notifications/unread-count/:userId
 * Get unread notification count for a user
 */
router.get('/unread-count/:userId', async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
        const count = await getUnreadCount(userId);
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: 'Failed to get unread count', error: (error as Error).message });
    }
});

/**
 * POST /api/notifications/test
 * Test endpoint to send a notification to all users
 */
router.post('/test', async (req: Request, res: Response) => {
    try {
        console.log('🧪 Testing notification system...');
        const result = await sendNotificationToAll(
            '🧪 Test Notification',
            'This is a test notification from Modern Mahall',
            { type: 'test' }
        );
        res.json({
            message: 'Test notification sent',
            result
        });
    } catch (error) {
        console.error('Test notification error:', error);
        res.status(500).json({ message: 'Failed to send test notification', error: (error as Error).message });
    }
});

/**
 * POST /api/notifications/test-user
 * Test endpoint to send a notification to a specific user
 */
router.post('/test-user', async (req: Request, res: Response) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ message: 'userId is required' });
    }

    try {
        console.log(`🧪 Testing notification for user ${userId}...`);
        const result = await sendNotification(
            userId,
            '🧪 Test Notification',
            'This is a test notification sent to you',
            { type: 'test' }
        );
        res.json({
            message: 'Test notification sent',
            success: result
        });
    } catch (error) {
        console.error('Test notification error:', error);
        res.status(500).json({ message: 'Failed to send test notification', error: (error as Error).message });
    }
});

export default router;
