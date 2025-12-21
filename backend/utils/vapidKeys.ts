import webpush from 'web-push';
import 'dotenv/config';

export function initializeVapidKeys() {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:admin@modernmahall.com';

    if (!publicKey || !privateKey) {
        throw new Error(
            '❌ VAPID keys missing. Set them in environment variables.'
        );
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);

    return { publicKey, privateKey, subject };
}
