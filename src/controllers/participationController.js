const Participation = require('../models/Participation');
const Activity = require('../models/Activity');
const User = require('../models/User');

// Get user's participations
const getUserParticipations = async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address is required'
      });
    }
    
    const participations = await Participation.find({ walletAddress })
      .populate('activity', 'title date location status metrics')
      .sort('-verifiedAt');
    
    res.status(200).json({
      success: true,
      count: participations.length,
      data: participations
    });
  } catch (error) {
    console.error('Get user participations error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get user participations'
    });
  }
};

// Get all participations for an activity
const getActivityParticipations = async (req, res) => {
  try {
    const { activityId } = req.params;
    
    const participations = await Participation.find({ activity: activityId })
      .populate('user', 'name walletAddress')
      .sort('-verifiedAt');
    
    res.status(200).json({
      success: true,
      count: participations.length,
      data: participations
    });
  } catch (error) {
    console.error('Get activity participations error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get activity participations'
    });
  }
};

// Record GoodDollar reward transaction for a participation
const recordRewardTransaction = async (req, res) => {
  try {
    const { participationId, transactionHash, amount } = req.body;
    
    if (!participationId || !transactionHash || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Participation ID, transaction hash, and amount are required'
      });
    }
    
    // Update participation record
    const participation = await Participation.findByIdAndUpdate(
      participationId,
      {
        rewarded: true,
        rewardAmount: amount,
        transactionHash
      },
      { new: true }
    );
    
    if (!participation) {
      return res.status(404).json({
        success: false,
        message: 'Participation not found'
      });
    }
    
    // Also update in Activity model
    const activity = await Activity.findById(participation.activity);
    
    if (activity) {
      const participant = activity.participants.find(
        p => p.walletAddress === participation.walletAddress
      );
      
      if (participant) {
        participant.rewarded = true;
        participant.rewardAmount = amount;
        participant.transactionHash = transactionHash;
        await activity.save();
      }
    }
    
    // Update user's total rewards if user exists
    if (participation.user) {
      const user = await User.findById(participation.user);
      if (user) {
        user.totalRewardsEarned += Number(amount);
        await user.save();
      }
    }
    
    // Create reward record
    const Reward = require('../models/Reward');
    const reward = await Reward.create({
      user: participation.user,
      walletAddress: participation.walletAddress,
      activity: participation.activity,
      amount,
      transactionHash,
      status: 'completed',
      type: participation.role,
      goodDollarTransactionId: transactionHash
    });
    
    res.status(200).json({
      success: true,
      data: {
        participation,
        reward
      }
    });
  } catch (error) {
    console.error('Record reward transaction error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to record reward transaction'
    });
  }
};

module.exports = {
  getUserParticipations,
  getActivityParticipations,
  recordRewardTransaction
};