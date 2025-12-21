/**
 * MongoDB Migration Script
 * Migrates data from Filesystem to MongoDB
 * Usage: npx tsx backend/scripts/migrate-to-mongo.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs/promises';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { MongoDatabase } from '../db/mongodb.js';
import type { IFamily, IAdmin, IPayment, IAnnouncement, INotification, IFeedback, ISubscription } from '../db/interface.js';

const DATA_DIR = path.join(process.cwd(), 'backend', 'data');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/modern-mahall';

async function readJsonFile<T>(filename: string): Promise<T[]> {
    try {
        const filePath = path.join(DATA_DIR, filename);
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data) as T[];
    } catch (error) {
        console.log(`⚠️  ${filename} not found or empty, skipping...`);
        return [];
    }
}

async function migrateToMongoDB() {
    console.log('🚀 MongoDB Migration Script\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Connect to MongoDB
    const db = new MongoDatabase(MONGODB_URI);

    try {
        console.log('📡 Connecting to MongoDB...');
        await db.initialize();
        console.log(`✓ Connected to: ${MONGODB_URI}\n`);

        // Read all data from filesystem
        console.log('📂 Reading filesystem data from backend/data/...');
        const [families, admins, payments, announcements, notifications, feedbacks, subscriptions] = await Promise.all([
            readJsonFile<IFamily>('families.json'),
            readJsonFile<IAdmin>('admins.json'),
            readJsonFile<IPayment>('payments.json'),
            readJsonFile<IAnnouncement>('announcements.json'),
            readJsonFile<INotification>('notifications.json'),
            readJsonFile<IFeedback>('feedbacks.json'),
            readJsonFile<ISubscription>('subscriptions.json')
        ]);

        console.log(`\n📊 Data Summary:`);
        console.log(`   • Families: ${families.length}`);
        console.log(`   • Admins: ${admins.length}`);
        console.log(`   • Payments: ${payments.length}`);
        console.log(`   • Announcements: ${announcements.length}`);
        console.log(`   • Notifications: ${notifications.length}`);
        console.log(`   • Feedbacks: ${feedbacks.length}`);
        console.log(`   • Subscriptions: ${subscriptions.length}\n`);

        // Create super admin from environment if not exists
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('👤 Checking Super Admin...');
        const superAdminMobile = process.env.ADMIN_MOBILE;
        if (superAdminMobile) {
            const existingAdmin = admins.find(a => a.mobile === superAdminMobile);
            if (!existingAdmin) {
                const superAdmin: IAdmin = {
                    id: 'super_admin_' + Date.now(),
                    mobile: superAdminMobile,
                    name: 'Super Admin',
                    role: 'SUPER_ADMIN',
                    createdAt: new Date()
                };
                admins.push(superAdmin);
                console.log(`✓ Created Super Admin: ${superAdminMobile}`);
            } else {
                console.log(`✓ Super Admin exists: ${superAdminMobile}`);
            }
        } else {
            console.log('⚠️  No ADMIN_MOBILE in environment');
        }

        let totalSuccess = 0;
        let totalFailed = 0;

        // Migrate Admins
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('👥 Migrating Admins...');
        for (const admin of admins) {
            try {
                await db.createAdmin(admin);
                console.log(`   ✓ ${admin.name} (${admin.mobile})`);
                totalSuccess++;
            } catch (error: any) {
                if (error.message?.includes('duplicate')) {
                    console.log(`   ⚠️  ${admin.name} - already exists`);
                } else {
                    console.log(`   ✗ ${admin.name} - ${error.message}`);
                    totalFailed++;
                }
            }
        }

        // Migrate Families
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🏠 Migrating Families...');
        for (const family of families) {
            try {
                await db.createFamily(family);
                console.log(`   ✓ ${family.code} - ${family.headName} (${family.members.length} members)`);
                totalSuccess++;
            } catch (error: any) {
                if (error.message?.includes('duplicate')) {
                    console.log(`   ⚠️  ${family.code} - already exists`);
                } else {
                    console.log(`   ✗ ${family.code} - ${error.message}`);
                    totalFailed++;
                }
            }
        }

        // Migrate Payments
        if (payments.length > 0) {
            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('💰 Migrating Payments...');
            for (const payment of payments) {
                try {
                    await db.createPayment(payment);
                    console.log(`   ✓ Payment ${payment.id} - ₹${payment.amount}`);
                    totalSuccess++;
                } catch (error: any) {
                    console.log(`   ✗ Payment ${payment.id} - ${error.message}`);
                    totalFailed++;
                }
            }
        }

        // Migrate Announcements
        if (announcements.length > 0) {
            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📢 Migrating Announcements...');
            for (const announcement of announcements) {
                try {
                    await db.createAnnouncement(announcement);
                    console.log(`   ✓ ${announcement.title}`);
                    totalSuccess++;
                } catch (error: any) {
                    console.log(`   ✗ ${announcement.title} - ${error.message}`);
                    totalFailed++;
                }
            }
        }

        // Migrate Notifications
        if (notifications.length > 0) {
            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🔔 Migrating Notifications...');
            for (const notification of notifications) {
                try {
                    await db.createNotification(notification);
                    console.log(`   ✓ ${notification.title}`);
                    totalSuccess++;
                } catch (error: any) {
                    console.log(`   ✗ ${notification.title} - ${error.message}`);
                    totalFailed++;
                }
            }
        }

        // Migrate Feedbacks
        if (feedbacks.length > 0) {
            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('💬 Migrating Feedbacks...');
            for (const feedback of feedbacks) {
                try {
                    await db.createFeedback(feedback);
                    console.log(`   ✓ Feedback ${feedback.id}`);
                    totalSuccess++;
                } catch (error: any) {
                    console.log(`   ✗ Feedback ${feedback.id} - ${error.message}`);
                    totalFailed++;
                }
            }
        }

        // Migrate Subscriptions
        if (subscriptions.length > 0) {
            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📬 Migrating Subscriptions...');
            for (const subscription of subscriptions) {
                try {
                    await db.createSubscription(subscription);
                    console.log(`   ✓ Subscription ${subscription.id}`);
                    totalSuccess++;
                } catch (error: any) {
                    console.log(`   ✗ Subscription ${subscription.id} - ${error.message}`);
                    totalFailed++;
                }
            }
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ Migration Complete!\n');
        console.log('📊 Final Summary:');
        console.log(`   ✓ Successfully migrated: ${totalSuccess} items`);
        if (totalFailed > 0) {
            console.log(`   ✗ Failed: ${totalFailed} items`);
        }
        console.log('\n💡 Next Steps:');
        console.log('   1. Update .env.local: DB_SYSTEM=mongodb');
        console.log('   2. Restart your backend server');
        console.log('   3. Your app will now use MongoDB!');
        console.log('\n⚠️  Note: Your filesystem data in backend/data/ is still intact');
        console.log('   You can switch back anytime by setting DB_SYSTEM=filedb\n');

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    } finally {
        if (db.disconnect) {
            await db.disconnect();
            console.log('✓ Disconnected from MongoDB\n');
        }
        process.exit(0);
    }
}

// Run the migration
console.log('\n');
migrateToMongoDB();
