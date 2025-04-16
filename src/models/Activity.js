const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide an activity title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  location: {
    type: String,
    required: [true, 'Please provide a location']
  },
  date: {
    type: Date,
    required: [true, 'Please provide a date']
  },
  endDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['planned', 'active', 'completed', 'cancelled'],
    default: 'planned'
  },
  qrCode: {
    type: String  // Store the QR code data or URL
  },
  token: {
    type: String, // Store a verification token for QR validation
    unique: true
  },
  metrics: {
    foodAmount: {
      type: Number,  // kg of food rescued
      default: 0
    },
    peopleServed: {
      type: Number,
      default: 0
    },
    mealCount: {
      type: Number,
      default: 0
    },
    volunteerHours: {
      type: Number,
      default: 0
    }
  },
  participants: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      walletAddress: {
        type: String
      },
      role: {
        type: String,
        enum: ['student', 'volunteer', 'recipient'],
        default: 'student'
      },
      verified: {
        type: Boolean,
        default: false
      },
      verifiedAt: {
        type: Date
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
      linkedClaimId: {
        type: String // Reference to the LinkedClaims credential
      }
    }
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Add GoodCollective fields
  goodCollectivePoolId: {
    type: String
  },
  goodCollectiveStatus: {
    type: String,
    enum: ['pending', 'active', 'completed'],
    default: 'pending'
  },
  nftMinted: {
    type: Boolean,
    default: false
  },
  nftId: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Activity', ActivitySchema);