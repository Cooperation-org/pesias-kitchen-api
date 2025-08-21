const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { verifySignature } = require('../utils/web3');

exports.getNonce = async (req, res) => {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ message: 'Wallet address is required' });
    }
    
    let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    
    if (!user) {
      user = new User({
        walletAddress: walletAddress.toLowerCase(),
        nonce: uuidv4(),
      });
      await user.save();
    } else {
      user.nonce = uuidv4();
      await user.save();
    }
    
    res.status(200).json({ nonce: user.nonce });
  } catch (error) {
    console.error('Error in getNonce:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.verifySignature = async (req, res) => {
  try {
    const { walletAddress, signature } = req.body;
    
    if (!walletAddress || !signature) {
      return res.status(400).json({ message: 'Wallet address and signature are required' });
    }
    
    const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify the signature properly for production
    const message = `Welcome to Pesia's Kitchen! Please confirm your identity: ${user.nonce}`;
    const isValid = await verifySignature(walletAddress, message, signature);
    
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid signature' });
    }
    
    // Generate a new nonce for next login
    user.nonce = uuidv4();
    await user.save();
    
    // Create and sign a JWT token
    const token = jwt.sign(
      { userId: user._id, walletAddress: user.walletAddress, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(200).json({ 
      token, 
      user: { 
        id: user._id, 
        walletAddress: user.walletAddress, 
        role: user.role 
      } 
    });
  } catch (error) {
    console.error('Error in verifySignature:', error);
    res.status(500).json({ message: 'Server error' });
  }
};