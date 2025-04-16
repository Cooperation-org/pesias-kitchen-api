const Activity = require('../models/Activity');
const User = require('../models/User');
const Participation = require('../models/Participation');
const goodCollectiveService = require('../services/goodCollectiveService');
const crypto = require('crypto');

// Create new activity
const createActivity = async (req, res) => {
  try {
    const { 
      title, description, location, date, endDate, 
      expectedFoodAmount, expectedPeopleServed 
    } = req.body;
    
    // Find user by wallet address
    const user = await User.findOne({ walletAddress: req.body.walletAddress });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Generate token for QR code
    const token = crypto.randomBytes(16).toString('hex');
    
    // Create activity
    const activity = await Activity.create({
      title,
      description,
      location,
      date,
      endDate,
      token,
      status: 'planned',
      metrics: {
        foodAmount: expectedFoodAmount || 0,
        peopleServed: expectedPeopleServed || 0,
        mealCount: 0,
        volunteerHours: 0
      },
      createdBy: user._id
    });
    
    // Add to user's created activities
    user.activitiesCreated.push(activity._id);
    await user.save();
    
    // Create GoodCollective pool if integration is available
    try {
      const poolData = await goodCollectiveService.createPool(
        activity.title,
        {
          studentReward: 5, // G$ reward amount
          volunteerReward: 5, // G$ reward amount
          recipientReward: 2 // G$ reward amount
        }
      );
      
      // Update activity with GoodCollective info
      activity.goodCollectivePoolId = poolData.poolId;
      activity.goodCollectiveStatus = 'active';
      await activity.save();
    } catch (error) {
      console.error('GoodCollective pool creation error:', error);
      // Continue even if GoodCollective integration fails
    }
    
    res.status(201).json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Activity creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create activity'
    });
  }
};

// Get all activities
const getActivities = async (req, res) => {
  try {
    const activities = await Activity.find()
      .populate('createdBy', 'name walletAddress')
      .sort('-date');
    
    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get activities'
    });
  }
};

// Get single activity
const getActivity = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate('createdBy', 'name walletAddress')
      .populate('participants.user', 'name walletAddress');
    
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
    console.error('Get activity error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get activity'
    });
  }
};

// Update activity status
const updateActivityStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['planned', 'active', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    const activity = await Activity.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
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
    console.error('Update activity status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update activity status'
    });
  }
};

// Complete activity and update metrics
const completeActivity = async (req, res) => {
  try {
    const { 
      foodAmount, peopleServed, mealCount, volunteerHours 
    } = req.body;
    
    const activity = await Activity.findById(req.params.id);
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }
    
    // Update activity with metrics and mark as completed
    activity.status = 'completed';
    activity.metrics = {
      foodAmount: foodAmount || activity.metrics.foodAmount,
      peopleServed: peopleServed || activity.metrics.peopleServed,
      mealCount: mealCount || activity.metrics.mealCount,
      volunteerHours: volunteerHours || activity.metrics.volunteerHours
    };
    
    await activity.save();
    
    // Track impact in GoodCollective if integration is available
    try {
      await goodCollectiveService.trackImpact(activity._id, activity.metrics);
    } catch (error) {
      console.error('GoodCollective impact tracking error:', error);
      // Continue even if GoodCollective integration fails
    }
    
    res.status(200).json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Complete activity error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to complete activity'
    });
  }
};

// Get participants for an activity
const getActivityParticipants = async (req, res) => {
  try {
    const participations = await Participation.find({ activity: req.params.id })
      .populate('user', 'name walletAddress')
      .sort('-verifiedAt');
    
    res.status(200).json({
      success: true,
      count: participations.length,
      data: participations
    });
  } catch (error) {
    console.error('Get activity participants error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get activity participants'
    });
  }
};

module.exports = {
  createActivity,
  getActivities,
  getActivity,
  updateActivityStatus,
  completeActivity,
  getActivityParticipants
};