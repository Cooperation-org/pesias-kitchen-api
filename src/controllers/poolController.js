// src/controllers/poolController.js
const goodDollarService = process.env.NODE_ENV === 'production' 
  ? require('../services/goodDollarService')
  : require('../services/mockGoodDollarService');

exports.getPoolInfo = async (req, res) => {
  try {
    const poolInfo = await goodDollarService.getPoolInfo();
    
    res.status(200).json(poolInfo);
  } catch (error) {
    console.error('Error getting pool info:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getUserBalance = async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    if (!walletAddress) {
      return res.status(400).json({ message: 'Wallet address is required' });
    }
    
    const balance = await goodDollarService.getUserBalance(walletAddress);
    
    res.status(200).json(balance);
  } catch (error) {
    console.error('Error getting user balance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};