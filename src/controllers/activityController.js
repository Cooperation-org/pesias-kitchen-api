
const Activity = require('../models/Activity');
const QRCode = require('../models/QRCode');
const Event = require('../models/Event');
const User = require('../models/User');

const goodDollarService = require('../services/goodDollarService');

exports.recordActivity = async (req, res) => {
  try {
    const { eventId, qrCodeId, quantity, notes } = req.body;
    
    if (!eventId || !qrCodeId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const event = await Event.findById(eventId);
    const qrCode = await QRCode.findById(qrCodeId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    if (!qrCode) {
      return res.status(404).json({ message: 'QR code not found' });
    }
    
    // Check for duplicate participation - prevent recording same activity twice
    const existingActivity = await Activity.findOne({
      user: req.user.userId,
      event: eventId
    });

    if (existingActivity) {
      return res.status(400).json({
        message: 'You\'ve already participated in this event! Your activity was recorded on ' + new Date(existingActivity.createdAt).toLocaleDateString() + '. You can scan again to view details.',
        existingActivity: {
          id: existingActivity._id,
          eventTitle: event.title,
          timestamp: existingActivity.createdAt,
          rewardAmount: existingActivity.rewardAmount
        }
      });
    }
    
    const newActivity = new Activity({
      event: event._id,
      qrCode: qrCode._id,
      user: req.user.userId,
      quantity: quantity || event.defaultQuantity || 1,
      notes: notes || '',
      rewardAmount: event.rewardAmount || 1, // Store the actual reward amount
    });
    
    await newActivity.save();
    
    await User.findByIdAndUpdate(
      req.user.userId,
      { $push: { activities: newActivity._id } }
    );

    // Activity recorded successfully - user can claim rewards later
    
    res.status(201).json({
      message: qrCode.type === 'volunteer' ? 
        'Activity recorded successfully! You can now claim your G$ rewards.' : 
        'Activity recorded successfully',
      activity: newActivity
    });
  } catch (error) {
    console.error('Error recording activity:', error);
    
    // Handle specific error types with user-friendly messages
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Invalid activity data. Please check your input and try again.' 
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        message: 'Invalid event or QR code. Please scan again.' 
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Activity already exists. You have already participated in this event.' 
      });
    }
    
    // Generic error for unexpected issues
    res.status(500).json({ 
      message: 'Unable to record activity. Please try again later.' 
    });
  }
};


exports.mintActivityNFT = async (req, res) => {
  try {
    const { activityId } = req.params;
    
    const activity = await Activity.findById(activityId)
      .populate('event')
      .populate('user');
    
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    
    if (activity.nftId) {
      return res.status(400).json({ message: 'NFT already minted for this activity' });
    }
    
    const user = await User.findById(activity.user);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const qrCode = await QRCode.findById(activity.qrCode);
    if (!qrCode) {
      return res.status(404).json({ message: 'QR code not found' });
    }
    
    if (qrCode.type !== 'volunteer') {
      return res.status(403).json({ message: 'Only volunteer activities can mint NFTs' });
    }

    const nftResult = await goodDollarService.mintNFT(
      user.walletAddress,
      activity.event.activityType,
      activity.event.location,
      activity.quantity,
      activity._id.toString()
    );
    
    activity.nftId = nftResult.nftId;
    activity.txHash = nftResult.txHash;
    activity.verified = true;
    await activity.save();
    
    res.status(200).json({
      message: 'NFT minted successfully and G$ rewards claimed via blockchain',
      nftId: nftResult.nftId,
      txHash: nftResult.txHash,
      rewardAmount: nftResult.rewardAmount
    });
  } catch (error) {
    console.error('Error minting NFT:', error);
    
    // Handle specific blockchain errors with user-friendly messages
    if (error.message && error.message.includes('insufficient funds')) {
      return res.status(400).json({ 
        message: 'Insufficient funds for blockchain transaction. Please try again later.' 
      });
    }
    
    if (error.message && error.message.includes('network')) {
      return res.status(400).json({ 
        message: 'Network connection issue. Please check your internet and try again.' 
      });
    }
    
    if (error.message && error.message.includes('gas')) {
      return res.status(400).json({ 
        message: 'Transaction failed due to gas issues. Please try again.' 
      });
    }
    
    // Generic blockchain error
    res.status(500).json({ 
      message: 'Unable to process blockchain transaction. Please try again later.',
      error: error.message || 'Unknown error'
    });
  }
};

exports.getUserActivities = async (req, res) => {
  try {
    const activities = await Activity.find({ user: req.user.userId })
      .populate('event')
      .sort({ timestamp: -1 });
    
    res.status(200).json(activities);
  } catch (error) {
    console.error('Error fetching user activities:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllActivities = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const activities = await Activity.find()
      .populate('user', 'name walletAddress')
      .populate('event')
      .sort({ timestamp: -1 });
    
    res.status(200).json(activities);
  } catch (error) {
    console.error('Error fetching all activities:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getActivityById = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.activityId)
      .populate('user', 'name walletAddress')
      .populate('event')
      .populate('qrCode');
    
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    
    if (activity.user._id.toString() !== req.user.userId && 
    req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Not authorized' });
    }
    
    res.status(200).json(activity);
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
