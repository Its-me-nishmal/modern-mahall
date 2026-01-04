export enum UserRole {
  ADMIN = 'ADMIN',
  HEAD = 'HEAD',
  MEMBER = 'MEMBER'
}

export enum Status {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DELETED_PENDING = 'deleted_pending'
}

export type AnnouncementCategory = 'Program' | 'Death' | 'Notice' | 'Emergency' | 'Data Collect';

export interface DeliveryStats {
  total: number;
  sent: number;
  delivered: number;
  read: number;
}

export interface TargetingCriteria {
  wards?: string[];
  minAge?: number;
  maxAge?: number;
  gender?: 'Male' | 'Female' | 'All';
  role?: 'Head' | 'Member' | 'All';
  specificFamilyIds?: string[];
  specificMemberIds?: string[]; // For individual member selection
  bloodGroup?: string;
  education?: string;
  job?: string;
}

export interface Announcement {
  id: string;
  title: string;
  description: string;
  category: AnnouncementCategory;
  date: string;
  imageUrl?: string;
  videoUrl?: string;
  formUrl?: string;
  location?: string;
  phoneNumber?: string;
  target?: TargetingCriteria;
  stats?: DeliveryStats;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  phone: string;
  role: UserRole;
  name?: string;
  familyId?: string;
}

export interface FamilyMember {
  id: string;
  familyId: string;
  name: string;
  relation: 'Head' | 'Father' | 'Mother' | 'Son' | 'Daughter' | 'Wife' | 'Other';
  age: number; // Keep for backward compatibility, but prefer dob calculation
  dob?: string;
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';
  education?: string;
  job?: string;
  maritalStatus?: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  email?: string;
  phone?: string;
  status: Status;
  gender: 'Male' | 'Female';
  deleteRequested?: boolean;
}

export interface Payment {
  id: string;
  familyId: string;
  memberId?: string;
  memberName?: string;
  amount: number;
  date: string;
  title: string;
  type: string; // Changed from union to string for flexibility
  status: 'Paid' | 'Pending';
}

export interface Feedback {
  id: string;
  familyId: string;
  senderName: string;
  message: string;
  date: string;
  isRead: boolean;
}

export interface Family {
  id: string;
  code: string;
  headName: string; // Denormalized for display
  headId: string;
  ward: string;
  address: string;
  houseName?: string;
  rationCardType?: 'APL' | 'BPL' | 'AAY' | 'PHH' | 'None';
  rationCardNumber?: string;
  mahalNumber?: string; // Special ID for Mahall
  annualIncome?: number;
  members: FamilyMember[];
  status: Status;
  balance: number; // Positive means due, negative means credit
  paymentStatus: 'Paid' | 'Unpaid' | 'Partial';
}

export interface Log {
  id: string;
  action: string;
  timestamp: string;
  details: string;
}

export type ReportType = 'Financial' | 'Demographics' | 'Activity';