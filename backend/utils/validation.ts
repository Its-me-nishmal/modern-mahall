/**
 * Input Validation Schemas using Zod
 * Provides type-safe validation for all API inputs
 */

import { z } from 'zod';

// Phone number validation (Indian format)
const phoneSchema = z.string()
    .regex(/^91[0-9]{10}$/, 'Invalid mobile number. Must be in format: 91XXXXXXXXXX');

// OTP Schema
export const sendOTPSchema = z.object({
    mobile: phoneSchema
});

export const verifyOTPSchema = z.object({
    mobile: phoneSchema,
    otp: z.string()
        .length(6, 'OTP must be exactly 6 digits')
        .regex(/^[0-9]{6}$/, 'OTP must contain only numbers')
});

// Registration Schema
export const registerSchema = z.object({
    phone: phoneSchema,
    headName: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name is too long')
        .trim(),
    address: z.string()
        .min(5, 'Address must be at least 5 characters')
        .max(500, 'Address is too long')
        .trim(),
    ward: z.string()
        .min(1, 'Ward is required')
        .max(50, 'Ward name is too long')
        .trim(),
    age: z.number()
        .int('Age must be a whole number')
        .min(18, 'Head of family must be at least 18 years old')
        .max(120, 'Invalid age'),
    gender: z.enum(['Male', 'Female'], {
        errorMap: () => ({ message: 'Gender must be either Male or Female' })
    })
});

// Member Schema
export const memberSchema = z.object({
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name is too long')
        .trim(),
    relation: z.enum(['Head', 'Father', 'Mother', 'Son', 'Daughter', 'Wife', 'Other']),
    age: z.number()
        .int('Age must be a whole number')
        .min(0, 'Age cannot be negative')
        .max(120, 'Invalid age'),
    gender: z.enum(['Male', 'Female']),
    phone: z.string()
        .regex(/^[0-9]{10,12}$/, 'Invalid phone number')
        .optional()
        .or(z.literal('')),
    email: z.string()
        .email('Invalid email address')
        .optional()
        .or(z.literal('')),
    bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'])
        .optional(),
    education: z.string()
        .max(100, 'Education field is too long')
        .optional(),
    job: z.string()
        .max(100, 'Job field is too long')
        .optional(),
    maritalStatus: z.enum(['Single', 'Married', 'Divorced', 'Widowed'])
        .optional(),
    dob: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'DOB must be in format YYYY-MM-DD')
        .optional()
});

// Payment Schema
export const paymentSchema = z.object({
    amount: z.number()
        .positive('Amount must be positive')
        .max(1000000, 'Amount is too large'),
    title: z.string()
        .min(3, 'Title must be at least 3 characters')
        .max(200, 'Title is too long')
        .trim(),
    familyId: z.string()
        .min(1, 'Family ID is required')
        .optional(),
    memberId: z.string().optional()
});

// Announcement Schema
export const announcementSchema = z.object({
    title: z.string()
        .min(3, 'Title must be at least 3 characters')
        .max(200, 'Title is too long')
        .trim(),
    description: z.string()
        .min(10, 'Description must be at least 10 characters')
        .max(5000, 'Description is too long')
        .trim(),
    category: z.enum(['Program', 'Death', 'Notice', 'Emergency', 'Data Collect']),
    imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
    videoUrl: z.string().url('Invalid video URL').optional().or(z.literal('')),
    formUrl: z.string().url('Invalid form URL').optional().or(z.literal('')),
    location: z.string().max(500, 'Location is too long').optional(),
    phoneNumber: z.string()
        .regex(/^[0-9+\-\s()]{10,20}$/, 'Invalid phone number')
        .optional()
        .or(z.literal(''))
});

// Feedback Schema
export const feedbackSchema = z.object({
    message: z.string()
        .min(10, 'Feedback must be at least 10 characters')
        .max(2000, 'Feedback is too long')
        .trim()
});

// Helper function to validate request body
export const validateBody = <T>(schema: z.Schema<T>) => {
    return (req: any, res: any, next: any) => {
        try {
            const result = schema.safeParse(req.body);
            if (!result.success) {
                return res.status(400).json({
                    message: 'Validation failed',
                    errors: result.error.flatten().fieldErrors
                });
            }
            req.validatedBody = result.data;
            next();
        } catch (error) {
            return res.status(500).json({ message: 'Validation error occurred' });
        }
    };
};
