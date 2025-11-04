const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  // Transaction details
  txHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'cUSD',
    enum: ['cUSD', 'USDC', 'USDT', 'G$']
  },

  // Donor information (optional - can be anonymous)
  donorWallet: {
    type: String,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Donation method
  method: {
    type: String,
    enum: ['minipay', 'goodcollective', 'direct'],
    default: 'minipay'
  },

  // Blockchain details
  blockNumber: Number,
  chainId: {
    type: Number,
    default: 42220 // Celo mainnet
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'pending'
  },

  // Metadata
  notes: String,
  source: {
    type: String,
    enum: ['web', 'mobile', 'minipay-app'],
    default: 'web'
  },

  // Timestamps
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
donationSchema.index({ createdAt: -1 });
donationSchema.index({ status: 1, createdAt: -1 });
donationSchema.index({ donorWallet: 1, createdAt: -1 });

// Virtual for formatted amount
donationSchema.virtual('formattedAmount').get(function() {
  return `${this.amount.toFixed(2)} ${this.currency}`;
});

// Static method to get donation statistics
donationSchema.statics.getStatistics = async function(startDate, endDate) {
  const stats = await this.aggregate([
    {
      $match: {
        status: 'confirmed',
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalDonations: { $sum: 1 },
        uniqueDonors: { $addToSet: '$donorWallet' },
        byMethod: {
          $push: {
            method: '$method',
            amount: '$amount'
          }
        }
      }
    }
  ]);

  if (stats.length === 0) {
    return {
      totalAmount: 0,
      totalDonations: 0,
      uniqueDonors: 0,
      byMethod: {}
    };
  }

  const result = stats[0];

  // Process donations by method
  const methodBreakdown = result.byMethod.reduce((acc, item) => {
    if (!acc[item.method]) {
      acc[item.method] = { count: 0, totalAmount: 0 };
    }
    acc[item.method].count++;
    acc[item.method].totalAmount += item.amount;
    return acc;
  }, {});

  return {
    totalAmount: result.totalAmount,
    totalDonations: result.totalDonations,
    uniqueDonors: result.uniqueDonors.filter(w => w).length, // Filter out null wallets
    byMethod: methodBreakdown,
    period: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    }
  };
};

module.exports = mongoose.model('Donation', donationSchema);
