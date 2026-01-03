import express from 'express';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
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

// Confirm payment (Buyer only) - Dummy implementation if Stripe not configured
router.post('/confirm', verifyToken, checkRole('buyer'), async (req, res) => {
  try {
    const { amount, coins, payment_intent_id } = req.body;
    const buyer = req.userDoc;

    // Create payment record
    const payment = new Payment({
      buyer_email: buyer.email,
      amount,
      coins,
      payment_intent_id: payment_intent_id || 'dummy_' + Date.now(),
      status: 'completed'
    });

    await payment.save();

    // Increase buyer's coins
    buyer.coin += coins;
    await buyer.save();

    res.json({ message: 'Payment confirmed successfully', payment });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ message: 'Error confirming payment', error: error.message });
  }
});

// Get payment history (Buyer only)
router.get('/history', verifyToken, checkRole('buyer'), async (req, res) => {
  try {
    const payments = await Payment.find({ buyer_email: req.user.email })
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ message: 'Error fetching payment history', error: error.message });
  }
});

// Get all payments (Admin only)
router.get('/', verifyToken, checkRole('admin'), async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({ message: 'Error fetching payments', error: error.message });
  }
});

export default router;

