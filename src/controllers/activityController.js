// src/controllers/activityController.js
const Activity = require('../models/Activity');
const User = require('../models/User');
const Reward = require('../models/Reward');
const qrCodeService = require('../services/qrCodeService');
const goodDollarService = require('../services/goodDollarService');
const linkedClaimsService = require('../services/linkedClaimsService');

// Create a new activity
exports.createActivity = async (req, res) => {
  try {
    const { title, description, location, date, endDate, metrics } = req.body;

    // Generate QR code
    const { qrCodeDataUrl, token } = await qrCodeService.generateActivityQR(Date.now().toString());

    const activity = await Activity.create({
      title,
      description,
      location,
      date: new Date(date),
      endDate: endDate ? new Date(endDate) : null,
      metrics,
      qrCode: qrCodeDataUrl,
      qrToken: token,
      createdBy: req.user.id
    });

    // Update user's created activities
    await User.findByIdAndUpdate(req.user.id, {
      $push: { activitiesCreated: activity._id }
    });

    res.status(201).json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all activities
exports.getActivities = async (req, res) => {
  try {
    const activities = await Activity.find()
      .populate('createdBy', 'name email')
      .sort('-date');
    
    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get single activity
exports.getActivity = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('participants.user', 'name email');
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: activity
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Join an activity
exports.joinActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { role = 'volunteer' } = req.body;
    
    const activity = await Activity.findById(id);
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }
    
    // Check if user already joined
    const alreadyJoined = activity.participants.some(
      participant => participant.user.toString() === req.user.id
    );
    
    if (alreadyJoined) {
      return res.status(400).json({
        success: false,
        message: 'You have already joined this activity'
      });
    }
    
    // Add user to participants
    activity.participants.push({
      user: req.user.id,
      role,
      verified: false
    });
    
    await activity.save();
    
    // Add activity to user's joined activities
    await User.findByIdAndUpdate(req.user.id, {
      $push: { activitiesJoined: activity._id }
    });
    
    res.status(200).json({
      success: true,
      message: `Successfully joined activity as ${role}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Verify participation with QR code
exports.verifyParticipation = async (req, res) => {
  try {
    const { id } = req.params;
    const { qrData } = req.body;
    
    const activity = await Activity.findById(id).select('+qrToken');
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }
    
    // Validate QR code
    const isValid = qrCodeService.validateQRData(qrData, activity.qrToken);
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code'
      });
    }
    
    // Find participant index
    const participantIndex = activity.participants.findIndex(
      p => p.user.toString() === req.user.id
    );
    
    if (participantIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'You are not registered for this activity'
      });
    }
    
    // Update participant status
    activity.participants[participantIndex].verified = true;
    activity.participants[participantIndex].verifiedAt = Date.now();
    
    // Get user details
    const user = await User.findById(req.user.id);
    
    // Create LinkedClaims credential
    const role = activity.participants[participantIndex].role;
    const credential = await linkedClaimsService.createActivityCredential(
      activity,
      user,
      role
    );
    
    // Store credential ID
    activity.participants[participantIndex].linkedClaimId = credential.id;
    await activity.save();
    
    // Add credential to user
    await User.findByIdAndUpdate(user._id, {
      $push: { linkedClaimsIds: credential.id }
    });
    
    // Process reward if user has wallet
    if (user.walletAddress) {
      // Calculate reward amount based on role and activity
      const rewardAmount = role === 'volunteer' ? 10 : 5; // Example logic
      
      // Send reward
      const transaction = await goodDollarService.sendReward(
        user.walletAddress,
        rewardAmount,
        activity._id
      );
      
      // Update participant reward info
      activity.participants[participantIndex].rewarded = true;
      activity.participants[participantIndex].rewardAmount = rewardAmount;
      activity.participants[participantIndex].transactionHash = transaction.hash;
      await activity.save();
      
      // Create reward record
      await Reward.create({
        user: user._id,
        activity: activity._id,
        amount: rewardAmount,
        transactionHash: transaction.hash,
        type: role,
        linkedClaimId: credential.id,
        status: 'completed'
      });
      
      // Update user's total rewards
      await User.findByIdAndUpdate(user._id, {
        $inc: { totalRewardsEarned: rewardAmount }
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Participation verified and rewarded',
      data: {
        credentialId: credential.id,
        walletUpdated: !!user.walletAddress
      }
    });
  } catch (error) {
    console.error('Error verifying participation:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update activity
exports.updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    let activity = await Activity.findById(id);
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }
    
    // Check if user is authorized
    if (activity.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this activity'
      });
    }
    
    activity = await Activity.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: activity
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete activity
exports.deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const activity = await Activity.findById(id);
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }
    
    // Check if user is authorized
    if (activity.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this activity'
      });
    }
    
    await activity.remove();
    
    // Remove activity from users
    await User.updateMany(
      { $or: [
        { activitiesCreated: activity._id },
        { activitiesJoined: activity._id }
      ]},
      { 
        $pull: { 
          activitiesCreated: activity._id,
          activitiesJoined: activity._id
        }
      }
    );
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};