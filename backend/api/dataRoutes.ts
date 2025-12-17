import { Router, Request, Response } from 'express';
import { readData, writeData } from '../db/fsdb.js';
import { sendNotificationToAll, sendNotification } from '../services/notificationService.js';

const router = Router();

// Define expected structure types based on intended usage (assuming simple data entities)
interface GenericData {
    id: string;
    [key: string]: any;
}

// Route to retrieve all records from a specific file (collection)
router.get('/:collectionName', async (req: Request, res: Response) => {
    const { collectionName } = req.params;
    const filename = `${collectionName}.json`;

    try {
        const data = await readData<GenericData[]>(filename);
        if (data === null) {
            return res.status(404).json({ message: `Collection '${collectionName}' not found.` });
        }
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: `Error reading data for ${collectionName}`, error: (error as Error).message });
    }
});

// Route to create a new record in a collection file
router.post('/:collectionName', async (req: Request, res: Response) => {
    const { collectionName } = req.params;
    const filename = `${collectionName}.json`;
    const newItem: GenericData = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9), // Simple unique ID generator
        ...req.body
    };

    try {
        const existingData = await readData<GenericData[]>(filename) || [];

        if (!Array.isArray(existingData)) {
            // Handle case where file exists but contains non-array data (error state)
            return res.status(500).json({ message: `Data corruption in ${filename}: Expected array.` });
        }

        existingData.push(newItem);
        await writeData(filename, existingData);

        // Send notifications based on collection type
        if (collectionName === 'announcements') {
            // Notify all users about new announcement
            await sendNotificationToAll(
                '📢 New Announcement',
                newItem.title || 'A new announcement has been posted',
                { type: 'announcement', id: newItem.id }
            );
        } else if (collectionName === 'payments') {
            // Notify specific user about new payment
            if (newItem.familyId) {
                const families = await readData<any[]>('families.json') || [];
                const family = families.find(f => f.id === newItem.familyId);
                if (family && family.headId) {
                    await sendNotification(
                        family.headId,
                        '💰 New Payment Due',
                        `Payment of ₹${newItem.amount} for ${newItem.title || 'payment'}`,
                        { type: 'payment', id: newItem.id }
                    );
                }
            }
        }

        res.status(201).json(newItem);
    } catch (error) {
        res.status(500).json({ message: `Error creating item in ${collectionName}`, error: (error as Error).message });
    }
});

// Route to update an existing record in a collection file
router.put('/:collectionName/:id', async (req: Request, res: Response) => {
    const { collectionName, id } = req.params;
    const filename = `${collectionName}.json`;

    try {
        const existingData = await readData<GenericData[]>(filename);

        if (!existingData || !Array.isArray(existingData)) {
            return res.status(404).json({ message: `Collection '${collectionName}' not found.` });
        }

        const itemIndex = existingData.findIndex(item => item.id === id);

        if (itemIndex === -1) {
            return res.status(404).json({ message: `Item with id '${id}' not found in ${collectionName}.` });
        }

        const oldItem = existingData[itemIndex];

        // Update the item while preserving the ID
        existingData[itemIndex] = {
            ...existingData[itemIndex],
            ...req.body,
            id // Ensure ID cannot be changed
        };

        await writeData(filename, existingData);

        // Send notifications for payment status changes
        if (collectionName === 'payments' && oldItem.status !== req.body.status) {
            if (req.body.status === 'paid' && existingData[itemIndex].familyId) {
                const families = await readData<any[]>('families.json') || [];
                const family = families.find(f => f.id === existingData[itemIndex].familyId);
                if (family && family.headId) {
                    await sendNotification(
                        family.headId,
                        '✅ Payment Confirmed',
                        `Your payment of ₹${existingData[itemIndex].amount} has been confirmed`,
                        { type: 'payment_confirmed', id: id }
                    );
                }
            }
        }

        res.json(existingData[itemIndex]);
    } catch (error) {
        res.status(500).json({ message: `Error updating item in ${collectionName}`, error: (error as Error).message });
    }
});

// Route to delete a record from a collection file
router.delete('/:collectionName/:id', async (req: Request, res: Response) => {
    const { collectionName, id } = req.params;
    const filename = `${collectionName}.json`;

    try {
        const existingData = await readData<GenericData[]>(filename);

        if (!existingData || !Array.isArray(existingData)) {
            return res.status(404).json({ message: `Collection '${collectionName}' not found.` });
        }

        const itemIndex = existingData.findIndex(item => item.id === id);

        if (itemIndex === -1) {
            return res.status(404).json({ message: `Item with id '${id}' not found in ${collectionName}.` });
        }

        const deletedItem = existingData.splice(itemIndex, 1)[0];

        await writeData(filename, existingData);

        res.json({ message: 'Item deleted successfully', item: deletedItem });
    } catch (error) {
        res.status(500).json({ message: `Error deleting item from ${collectionName}`, error: (error as Error).message });
    }
});

export default router;