/**
 * Quick test to verify which database system is active
 * Run: npx tsx backend/scripts/test-db.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('\n🔍 Database Configuration Test\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('Environment Variables:');
console.log(`  DB_SYSTEM = "${process.env.DB_SYSTEM}"`);
console.log(`  MONGODB_URI = "${process.env.MONGODB_URI}"`);

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Now import database
import database from '../db/index.js';

console.log('Database instance type:', database.constructor.name);

// Try to initialize
try {
    await database.initialize();
    console.log('✓ Database initialized successfully');

    // Try to get all announcements
    const announcements = await database.getAllAnnouncements();
    console.log(`\n📢 Found ${announcements.length} announcements in database`);

    if (announcements.length > 0) {
        console.log('\nLatest announcement:');
        console.log(`  - Title: ${announcements[0].title}`);
        console.log(`  - ID: ${announcements[0].id}`);
    }

    if (database.disconnect) {
        await database.disconnect();
    }

    console.log('\n✅ Test complete!\n');
} catch (error) {
    console.error('\n❌ Test failed:', error);
}

process.exit(0);
