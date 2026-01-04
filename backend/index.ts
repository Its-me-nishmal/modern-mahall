// Initialize dotenv FIRST - before any imports that might need env vars
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config();

// Now import everything else
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { initializeDatabase } from './db/index.js';
// import { initializeVapidKeys } from './utils/vapidKeys.js';
import { initializeWebPush } from './services/notificationService.js';
import { apiLimiter } from './utils/rateLimiter.js';
import authRoutes from './api/authRoutes.js';
import adminRoutes from './api/adminRoutes.js';
import dataRoutes from './api/dataRoutes.js';
import notificationRoutes from './api/notificationRoutes.js';
import reportRoutes from './api/reportRoutes.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Helmet - Security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"], // For inline scripts (consider removing in production)
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding
}));

// CORS Configuration - Strict in production
const allowedOrigins = [
    'http://localhost:5173', // Vite dev server
    'http://localhost:3000', // Alternative port
    'http://127.0.0.1:5173',
    'http://localhost:3001',
    'https://modern-mahallu.vercel.app', // Production frontend
    // Add your production domain here
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, Postman, curl)
        if (!origin) return callback(null, true);

        if (process.env.NODE_ENV === 'production') {
            // Strict in production
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            } else {
                return callback(new Error('Not allowed by CORS'));
            }
        } else {
            // Permissive in development (localhost, local IPs)
            if (origin.includes('localhost') ||
                origin.includes('127.0.0.1') ||
                origin.startsWith('http://192.168.') ||
                origin.startsWith('http://10.') ||
                allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(null, true); // Allow all in dev
        }
    },
    credentials: true, // Allow cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Cookie parser for httpOnly cookies
app.use(cookieParser());

// Regular middleware
app.use(express.json({ limit: '10mb' })); // Limit body size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to all /api routes
app.use('/api', apiLimiter);

// Global error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Global error handler:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
    });

    // CORS errors
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({
            message: 'Access forbidden: Origin not allowed'
        });
    }

    // Default error
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
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