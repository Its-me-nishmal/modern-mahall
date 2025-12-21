/**
 * Token Service
 * Handles JWT token generation and verification
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

export interface TokenPayload {
    userId: string;
    mobile: string;
    role: 'ADMIN' | 'SUPER_ADMIN' | 'HEAD' | 'MEMBER';
    familyId?: string;
    name?: string;
}

/**
 * Generate JWT token
 * @param payload Token payload
 * @returns JWT token string
 */
export function generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY as any });
}

/**
 * Verify and decode JWT token
 * @param token JWT token string
 * @returns Decoded token payload or null if invalid
 */
export function verifyToken(token: string): TokenPayload | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
        return decoded;
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
}

/**
 * Decode token without verification (for debugging)
 * @param token JWT token string
 * @returns Decoded token payload
 */
export function decodeToken(token: string): TokenPayload | null {
    try {
        return jwt.decode(token) as TokenPayload;
    } catch (error) {
        return null;
    }
}

/**
 * Extract token from Authorization header
 * @param authHeader Authorization header value
 * @returns Token string or null
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader) return null;

    // Handle "Bearer <token>" format
    if (authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }

    // Handle direct token
    return authHeader;
}
