const Activity = require('../models/Activity');
const crypto = require('crypto');

// Generate QR code token for an activity
const generateQR = async (req, res) => {
  try {
    const { activityId } = req.params;
    
    // Find the activity
    const activity = await Activity.findById(activityId);
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }
    
    // Generate a unique token if not already present
    if (!activity.token) {
      activity.token = crypto.randomBytes(16).toString('hex');
      await activity.save();
    }
    
    // Create QR code data
    // This is the data that will be encoded in the QR code by the frontend
    const qrCodeData = {
      activityId: activity._id,
      token: activity.token,
      title: activity.title,
      date: activity.date
    };
    
    // The frontend will use this data to generate the QR code
    res.status(200).json({
      success: true,
      data: qrCodeData
    });
  } catch (error) {
    console.error('QR code generation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate QR code'
    });
  }
};

// Verify QR code scan
const verifyQR = async (req, res) => {
  try {
    const { activityId, token, walletAddress, role } = req.body;
    
    if (!activityId || !token || !walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'Activity ID, token, and wallet address are required'
      });
    }
    
    // Find the activity
    const activity = await Activity.findById(activityId);
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }
    
    // Verify token
    if (activity.token !== token) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code token'
      });
    }
    
    // Check if activity is active
    if (activity.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Activity is ${activity.status}, not active`
      });
    }
    
    // Find user by wallet address
    const User = require('../models/User');
    const user = await User.findOne({ walletAddress });
    
    // Check if already participated
    const existingParticipant = activity.participants.find(
      p => p.walletAddress === walletAddress
    );
    
    if (existingParticipant && existingParticipant.verified) {
      return res.status(400).json({
        success: false,
        message: 'Already verified participation in this activity'
      });
    }
    
    // Update or add participant
    if (existingParticipant) {
      existingParticipant.verified = true;
      existingParticipant.verifiedAt = Date.now();
      existingParticipant.role = role || existingParticipant.role;
    } else {
      activity.participants.push({
        user: user ? user._id : null,
        walletAddress,
        role: role || 'student',
        verified: true,
        verifiedAt: Date.now()
      });
    }
    
    await activity.save();
    
    // If GoodCollective integration is available, record the action
    try {
      const goodCollectiveService = require('../services/goodCollectiveService');
      await goodCollectiveService.recordAction(activity._id, walletAddress, role || 'student');
    } catch (error) {
      console.error('GoodCollective integration error:', error);
      // Continue even if GoodCollective integration fails
    }
    
    // Also record in Participation model for easier querying
    const Participation = require('../models/Participation');
    await Participation.findOneAndUpdate(
      { activity: activityId, walletAddress },
      {
        activity: activityId,
        user: user ? user._id : null,
        walletAddress,
        role: role || 'student',
        verified: true,
        verifiedAt: Date.now()
      },
      { upsert: true, new: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Participation verified successfully'
    });
  } catch (error) {
    console.error('QR verification error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify QR code'
    });
  }
};

module.exports = {
  generateQR,
  verifyQR
};