import React, { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import {
    requestNotificationPermission,
    subscribeToPushNotifications,
    getUnreadCount
} from '../services/notificationService';

interface NotificationManagerProps {
    userId: string;
    onUnreadCountChange?: (count: number) => void;
}

const NotificationManager: React.FC<NotificationManagerProps> = ({ userId, onUnreadCountChange }) => {
    const [showPrompt, setShowPrompt] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        // Check current notification permission
        if ('Notification' in window) {
            setPermission(Notification.permission);

            // Show prompt if permission not granted
            if (Notification.permission === 'default') {
                // Delay showing prompt to avoid overwhelming user on login
                setTimeout(() => setShowPrompt(true), 2000);
            } else if (Notification.permission === 'granted') {
                // Subscribe to push notifications
                subscribeToPushNotifications(userId);

                // Fetch initial unread count
                fetchUnreadCount();
            }
        }
    }, [userId]);

    const fetchUnreadCount = async () => {
        const count = await getUnreadCount(userId);
        onUnreadCountChange?.(count);
    };

    const handleEnableNotifications = async () => {
        const permission = await requestNotificationPermission();
        setPermission(permission);

        if (permission === 'granted') {
            await subscribeToPushNotifications(userId);
            setShowPrompt(false);
            fetchUnreadCount();
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
    };

    if (!showPrompt || permission !== 'default') {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 max-w-sm bg-white rounded-lg shadow-2xl border border-gray-200 p-4 z-50 animate-slide-up">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Bell className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                        Stay Updated
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                        Get notified about new announcements, payments, and important updates
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={handleEnableNotifications}
                            className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                            Enable Notifications
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Not Now
                        </button>
                    </div>
                </div>
                <button
                    onClick={handleDismiss}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default NotificationManager;
