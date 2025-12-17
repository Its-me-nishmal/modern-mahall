import * as fs from 'fs/promises';
import * as path from 'path';

const DATA_DIR = path.join(process.cwd(), 'backend', 'data');

/**
 * Initializes the filesystem database utility.
 * Ensures the data directory exists.
 */
export async function initializeDB(): Promise<void> {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        console.log(`Database directory ensured at: ${DATA_DIR}`);
    } catch (error) {
        console.error("Failed to ensure database directory:", error);
        throw error;
    }
}

/**
 * Reads data from a specified file in the data directory.
 * @param filename The name of the data file (e.g., 'users.json').
 * @returns Parsed JSON data or null if file does not exist.
 */
export async function readData<T>(filename: string): Promise<T | null> {
    const filePath = path.join(DATA_DIR, filename);
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data) as T;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            // File does not exist, return null
            return null;
        }
        console.error(`Error reading data from ${filename}:`, error);
        throw error;
    }
}

/**
 * Writes data to a specified file in the data directory, overwriting existing content.
 * @param filename The name of the data file (e.g., 'users.json').
 * @param data The data object to write.
 */
export async function writeData(filename: string, data: any): Promise<void> {
    const filePath = path.join(DATA_DIR, filename);
    try {
        const serializedData = JSON.stringify(data, null, 2);
        await fs.writeFile(filePath, serializedData, 'utf-8');
    } catch (error) {
        console.error(`Error writing data to ${filename}:`, error);
        throw error;
    }
}