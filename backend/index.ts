// Initialize dotenv FIRST - before any imports that might need env vars
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Now import everything else
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { initializeDB, readData, writeData } from './db/fsdb.js';
import { getAdminCredentials } from './utils/auth.js';
import { initializeVapidKeys } from './utils/vapidKeys.js';
import { initializeWebPush } from './services/notificationService.js';
import adminRoutes from './api/adminRoutes.js';
import dataRoutes from './api/dataRoutes.js';
import notificationRoutes from './api/notificationRoutes.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

let ADMIN_USERNAME: string;
let ADMIN_PASSWORD: string;

// Middleware
// Configure CORS to allow requests from frontend (assuming Vite default port 5173)
// In production, restrict origin to actual frontend URL.
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

app.use(express.json());

// Simple error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).send('Internal Server Error');
});

// Health Check Endpoint
app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', service: 'ModernMahall Backend' });
});

// Admin Login Endpoint
app.post('/api/admin/login', async (req: Request, res: Response) => {
    const { mobile, otp } = req.body;

    try {
        // First check environment variables (SUPER ADMIN)
        const envCreds = getAdminCredentials();
        if (mobile === envCreds.mobile && otp === envCreds.otp) {
            return res.json({ message: 'Admin Login successful', token: 'super_admin_token', role: 'ADMIN' });
        }

        // Then check DB for other admins
        const admins = await readData<any[]>('admins.json') || [];
        const adminUser = admins.find(a => a.mobile === mobile && a.otp === otp);

        if (adminUser) {
            res.json({ message: 'Admin Login successful', token: 'db_admin_token_' + adminUser.id, role: 'ADMIN' });
        } else {
            res.status(401).json({ message: 'Invalid admin credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
});

// User Login Endpoint (Mobile/OTP based)
app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
        return res.status(400).json({ message: 'Mobile number and OTP are required' });
    }

    // Validate OTP (always 123456 for now)
    if (otp !== '123456') {
        return res.status(401).json({ message: 'Invalid OTP' });
    }

    try {
        const families = await readData<any[]>('families.json') || [];

        // Search for user in all families
        let userFound: any = null;
        let userFamilyId: string | null = null;

        for (const family of families) {
            const member = family.members.find((m: any) => m.phone === mobile);
            if (member) {
                userFound = member;
                userFamilyId = family.id;
                break;
            }
        }

        if (userFound) {
            // Existing user found
            const userToken = 'user_token_' + userFound.id;
            res.json({
                message: 'Login successful',
                token: userToken,
                user: {
                    id: userFound.id,
                    phone: mobile,
                    role: userFound.relation === 'Head' ? 'HEAD' : 'MEMBER',
                    name: userFound.name,
                    familyId: userFamilyId
                }
            });
        } else {
            // New user - needs onboarding
            res.json({
                newUser: true,
                phone: mobile
            });
        }
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Internal Server Error during login" });
    }
});

// User Registration Endpoint (Create new family)
app.post('/api/auth/register', async (req: Request, res: Response) => {
    const { phone, headName, address, ward, age, gender } = req.body;

    if (!phone || !headName || !address || !ward || !age || !gender) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const families = await readData<any[]>('families.json') || [];

        // Generate family code
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
            status: 'pending',
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
                    status: 'pending',
                    phone: phone
                }
            ]
        };

        families.push(newFamily);
        await writeData('families.json', families);

        // Generate token
        const token = `user_token_${memberId}_${Date.now()}`;

        res.status(201).json({
            message: 'Registration successful',
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

// Use Routes
app.use('/api/admin', adminRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/notifications', notificationRoutes);


// Initialize DB and start server
async function startServer() {
    try {
        await initializeDB();

        // Initialize VAPID keys (generate if not exists)
        console.log('Initializing VAPID keys...');
        initializeVapidKeys();

        // Initialize web-push with the loaded VAPID keys
        initializeWebPush();

        // Load credentials here to ensure they are available before server starts logging them
        const creds = getAdminCredentials();
        const ADMIN_MOBILE = creds.mobile;

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
            console.log(`Admin credentials loaded: Mobile=${ADMIN_MOBILE}`);
            console.log('✓ Push notification system ready');
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

startServer();