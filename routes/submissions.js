import express from 'express';
import { ObjectId } from 'mongodb';
import { Submissions, Tasks, Users, Notifications } from '../config/collections.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

// Create submission (Worker only)
router.post('/', verifyToken, checkRole('worker'), async (req, res) => {
  try {
    const { task_id, submission_details } = req.body;
    const worker = req.userDoc;

    const task = await Tasks().findOne({ _id: new ObjectId(task_id) });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.required_workers <= 0) {
      return res.status(400).json({ message: 'Task is already full' });
    }

    const submission = {
      task_id: new ObjectId(task_id),
      task_title: task.task_title,
      payable_amount: task.payable_amount,
      worker_email: worker.email,
      worker_name: worker.name,
      buyer_email: task.buyer_email,
      buyer_name: task.buyer_name,
      submission_details,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await Submissions().insertOne(submission);

    // Decrease required_workers
    await Tasks().updateOne(
      { _id: new ObjectId(task_id) },
      { $inc: { required_workers: -1 }, $set: { updatedAt: new Date() } }
    );

    // Create notification for buyer
    const notification = {
      message: `${worker.name} has submitted a task: ${task.task_title}`,
      toEmail: task.buyer_email,
      actionRoute: '/dashboard/task-review',
      isRead: false,
      createdAt: new Date()
    };
    await Notifications().insertOne(notification);

    res.status(201).json({ message: 'Submission created successfully', submission: { ...submission, _id: result.insertedId } });
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

    const query = { worker_email: req.user.email };
    const submissions = await Submissions().find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await Submissions().countDocuments(query);

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

    const totalSubmissions = await Submissions().countDocuments({ worker_email: workerEmail });
    const pendingSubmissions = await Submissions().countDocuments({
      worker_email: workerEmail,
      status: 'pending'
    });

    const approvedSubmissions = await Submissions().find({
      worker_email: workerEmail,
      status: 'approved'
    }).toArray();

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
    const submissions = await Submissions().find({
      worker_email: req.user.email,
      status: 'approved'
    }).sort({ createdAt: -1 }).toArray();
    res.json(submissions);
  } catch (error) {
    console.error('Get approved submissions error:', error);
    res.status(500).json({ message: 'Error fetching submissions', error: error.message });
  }
});

// Get buyer stats (approved submissions total payment)
router.get('/buyer/stats', verifyToken, checkRole('buyer'), async (req, res) => {
  try {
    const buyerEmail = req.user.email;

    const approvedSubmissions = await Submissions().find({
      buyer_email: buyerEmail,
      status: 'approved'
    }).toArray();

    const totalPayment = approvedSubmissions.reduce((sum, sub) => sum + sub.payable_amount, 0);

    res.json({
      totalPayment
    });
  } catch (error) {
    console.error('Get buyer stats error:', error);
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
});

// Get pending submissions for buyer to review
router.get('/buyer/pending', verifyToken, checkRole('buyer'), async (req, res) => {
  try {
    const submissions = await Submissions().find({
      buyer_email: req.user.email,
      status: 'pending'
    }).sort({ createdAt: -1 }).toArray();
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
    const submission = await Submissions().findOne({ _id: new ObjectId(id) });

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (submission.buyer_email !== req.user.email) {
      return res.status(403).json({ message: 'You can only approve your own task submissions' });
    }

    if (submission.status !== 'pending') {
      return res.status(400).json({ message: 'Submission is not pending' });
    }

    await Submissions().updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: 'approved', updatedAt: new Date() } }
    );

    // Increase worker's coins
    await Users().updateOne(
      { email: submission.worker_email },
      { $inc: { coin: submission.payable_amount } }
    );

    // Create notification for worker
    const notification = {
      message: `You have earned ${submission.payable_amount} coins from ${submission.buyer_name} for completing ${submission.task_title}`,
      toEmail: submission.worker_email,
      actionRoute: '/dashboard/worker-home',
      isRead: false,
      createdAt: new Date()
    };
    await Notifications().insertOne(notification);

    res.json({ message: 'Submission approved successfully' });
  } catch (error) {
    console.error('Approve submission error:', error);
    res.status(500).json({ message: 'Error approving submission', error: error.message });
  }
});

// Reject submission (Buyer only)
router.patch('/:id/reject', verifyToken, checkRole('buyer'), async (req, res) => {
  try {
    const { id } = req.params;
    const submission = await Submissions().findOne({ _id: new ObjectId(id) });

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (submission.buyer_email !== req.user.email) {
      return res.status(403).json({ message: 'You can only reject your own task submissions' });
    }

    if (submission.status !== 'pending') {
      return res.status(400).json({ message: 'Submission is not pending' });
    }

    await Submissions().updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: 'rejected', updatedAt: new Date() } }
    );

    // Increase required_workers
    await Tasks().updateOne(
      { _id: submission.task_id },
      { $inc: { required_workers: 1 }, $set: { updatedAt: new Date() } }
    );

    // Create notification for worker
    const notification = {
      message: `Your submission for ${submission.task_title} has been rejected by ${submission.buyer_name}`,
      toEmail: submission.worker_email,
      actionRoute: '/dashboard/my-submissions',
      isRead: false,
      createdAt: new Date()
    };
    await Notifications().insertOne(notification);

    res.json({ message: 'Submission rejected successfully' });
  } catch (error) {
    console.error('Reject submission error:', error);
    res.status(500).json({ message: 'Error rejecting submission', error: error.message });
  }
});

export default router;
