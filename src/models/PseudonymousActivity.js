const mongoose = require('mongoose');

const pseudonymousActivitySchema = new mongoose.Schema({
  // Pseudonymous identifier (UUID v4 generated in browser)
  pseudonymousId: {
    type: String,
    required: true,
    index: true,
    validate: {
      validator: function(v) {
        // Validate UUID v4 format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(v);
      },
      message: 'Invalid pseudonymous ID format (must be UUID v4)'
    }
  },

  // Event and QR code references
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  qrCodeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QRCode',
    required: true
  },

  // Activity details
  activityType: {
    type: String,
    enum: ['volunteer', 'recipient'],
    required: true
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  rewardAmount: {
    type: Number,
    default: 1,
    min: 0
  },

  // Timestamp and verification data
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  
  // Geolocation data for verification
  geolocation: {
    latitude: { type: Number },
    longitude: { type: Number },
    accuracy: { type: Number }
  },

  // Browser fingerprinting for additional duplicate prevention
  sessionFingerprint: {
    type: String,
    sparse: true
  },

  // Network metadata
  ipAddress: {
    type: String,
    sparse: true
  },
  userAgent: {
    type: String,
    sparse: true
  },

  // Smart contract integration
  blockchainProof: {
    transactionHash: String,
    blockNumber: Number,
    gasUsed: Number,
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'failed'],
      default: 'pending'
    }
  },

  // Reward distribution tracking
  rewardsDistributed: {
    type: Boolean,
    default: false
  },
  rewardTransactionHash: String,

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for duplicate prevention (one pseudonymous ID per event)
pseudonymousActivitySchema.index({ pseudonymousId: 1, eventId: 1 }, { unique: true });

// Indexes for analytics and queries
pseudonymousActivitySchema.index({ activityType: 1, createdAt: -1 });
pseudonymousActivitySchema.index({ timestamp: -1 });
pseudonymousActivitySchema.index({ 'geolocation.latitude': 1, 'geolocation.longitude': 1 });

// Update the updatedAt field on save
pseudonymousActivitySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for activity age
pseudonymousActivitySchema.virtual('ageInDays').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Instance methods
pseudonymousActivitySchema.methods.markRewardsDistributed = function(transactionHash) {
  this.rewardsDistributed = true;
  this.rewardTransactionHash = transactionHash;
  this.updatedAt = new Date();
  return this.save();
};

pseudonymousActivitySchema.methods.updateBlockchainProof = function(txHash, blockNumber, gasUsed, status = 'confirmed') {
  this.blockchainProof = {
    transactionHash: txHash,
    blockNumber,
    gasUsed,
    status
  };
  this.updatedAt = new Date();
  return this.save();
};

// Static methods for analytics
pseudonymousActivitySchema.statics.getStatsByDateRange = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          activityType: "$activityType"
        },
        count: { $sum: 1 },
        totalRewards: { $sum: "$rewardAmount" },
        totalQuantity: { $sum: "$quantity" }
      }
    },
    {
      $sort: { "_id.date": 1, "_id.activityType": 1 }
    }
  ]);
};

pseudonymousActivitySchema.statics.getUniqueParticipants = function(eventId = null) {
  const match = eventId ? { eventId: new mongoose.Types.ObjectId(eventId) } : {};
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$pseudonymousId",
        firstActivity: { $min: "$createdAt" },
        lastActivity: { $max: "$createdAt" },
        totalActivities: { $sum: 1 },
        totalRewards: { $sum: "$rewardAmount" }
      }
    },
    {
      $group: {
        _id: null,
        uniqueParticipants: { $sum: 1 },
        totalActivities: { $sum: "$totalActivities" },
        totalRewards: { $sum: "$totalRewards" },
        averageActivitiesPerParticipant: { $avg: "$totalActivities" }
      }
    }
  ]);
};

// Export the model
module.exports = mongoose.model('PseudonymousActivity', pseudonymousActivitySchema);