const { ethers } = require('ethers');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

const generateCustodialWallet = () => {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address.toLowerCase(),
    privateKey: wallet.privateKey
  };
};

const createCustodialUser = async (identifier, identifierType, name = '') => {
  // FIX: Build query condition dynamically to avoid null matches
  let queryCondition;
  
  if (identifierType === 'phone') {
    queryCondition = { phoneNumber: identifier };
  } else if (identifierType === 'email') {
    queryCondition = { email: identifier };
  } else {
    throw new Error('Invalid identifier type');
  }
  
  const existingUser = await User.findOne(queryCondition);
  
  if (existingUser) {
    return { user: existingUser, isNew: false };
  }
  
  const walletData = generateCustodialWallet();
  
  const userData = {
    walletAddress: walletData.address,
    isCustodial: true,
    nonce: uuidv4(),
    role: 'recipient',
    name: name || ''
  };
  
  if (identifierType === 'phone') {
    userData.phoneNumber = identifier;
  } else {
    userData.email = identifier;
  }
  
  const user = new User(userData);
  await user.save();
  
  return { user, isNew: true };
};

module.exports = {
  generateCustodialWallet,
  createCustodialUser
};