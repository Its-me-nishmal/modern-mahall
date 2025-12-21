/**
 * Authentication Utilities
 * JWT middleware and authentication helpers
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader, type TokenPayload } from '../services/tokenService.js';

// Extend Express Request to include user data
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}

export interface AdminCredentials {
    mobile: string;
    otp: string;
}

/**
 * Retrieves admin credentials from environment variables.
 * @returns AdminCredentials object
 */
export function getAdminCredentials(): AdminCredentials {
    const mobile = process.env.ADMIN_MOBILE;
    const otp = process.env.ADMIN_OTP;

    if (!mobile || !otp) {
        throw new Error('CRITICAL: Admin credentials (ADMIN_MOBILE and ADMIN_OTP) must be set in environment variables.');
    }

    return { mobile, otp };
}

/**
 * JWT Authentication Middleware
 * Verifies the JWT token and attaches user data to request
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
        res.status(401).json({ message: 'Authentication required' });
        return;
    }

    const payload = verifyToken(token);
    if (!payload) {
        res.status(401).json({ message: 'Invalid or expired token' });
        return;
    }

    req.user = payload;
    next();
}

/**
 * Admin-only Middleware
 * Requires user to be authenticated and have admin role
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
    requireAuth(req, res, () => {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            res.status(403).json({ message: 'Admin access required' });
            return;
        }

        next();
    });
}

/**
 * Optional Authentication Middleware
 * Attempts to verify token but doesn't fail if not present
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
        const payload = verifyToken(token);
        if (payload) {
            req.user = payload;
        }
    }

    next();
}

/**
 * Role-based Access Control
 * Checks if user has required role
 */
export function requireRole(...roles: ('ADMIN' | 'SUPER_ADMIN' | 'HEAD' | 'MEMBER')[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        requireAuth(req, res, () => {
            if (!req.user) {
                res.status(401).json({ message: 'Authentication required' });
                return;
            }

            if (!roles.includes(req.user.role)) {
                res.status(403).json({ message: `Access denied. Required roles: ${roles.join(', ')}` });
                return;
            }

            next();
        });
    };
}