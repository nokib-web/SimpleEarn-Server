import express from 'express';
import User from '../models/User.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

// Get all users (Admin only)
router.get('/', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        const users = await User.find().select('-__v');
        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
});

// Get top workers (public)
router.get('/top-workers', async (req, res) => {
    try {
        const workers = await User.find({ role: 'worker' })
            .sort({ coin: -1 })
            .limit(6)
            .select('name photoURL coin');
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

        const user = await User.findByIdAndUpdate(
            id,
            { role },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User role updated successfully', user });
    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({ message: 'Error updating role', error: error.message });
    }
});

// Delete user (Admin only)
router.delete('/:id', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
});

export default router;
