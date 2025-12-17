import { Router, Request, Response } from 'express';
import { readData, writeData } from '../db/fsdb.js';
import { Family, FamilyMember, Status } from '../../types.js';

const router = Router();

// Login endpoint - checks if user exists in any family
router.post('/login', async (req: Request, res: Response) => {
    const { mobile, otp } = req.body;

    // Simple OTP validation (always 123456 for now)
    if (otp !== '123456') {
        return res.status(401).json({ message: 'Invalid OTP' });
    }

    try {
        const families = await readData<Family[]>('families.json') || [];

        // Search for user in all families
        let foundUser: FamilyMember | null = null;
        let foundFamily: Family | null = null;

        for (const family of families) {
            const member = family.members.find(m => m.phone === mobile);
            if (member) {
                foundUser = member;
                foundFamily = family;
                break;
            }
        }

        if (foundUser && foundFamily) {
            // Existing user found
            const token = `user_token_${foundUser.id}_${Date.now()}`;

            return res.json({
                token,
                user: {
                    id: foundUser.id,
                    phone: mobile,
                    role: foundUser.relation === 'Head' ? 'HEAD' : 'MEMBER',
                    name: foundUser.name,
                    familyId: foundFamily.id
                }
            });
        } else {
            // New user - needs onboarding
            return res.json({
                newUser: true,
                phone: mobile
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Register endpoint - creates new family with head
router.post('/register', async (req: Request, res: Response) => {
    const { phone, headName, address, ward, age, gender } = req.body;

    try {
        const families = await readData<Family[]>('families.json') || [];

        // Generate family code
        const familyCount = families.length + 1;
        const familyCode = `MH-${String(familyCount).padStart(3, '0')}`;
        const familyId = `f_${Date.now()}`;
        const memberId = `m_${Date.now()}`;

        // Create new family
        const newFamily: Family = {
            id: familyId,
            code: familyCode,
            headName: headName,
            headId: memberId,
            ward: ward,
            address: address,
            status: Status.PENDING,
            paymentStatus: 'Unpaid',
            balance: 0,
            members: [
                {
                    id: memberId,
                    familyId: familyId,
                    name: headName,
                    relation: 'Head',
                    age: age,
                    gender: gender,
                    status: Status.PENDING,
                    phone: phone
                }
            ]
        };

        families.push(newFamily);
        await writeData('families.json', families);

        // Generate token
        const token = `user_token_${memberId}_${Date.now()}`;

        res.status(201).json({
            token,
            user: {
                id: memberId,
                phone: phone,
                role: 'HEAD',
                name: headName,
                familyId: familyId
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Admin login endpoint
router.post('/admin/login', async (req: Request, res: Response) => {
    const { mobile, otp } = req.body;

    // Check admin credentials from env
    if (mobile === process.env.ADMIN_MOBILE && otp === process.env.ADMIN_OTP) {
        const token = 'super_admin_token';
        return res.json({ token });
    }

    res.status(401).json({ message: 'Invalid admin credentials' });
});

export default router;
