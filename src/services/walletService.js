const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

/**
 * Verify that wallet address is valid Ethereum address
 */
const isValidWalletAddress = (walletAddress) => {
  return /^0x[a-fA-F0-9]{40}$/.test(walletAddress);
};

/**
 * Create or find user with Dynamic anonymous wallet
 */
const createOrFindDynamicUser = async (walletAddress) => {
  const normalizedAddress = walletAddress.toLowerCase();
  
  const existingUser = await User.findOne({ 
    walletAddress: normalizedAddress 
  });
  
  if (existingUser) {
    return { user: existingUser, isNew: false };
  }
  
  // Create new anonymous user with Dynamic wallet
  const userData = {
    walletAddress: normalizedAddress,
    isAnonymous: true,
    walletProvider: 'dynamic',
    nonce: uuidv4(),
    role: 'recipient',
    name: `Anonymous-${normalizedAddress.slice(-8)}`
  };
  
  const user = new User(userData);
  await user.save();
  
  return { user, isNew: true };
};

/**
 * Create or find user with external wallet (MetaMask, Trust Wallet, etc.)
 */
const createOrFindExternalUser = async (walletAddress, signedMessage = null) => {
  const normalizedAddress = walletAddress.toLowerCase();
  
  const existingUser = await User.findOne({ 
    walletAddress: normalizedAddress 
  });
  
  if (existingUser) {
    return { user: existingUser, isNew: false };
  }
  
  // Create new user with external wallet
  const userData = {
    walletAddress: normalizedAddress,
    isAnonymous: false,
    walletProvider: 'external',
    nonce: uuidv4(),
    role: 'recipient',
    name: `Wallet-${normalizedAddress.slice(0, 6)}...${normalizedAddress.slice(-4)}`
  };
  
  const user = new User(userData);
  await user.save();
  
  return { user, isNew: true };
};

/**
 * Get wallet provider type based on request
 */
const getWalletProvider = (req) => {
  const { anonymous, walletAddress, signedMessage } = req.body;
  
  if (!walletAddress || !isValidWalletAddress(walletAddress)) {
    return { error: 'Invalid or missing wallet address' };
  }
  
  if (anonymous) {
    return { provider: 'dynamic', handler: createOrFindDynamicUser };
  } else {
    return { provider: 'external', handler: createOrFindExternalUser };
  }
};

module.exports = {
  isValidWalletAddress,
  createOrFindDynamicUser,
  createOrFindExternalUser,
  getWalletProvider
};