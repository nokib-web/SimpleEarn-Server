import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  task_title: {
    type: String,
    required: true,
    trim: true
  },
  task_detail: {
    type: String,
    required: true
  },
  required_workers: {
    type: Number,
    required: true,
    min: 1
  },
  payable_amount: {
    type: Number,
    required: true,
    min: 1
  },
  completion_date: {
    type: Date,
    required: true
  },
  submission_info: {
    type: String,
    required: true
  },
  task_image_url: {
    type: String,
    default: ''
  },
  buyer_email: {
    type: String,
    required: true
  },
  buyer_name: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  }
}, {
  timestamps: true
});

export default mongoose.model('Task', taskSchema);

