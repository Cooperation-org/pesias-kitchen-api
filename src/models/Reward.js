const mongoose = require('mongoose');

const RewardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  walletAddress: {
    type: String,
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
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  type: {
    type: String,
    enum: ['student', 'volunteer', 'recipient', 'donation'],
    default: 'student'
  },
  goodDollarTransactionId: {
    type: String
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
RewardSchema.index({ walletAddress: 1, activity: 1 });
RewardSchema.index({ user: 1, activity: 1 });

module.exports = mongoose.model('Reward', RewardSchema);