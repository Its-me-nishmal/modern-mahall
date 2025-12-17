import React, { useEffect, useState } from 'react';
import { Bell, X, Check, ArrowLeft } from 'lucide-react';
import {
    getNotificationHistory,
    markNotificationAsRead,
    markAllNotificationsAsRead
} from '../services/notificationService';

interface Notification {
    id: string;
    userId: string;
    title: string;
    body: string;
    type: string;
    timestamp: string;
    read: boolean;
    data?: any;
}

interface NotificationInboxProps {
    userId: string;
    onClose: () => void;
    onUnreadCountChange?: (count: number) => void;
}

const NotificationInbox: React.FC<NotificationInboxProps> = ({ userId, onClose, onUnreadCountChange }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, [userId]);

    const fetchNotifications = async () => {
        setLoading(true);
        const data = await getNotificationHistory(userId);
        setNotifications(data);
        setLoading(false);

        // Update unread count
        const unreadCount = data.filter((n: Notification) => !n.read).length;
        onUnreadCountChange?.(unreadCount);
    };

    const handleMarkAsRead = async (notificationId: string) => {
        await markNotificationAsRead(notificationId);
        setNotifications(prev =>
            prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );

        // Update unread count
        const unreadCount = notifications.filter(n => !n.read && n.id !== notificationId).length;
        onUnreadCountChange?.(unreadCount);
    };

    const handleMarkAllAsRead = async () => {
        await markAllNotificationsAsRead(userId);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        onUnreadCountChange?.(0);
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'announcement':
                return '📢';
            case 'payment':
                return '💰';
            case 'payment_confirmed':
                return '✅';
            case 'approval':
                return '👍';
            default:
                return '🔔';
        }
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
                        {unreadCount > 0 && (
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                                {unreadCount} new
                            </span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                        >
                            Mark all as read
                        </button>
                    )}
                </div>

                {/* Notifications List */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                            <Bell className="w-12 h-12 mb-3 opacity-50" />
                            <p className="text-lg font-medium">No notifications yet</p>
                            <p className="text-sm">You'll see updates here when they arrive</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.read ? 'bg-emerald-50' : ''
                                        }`}
                                    onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                                >
                                    <div className="flex gap-3">
                                        <div className="flex-shrink-0 text-2xl">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className={`font-semibold text-gray-900 ${!notification.read ? 'font-bold' : ''
                                                    }`}>
                                                    {notification.title}
                                                </h3>
                                                {!notification.read && (
                                                    <div className="flex-shrink-0 w-2 h-2 bg-emerald-600 rounded-full mt-2"></div>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {notification.body}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-2">
                                                {formatTimestamp(notification.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationInbox;
