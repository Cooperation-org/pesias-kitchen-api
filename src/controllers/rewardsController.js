const Activity = require('../models/Activity');
const User = require('../models/User');

exports.getRewardHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const user = await User.findById(userId);
    
    const activities = await Activity.find({
      user: userId,
      nftId: { $ne: null }
    }).populate('event');
    
    const rewards = activities.map(activity => {
      let rewardAmount;
      switch (activity.event.activityType) {
        case 'food_sorting': rewardAmount = 1; break;
        case 'food_distribution': rewardAmount = 2; break;
        case 'food_pickup': rewardAmount = 1.5; break;
        default: rewardAmount = 0;
      }
      
      return {
        activityId: activity._id,
        nftId: activity.nftId,
        activityType: activity.event.activityType,
        location: activity.event.location,
        date: activity.timestamp,
        rewardAmount
      };
    });
    
    const totalRewards = rewards.reduce((sum, item) => sum + item.rewardAmount, 0);
    
    res.status(200).json({
      userInfo: {
        id: user._id,
        name: user.name || 'Anonymous Volunteer',
        walletAddress: user.walletAddress
      },
      rewards,
      totalRewards
    });
  } catch (error) {
    console.error('Error getting reward history:', error);
    res.status(500).json({ message: 'Server error' });
  }
};