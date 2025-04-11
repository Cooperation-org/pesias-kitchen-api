const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['recipient', 'admin', 'volunteer'],
    default: 'volunteer'
  },
  walletAddress: {
    type: String,
    default: ''
  },
  phoneNumber: {
    type: String,
    match: [/^\+?[1-9]\d{9,14}$/, 'Please enter a valid phone number'],
    sparse: true // This allows the field to be optional but unique if provided
  },
  profileImage: {
    type: String
  },
  activitiesJoined: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity'
  }],
  activitiesCreated: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity'
  }],
  totalRewardsEarned: {
    type: Number,
    default: 0
  },
  linkedClaimsIds: [{
    type: String // Store LinkedClaims credential IDs only
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare passwords
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );
};

module.exports = mongoose.model('User', UserSchema);