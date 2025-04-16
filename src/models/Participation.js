const mongoose = require('mongoose');

const ParticipationSchema = new mongoose.Schema({
  activity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  walletAddress: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'volunteer', 'recipient'],
    default: 'student'
  },
  verified: {
    type: Boolean,
    default: true
  },
  verifiedAt: {
    type: Date,
    default: Date.now
  },
  rewarded: {
    type: Boolean,
    default: false
  },
  rewardAmount: {
    type: Number,
    default: 0
  },
  transactionHash: {
    type: String
  },
  goodCollectiveActionId: {
    type: String
  },
  linkedClaimId: {
    type: String
  }
});

// Create index for faster queries
ParticipationSchema.index({ activity: 1, walletAddress: 1 }, { unique: true });

module.exports = mongoose.model('Participation', ParticipationSchema);