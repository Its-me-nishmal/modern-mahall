/**
 * Authentication Routes
 * Handles user and admin authentication with OTP
 */

import { Router, Request, Response } from 'express';
import database from '../db/index.js';
import { generateOTP, verifyOTP, sendOTP } from '../services/otpService.js';
import { generateToken } from '../services/tokenService.js';

const router = Router();

// ============================================
// USER AUTHENTICATION ROUTES
// ============================================

/**
 * POST /api/auth/send-otp
 * Send OTP to user's mobile number
 */
router.post('/send-otp', async (req: Request, res: Response) => {
    const { mobile } = req.body;

    if (!mobile) {
        return res.status(400).json({ message: 'Mobile number is required' });
    }

    try {
        // Generate OTP
        const otp = await generateOTP(mobile);

        // Send OTP (logs to console in dev, would send SMS in production)
        await sendOTP(mobile, otp);

        res.json({
            success: true,
            message: 'OTP sent successfully',
            expiresIn: parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10)
        });
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ message: 'Failed to send OTP' });
    }
});

/**
 * POST /api/auth/verify-otp
 * Verify OTP and login/register user
 */
router.post('/verify-otp', async (req: Request, res: Response) => {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
        return res.status(400).json({ message: 'Mobile number and OTP are required' });
    }

    try {
        // Verify OTP
        const isValid = await verifyOTP(mobile, otp);
        if (!isValid) {
            return res.status(401).json({ message: 'Invalid or expired OTP' });
        }

        // Check if user exists
        const result = await database.getMemberByPhone(mobile);

        if (result) {
            // Existing user - login
            const { member, familyId } = result;
            const family = await database.getFamilyById(familyId);

            if (!family) {
                return res.status(500).json({ message: 'Family data not found' });
            }

            const token = generateToken({
                userId: member.id,
                mobile: mobile,
                role: member.relation === 'Head' ? 'HEAD' : 'MEMBER',
                familyId: familyId,
                name: member.name
            });

            res.json({
                success: true,
                message: 'Login successful',
                token,
                user: {
                    id: member.id,
                    phone: mobile,
                    role: member.relation === 'Head' ? 'HEAD' : 'MEMBER',
                    name: member.name,
                    familyId: familyId,
                    status: member.status
                }
            });
        } else {
            // New user - needs registration
            res.json({
                success: true,
                newUser: true,
                phone: mobile,
                message: 'OTP verified. Please complete registration.'
            });
        }
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ message: 'Server error during OTP verification' });
    }
});

/**
 * POST /api/auth/register
 * Register new user (create family)
 */
router.post('/register', async (req: Request, res: Response) => {
    const { phone, headName, address, ward, age, gender } = req.body;

    if (!phone || !headName || !address || !ward || !age || !gender) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Check if user already exists
        const existing = await database.getMemberByPhone(phone);
        if (existing) {
            return res.status(400).json({ message: 'User already registered' });
        }

        // Generate family code
        const families = await database.getAllFamilies();
        const familyCount = families.length + 1;
        const familyCode = `MH-${String(familyCount).padStart(3, '0')}`;
        const familyId = `f_${Date.now()}`;
        const memberId = `m_${Date.now()}`;

        // Create new family
        const newFamily = {
            id: familyId,
            code: familyCode,
            headName: headName,
            headId: memberId,
            ward: ward,
            address: address,
            status: 'pending' as const,
            paymentStatus: 'Unpaid' as const,
            balance: 0,
            members: [
                {
                    id: memberId,
                    familyId: familyId,
                    name: headName,
                    relation: 'Head',
                    age: age,
                    gender: gender,
                    status: 'pending' as const,
                    phone: phone
                }
            ]
        };

        await database.createFamily(newFamily);

        // Generate token
        const token = generateToken({
            userId: memberId,
            mobile: phone,
            role: 'HEAD',
            familyId: familyId,
            name: headName
        });

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user: {
                id: memberId,
                phone: phone,
                role: 'HEAD',
                name: headName,
                familyId: familyId,
                status: 'pending'
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// ============================================
// ADMIN AUTHENTICATION ROUTES
// ============================================

/**
 * POST /api/auth/admin/send-otp
 * Send OTP to admin's mobile number
 */
router.post('/admin/send-otp', async (req: Request, res: Response) => {
    const { mobile } = req.body;

    if (!mobile) {
        return res.status(400).json({ message: 'Mobile number is required' });
    }

    try {
        // Check if mobile belongs to an admin
        const ADMIN_MOBILE = process.env.ADMIN_MOBILE;
        const isEnvAdmin = mobile === ADMIN_MOBILE;
        const isDbAdmin = await database.getAdminByMobile(mobile);

        if (!isEnvAdmin && !isDbAdmin) {
            return res.status(403).json({ message: 'Not authorized as admin' });
        }

        // Generate and send OTP
        const otp = await generateOTP(mobile);
        await sendOTP(mobile, otp);

        res.json({
            success: true,
            message: 'Admin OTP sent successfully',
            expiresIn: parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10)
        });
    } catch (error) {
        console.error('Admin send OTP error:', error);
        res.status(500).json({ message: 'Failed to send admin OTP' });
    }
});

/**
 * POST /api/auth/admin/verify-otp
 * Verify admin OTP and login
 */
router.post('/admin/verify-otp', async (req: Request, res: Response) => {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
        return res.status(400).json({ message: 'Mobile number and OTP are required' });
    }

    try {
        // Verify OTP
        const isValid = await verifyOTP(mobile, otp);
        if (!isValid) {
            return res.status(401).json({ message: 'Invalid or expired OTP' });
        }

        // Check if super admin from env
        const ADMIN_MOBILE = process.env.ADMIN_MOBILE;
        if (mobile === ADMIN_MOBILE) {
            const token = generateToken({
                userId: 'super_admin',
                mobile: mobile,
                role: 'SUPER_ADMIN',
                name: 'Super Admin'
            });

            return res.json({
                success: true,
                message: 'Admin login successful',
                token,
                role: 'SUPER_ADMIN',
                user: {
                    id: 'super_admin',
                    phone: mobile,
                    role: 'SUPER_ADMIN',
                    name: 'Super Admin'
                }
            });
        }

        // Check database admins
        const admin = await database.getAdminByMobile(mobile);
        if (admin) {
            const token = generateToken({
                userId: admin.id,
                mobile: mobile,
                role: admin.role,
                name: admin.name
            });

            res.json({
                success: true,
                message: 'Admin login successful',
                token,
                role: admin.role,
                user: {
                    id: admin.id,
                    phone: mobile,
                    role: admin.role,
                    name: admin.name
                }
            });
        } else {
            res.status(403).json({ message: 'Not authorized as admin' });
        }
    } catch (error) {
        console.error('Admin verify OTP error:', error);
        res.status(500).json({ message: 'Server error during admin OTP verification' });
    }
});

/**
 * LEGACY: POST /api/auth/login
 * Old login endpoint - kept for backward compatibility
 * Will be deprecated in future versions
 */
router.post('/login', async (req: Request, res: Response) => {
    const { mobile, otp } = req.body;

    // For backward compatibility, accept hardcoded OTP in development
    if (process.env.NODE_ENV !== 'production' && otp === '123456') {
        try {
            const result = await database.getMemberByPhone(mobile);

            if (result) {
                const { member, familyId } = result;
                const token = generateToken({
                    userId: member.id,
                    mobile: mobile,
                    role: member.relation === 'Head' ? 'HEAD' : 'MEMBER',
                    familyId: familyId,
                    name: member.name
                });

                return res.json({
                    token,
                    user: {
                        id: member.id,
                        phone: mobile,
                        role: member.relation === 'Head' ? 'HEAD' : 'MEMBER',
                        name: member.name,
                        familyId: familyId
                    }
                });
            } else {
                return res.json({
                    newUser: true,
                    phone: mobile
                });
            }
        } catch (error) {
            return res.status(500).json({ message: 'Server error' });
        }
    }

    // Redirect to new flow
    res.status(400).json({
        message: 'Please use /api/auth/send-otp and /api/auth/verify-otp endpoints'
    });
});

export default router;
