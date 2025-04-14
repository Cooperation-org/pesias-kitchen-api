const User = require('../models/User');
const goodDollarService = require('../services/goodDollarService');

// Get current user profile
const  getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('activitiesJoined')
      .populate('activitiesCreated');
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { name, email, phoneNumber, profileImage } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, email, phoneNumber, profileImage },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Connect wallet
const connectWallet = async (req, res) => {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address is required'
      });
    }
    
    // Update user with wallet address
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { walletAddress },
      { new: true }
    );
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create new wallet
const createWallet = async (req, res) => {
  try {
    // Use GoodDollar service to create a wallet
    const wallet = await goodDollarService.createWallet();
    
    // Update user with new wallet address
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { walletAddress: wallet.address },
      { new: true }
    );
    
    res.status(200).json({
      success: true,
      data: {
        user,
        wallet: {
          address: wallet.address
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getMe,
  updateProfile,
  connectWallet,
  createWallet
};