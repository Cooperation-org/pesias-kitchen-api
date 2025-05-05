const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  qrCode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QRCode',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  verified: {
    type: Boolean,
    default: true,
  },
  nftId: {
    type: String,
    default: null,
  },
  txHash: {  
    type: String,
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  notes: String,
});

module.exports = mongoose.model('Activity', activitySchema);