const Reward = require('../models/Reward');
const User = require('../models/User');

// Get rewards for user
const getUserRewards = async (req, res) => {
  try {
    const rewards = await Reward.find({ user: req.user.id })
      .populate('activity', 'title date')
      .sort('-createdAt');
    
    res.status(200).json({
      success: true,
      count: rewards.length,
      data: rewards
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get rewards for specific activity
const getActivityRewards = async (req, res) => {
  try {
    const { activityId } = req.params;
    
    const rewards = await Reward.find({ activity: activityId })
      .populate('user', 'name email')
      .sort('-createdAt');
    
    res.status(200).json({
      success: true,
      count: rewards.length,
      data: rewards
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all rewards (admin only)
const getAllRewards = async (req, res) => {
  try {
    const rewards = await Reward.find()
      .populate('user', 'name email')
      .populate('activity', 'title date')
      .sort('-createdAt');
    
    res.status(200).json({
      success: true,
      count: rewards.length,
      data: rewards
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getUserRewards,
  getActivityRewards,
  getAllRewards
};