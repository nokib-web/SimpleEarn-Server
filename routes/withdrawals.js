import express from 'express';
import Withdrawal from '../models/Withdrawal.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

// Create withdrawal request (Worker only)
router.post('/', verifyToken, checkRole('worker'), async (req, res) => {
  try {
    const { withdrawal_coin, payment_system, account_number } = req.body;
    const worker = req.userDoc;

    if (worker.coin < withdrawal_coin) {
      return res.status(400).json({ message: 'Insufficient coins' });
    }

    if (withdrawal_coin < 200) {
      return res.status(400).json({ message: 'Minimum withdrawal is 200 coins' });
    }

    const withdrawal_amount = withdrawal_coin / 20; // 20 coins = 1 dollar

    const withdrawal = new Withdrawal({
      worker_email: worker.email,
      worker_name: worker.name,
      withdrawal_coin,
      withdrawal_amount,
      payment_system,
      account_number,
      status: 'pending'
    });

    await withdrawal.save();
    res.status(201).json({ message: 'Withdrawal request created successfully', withdrawal });
  } catch (error) {
    console.error('Create withdrawal error:', error);
    res.status(500).json({ message: 'Error creating withdrawal', error: error.message });
  }
});

// Get worker's withdrawal requests
router.get('/worker/my-withdrawals', verifyToken, checkRole('worker'), async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ worker_email: req.user.email })
      .sort({ createdAt: -1 });
    res.json(withdrawals);
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({ message: 'Error fetching withdrawals', error: error.message });
  }
});

// Get pending withdrawal requests (Admin only)
router.get('/pending', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ status: 'pending' })
      .sort({ createdAt: -1 });
    res.json(withdrawals);
  } catch (error) {
    console.error('Get pending withdrawals error:', error);
    res.status(500).json({ message: 'Error fetching withdrawals', error: error.message });
  }
});

// Approve withdrawal (Admin only)
router.patch('/:id/approve', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const withdrawal = await Withdrawal.findById(id);

    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ message: 'Withdrawal is not pending' });
    }

    withdrawal.status = 'approved';
    await withdrawal.save();

    // Decrease worker's coins
    const worker = await User.findOne({ email: withdrawal.worker_email });
    if (worker) {
      if (worker.coin < withdrawal.withdrawal_coin) {
        withdrawal.status = 'pending';
        await withdrawal.save();
        return res.status(400).json({ message: 'Worker does not have enough coins' });
      }
      worker.coin -= withdrawal.withdrawal_coin;
      await worker.save();
    }

    // Create notification for worker
    const notification = new Notification({
      message: `Your withdrawal request of $${withdrawal.withdrawal_amount} has been approved`,
      toEmail: withdrawal.worker_email,
      actionRoute: '/dashboard/withdrawals'
    });
    await notification.save();

    res.json({ message: 'Withdrawal approved successfully', withdrawal });
  } catch (error) {
    console.error('Approve withdrawal error:', error);
    res.status(500).json({ message: 'Error approving withdrawal', error: error.message });
  }
});

export default router;

