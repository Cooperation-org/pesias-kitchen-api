const Activity = require('../models/Activity');
const QRCode = require('../models/QRCode');
const Event = require('../models/Event');
const User = require('../models/User');
const { mintNFT } = require('../services/goodDollarService');


exports.recordActivity = async (req, res) => {
  try {
    const { eventId, qrCodeId, quantity, notes } = req.body;
    
    if (!eventId || !qrCodeId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Find the event and QR code
    const event = await Event.findById(eventId);
    const qrCode = await QRCode.findById(qrCodeId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    if (!qrCode) {
      return res.status(404).json({ message: 'QR code not found' });
    }
    
    // Create new activity record
    const newActivity = new Activity({
      event: event._id,
      qrCode: qrCode._id,
      user: req.user.userId,
      quantity: quantity || event.defaultQuantity || 1,
      notes: notes || '',
    });
    
    await newActivity.save();
    
    // Add activity to user's activities
    await User.findByIdAndUpdate(
      req.user.userId,
      { $push: { activities: newActivity._id } }
    );
    
    res.status(201).json({
      message: 'Activity recorded successfully',
      activity: newActivity
    });
  } catch (error) {
    console.error('Error recording activity:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.mintActivityNFT = async (req, res) => {
  try {
    const { activityId } = req.params;
    
    const activity = await Activity.findById(activityId);
    
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
    
    // Mint NFT using GoodDollar service
    const nftResult = await mintNFT(
      user.walletAddress,
      activity.type,
      activity.location,
      activity.quantity,
      activity._id.toString()
    );
    
    // Update activity with NFT ID
    activity.nftId = nftResult.nftId;
    activity.verified = true;
    await activity.save();
    
    res.status(200).json({
      message: 'NFT minted successfully',
      nftId: nftResult.nftId,
      txHash: nftResult.txHash
    });
  } catch (error) {
    console.error('Error minting NFT:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserActivities = async (req, res) => {
  try {
    const activities = await Activity.find({ user: req.user.userId })
      .sort({ timestamp: -1 });
    
    res.status(200).json(activities);
  } catch (error) {
    console.error('Error fetching user activities:', error);
    res.status(500).json({ message: 'Server error' });
  }
};