import express from 'express';
import User from '../models/User.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Register user
router.post('/register', async (req, res) => {
    try {
        const { name, email, photoURL, password, role } = req.body;

        // Validate role
        if (!['worker', 'buyer'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role. Must be worker or buyer.' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Set initial coins based on role
        const initialCoins = role === 'worker' ? 10 : 50;

        // Create user
        const user = new User({
            name,
            email,
            photoURL: photoURL || '',
            role,
            coin: initialCoins
        });

        await user.save();

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                name: user.name,
                email: user.email,
                role: user.role,
                coin: user.coin
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Registration failed', error: error.message });
    }
});

// Get user info (after Firebase auth)
router.get('/me', verifyToken, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.user.email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                photoURL: user.photoURL,
                role: user.role,
                coin: user.coin
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
});

export default router;

