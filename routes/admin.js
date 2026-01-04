import express from 'express';
import { Users, Payments, Tasks, Submissions } from '../config/collections.js';
import { verifyToken, checkRole } from '../middleware/auth.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const router = express.Router();

// Get global administrative statistics
router.get('/stats', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        const [
            totalWorkers,
            totalBuyers,
            users,
            payments,
            totalTasks,
            totalSubmissions
        ] = await Promise.all([
            Users().countDocuments({ role: 'worker' }),
            Users().countDocuments({ role: 'buyer' }),
            Users().find({}).toArray(),
            Payments().find({}).toArray(),
            Tasks().countDocuments({}),
            Submissions().countDocuments({})
        ]);

        const totalCoins = users.reduce((sum, user) => sum + (user.coin || 0), 0);
        const totalPayments = payments.length;
        const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

        res.json({
            totalWorkers,
            totalBuyers,
            totalCoins,
            totalPayments,
            totalTasks,
            totalSubmissions,
            totalRevenue,
            usersCount: users.length
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ message: 'Error fetching administrative statistics', error: error.message });
    }
});

export default router;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

