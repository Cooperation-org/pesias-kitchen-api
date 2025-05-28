const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  role: {
    type: String,
    enum: ['volunteer', 'recipient', 'admin', 'superadmin'],
    default: 'recipient',
  },
  name: {
    type: String,
    default: '',
  },
  nonce: {
    type: String,
    required: true,
  },
  isCustodial: {
  type: Boolean,
  default: false,
  },
  phoneNumber: {
    type: String,
    sparse: true,
    trim: true,
  },
  email: {
    type: String,
    sparse: true,
    lowercase: true,
    trim: true,
  },
  claimedAt: {
    type: Date,
    default: null,
  },
  activities: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);