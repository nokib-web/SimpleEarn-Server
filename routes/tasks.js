import express from 'express';
import { ObjectId } from 'mongodb';
import { Tasks, Users } from '../config/collections.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

// Get all available tasks (where required_workers > 0)
router.get('/available', async (req, res) => {
  try {
    const tasks = await Tasks().find({ required_workers: { $gt: 0 }, status: 'active' })
      .sort({ completion_date: 1 })
      .toArray();
    res.json(tasks);
  } catch (error) {
    console.error('Get available tasks error:', error);
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
});

// Get task by ID
router.get('/:id', async (req, res) => {
  try {
    const task = await Tasks().findOne({ _id: new ObjectId(req.params.id) });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Error fetching task', error: error.message });
  }
});

// Create task (Buyer only)
router.post('/', verifyToken, checkRole('buyer'), async (req, res) => {
  try {
    const {
      task_title,
      task_detail,
      required_workers,
      payable_amount,
      completion_date,
      submission_info,
      task_image_url
    } = req.body;

    const buyer = req.userDoc;
    const totalPayable = required_workers * payable_amount;

    if (buyer.coin < totalPayable) {
      return res.status(400).json({
        message: 'Not available Coin. Purchase Coin',
        required: totalPayable,
        available: buyer.coin
      });
    }

    const task = {
      task_title,
      task_detail,
      required_workers: parseInt(required_workers),
      payable_amount: parseInt(payable_amount),
      completion_date: new Date(completion_date),
      submission_info,
      task_image_url: task_image_url || '',
      buyer_email: buyer.email,
      buyer_name: buyer.name,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await Tasks().insertOne(task);

    // Deduct coins from buyer
    await Users().updateOne(
      { _id: buyer._id },
      { $inc: { coin: -totalPayable } }
    );

    res.status(201).json({ message: 'Task created successfully', task: { ...task, _id: result.insertedId } });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Error creating task', error: error.message });
  }
});

// Update task (Buyer only - owner)
router.patch('/:id', verifyToken, checkRole('buyer'), async (req, res) => {
  try {
    const { id } = req.params;
    const { task_title, task_detail, submission_info } = req.body;

    const task = await Tasks().findOne({ _id: new ObjectId(id) });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.buyer_email !== req.user.email) {
      return res.status(403).json({ message: 'You can only update your own tasks' });
    }

    const updateData = {
      updatedAt: new Date()
    };
    if (task_title) updateData.task_title = task_title;
    if (task_detail) updateData.task_detail = task_detail;
    if (submission_info) updateData.submission_info = submission_info;

    const result = await Tasks().findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    res.json({ message: 'Task updated successfully', task: result });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Error updating task', error: error.message });
  }
});

// Delete task (Buyer only - owner or Admin)
router.delete('/:id', verifyToken, checkRole('buyer', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Tasks().findOne({ _id: new ObjectId(id) });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if buyer owns the task or user is admin
    if (req.userRole !== 'admin' && task.buyer_email !== req.user.email) {
      return res.status(403).json({ message: 'You can only delete your own tasks' });
    }

    // Refund coins if task not completed
    if (req.userRole === 'buyer') {
      const buyer = req.userDoc;
      const refundAmount = task.required_workers * task.payable_amount;
      await Users().updateOne(
        { _id: buyer._id },
        { $inc: { coin: refundAmount } }
      );
    }

    await Tasks().deleteOne({ _id: new ObjectId(id) });
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Error deleting task', error: error.message });
  }
});

// Get buyer's tasks
router.get('/buyer/my-tasks', verifyToken, checkRole('buyer'), async (req, res) => {
  try {
    const tasks = await Tasks().find({ buyer_email: req.user.email })
      .sort({ completion_date: -1 })
      .toArray();
    res.json(tasks);
  } catch (error) {
    console.error('Get buyer tasks error:', error);
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
});

// Get all tasks (Admin only)
router.get('/', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const tasks = await Tasks().find().sort({ createdAt: -1 }).toArray();
    res.json(tasks);
  } catch (error) {
    console.error('Get all tasks error:', error);
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
});

export default router;
