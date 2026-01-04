import express from 'express';
import { ObjectId } from 'mongodb';
import { Payments, Users } from '../config/collections.js';
import Stripe from 'stripe';
import { verifyToken, checkRole } from '../middleware/auth.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_...');

const router = express.Router();

// Create payment intent (Buyer only)
router.post('/create-intent', verifyToken, checkRole('buyer'), async (req, res) => {
  try {
    const { amount, coins } = req.body;

    if (!amount || !coins) {
      return res.status(400).json({ message: 'Amount and coins are required' });
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        buyer_email: req.user.email,
        coins: coins.toString()
      }
    });

    res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ message: 'Error creating payment intent', error: error.message });
  }
});

// Confirm payment (Buyer only) - Verifies with Stripe
router.post('/confirm', verifyToken, checkRole('buyer'), async (req, res) => {
  try {
    const { amount, coins, payment_intent_id } = req.body;
    const buyer = req.userDoc;

    if (!payment_intent_id) {
      return res.status(400).json({ message: 'Payment Intent ID is required' });
    }

    // Real verification: Retrieve the payment intent from Stripe
    let isSucceeded = false;
    let finalIntentId = payment_intent_id;

    if (payment_intent_id.startsWith('pi_')) {
      try {
        const intent = await stripe.paymentIntents.retrieve(payment_intent_id);
        if (intent.status === 'succeeded') {
          isSucceeded = true;
        } else {
          return res.status(400).json({ message: `Payment failed with status: ${intent.status}` });
        }
      } catch (stripeErr) {
        console.error('Stripe retrieval error:', stripeErr);
        return res.status(400).json({ message: 'Invalid Payment Intent ID' });
      }
    } else if (payment_intent_id.startsWith('dummy_')) {
      // Allow dummy only for testing if explicitly desired, but since user asked for real:
      // isSucceeded = true; 
      return res.status(400).json({ message: 'Dummy payments not allowed for real implementation' });
    }

    if (!isSucceeded) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    // Prevent duplicate processing of the same payment intent
    const existingPayment = await Payments().findOne({ payment_intent_id: finalIntentId });
    if (existingPayment) {
      return res.status(400).json({ message: 'This payment has already been processed' });
    }

    // Create payment record
    const payment = {
      buyer_email: buyer.email,
      amount: parseFloat(amount),
      coins: parseInt(coins),
      payment_intent_id: finalIntentId,
      status: 'completed',
      createdAt: new Date()
    };

    const result = await Payments().insertOne(payment);

    // Increase buyer's coins
    await Users().updateOne(
      { _id: buyer._id },
      { $inc: { coin: parseInt(coins) } }
    );

    res.json({ message: 'Payment confirmed successfully', payment: { ...payment, _id: result.insertedId } });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ message: 'Error confirming payment', error: error.message });
  }
});

// Get payment history (Buyer only)
router.get('/history', verifyToken, checkRole('buyer'), async (req, res) => {
  try {
    const payments = await Payments().find({ buyer_email: req.user.email })
      .sort({ createdAt: -1 }).toArray();
    res.json(payments);
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ message: 'Error fetching payment history', error: error.message });
  }
});

// Get all payments (Admin only)
router.get('/', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const payments = await Payments().find().sort({ createdAt: -1 }).toArray();
    res.json(payments);
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({ message: 'Error fetching payments', error: error.message });
  }
});

export default router;
