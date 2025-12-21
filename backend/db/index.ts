/**
 * Database Factory
 * Creates and exports the appropriate database instance based on environment configuration
 * Uses lazy initialization to ensure environment variables are loaded first
 */

import type { IDatabase } from './interface.js';
import { FileDatabase } from './fsdb.js';
import { MongoDatabase } from './mongodb.js';

let database: IDatabase | null = null;

/**
 * Get the database instance (lazy initialization)
 */
function getDatabase(): IDatabase {
    if (!database) {
        const DB_SYSTEM = process.env.DB_SYSTEM || 'filedb';
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/modern-mahall';

        if (DB_SYSTEM === 'mongodb') {
            console.log('⚙️  Using MongoDB database');
            database = new MongoDatabase(MONGODB_URI);
        } else {
            console.log('⚙️  Using Filesystem database');
            database = new FileDatabase();
        }
    }
    return database;
}

// Export a Proxy that delegates all calls to the lazy-initialized database
const databaseProxy = new Proxy({} as IDatabase, {
    get(target, prop) {
        const db = getDatabase();
        const value = (db as any)[prop];

        // If it's a method, bind it to the database instance
        if (typeof value === 'function') {
            return value.bind(db);
        }
        return value;
    }
});

export default databaseProxy;

// Also export the initialize function for convenience
export async function initializeDatabase(): Promise<void> {
    const db = getDatabase();
    await db.initialize();

    // Setup periodic cleanup of expired OTPs (every 5 minutes)
    setInterval(async () => {
        try {
            const deleted = await db.cleanupExpiredOTPs();
            if (deleted > 0) {
                console.log(`🧹 Cleaned up ${deleted} expired OTPs`);
            }
        } catch (error) {
            console.error('Error cleaning up expired OTPs:', error);
        }
    }, 5 * 60 * 1000); // 5 minutes
}

// Export types for convenience
export type * from './interface.js';
