const mongoose = require('mongoose');

const RewardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  activity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Please provide a reward amount']
  },
  transactionHash: {
    type: String,
    required: [true, 'Transaction hash is required']
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  type: {
    type: String,
    enum: ['volunteer', 'recipient', 'donation'],
    default: 'volunteer'
  },
  linkedClaimId: {
    type: String // Reference to the LinkedClaims credential
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create index for faster queries
RewardSchema.index({ user: 1, activity: 1 });

module.exports = mongoose.model('Reward', RewardSchema);