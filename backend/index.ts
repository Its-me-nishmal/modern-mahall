// Initialize dotenv FIRST - before any imports that might need env vars
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config();

// Now import everything else
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { initializeDatabase } from './db/index.js';
// import { initializeVapidKeys } from './utils/vapidKeys.js';
import { initializeWebPush } from './services/notificationService.js';
import authRoutes from './api/authRoutes.js';
import adminRoutes from './api/adminRoutes.js';
import dataRoutes from './api/dataRoutes.js';
import notificationRoutes from './api/notificationRoutes.js';
import reportRoutes from './api/reportRoutes.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// Middleware
// Configure CORS to allow requests from frontend
// app.use(cors({
//     origin: (origin, callback) => {
//         // Allow requests with no origin (like mobile apps or curl requests)
//         if (!origin) return callback(null, true);

//         // Allow any localhost origin
//         if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
//             return callback(null, true);
//         }

//         // Allow local network IPs (192.168.x.x, 10.x.x.x, etc.) for mobile testing
//         if (origin.startsWith('http://192.168.') || origin.startsWith('http://10.')) {
//             return callback(null, true);
//         }

//         // Allow Vercel deployments (optional, good practice)
//         if (origin.endsWith('.vercel.app')) {
//             return callback(null, true);
//         }

//         // Default: Allow it (or restrict if strict security needed)
//         // For development, we'll be permissive
//         return callback(null, true);
//     },
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization']
// }));

app.use(cors());
app.use(express.json());

// Simple error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).send('Internal Server Error');
});

// Health Check Endpoint
app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'OK',
        service: 'ModernMahall Backend',
        database: process.env.DB_SYSTEM || 'filedb',
        timestamp: new Date().toISOString()
    });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);

// Initialize DB and start server
async function startServer() {
    try {
        console.log('🚀 Starting ModernMahall Backend Server...\n');

        // Initialize Database
        console.log('📦 Initializing database...');
        await initializeDatabase();

        // Initialize VAPID keys (generate if not exists)
        // console.log('🔑 Initializing VAPID keys...');
        // initializeVapidKeys();

        // Initialize web-push with the loaded VAPID keys
        console.log('📬 Initializing push notification service...');
        initializeWebPush();

        // Start server
        app.listen(PORT, () => {
            console.log('\n✓ Server successfully started!\n');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`📍 Server URL: http://localhost:${PORT}`);
            console.log(`💾 Database: ${process.env.DB_SYSTEM || 'filedb'}`);
            console.log(`🔐 Admin Mobile: ${process.env.ADMIN_MOBILE}`);
            console.log(`⏱️  OTP Expiry: ${process.env.OTP_EXPIRY_MINUTES || 5} minutes`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            console.log('🎯 Available endpoints:');
            console.log('   - GET  /api/health');
            console.log('   - POST /api/auth/send-otp');
            console.log('   - POST /api/auth/verify-otp');
            console.log('   - POST /api/auth/register');
            console.log('   - POST /api/auth/admin/send-otp');
            console.log('   - POST /api/auth/admin/verify-otp');
            console.log('\n✅ Ready to accept connections!\n');
        });
    } catch (error) {
        console.error('\n❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();