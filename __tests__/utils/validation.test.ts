import { z } from 'zod';
import { sendOTPSchema, verifyOTPSchema, registerSchema, memberSchema, paymentSchema, announcementSchema } from '../backend/utils/validation';

describe('Validation Schemas', () => {
    describe('sendOTPSchema', () => {
        test('should accept valid Indian mobile number', () => {
            const result = sendOTPSchema.safeParse({ mobile: '919876543210' });
            expect(result.success).toBe(true);
        });

        test('should reject invalid mobile format', () => {
            const result = sendOTPSchema.safeParse({ mobile: '123' });
            expect(result.success).toBe(false);
        });

        test('should reject non-Indian numbers', () => {
            const result = sendOTPSchema.safeParse({ mobile: '019876543210' });
            expect(result.success).toBe(false);
        });
    });

    describe('verifyOTPSchema', () => {
        test('should accept valid OTP', () => {
            const result = verifyOTPSchema.safeParse({
                mobile: '919876543210',
                otp: '123456'
            });
            expect(result.success).toBe(true);
        });

        test('should reject OTP with wrong length', () => {
            const result = verifyOTPSchema.safeParse({
                mobile: '919876543210',
                otp: '12345'
            });
            expect(result.success).toBe(false);
        });

        test('should reject non-numeric OTP', () => {
            const result = verifyOTPSchema.safeParse({
                mobile: '919876543210',
                otp: 'ABCDEF'
            });
            expect(result.success).toBe(false);
        });
    });

    describe('registerSchema', () => {
        const validData = {
            phone: '919876543210',
            headName: 'John Doe',
            address: '123 Main Street',
            ward: 'Ward 1',
            age: 35,
            gender: 'Male' as const
        };

        test('should accept valid registration data', () => {
            const result = registerSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        test('should reject age below 18', () => {
            const result = registerSchema.safeParse({ ...validData, age: 17 });
            expect(result.success).toBe(false);
        });

        test('should reject age above 120', () => {
            const result = registerSchema.safeParse({ ...validData, age: 121 });
            expect(result.success).toBe(false);
        });

        test('should reject invalid gender', () => {
            const result = registerSchema.safeParse({ ...validData, gender: 'Other' });
            expect(result.success).toBe(false);
        });

        test('should trim whitespace from name', () => {
            const result = registerSchema.safeParse({ ...validData, headName: '  John Doe  ' });
            if (result.success) {
                expect(result.data.headName).toBe('John Doe');
            }
        });
    });

    describe('memberSchema', () => {
        const validMember = {
            name: 'Jane Doe',
            relation: 'Wife' as const,
            age: 30,
            gender: 'Female' as const
        };

        test('should accept valid member data', () => {
            const result = memberSchema.safeParse(validMember);
            expect(result.success).toBe(true);
        });

        test('should accept optional fields', () => {
            const result = memberSchema.safeParse({
                ...validMember,
                email: 'jane@example.com',
                phone: '9876543210',
                bloodGroup: 'O+'
            });
            expect(result.success).toBe(true);
        });

        test('should reject invalid email', () => {
            const result = memberSchema.safeParse({
                ...validMember,
                email: 'invalid-email'
            });
            expect(result.success).toBe(false);
        });

        test('should accept valid blood group', () => {
            const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
            bloodGroups.forEach(bg => {
                const result = memberSchema.safeParse({ ...validMember, bloodGroup: bg });
                expect(result.success).toBe(true);
            });
        });
    });

    describe('paymentSchema', () => {
        test('should accept valid payment', () => {
            const result = paymentSchema.safeParse({
                amount: 100,
                title: 'Membership Fee',
                familyId: 'f_123'
            });
            expect(result.success).toBe(true);
        });

        test('should reject negative amount', () => {
            const result = paymentSchema.safeParse({
                amount: -100,
                title: 'Test'
            });
            expect(result.success).toBe(false);
        });

        test('should reject zero amount', () => {
            const result = paymentSchema.safeParse({
                amount: 0,
                title: 'Test'
            });
            expect(result.success).toBe(false);
        });

        test('should reject amount too large', () => {
            const result = paymentSchema.safeParse({
                amount: 1000001,
                title: 'Test'
            });
            expect(result.success).toBe(false);
        });
    });

    describe('announcementSchema', () => {
        const validAnnouncement = {
            title: 'Community Meeting',
            description: 'Join us for the monthly community meeting to discuss important matters.',
            category: 'Program' as const
        };

        test('should accept valid announcement', () => {
            const result = announcementSchema.safeParse(validAnnouncement);
            expect(result.success).toBe(true);
        });

        test('should reject short description', () => {
            const result = announcementSchema.safeParse({
                ...validAnnouncement,
                description: 'Short'
            });
            expect(result.success).toBe(false);
        });

        test('should accept valid URLs', () => {
            const result = announcementSchema.safeParse({
                ...validAnnouncement,
                imageUrl: 'https://example.com/image.jpg',
                videoUrl: 'https://youtube.com/watch?v=123',
                formUrl: 'https://forms.google.com/form'
            });
            expect(result.success).toBe(true);
        });

        test('should reject invalid URLs', () => {
            const result = announcementSchema.safeParse({
                ...validAnnouncement,
                imageUrl: 'not-a-url'
            });
            expect(result.success).toBe(false);
        });

        test('should accept empty string for optional URLs', () => {
            const result = announcementSchema.safeParse({
                ...validAnnouncement,
                imageUrl: ''
            });
            expect(result.success).toBe(true);
        });
    });
});
