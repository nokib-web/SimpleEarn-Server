import express from 'express';
import Submission from '../models/Submission.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

// Create submission (Worker only)
router.post('/', verifyToken, checkRole('worker'), async (req, res) => {
  try {
    const { task_id, submission_details } = req.body;
    const worker = req.userDoc;

    const task = await Task.findById(task_id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.required_workers <= 0) {
      return res.status(400).json({ message: 'Task is already full' });
    }

    const submission = new Submission({
      task_id,
      task_title: task.task_title,
      payable_amount: task.payable_amount,
      worker_email: worker.email,
      worker_name: worker.name,
      buyer_email: task.buyer_email,
      buyer_name: task.buyer_name,
      submission_details,
      status: 'pending'
    });

    await submission.save();

    // Decrease required_workers
    task.required_workers -= 1;
    await task.save();

    // Create notification for buyer
    const notification = new Notification({
      message: `${worker.name} has submitted a task: ${task.task_title}`,
      toEmail: task.buyer_email,
      actionRoute: '/dashboard/task-review'
    });
    await notification.save();

    res.status(201).json({ message: 'Submission created successfully', submission });
  } catch (error) {
    console.error('Create submission error:', error);
    res.status(500).json({ message: 'Error creating submission', error: error.message });
  }
});

// Get worker's submissions
router.get('/worker/my-submissions', verifyToken, checkRole('worker'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const submissions = await Submission.find({ worker_email: req.user.email })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Submission.countDocuments({ worker_email: req.user.email });

    res.json({
      submissions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get worker submissions error:', error);
    res.status(500).json({ message: 'Error fetching submissions', error: error.message });
  }
});

// Get worker stats
router.get('/worker/stats', verifyToken, checkRole('worker'), async (req, res) => {
  try {
    const workerEmail = req.user.email;

    const totalSubmissions = await Submission.countDocuments({ worker_email: workerEmail });
    const pendingSubmissions = await Submission.countDocuments({ 
      worker_email: workerEmail, 
      status: 'pending' 
    });

    const approvedSubmissions = await Submission.find({ 
      worker_email: workerEmail, 
      status: 'approved' 
    });
    const totalEarning = approvedSubmissions.reduce((sum, sub) => sum + sub.payable_amount, 0);

    res.json({
      totalSubmissions,
      pendingSubmissions,
      totalEarning
    });
  } catch (error) {
    console.error('Get worker stats error:', error);
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
});

// Get approved submissions for worker
router.get('/worker/approved', verifyToken, checkRole('worker'), async (req, res) => {
  try {
    const submissions = await Submission.find({ 
      worker_email: req.user.email, 
      status: 'approved' 
    }).sort({ createdAt: -1 });
    res.json(submissions);
  } catch (error) {
    console.error('Get approved submissions error:', error);
    res.status(500).json({ message: 'Error fetching submissions', error: error.message });
  }
});

// Get pending submissions for buyer to review
router.get('/buyer/pending', verifyToken, checkRole('buyer'), async (req, res) => {
  try {
    const submissions = await Submission.find({ 
      buyer_email: req.user.email, 
      status: 'pending' 
    }).sort({ createdAt: -1 });
    res.json(submissions);
  } catch (error) {
    console.error('Get pending submissions error:', error);
    res.status(500).json({ message: 'Error fetching submissions', error: error.message });
  }
});

// Approve submission (Buyer only)
router.patch('/:id/approve', verifyToken, checkRole('buyer'), async (req, res) => {
  try {
    const { id } = req.params;
    const submission = await Submission.findById(id);

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (submission.buyer_email !== req.user.email) {
      return res.status(403).json({ message: 'You can only approve your own task submissions' });
    }

    if (submission.status !== 'pending') {
      return res.status(400).json({ message: 'Submission is not pending' });
    }

    submission.status = 'approved';
    await submission.save();

    // Increase worker's coins
    const worker = await User.findOne({ email: submission.worker_email });
    if (worker) {
      worker.coin += submission.payable_amount;
      await worker.save();
    }

    // Create notification for worker
    const notification = new Notification({
      message: `You have earned ${submission.payable_amount} coins from ${submission.buyer_name} for completing ${submission.task_title}`,
      toEmail: submission.worker_email,
      actionRoute: '/dashboard/worker-home'
    });
    await notification.save();

    res.json({ message: 'Submission approved successfully', submission });
  } catch (error) {
    console.error('Approve submission error:', error);
    res.status(500).json({ message: 'Error approving submission', error: error.message });
  }
});

// Reject submission (Buyer only)
router.patch('/:id/reject', verifyToken, checkRole('buyer'), async (req, res) => {
  try {
    const { id } = req.params;
    const submission = await Submission.findById(id);

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (submission.buyer_email !== req.user.email) {
      return res.status(403).json({ message: 'You can only reject your own task submissions' });
    }

    if (submission.status !== 'pending') {
      return res.status(400).json({ message: 'Submission is not pending' });
    }

    submission.status = 'rejected';
    await submission.save();

    // Increase required_workers
    const task = await Task.findById(submission.task_id);
    if (task) {
      task.required_workers += 1;
      await task.save();
    }

    // Create notification for worker
    const notification = new Notification({
      message: `Your submission for ${submission.task_title} has been rejected by ${submission.buyer_name}`,
      toEmail: submission.worker_email,
      actionRoute: '/dashboard/my-submissions'
    });
    await notification.save();

    res.json({ message: 'Submission rejected successfully', submission });
  } catch (error) {
    console.error('Reject submission error:', error);
    res.status(500).json({ message: 'Error rejecting submission', error: error.message });
  }
});

export default router;

