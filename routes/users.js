import express from 'express';
import { ObjectId } from 'mongodb';
import { Users } from '../config/collections.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

// Get all users (Admin only)
router.get('/', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        const users = await Users().find().toArray();
        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
});

// Get top workers (public)
router.get('/top-workers', async (req, res) => {
    try {
        const workers = await Users().find({ role: 'worker' })
            .sort({ coin: -1 })
            .limit(6)
            .project({ name: 1, photoURL: 1, coin: 1 })
            .toArray();
        res.json(workers);
    } catch (error) {
        console.error('Get top workers error:', error);
        res.status(500).json({ message: 'Error fetching top workers', error: error.message });
    }
});

// Update user role (Admin only)
router.patch('/:id/role', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['worker', 'buyer', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const result = await Users().findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: { role, updatedAt: new Date() } },
            { returnDocument: 'after' }
        );

        if (!result) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User role updated successfully', user: result });
    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({ message: 'Error updating role', error: error.message });
    }
});

// Delete user (Admin only)
router.delete('/:id', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Users().findOneAndDelete({ _id: new ObjectId(id) });

        if (!result) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
});

export default router;
