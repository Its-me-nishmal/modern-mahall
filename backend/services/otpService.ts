/**
 * OTP Service
 * Handles OTP generation, verification, and sending
 */

import database from '../db/index.js';
import type { IOTP } from '../db/interface.js';

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10);

/**
 * Generate a 6-digit OTP
 */
function generateOTPCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate and store OTP for a mobile number
 * @param mobile Mobile number to generate OTP for
 * @returns Generated OTP code
 */
export async function generateOTP(mobile: string): Promise<string> {
    const otpCode = generateOTPCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    const otp: IOTP = {
        id: `otp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        mobile,
        otp: otpCode,
        expiresAt,
        verified: false,
        createdAt: new Date()
    };

    await database.createOTP(otp);

    console.log(`✓ OTP generated for ${mobile}: ${otpCode} (expires in ${OTP_EXPIRY_MINUTES} minutes)`);

    return otpCode;
}

/**
 * Verify OTP for a mobile number
 * @param mobile Mobile number
 * @param otp OTP code to verify
 * @returns True if OTP is valid, false otherwise
 */
export async function verifyOTP(mobile: string, otp: string): Promise<boolean> {
    const isValid = await database.verifyOTP(mobile, otp);

    if (isValid) {
        console.log(`✓ OTP verified successfully for ${mobile}`);
        // Clean up the OTP after successful verification
        await database.deleteOTP(mobile);
    } else {
        console.log(`✗ Invalid or expired OTP for ${mobile}`);
    }

    return isValid;
}

/**
 * Send OTP to mobile number
 * In development: logs to console
 * In production: would integrate with SMS/Email service
 * @param mobile Mobile number
 * @param otp OTP code
 */
export async function sendOTP(mobile: string, otp: string): Promise<void> {
    // Format phone number
    let formattedMobile = mobile.replace(/\D/g, ''); // Remove non-digits

    // Default to India (+91) if 10 digits
    if (formattedMobile.length === 10) {
        formattedMobile = '91' + formattedMobile;
    }

    // Ensure '+' prefix
    if (!formattedMobile.startsWith('+')) {
        formattedMobile = '+' + formattedMobile;
    }

    const message = `🔑 Modern Mahallu Verification\n\nYour verification code is: *${otp}*\n\nThis code will expire in ${OTP_EXPIRY_MINUTES} minutes.\nDo not share this code with anyone.`;
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa-simple-otp.onrender.com/send-otp?phonenumber=${formattedMobile}&message=${encodedMessage}`;

    try {
        console.log(`📤 Sending OTP to ${formattedMobile} via WhatsApp API...`);
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`External API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ OTP sent successfully:`, data);
    } catch (error) {
        console.error(`❌ Failed to send OTP via external API:`, error);
        // Fallback or just log error - for now logging is sufficient as per user request to "use this"
    }

    // Dev logging for backup/debugging
    if (process.env.NODE_ENV !== 'production') {
        console.log(`📱 [DEV BACKUP] OTP for ${mobile}: ${otp}`);
    }
}

/**
 * Check if OTP exists and is valid for a mobile number
 * @param mobile Mobile number
 * @returns OTP object if exists and valid, null otherwise
 */
export async function getValidOTP(mobile: string): Promise<IOTP | null> {
    return await database.getOTPByMobile(mobile);
}

/**
 * Resend OTP (generate new one and invalidate old)
 * @param mobile Mobile number
 * @returns New OTP code
 */
export async function resendOTP(mobile: string): Promise<string> {
    // Delete existing OTPs for this mobile
    await database.deleteOTP(mobile);

    // Generate and send new OTP
    const otp = await generateOTP(mobile);
    await sendOTP(mobile, otp);

    return otp;
}
