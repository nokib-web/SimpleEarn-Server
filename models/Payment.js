import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  buyer_email: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  coins: {
    type: Number,
    required: true,
    min: 0
  },
  payment_intent_id: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

export default mongoose.model('Payment', paymentSchema);

