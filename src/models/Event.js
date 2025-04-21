const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  activityType: {
    type: String,
    enum: ['food_sorting', 'food_distribution', 'food_pickup'],
    required: true,
  },
  capacity: {
    type: Number,
    default: 0,
  },
  defaultQuantity: { // Add this to store the default quantity for this event
    type: Number,
    default: 1,
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Event', eventSchema);