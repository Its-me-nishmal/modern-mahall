/**
 * MongoDB Database Implementation
 * Implements the IDatabase interface using Mongoose
 */

import mongoose, { Schema, Model } from 'mongoose';
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

// Mongoose Schemas
const MemberSchema = new Schema<IMember>({
    id: { type: String, required: true },
    familyId: { type: String, required: true },
    name: { type: String, required: true },
    relation: { type: String, required: true },
    age: { type: Number, required: true },
    dob: { type: String },
    bloodGroup: { type: String },
    education: { type: String },
    job: { type: String },
    maritalStatus: { type: String },
    email: { type: String },
    gender: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    phone: { type: String }
});

const FamilySchema = new Schema<IFamily>({
    id: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
    headName: { type: String, required: true },
    headId: { type: String, required: true },
    ward: { type: String, required: true },
    address: { type: String, required: true },
    houseName: { type: String },
    rationCardType: { type: String, enum: ['APL', 'BPL', 'AAY', 'PHH', 'None'] },
    rationCardNumber: { type: String },
    mahalNumber: { type: String },
    annualIncome: { type: Number },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    paymentStatus: { type: String, enum: ['Paid', 'Unpaid', 'Partial'], default: 'Unpaid' },
    balance: { type: Number, default: 0 },
    members: [MemberSchema]
}, { timestamps: true });

const AdminSchema = new Schema<IAdmin>({
    id: { type: String, required: true, unique: true },
    mobile: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['ADMIN', 'SUPER_ADMIN'], default: 'ADMIN' },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const OTPSchema = new Schema<IOTP>({
    id: { type: String, required: true, unique: true },
    mobile: { type: String, required: true, index: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    verified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const PaymentSchema = new Schema<IPayment>({
    id: { type: String, required: true, unique: true },
    familyId: { type: String, required: true, index: true },
    memberId: { type: String },
    memberName: { type: String },
    amount: { type: Number, required: true },
    title: { type: String, default: 'Payment' },
    date: { type: String, default: () => new Date().toISOString().split('T')[0] },
    type: { type: String, default: 'General' },
    method: { type: String, default: 'Cash' },
    status: { type: String, default: 'Pending' },
    reference: { type: String }
}, { timestamps: true });

const NotificationSchema = new Schema<INotification>({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['info', 'warning', 'success', 'error'], default: 'info' },
    recipients: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
    readBy: [{ type: String }]
}, { timestamps: true });

const AnnouncementSchema = new Schema<IAnnouncement>({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    content: { type: String, default: '' },
    category: { type: String, default: 'General' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: String, default: 'admin' },
    imageUrl: { type: String },
    videoUrl: { type: String },
    formUrl: { type: String },
    location: { type: String },
    phoneNumber: { type: String },
    target: {
        wards: [{ type: String }],
        minAge: { type: Number },
        maxAge: { type: Number },
        gender: { type: String, enum: ['Male', 'Female', 'All'] },
        bloodGroup: { type: String },
        education: { type: String },
        job: { type: String },
        specificFamilyIds: [{ type: String }],
        specificMemberIds: [{ type: String }]
    },
    stats: {
        total: { type: Number, default: 0 },
        sent: { type: Number, default: 0 },
        delivered: { type: Number, default: 0 },
        read: { type: Number, default: 0 }
    }
}, { timestamps: true });

const FeedbackSchema = new Schema<IFeedback>({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    familyId: { type: String, required: true },
    message: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5 },
    createdAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' }
}, { timestamps: true });

const SubscriptionSchema = new Schema<ISubscription>({
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
        p256dh: { type: String, required: true },
        auth: { type: String, required: true }
    },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const LogSchema = new Schema<ILog>({
    id: { type: String, required: true, unique: true },
    action: { type: String, required: true },
    performedBy: { type: String, required: true },
    performedByName: { type: String },
    targetType: { type: String },
    targetId: { type: String },
    details: { type: String },
    timestamp: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

// Models
const FamilyModel: Model<IFamily> = mongoose.model('Family', FamilySchema);
const AdminModel: Model<IAdmin> = mongoose.model('Admin', AdminSchema);
const OTPModel: Model<IOTP> = mongoose.model('OTP', OTPSchema);
const PaymentModel: Model<IPayment> = mongoose.model('Payment', PaymentSchema);
const NotificationModel: Model<INotification> = mongoose.model('Notification', NotificationSchema);
const AnnouncementModel: Model<IAnnouncement> = mongoose.model('Announcement', AnnouncementSchema);
const FeedbackModel: Model<IFeedback> = mongoose.model('Feedback', FeedbackSchema);
const SubscriptionModel: Model<ISubscription> = mongoose.model('Subscription', SubscriptionSchema);
const LogModel: Model<ILog> = mongoose.model('Log', LogSchema);

export class MongoDatabase implements IDatabase {
    private connectionString: string;
    private isConnected: boolean = false;

    constructor(connectionString: string) {
        this.connectionString = connectionString;
    }

    async initialize(): Promise<void> {
        if (this.isConnected) {
            console.log('MongoDB already connected');
            return;
        }

        try {
            await mongoose.connect(this.connectionString);
            this.isConnected = true;
            console.log('✓ MongoDB connected successfully');
        } catch (error) {
            console.error('MongoDB connection error:', error);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        if (this.isConnected) {
            await mongoose.disconnect();
            this.isConnected = false;
            console.log('MongoDB disconnected');
        }
    }

    // Family Operations
    async getAllFamilies(): Promise<IFamily[]> {
        return await FamilyModel.find().lean();
    }

    async getFamilyById(id: string): Promise<IFamily | null> {
        return await FamilyModel.findOne({ id }).lean();
    }

    async getFamilyByCode(code: string): Promise<IFamily | null> {
        return await FamilyModel.findOne({ code }).lean();
    }

    async createFamily(family: IFamily): Promise<IFamily> {
        const newFamily = new FamilyModel(family);
        return (await newFamily.save()).toObject();
    }

    async updateFamily(id: string, updates: Partial<IFamily>): Promise<IFamily | null> {
        return await FamilyModel.findOneAndUpdate({ id }, updates, { new: true }).lean();
    }

    async deleteFamily(id: string): Promise<boolean> {
        const result = await FamilyModel.deleteOne({ id });
        return result.deletedCount > 0;
    }

    // Member Operations
    async getMemberById(id: string): Promise<IMember | null> {
        const family = await FamilyModel.findOne({ 'members.id': id }).lean();
        if (!family) return null;
        return family.members.find(m => m.id === id) || null;
    }

    async getMemberByPhone(phone: string): Promise<{ member: IMember; familyId: string } | null> {
        const family = await FamilyModel.findOne({ 'members.phone': phone }).lean();
        if (!family) return null;
        const member = family.members.find(m => m.phone === phone);
        if (!member) return null;
        return { member, familyId: family.id };
    }

    async addMemberToFamily(familyId: string, member: IMember): Promise<IMember> {
        const family = await FamilyModel.findOneAndUpdate(
            { id: familyId },
            { $push: { members: member } },
            { new: true }
        ).lean();
        if (!family) throw new Error('Family not found');
        return member;
    }

    async updateMember(id: string, updates: Partial<IMember>): Promise<IMember | null> {
        const family = await FamilyModel.findOne({ 'members.id': id });
        if (!family) return null;

        const memberIndex = family.members.findIndex(m => m.id === id);
        if (memberIndex === -1) return null;

        Object.assign(family.members[memberIndex], updates);
        await family.save();
        return family.members[memberIndex];
    }

    async deleteMember(id: string): Promise<boolean> {
        const result = await FamilyModel.updateOne(
            { 'members.id': id },
            { $pull: { members: { id } } }
        );
        return result.modifiedCount > 0;
    }

    // Admin Operations
    async getAllAdmins(): Promise<IAdmin[]> {
        return await AdminModel.find().lean();
    }

    async getAdminByMobile(mobile: string): Promise<IAdmin | null> {
        return await AdminModel.findOne({ mobile }).lean();
    }

    async createAdmin(admin: IAdmin): Promise<IAdmin> {
        const newAdmin = new AdminModel(admin);
        return (await newAdmin.save()).toObject();
    }

    async updateAdmin(id: string, updates: Partial<IAdmin>): Promise<IAdmin | null> {
        return await AdminModel.findOneAndUpdate({ id }, updates, { new: true }).lean();
    }

    async deleteAdmin(id: string): Promise<boolean> {
        const result = await AdminModel.deleteOne({ id });
        return result.deletedCount > 0;
    }

    // OTP Operations
    async createOTP(otp: IOTP): Promise<IOTP> {
        // Delete any existing OTP for this mobile number first
        await OTPModel.deleteMany({ mobile: otp.mobile });
        const newOTP = new OTPModel(otp);
        return (await newOTP.save()).toObject();
    }

    async getOTPByMobile(mobile: string): Promise<IOTP | null> {
        return await OTPModel.findOne({ mobile, verified: false }).sort({ createdAt: -1 }).lean();
    }

    async verifyOTP(mobile: string, otp: string): Promise<boolean> {
        const otpDoc = await OTPModel.findOne({
            mobile,
            otp,
            verified: false,
            expiresAt: { $gt: new Date() }
        });

        if (!otpDoc) return false;

        otpDoc.verified = true;
        await otpDoc.save();
        return true;
    }

    async deleteOTP(mobile: string): Promise<boolean> {
        const result = await OTPModel.deleteMany({ mobile });
        return result.deletedCount > 0;
    }

    async cleanupExpiredOTPs(): Promise<number> {
        const result = await OTPModel.deleteMany({ expiresAt: { $lt: new Date() } });
        return result.deletedCount;
    }

    // Payment Operations
    async getAllPayments(): Promise<IPayment[]> {
        return await PaymentModel.find().lean();
    }

    async getPaymentById(id: string): Promise<IPayment | null> {
        return await PaymentModel.findOne({ id }).lean();
    }

    async getPaymentsByFamilyId(familyId: string): Promise<IPayment[]> {
        return await PaymentModel.find({ familyId }).lean();
    }

    async createPayment(payment: IPayment): Promise<IPayment> {
        const newPayment = new PaymentModel(payment);
        return (await newPayment.save()).toObject();
    }

    async updatePayment(id: string, updates: Partial<IPayment>): Promise<IPayment | null> {
        return await PaymentModel.findOneAndUpdate({ id }, updates, { new: true }).lean();
    }

    async deletePayment(id: string): Promise<boolean> {
        const result = await PaymentModel.deleteOne({ id });
        return result.deletedCount > 0;
    }

    // Notification Operations
    async getAllNotifications(): Promise<INotification[]> {
        return await NotificationModel.find().lean();
    }

    async getNotificationById(id: string): Promise<INotification | null> {
        return await NotificationModel.findOne({ id }).lean();
    }

    async getNotificationsByRecipient(userId: string): Promise<INotification[]> {
        return await NotificationModel.find({
            $or: [
                { recipients: userId },
                { recipients: 'all' }
            ]
        }).lean();
    }

    async createNotification(notification: INotification): Promise<INotification> {
        const newNotification = new NotificationModel(notification);
        return (await newNotification.save()).toObject();
    }

    async markNotificationAsRead(id: string, userId: string): Promise<boolean> {
        const result = await NotificationModel.updateOne(
            { id },
            { $addToSet: { readBy: userId } }
        );
        return result.modifiedCount > 0;
    }

    async deleteNotification(id: string): Promise<boolean> {
        const result = await NotificationModel.deleteOne({ id });
        return result.deletedCount > 0;
    }

    // Announcement Operations
    async getAllAnnouncements(): Promise<IAnnouncement[]> {
        return await AnnouncementModel.find().sort({ createdAt: -1 }).lean();
    }

    async getAnnouncementById(id: string): Promise<IAnnouncement | null> {
        return await AnnouncementModel.findOne({ id }).lean();
    }

    async createAnnouncement(announcement: IAnnouncement): Promise<IAnnouncement> {
        const newAnnouncement = new AnnouncementModel(announcement);
        return (await newAnnouncement.save()).toObject();
    }

    async updateAnnouncement(id: string, updates: Partial<IAnnouncement>): Promise<IAnnouncement | null> {
        return await AnnouncementModel.findOneAndUpdate({ id }, updates, { new: true }).lean();
    }

    async deleteAnnouncement(id: string): Promise<boolean> {
        const result = await AnnouncementModel.deleteOne({ id });
        return result.deletedCount > 0;
    }

    // Feedback Operations
    async getAllFeedbacks(): Promise<IFeedback[]> {
        return await FeedbackModel.find().lean();
    }

    async getFeedbackById(id: string): Promise<IFeedback | null> {
        return await FeedbackModel.findOne({ id }).lean();
    }

    async getFeedbacksByUserId(userId: string): Promise<IFeedback[]> {
        return await FeedbackModel.find({ userId }).lean();
    }

    async createFeedback(feedback: IFeedback): Promise<IFeedback> {
        const newFeedback = new FeedbackModel(feedback);
        return (await newFeedback.save()).toObject();
    }

    async updateFeedback(id: string, updates: Partial<IFeedback>): Promise<IFeedback | null> {
        return await FeedbackModel.findOneAndUpdate({ id }, updates, { new: true }).lean();
    }

    async deleteFeedback(id: string): Promise<boolean> {
        const result = await FeedbackModel.deleteOne({ id });
        return result.deletedCount > 0;
    }

    // Subscription Operations
    async getAllSubscriptions(): Promise<ISubscription[]> {
        return await SubscriptionModel.find().lean();
    }

    async getSubscriptionsByUserId(userId: string): Promise<ISubscription[]> {
        return await SubscriptionModel.find({ userId }).lean();
    }

    async createSubscription(subscription: ISubscription): Promise<ISubscription> {
        // Delete any existing subscription with the same endpoint
        await SubscriptionModel.deleteMany({ endpoint: subscription.endpoint });
        const newSubscription = new SubscriptionModel(subscription);
        return (await newSubscription.save()).toObject();
    }

    async deleteSubscription(id: string): Promise<boolean> {
        const result = await SubscriptionModel.deleteOne({ id });
        return result.deletedCount > 0;
    }

    // Log Operations
    async getAllLogs(): Promise<ILog[]> {
        return await LogModel.find().sort({ timestamp: -1 }).lean();
    }

    async createLog(log: ILog): Promise<ILog> {
        const newLog = new LogModel(log);
        return (await newLog.save()).toObject();
    }

    async deleteLogs(olderThan?: Date): Promise<number> {
        if (olderThan) {
            const result = await LogModel.deleteMany({ timestamp: { $lt: olderThan } });
            return result.deletedCount;
        }
        const result = await LogModel.deleteMany({});
        return result.deletedCount;
    }
}
