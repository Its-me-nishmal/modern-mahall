import { Router, Request, Response } from 'express';
import database from '../db/index.js';
import { sendNotificationToAll, sendNotification } from '../services/notificationService.js';
import { requireAuth } from '../utils/auth.js';
import { IAnnouncement } from '../db/interface.js';

const router = Router();

// Define expected structure types based on intended usage
interface GenericData {
    id: string;
    [key: string]: any;
}

// Helper function to get appropriate database method based on collection name
const getCollectionMethods = (collectionName: string) => {
    switch (collectionName) {
        case 'families':
            return {
                getAll: () => database.getAllFamilies(),
                create: (data: any) => database.createFamily(data),
                update: (id: string, data: any) => database.updateFamily(id, data),
                delete: (id: string) => database.deleteFamily(id),
                getById: (id: string) => database.getFamilyById(id)
            };
        case 'announcements':
            return {
                getAll: () => database.getAllAnnouncements(),
                create: (data: any) => database.createAnnouncement(data),
                update: (id: string, data: any) => database.updateAnnouncement(id, data),
                delete: (id: string) => database.deleteAnnouncement(id),
                getById: (id: string) => database.getAnnouncementById(id)
            };
        case 'payments':
            return {
                getAll: () => database.getAllPayments(),
                create: (data: any) => database.createPayment(data),
                update: (id: string, data: any) => database.updatePayment(id, data),
                delete: (id: string) => database.deletePayment(id),
                getById: (id: string) => database.getPaymentById ? database.getPaymentById(id) : null
            };
        case 'feedbacks':
            return {
                getAll: () => database.getAllFeedbacks(),
                create: (data: any) => database.createFeedback(data),
                update: (id: string, data: any) => database.updateFeedback(id, data),
                delete: (id: string) => database.deleteFeedback(id),
                getById: (id: string) => database.getFeedbackById(id)
            };
        case 'notifications':
            return {
                getAll: () => database.getAllNotifications(),
                create: (data: any) => database.createNotification(data),
                update: (id: string, data: any) => null, // Not implemented
                delete: (id: string) => database.deleteNotification(id),
                getById: (id: string) => database.getNotificationById(id)
            };
        case 'logs':
            return {
                getAll: () => database.getAllLogs(),
                create: (data: any) => database.createLog(data),
                update: (id: string, data: any) => null, // Not supported
                delete: (id: string) => null, // Not supported
                getById: (id: string) => null // Not supported
            };
        default:
            return null;
    }
};

// SECURE ANNOUNCEMENTS ROUTE
// Filters announcements based on user role and targeting criteria.
router.get('/announcements', requireAuth, async (req: Request, res: Response) => {
    try {
        const methods = getCollectionMethods('announcements');
        if (!methods) {
            return res.status(400).json({ message: "Announcements collection not supported" });
        }

        const allAnnouncements = await methods.getAll();
        const user = req.user!; // Populated by requireAuth

        // ADMINs see everything
        if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
            return res.json(allAnnouncements.map((item: any) => ({
                ...item,
                description: item.content || item.description || '',
                // Ensure other fields are mapped if needed
                imageUrl: item.imageUrl,
                videoUrl: item.videoUrl,
                formUrl: item.formUrl,
                location: item.location
            })));
        }

        // For Regular Members (Head/Member)
        if (!user.familyId) {
            // New users without family should likely see nothing targeted
            const globalOnly = allAnnouncements.filter((a: IAnnouncement) => {
                const target = a.target;
                return !target || (!target.wards?.length && !target.specificFamilyIds?.length && !target.specificMemberIds?.length);
            });
            return res.json(globalOnly);
        }

        const family = await database.getFamilyById(user.familyId);
        if (!family) {
            return res.status(404).json({ message: "User family not found" });
        }

        // Identify the specific member profile
        // Backend auth token has mobile. We use that to identify the specific member.
        // Fallback to name match if needed (though mobile is unique)
        const currentMember = family.members.find(m => m.phone === user.mobile || m.name === user.name);

        const filtered = allAnnouncements.filter((a: IAnnouncement) => {
            const target = a.target;

            // 1. GLOBAL (No targeting)
            if (!target) return true;
            const hasNoTargeting = !target.wards?.length && !target.gender &&
                !target.minAge && !target.maxAge &&
                !target.specificFamilyIds?.length && !target.specificMemberIds?.length;
            if (hasNoTargeting) return true;

            // 2. SPECIFIC MEMBER TARGETING (Priority)
            if (target.specificMemberIds && target.specificMemberIds.length > 0) {
                if (user.role === 'HEAD') {
                    // Head: Visible if ANY family member is targeted
                    return family.members.some(m => target.specificMemberIds!.includes(m.id));
                } else {
                    // Member: Visible ONLY if YOU are targeted
                    if (!currentMember) return false;
                    return target.specificMemberIds.includes(currentMember.id);
                }
            }

            // 3. SPECIFIC FAMILY TARGETING
            if (target.specificFamilyIds && target.specificFamilyIds.length > 0) {
                if (!target.specificFamilyIds.includes(family.id)) return false;
            }

            // 4. WARD TARGETING
            if (target.wards && target.wards.length > 0) {
                if (!target.wards.includes(family.ward)) return false;
            }

            // 5. DEMOGRAPHICS (Gender/Age)
            // Use currentMember; if missing (and is Head), default to Head member profile
            const memberToCheck = currentMember || (user.role === 'HEAD' ? family.members.find(m => m.relation === 'Head') : null);

            if (memberToCheck) {
                if (target.gender && target.gender !== 'All') {
                    if (memberToCheck.gender !== target.gender) return false;
                }
                if (target.minAge && memberToCheck.age < target.minAge) return false;
                if (target.maxAge && memberToCheck.age > target.maxAge) return false;
            }

            return true;
        });

        // Map response format
        const responseData = filtered.map((item: any) => ({
            ...item,
            description: item.content || item.description || '',
            imageUrl: item.imageUrl,
            videoUrl: item.videoUrl,
            formUrl: item.formUrl,
            location: item.location
        }));

        res.json(responseData);

    } catch (error) {
        console.error('Error fetching announcements:', error);
        res.status(500).json({ message: "Error fetching announcements" });
    }
});

// Route to retrieve all records from a specific collection
router.get('/:collectionName', async (req: Request, res: Response) => {
    const { collectionName } = req.params;

    try {
        const methods = getCollectionMethods(collectionName);

        if (!methods) {
            return res.status(400).json({ message: `Collection '${collectionName}' is not supported` });
        }

        const data = await methods.getAll();

        // Map backend field names to frontend expectations
        let responseData = data || [];
        if (collectionName === 'announcements') {
            responseData = responseData.map((item: any) => ({
                ...item,
                description: item.content || item.description || '',
                imageUrl: item.imageUrl,
                videoUrl: item.videoUrl,
                formUrl: item.formUrl,
                location: item.location
            }));
        }

        res.json(responseData);
    } catch (error) {
        console.error(`Error reading ${collectionName}:`, error);
        res.status(500).json({ message: `Error reading data for ${collectionName}`, error: (error as Error).message });
    }
});

// Route to create a new record in a collection
router.post('/:collectionName', async (req: Request, res: Response) => {
    const { collectionName } = req.params;
    const newItem: GenericData = {
        id: `${collectionName}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        ...req.body,
        createdAt: req.body.createdAt || new Date()
    };

    // Map frontend field names to backend schema
    if (collectionName === 'announcements' && req.body.description) {
        newItem.content = req.body.description;
    }

    try {
        const methods = getCollectionMethods(collectionName);

        if (!methods) {
            return res.status(400).json({ message: `Collection '${collectionName}' is not supported` });
        }

        const created = await methods.create(newItem);

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
                const family = await database.getFamilyById(newItem.familyId);
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

        res.status(201).json(created || newItem);
    } catch (error) {
        console.error(`Error creating ${collectionName}:`, error);
        res.status(500).json({ message: `Error creating item in ${collectionName}`, error: (error as Error).message });
    }
});

// Route to update an existing record in a collection
router.put('/:collectionName/:id', async (req: Request, res: Response) => {
    const { collectionName, id } = req.params;

    try {
        const methods = getCollectionMethods(collectionName);

        if (!methods) {
            return res.status(400).json({ message: `Collection '${collectionName}' is not supported` });
        }

        // Get old item for comparison
        const oldItem = methods.getById ? await methods.getById(id) : null;

        if (!oldItem) {
            return res.status(404).json({ message: `Item with id '${id}' not found in ${collectionName}` });
        }

        // Update the item
        const updated = await methods.update(id, { ...req.body, id });

        if (!updated) {
            return res.status(404).json({ message: `Failed to update item with id '${id}' in ${collectionName}` });
        }

        // Send notifications for payment status changes
        if (collectionName === 'payments' && oldItem && (oldItem as any).status !== req.body.status) {
            if (req.body.status === 'Paid' && (updated as any).familyId) {
                const family = await database.getFamilyById((updated as any).familyId);
                if (family && family.headId) {
                    await sendNotification(
                        family.headId,
                        '✅ Payment Confirmed',
                        `Your payment of ₹${(updated as any).amount} has been confirmed`,
                        { type: 'payment_confirmed', id: id }
                    );
                }
            }
        }

        res.json(updated);
    } catch (error) {
        console.error(`Error updating ${collectionName}:`, error);
        res.status(500).json({ message: `Error updating item in ${collectionName}`, error: (error as Error).message });
    }
});

// Route to delete a record from a collection
router.delete('/:collectionName/:id', async (req: Request, res: Response) => {
    const { collectionName, id } = req.params;

    try {
        const methods = getCollectionMethods(collectionName);

        if (!methods) {
            return res.status(400).json({ message: `Collection '${collectionName}' is not supported` });
        }

        const deleted = await methods.delete(id);

        if (!deleted) {
            return res.status(404).json({ message: `Item with id '${id}' not found in ${collectionName}` });
        }

        res.json({ message: 'Item deleted successfully', success: deleted });
    } catch (error) {
        console.error(`Error deleting ${collectionName}:`, error);
        res.status(500).json({ message: `Error deleting item from ${collectionName}`, error: (error as Error).message });
    }
});

export default router;