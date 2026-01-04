
/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotificationInbox from '../NotificationInbox';
import * as notificationService from '../../services/notificationService';

// Mock notification service
jest.mock('../../services/notificationService');

describe('NotificationInbox', () => {
    const mockNotifications = [
        {
            id: '1',
            userId: 'user1',
            title: 'Test Notification',
            body: 'This is a test',
            type: 'announcement',
            timestamp: new Date().toISOString(),
            read: false
        },
        {
            id: '2',
            userId: 'user1',
            title: 'Read Notification',
            body: 'This is read',
            type: 'payment',
            timestamp: new Date().toISOString(),
            read: true
        }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        (notificationService.getNotificationHistory as jest.Mock).mockResolvedValue(mockNotifications);
    });

    test('renders notifications after loading', async () => {
        render(<NotificationInbox userId="user1" onClose={jest.fn()} />);

        expect(screen.getByText('Notifications')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Test Notification')).toBeInTheDocument();
            expect(screen.getByText('Read Notification')).toBeInTheDocument();
        });
    });

    test('shows unread count', async () => {
        render(<NotificationInbox userId="user1" onClose={jest.fn()} />);

        await waitFor(() => {
            expect(screen.getByText('1 new')).toBeInTheDocument();
        });
    });

    test('marks notification as read on click', async () => {
        (notificationService.markNotificationAsRead as jest.Mock).mockResolvedValue(true);
        const onUnreadChange = jest.fn();

        render(
            <NotificationInbox
                userId="user1"
                onClose={jest.fn()}
                onUnreadCountChange={onUnreadChange}
            />
        );

        await waitFor(() => {
            expect(screen.getByText('Test Notification')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Test Notification'));

        expect(notificationService.markNotificationAsRead).toHaveBeenCalledWith('1');
    });

    test('updates unread count when marking all as read', async () => {
        (notificationService.markAllNotificationsAsRead as jest.Mock).mockResolvedValue(true);
        const onUnreadChange = jest.fn();

        render(
            <NotificationInbox
                userId="user1"
                onClose={jest.fn()}
                onUnreadCountChange={onUnreadChange}
            />
        );

        await waitFor(() => {
            expect(screen.getAllByText(/Mark all as read/i)[0]).toBeInTheDocument();
        });

        fireEvent.click(screen.getAllByText(/Mark all as read/i)[0]);

        await waitFor(() => {
            expect(onUnreadChange).toHaveBeenCalledWith(0);
        });
    });

    test('shows empty state when no notifications', async () => {
        (notificationService.getNotificationHistory as jest.Mock).mockResolvedValue([]);

        render(<NotificationInbox userId="user1" onClose={jest.fn()} />);

        await waitFor(() => {
            expect(screen.getByText('No notifications yet')).toBeInTheDocument();
        });
    });
});
