// backend/utils/auth.ts

// Note: This relies on dotenv being initialized in the main entry point (index.ts) 
// before any part of the application attempts to read process.env.

export interface AdminCredentials {
    mobile: string;
    otp: string;
}

/**
 * Retrieves admin credentials from environment variables.
 * Assumes environment variables ADMIN_MOBILE and ADMIN_OTP are set.
 * @returns AdminCredentials object.
 */
export function getAdminCredentials(): AdminCredentials {
    const mobile = process.env.ADMIN_MOBILE;
    const otp = process.env.ADMIN_OTP;

    if (!mobile || !otp) {
        // Throw an error if critical credentials are missing, prompting configuration update
        throw new Error("CRITICAL: Admin credentials (ADMIN_MOBILE and ADMIN_OTP) must be set in environment variables.");
    }

    return { mobile, otp };
}