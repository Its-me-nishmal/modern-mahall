/**
 * Database Interface
 * Common interface for all database implementations (filesystem, MongoDB, etc.)
 */

export interface IFamily {
    id: string;
    code: string;
    headName: string;
    headId: string;
    ward: string;
    address: string;
    houseName?: string;
    rationCardType?: 'APL' | 'BPL' | 'AAY' | 'PHH' | 'None';
    rationCardNumber?: string;
    mahalNumber?: string;
    annualIncome?: number;
    status: 'pending' | 'approved' | 'rejected';
    paymentStatus: 'Paid' | 'Unpaid' | 'Partial';
    balance: number;
    members: IMember[];
}

export interface IMember {
    id: string;
    familyId: string;
    name: string;
    relation: string;
    age: number;
    dob?: string;
    bloodGroup?: string;
    education?: string;
    job?: string;
    maritalStatus?: string;
    email?: string;
    gender: string;
    status: 'pending' | 'approved' | 'rejected';
    phone?: string;
}

export interface IAdmin {
    id: string;
    mobile: string;
    name: string;
    role: 'ADMIN' | 'SUPER_ADMIN';
    createdAt?: Date;
}

export interface IOTP {
    id: string;
    mobile: string;
    otp: string;
    expiresAt: Date;
    verified: boolean;
    createdAt: Date;
}

export interface IPayment {
    id: string;
    familyId: string;
    memberId?: string;
    memberName?: string;
    amount: number;
    title?: string;
    date: string;
    type?: string;
    method: string;
    status?: string;
    reference?: string;
}

export interface INotification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
    recipients: string[]; // Array of user IDs or 'all'
    createdAt: Date;
    readBy: string[]; // Array of user IDs who have read
}

export interface IAnnouncement {
    id: string;
    title: string;
    content: string;
    category: string;
    priority: 'low' | 'medium' | 'high';
    createdAt: Date;
    createdBy: string;
    imageUrl?: string;
    videoUrl?: string;
    formUrl?: string;
    location?: string;
    phoneNumber?: string;
    target?: {
        wards?: string[];
        minAge?: number;
        maxAge?: number;
        gender?: 'Male' | 'Female' | 'All';
        bloodGroup?: string;
        education?: string;
        job?: string;
        specificFamilyIds?: string[];
        specificMemberIds?: string[];
    };
    stats?: {
        total: number;
        sent: number;
        delivered: number;
        read: number;
    };
}

export interface IFeedback {
    id: string;
    userId: string;
    familyId: string;
    message: string;
    rating?: number;
    createdAt: Date;
    status: 'pending' | 'reviewed' | 'resolved';
}

export interface ISubscription {
    id: string;
    userId: string;
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
    createdAt: Date;
}

export interface ILog {
    id: string;
    action: string;
    performedBy: string;
    performedByName?: string;
    targetType?: string;
    targetId?: string;
    details?: string;
    timestamp: Date;
}

/**
 * Database Operations Interface
 * All database implementations must conform to this interface
 */
export interface IDatabase {
    // Initialization
    initialize(): Promise<void>;
    disconnect?(): Promise<void>;

    // Family Operations
    getAllFamilies(): Promise<IFamily[]>;
    getFamilyById(id: string): Promise<IFamily | null>;
    getFamilyByCode(code: string): Promise<IFamily | null>;
    createFamily(family: IFamily): Promise<IFamily>;
    updateFamily(id: string, updates: Partial<IFamily>): Promise<IFamily | null>;
    deleteFamily(id: string): Promise<boolean>;

    // Member Operations
    getMemberById(id: string): Promise<IMember | null>;
    getMemberByPhone(phone: string): Promise<{ member: IMember; familyId: string } | null>;
    addMemberToFamily(familyId: string, member: IMember): Promise<IMember>;
    updateMember(id: string, updates: Partial<IMember>): Promise<IMember | null>;
    deleteMember(id: string): Promise<boolean>;

    // Admin Operations
    getAllAdmins(): Promise<IAdmin[]>;
    getAdminByMobile(mobile: string): Promise<IAdmin | null>;
    createAdmin(admin: IAdmin): Promise<IAdmin>;
    updateAdmin(id: string, updates: Partial<IAdmin>): Promise<IAdmin | null>;
    deleteAdmin(id: string): Promise<boolean>;

    // OTP Operations
    createOTP(otp: IOTP): Promise<IOTP>;
    getOTPByMobile(mobile: string): Promise<IOTP | null>;
    verifyOTP(mobile: string, otp: string): Promise<boolean>;
    deleteOTP(mobile: string): Promise<boolean>;
    cleanupExpiredOTPs(): Promise<number>; // Returns number of deleted OTPs

    // Payment Operations
    getAllPayments(): Promise<IPayment[]>;
    getPaymentById(id: string): Promise<IPayment | null>;
    getPaymentsByFamilyId(familyId: string): Promise<IPayment[]>;
    createPayment(payment: IPayment): Promise<IPayment>;
    updatePayment(id: string, updates: Partial<IPayment>): Promise<IPayment | null>;
    deletePayment(id: string): Promise<boolean>;

    // Notification Operations
    getAllNotifications(): Promise<INotification[]>;
    getNotificationById(id: string): Promise<INotification | null>;
    getNotificationsByRecipient(userId: string): Promise<INotification[]>;
    createNotification(notification: INotification): Promise<INotification>;
    markNotificationAsRead(id: string, userId: string): Promise<boolean>;
    deleteNotification(id: string): Promise<boolean>;

    // Announcement Operations
    getAllAnnouncements(): Promise<IAnnouncement[]>;
    getAnnouncementById(id: string): Promise<IAnnouncement | null>;
    createAnnouncement(announcement: IAnnouncement): Promise<IAnnouncement>;
    updateAnnouncement(id: string, updates: Partial<IAnnouncement>): Promise<IAnnouncement | null>;
    deleteAnnouncement(id: string): Promise<boolean>;

    // Feedback Operations
    getAllFeedbacks(): Promise<IFeedback[]>;
    getFeedbackById(id: string): Promise<IFeedback | null>;
    getFeedbacksByUserId(userId: string): Promise<IFeedback[]>;
    createFeedback(feedback: IFeedback): Promise<IFeedback>;
    updateFeedback(id: string, updates: Partial<IFeedback>): Promise<IFeedback | null>;
    deleteFeedback(id: string): Promise<boolean>;

    // Subscription Operations (Push Notifications)
    getAllSubscriptions(): Promise<ISubscription[]>;
    getSubscriptionsByUserId(userId: string): Promise<ISubscription[]>;
    createSubscription(subscription: ISubscription): Promise<ISubscription>;
    deleteSubscription(id: string): Promise<boolean>;

    // Log Operations
    getAllLogs(): Promise<ILog[]>;
    createLog(log: ILog): Promise<ILog>;
    deleteLogs(olderThan?: Date): Promise<number>;
}
