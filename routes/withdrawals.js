import express from 'express';
import { ObjectId } from 'mongodb';
import { Withdrawals, Users, Notifications } from '../config/collections.js';
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

    const withdrawal = {
      worker_email: worker.email,
      worker_name: worker.name,
      withdrawal_coin: parseInt(withdrawal_coin),
      withdrawal_amount,
      payment_system,
      account_number,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await Withdrawals().insertOne(withdrawal);
    res.status(201).json({ message: 'Withdrawal request created successfully', withdrawal: { ...withdrawal, _id: result.insertedId } });
  } catch (error) {
    console.error('Create withdrawal error:', error);
    res.status(500).json({ message: 'Error creating withdrawal', error: error.message });
  }
});

// Get worker's withdrawal requests
router.get('/worker/my-withdrawals', verifyToken, checkRole('worker'), async (req, res) => {
  try {
    const withdrawals = await Withdrawals().find({ worker_email: req.user.email })
      .sort({ createdAt: -1 }).toArray();
    res.json(withdrawals);
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({ message: 'Error fetching withdrawals', error: error.message });
  }
});

// Get pending withdrawal requests (Admin only)
router.get('/pending', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const withdrawals = await Withdrawals().find({ status: 'pending' })
      .sort({ createdAt: -1 }).toArray();
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
    const withdrawal = await Withdrawals().findOne({ _id: new ObjectId(id) });

    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ message: 'Withdrawal is not pending' });
    }

    // Check worker's current coins
    const worker = await Users().findOne({ email: withdrawal.worker_email });
    if (!worker || worker.coin < withdrawal.withdrawal_coin) {
      return res.status(400).json({ message: 'Worker does not have enough coins' });
    }

    // Approve and deduct coins
    await Withdrawals().updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: 'approved', updatedAt: new Date() } }
    );

    await Users().updateOne(
      { email: withdrawal.worker_email },
      { $inc: { coin: -withdrawal.withdrawal_coin } }
    );

    // Create notification for worker
    const notification = {
      message: `Your withdrawal request of $${withdrawal.withdrawal_amount} has been approved`,
      toEmail: withdrawal.worker_email,
      actionRoute: '/dashboard/withdrawals',
      isRead: false,
      createdAt: new Date()
    };
    await Notifications().insertOne(notification);

    res.json({ message: 'Withdrawal approved successfully' });
  } catch (error) {
    console.error('Approve withdrawal error:', error);
    res.status(500).json({ message: 'Error approving withdrawal', error: error.message });
  }
});

export default router;
