// controllers/updateController.js
import Update from "../models/UpdateInfo.js";

// Get active update notification
export const getUpdateInfo = async (req, res) => {
    try {
        // Find the latest active update that hasn't expired
        const update = await Update.findOne({
            isActive: true,
            $or: [
                { expiresAt: null },
                { expiresAt: { $gt: new Date() } }
            ]
        }).sort({ createdAt: -1 }); // Get the most recent

        if (!update) {
            return res.json({ 
                hasUpdate: false 
            });
        }

        res.json({
            hasUpdate: true,
            id: update._id.toString(),
            title: update.title,
            description: update.description,
            type: update.type,
            link: update.link,
            expiresAt: update.expiresAt
        });
    } catch (error) {
        console.error('Error fetching update info:', error);
        res.status(500).json({ error: 'Failed to fetch update info' });
    }
};

// Create new update notification (admin only)
export const createUpdate = async (req, res) => {
    try {
        const { title, description, type, link, expiresAt } = req.body;

        // Deactivate all previous updates
        await Update.updateMany({}, { isActive: false });

        // Create new update
        const newUpdate = new Update({
            title,
            description,
            type: type || 'update',
            link: link || null,
            expiresAt: expiresAt || null,
            isActive: true
        });

        await newUpdate.save();

        res.status(201).json({
            success: true,
            message: 'Update notification created successfully',
            update: newUpdate
        });
    } catch (error) {
        console.error('Error creating update:', error);
        res.status(500).json({ error: 'Failed to create update notification' });
    }
};

// Deactivate update notification (admin only)
export const deactivateUpdate = async (req, res) => {
    try {
        const { id } = req.params;
        
        const update = await Update.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );

        if (!update) {
            return res.status(404).json({ error: 'Update not found' });
        }

        res.json({
            success: true,
            message: 'Update deactivated successfully'
        });
    } catch (error) {
        console.error('Error deactivating update:', error);
        res.status(500).json({ error: 'Failed to deactivate update' });
    }
};

// Get all updates (admin only)
export const getAllUpdates = async (req, res) => {
    try {
        const updates = await Update.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            updates 
        });
    } catch (error) {
        console.error('Admin fetch Error:', error);
        res.status(500).json({success: false, error: 'Failed to fetch updates' });
    }
};