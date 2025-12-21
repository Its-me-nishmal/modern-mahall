/**
 * Filesystem Database Implementation
 * Implements the IDatabase interface using JSON files
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type {
    IDatabase,
    IFamily,
    IMember,
    IAdmin,
    IOTP,
    IPayment,
    INotification,
    IAnnouncement,
    IFeedback,
    ISubscription,
    ILog
} from './interface.js';

const DATA_DIR = path.join(process.cwd(), 'backend', 'data');

export class FileDatabase implements IDatabase {
    private dataDir: string;

    constructor(dataDir: string = DATA_DIR) {
        this.dataDir = dataDir;
    }

    async initialize(): Promise<void> {
        try {
            await fs.mkdir(this.dataDir, { recursive: true });
            console.log(`✓ Filesystem database initialized at: ${this.dataDir}`);

            // Initialize empty files if they don't exist
            const files = [
                'families.json',
                'admins.json',
                'otps.json',
                'payments.json',
                'notifications.json',
                'announcements.json',
                'feedbacks.json',
                'subscriptions.json',
                'logs.json'
            ];

            for (const file of files) {
                const filePath = path.join(this.dataDir, file);
                try {
                    await fs.access(filePath);
                } catch {
                    await fs.writeFile(filePath, '[]', 'utf-8');
                }
            }
        } catch (error) {
            console.error('Failed to initialize filesystem database:', error);
            throw error;
        }
    }

    private async readData<T>(filename: string): Promise<T[]> {
        const filePath = path.join(this.dataDir, filename);
        try {
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data) as T[];
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                return [];
            }
            throw error;
        }
    }

    private async writeData<T>(filename: string, data: T[]): Promise<void> {
        const filePath = path.join(this.dataDir, filename);
        const serializedData = JSON.stringify(data, null, 2);
        await fs.writeFile(filePath, serializedData, 'utf-8');
    }

    // Family Operations
    async getAllFamilies(): Promise<IFamily[]> {
        return await this.readData<IFamily>('families.json');
    }

    async getFamilyById(id: string): Promise<IFamily | null> {
        const families = await this.getAllFamilies();
        return families.find(f => f.id === id) || null;
    }

    async getFamilyByCode(code: string): Promise<IFamily | null> {
        const families = await this.getAllFamilies();
        return families.find(f => f.code === code) || null;
    }

    async createFamily(family: IFamily): Promise<IFamily> {
        const families = await this.getAllFamilies();
        families.push(family);
        await this.writeData('families.json', families);
        return family;
    }

    async updateFamily(id: string, updates: Partial<IFamily>): Promise<IFamily | null> {
        const families = await this.getAllFamilies();
        const index = families.findIndex(f => f.id === id);
        if (index === -1) return null;

        families[index] = { ...families[index], ...updates };
        await this.writeData('families.json', families);
        return families[index];
    }

    async deleteFamily(id: string): Promise<boolean> {
        const families = await this.getAllFamilies();
        const filtered = families.filter(f => f.id !== id);
        if (filtered.length === families.length) return false;

        await this.writeData('families.json', filtered);
        return true;
    }

    // Member Operations
    async getMemberById(id: string): Promise<IMember | null> {
        const families = await this.getAllFamilies();
        for (const family of families) {
            const member = family.members.find(m => m.id === id);
            if (member) return member;
        }
        return null;
    }

    async getMemberByPhone(phone: string): Promise<{ member: IMember; familyId: string } | null> {
        const families = await this.getAllFamilies();
        for (const family of families) {
            const member = family.members.find(m => m.phone === phone);
            if (member) return { member, familyId: family.id };
        }
        return null;
    }

    async addMemberToFamily(familyId: string, member: IMember): Promise<IMember> {
        const families = await this.getAllFamilies();
        const family = families.find(f => f.id === familyId);
        if (!family) throw new Error('Family not found');

        family.members.push(member);
        await this.writeData('families.json', families);
        return member;
    }

    async updateMember(id: string, updates: Partial<IMember>): Promise<IMember | null> {
        const families = await this.getAllFamilies();
        for (const family of families) {
            const memberIndex = family.members.findIndex(m => m.id === id);
            if (memberIndex !== -1) {
                family.members[memberIndex] = { ...family.members[memberIndex], ...updates };
                await this.writeData('families.json', families);
                return family.members[memberIndex];
            }
        }
        return null;
    }

    async deleteMember(id: string): Promise<boolean> {
        const families = await this.getAllFamilies();
        let found = false;

        for (const family of families) {
            const originalLength = family.members.length;
            family.members = family.members.filter(m => m.id !== id);
            if (family.members.length < originalLength) {
                found = true;
            }
        }

        if (found) {
            await this.writeData('families.json', families);
            return true;
        }
        return false;
    }

    // Admin Operations
    async getAllAdmins(): Promise<IAdmin[]> {
        return await this.readData<IAdmin>('admins.json');
    }

    async getAdminByMobile(mobile: string): Promise<IAdmin | null> {
        const admins = await this.getAllAdmins();
        return admins.find(a => a.mobile === mobile) || null;
    }

    async createAdmin(admin: IAdmin): Promise<IAdmin> {
        const admins = await this.getAllAdmins();
        admins.push(admin);
        await this.writeData('admins.json', admins);
        return admin;
    }

    async updateAdmin(id: string, updates: Partial<IAdmin>): Promise<IAdmin | null> {
        const admins = await this.getAllAdmins();
        const index = admins.findIndex(a => a.id === id);
        if (index === -1) return null;

        admins[index] = { ...admins[index], ...updates };
        await this.writeData('admins.json', admins);
        return admins[index];
    }

    async deleteAdmin(id: string): Promise<boolean> {
        const admins = await this.getAllAdmins();
        const filtered = admins.filter(a => a.id !== id);
        if (filtered.length === admins.length) return false;

        await this.writeData('admins.json', filtered);
        return true;
    }

    // OTP Operations
    async createOTP(otp: IOTP): Promise<IOTP> {
        const otps = await this.readData<IOTP>('otps.json');
        // Remove any existing OTP for this mobile
        const filtered = otps.filter(o => o.mobile !== otp.mobile);
        filtered.push(otp);
        await this.writeData('otps.json', filtered);
        return otp;
    }

    async getOTPByMobile(mobile: string): Promise<IOTP | null> {
        const otps = await this.readData<IOTP>('otps.json');
        const validOtps = otps.filter(o =>
            o.mobile === mobile &&
            !o.verified &&
            new Date(o.expiresAt) > new Date()
        );
        return validOtps[validOtps.length - 1] || null;
    }

    async verifyOTP(mobile: string, otp: string): Promise<boolean> {
        const otps = await this.readData<IOTP>('otps.json');
        const otpDoc = otps.find(o =>
            o.mobile === mobile &&
            o.otp === otp &&
            !o.verified &&
            new Date(o.expiresAt) > new Date()
        );

        if (!otpDoc) return false;

        otpDoc.verified = true;
        await this.writeData('otps.json', otps);
        return true;
    }

    async deleteOTP(mobile: string): Promise<boolean> {
        const otps = await this.readData<IOTP>('otps.json');
        const filtered = otps.filter(o => o.mobile !== mobile);
        if (filtered.length === otps.length) return false;

        await this.writeData('otps.json', filtered);
        return true;
    }

    async cleanupExpiredOTPs(): Promise<number> {
        const otps = await this.readData<IOTP>('otps.json');
        const now = new Date();
        const filtered = otps.filter(o => new Date(o.expiresAt) > now);
        const deletedCount = otps.length - filtered.length;

        if (deletedCount > 0) {
            await this.writeData('otps.json', filtered);
        }
        return deletedCount;
    }

    // Payment Operations
    async getAllPayments(): Promise<IPayment[]> {
        return await this.readData<IPayment>('payments.json');
    }

    async getPaymentsByFamilyId(familyId: string): Promise<IPayment[]> {
        const payments = await this.getAllPayments();
        return payments.filter(p => p.familyId === familyId);
    }

    async getPaymentById(id: string): Promise<IPayment | null> {
        const payments = await this.getAllPayments();
        return payments.find(p => p.id === id) || null;
    }

    async createPayment(payment: IPayment): Promise<IPayment> {
        const payments = await this.getAllPayments();
        payments.push(payment);
        await this.writeData('payments.json', payments);
        return payment;
    }

    async updatePayment(id: string, updates: Partial<IPayment>): Promise<IPayment | null> {
        const payments = await this.getAllPayments();
        const index = payments.findIndex(p => p.id === id);
        if (index === -1) return null;

        payments[index] = { ...payments[index], ...updates };
        await this.writeData('payments.json', payments);
        return payments[index];
    }

    async deletePayment(id: string): Promise<boolean> {
        const payments = await this.getAllPayments();
        const filtered = payments.filter(p => p.id !== id);
        if (filtered.length === payments.length) return false;

        await this.writeData('payments.json', filtered);
        return true;
    }

    // Notification Operations
    async getAllNotifications(): Promise<INotification[]> {
        return await this.readData<INotification>('notifications.json');
    }

    async getNotificationById(id: string): Promise<INotification | null> {
        const notifications = await this.getAllNotifications();
        return notifications.find(n => n.id === id) || null;
    }

    async getNotificationsByRecipient(userId: string): Promise<INotification[]> {
        const notifications = await this.getAllNotifications();
        return notifications.filter(n =>
            n.recipients.includes(userId) || n.recipients.includes('all')
        );
    }

    async createNotification(notification: INotification): Promise<INotification> {
        const notifications = await this.getAllNotifications();
        notifications.push(notification);
        await this.writeData('notifications.json', notifications);
        return notification;
    }

    async markNotificationAsRead(id: string, userId: string): Promise<boolean> {
        const notifications = await this.getAllNotifications();
        const notification = notifications.find(n => n.id === id);
        if (!notification) return false;

        if (!notification.readBy.includes(userId)) {
            notification.readBy.push(userId);
            await this.writeData('notifications.json', notifications);
        }
        return true;
    }

    async deleteNotification(id: string): Promise<boolean> {
        const notifications = await this.getAllNotifications();
        const filtered = notifications.filter(n => n.id !== id);
        if (filtered.length === notifications.length) return false;

        await this.writeData('notifications.json', filtered);
        return true;
    }

    // Announcement Operations
    async getAllAnnouncements(): Promise<IAnnouncement[]> {
        const announcements = await this.readData<IAnnouncement>('announcements.json');
        return announcements.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }

    async getAnnouncementById(id: string): Promise<IAnnouncement | null> {
        const announcements = await this.getAllAnnouncements();
        return announcements.find(a => a.id === id) || null;
    }

    async createAnnouncement(announcement: IAnnouncement): Promise<IAnnouncement> {
        const announcements = await this.readData<IAnnouncement>('announcements.json');
        announcements.push(announcement);
        await this.writeData('announcements.json', announcements);
        return announcement;
    }

    async updateAnnouncement(id: string, updates: Partial<IAnnouncement>): Promise<IAnnouncement | null> {
        const announcements = await this.readData<IAnnouncement>('announcements.json');
        const index = announcements.findIndex(a => a.id === id);
        if (index === -1) return null;

        announcements[index] = { ...announcements[index], ...updates };
        await this.writeData('announcements.json', announcements);
        return announcements[index];
    }

    async deleteAnnouncement(id: string): Promise<boolean> {
        const announcements = await this.readData<IAnnouncement>('announcements.json');
        const filtered = announcements.filter(a => a.id !== id);
        if (filtered.length === announcements.length) return false;

        await this.writeData('announcements.json', filtered);
        return true;
    }

    // Feedback Operations
    async getAllFeedbacks(): Promise<IFeedback[]> {
        return await this.readData<IFeedback>('feedbacks.json');
    }

    async getFeedbackById(id: string): Promise<IFeedback | null> {
        const feedbacks = await this.getAllFeedbacks();
        return feedbacks.find(f => f.id === id) || null;
    }

    async getFeedbacksByUserId(userId: string): Promise<IFeedback[]> {
        const feedbacks = await this.getAllFeedbacks();
        return feedbacks.filter(f => f.userId === userId);
    }

    async createFeedback(feedback: IFeedback): Promise<IFeedback> {
        const feedbacks = await this.getAllFeedbacks();
        feedbacks.push(feedback);
        await this.writeData('feedbacks.json', feedbacks);
        return feedback;
    }

    async updateFeedback(id: string, updates: Partial<IFeedback>): Promise<IFeedback | null> {
        const feedbacks = await this.getAllFeedbacks();
        const index = feedbacks.findIndex(f => f.id === id);
        if (index === -1) return null;

        feedbacks[index] = { ...feedbacks[index], ...updates };
        await this.writeData('feedbacks.json', feedbacks);
        return feedbacks[index];
    }

    async deleteFeedback(id: string): Promise<boolean> {
        const feedbacks = await this.getAllFeedbacks();
        const filtered = feedbacks.filter(f => f.id !== id);
        if (filtered.length === feedbacks.length) return false;

        await this.writeData('feedbacks.json', filtered);
        return true;
    }

    // Subscription Operations
    async getAllSubscriptions(): Promise<ISubscription[]> {
        return await this.readData<ISubscription>('subscriptions.json');
    }

    async getSubscriptionsByUserId(userId: string): Promise<ISubscription[]> {
        const subscriptions = await this.getAllSubscriptions();
        return subscriptions.filter(s => s.userId === userId);
    }

    async createSubscription(subscription: ISubscription): Promise<ISubscription> {
        const subscriptions = await this.getAllSubscriptions();
        // Remove existing subscription with same endpoint
        const filtered = subscriptions.filter(s => s.endpoint !== subscription.endpoint);
        filtered.push(subscription);
        await this.writeData('subscriptions.json', filtered);
        return subscription;
    }

    async deleteSubscription(id: string): Promise<boolean> {
        const subscriptions = await this.getAllSubscriptions();
        const filtered = subscriptions.filter(s => s.id !== id);
        if (filtered.length === subscriptions.length) return false;

        await this.writeData('subscriptions.json', filtered);
        return true;
    }

    // Log Operations
    async getAllLogs(): Promise<ILog[]> {
        return await this.readData<ILog>('logs.json');
    }

    async createLog(log: ILog): Promise<ILog> {
        const logs = await this.getAllLogs();
        logs.unshift(log); // Add new logs to the beginning
        // Keep only last 1000 logs to prevent file from growing too large
        const trimmedLogs = logs.slice(0, 1000);
        await this.writeData('logs.json', trimmedLogs);
        return log;
    }

    async deleteLogs(olderThan?: Date): Promise<number> {
        if (!olderThan) return 0;
        const logs = await this.getAllLogs();
        const initialCount = logs.length;
        const filtered = logs.filter(l => new Date(l.timestamp) >= olderThan);
        if (filtered.length !== initialCount) {
            await this.writeData('logs.json', filtered);
        }
        return initialCount - filtered.length;
    }
}

// Legacy exports for backward compatibility
export async function initializeDB(): Promise<void> {
    const db = new FileDatabase();
    await db.initialize();
}

export async function readData<T>(filename: string): Promise<T | null> {
    const db = new FileDatabase();
    const filePath = path.join(DATA_DIR, filename);
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data) as T;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return null;
        }
        throw error;
    }
}

export async function writeData(filename: string, data: any): Promise<void> {
    const filePath = path.join(DATA_DIR, filename);
    const serializedData = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, serializedData, 'utf-8');
}