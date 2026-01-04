import express from 'express';
import { ObjectId } from 'mongodb';
import { Notifications } from '../config/collections.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get user notifications
router.get('/:email', verifyToken, async (req, res) => {
  try {
    const { email } = req.params;

    // Verify user can only access their own notifications
    if (req.user.email !== email) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const notifications = await Notifications().find({ toEmail: email })
      .sort({ createdAt: -1 }).toArray();

    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
});

// Mark notification as read
router.patch('/:id/read', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notifications().findOne({ _id: new ObjectId(id) });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Verify user owns the notification
    if (notification.toEmail !== req.user.email) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Notifications().updateOne(
      { _id: new ObjectId(id) },
      { $set: { isRead: true } }
    );

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: 'Error updating notification', error: error.message });
  }
});

export default router;
