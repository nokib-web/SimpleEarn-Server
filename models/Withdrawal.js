import mongoose from 'mongoose';

const withdrawalSchema = new mongoose.Schema({
  worker_email: {
    type: String,
    required: true
  },
  worker_name: {
    type: String,
    required: true
  },
  withdrawal_coin: {
    type: Number,
    required: true,
    min: 0
  },
  withdrawal_amount: {
    type: Number,
    required: true,
    min: 0
  },
  payment_system: {
    type: String,
    required: true,
    enum: ['Stripe', 'Bkash', 'Rocket', 'Nagad', 'Other']
  },
  account_number: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  withdraw_date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('Withdrawal', withdrawalSchema);

