const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Dynamic-specific fields
  dynamicUserId: { type: String, unique: true, sparse: true },
  
  // Contact information
  email: { type: String, sparse: true },
  phone: { type: String, sparse: true },
  
  // Wallet information
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  walletProvider: {
    type: String,
    enum: ['dynamic', 'external'],
    default: 'external',
  },
  
  // Authentication methods
  authMethods: [{ 
    type: String, 
    enum: ['wallet', 'email', 'sms', 'passkey', 'social', 'biometric'],
    default: []
  }],
  
  // Passkey/Biometric data
  passkeyId: { type: String, sparse: true },
  
  // Social login data
  socialProvider: { type: String, enum: ['google', 'apple', 'twitter', 'discord'] },
  
  // User properties
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
    default: () => require('uuid').v4(), // Auto-generate if missing
  },
  isAnonymous: {
    type: Boolean,
    default: false,
  },
  
  // User activities
  activities: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
  }],
  
  // Metadata
  lastLoginAt: { type: Date, default: Date.now },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for performance
userSchema.index({ dynamicUserId: 1 });
userSchema.index({ walletAddress: 1 });
userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);