const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  // Remove email and password requirements
  email: {
    type: String,
    sparse: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  walletAddress: {
    type: String,
    unique: true,
    sparse: true
  },
  goodDollarInfo: {
    fullName: String,
    email: String,
    mobile: String,
    location: String
  },
  role: {
    type: String,
    enum: ['student', 'volunteer', 'recipient', 'admin'],
    default: 'student'
  },
  phoneNumber: {
    type: String,
    match: [/^\+?[1-9]\d{9,14}$/, 'Please enter a valid phone number'],
    sparse: true 
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
    type: String 
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);