import webpush from 'web-push';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Generate VAPID keys and save them to .env.local
 * VAPID keys are used for push notification authentication
 */
export function generateAndSaveVapidKeys(): { publicKey: string; privateKey: string } {
    const envPath = path.resolve(process.cwd(), '.env.local');

    // Check if VAPID keys already exist in .env.local
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        const publicKeyMatch = envContent.match(/VAPID_PUBLIC_KEY=(.+)/);
        const privateKeyMatch = envContent.match(/VAPID_PRIVATE_KEY=(.+)/);

        if (publicKeyMatch && privateKeyMatch) {
            console.log('✓ VAPID keys already exist in .env.local');
            return {
                publicKey: publicKeyMatch[1].trim(),
                privateKey: privateKeyMatch[1].trim()
            };
        }
    }

    // Generate new VAPID keys
    console.log('Generating new VAPID keys...');
    const vapidKeys = webpush.generateVAPIDKeys();

    // Append to .env.local
    const vapidConfig = `\n# VAPID Keys for Push Notifications (Auto-generated)\nVAPID_PUBLIC_KEY=${vapidKeys.publicKey}\nVAPID_PRIVATE_KEY=${vapidKeys.privateKey}\nVAPID_SUBJECT=mailto:admin@modernmahall.com\n`;

    fs.appendFileSync(envPath, vapidConfig);
    console.log('✓ VAPID keys generated and saved to .env.local');

    return vapidKeys;
}

/**
 * Get VAPID keys from environment variables
 */
export function getVapidKeys(): { publicKey: string; privateKey: string; subject: string } {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:admin@modernmahall.com';

    if (!publicKey || !privateKey) {
        throw new Error('VAPID keys not found. Please restart the server to generate them.');
    }

    return { publicKey, privateKey, subject };
}

/**
 * Initialize VAPID keys - generate if not exists, otherwise load from env
 */
export function initializeVapidKeys(): { publicKey: string; privateKey: string } {
    return generateAndSaveVapidKeys();
}
