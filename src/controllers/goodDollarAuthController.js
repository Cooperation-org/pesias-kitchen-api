const User = require('../models/User');

const handleGoodDollarLogin = async (req, res) => {
  try {
    const { walletAddress, goodDollarData } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address is required'
      });
    }
    
    // Find or create user with this wallet address
    let user = await User.findOne({ walletAddress });
    
    if (!user) {
      user = await User.create({
        name: goodDollarData?.fullName || `User-${walletAddress.substring(0, 8)}`,
        walletAddress,
        goodDollarInfo: {
          fullName: goodDollarData?.fullName || '',
          email: goodDollarData?.email || '',
          mobile: goodDollarData?.mobile || '',
          location: goodDollarData?.location || ''
        },
        email: goodDollarData?.email || ''
      });
    } else {
      // Update user information if provided
      if (goodDollarData) {
        user.goodDollarInfo = {
          fullName: goodDollarData.fullName || user.goodDollarInfo?.fullName || '',
          email: goodDollarData.email || user.goodDollarInfo?.email || '',
          mobile: goodDollarData.mobile || user.goodDollarInfo?.mobile || '',
          location: goodDollarData.location || user.goodDollarInfo?.location || ''
        };
        
        if (goodDollarData.fullName) {
          user.name = goodDollarData.fullName;
        }
        
        if (goodDollarData.email) {
          user.email = goodDollarData.email;
        }
        
        await user.save();
      }
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('GoodDollar login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'An error occurred during GoodDollar login'
    });
  }
};

module.exports = {
  handleGoodDollarLogin
};