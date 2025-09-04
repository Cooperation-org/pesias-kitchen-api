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

// Enhanced Dynamic authentication handler
exports.authenticateDynamicUser = async (req, res) => {
  try {
    const { 
      walletAddress, 
      authMethod, 
      userId, 
      email, 
      phone, 
      passkeyId,
      socialProvider 
    } = req.body;

    console.log('Dynamic auth request:', { 
      walletAddress, 
      authMethod, 
      userId, 
      email: email ? 'provided' : 'not provided',
      phone: phone ? 'provided' : 'not provided',
      passkeyId: passkeyId ? 'provided' : 'not provided',
      socialProvider 
    });

    // Validate required fields
    if (!walletAddress || !userId) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required authentication data',
        message: 'Wallet address and user ID are required for Dynamic authentication'
      });
    }

    // Find or create user based on Dynamic user ID
    let user = await User.findOne({ dynamicUserId: userId });
    
    if (!user) {
      // Create new user with all available data
      const userData = {
        dynamicUserId: userId,
        walletAddress: walletAddress.toLowerCase(),
        email,
        phone,
        authMethods: authMethod ? [authMethod] : [],
        passkeyId,
        socialProvider,
        isAnonymous: !email && !phone,
        walletProvider: 'dynamic',
        role: 'recipient',
        name: email || `User-${walletAddress.slice(-8)}`,
        nonce: uuidv4() // CRITICAL: Add required nonce field
      };

      console.log('Creating new Dynamic user:', { 
        dynamicUserId: userId, 
        walletAddress: walletAddress.toLowerCase(),
        authMethod,
        hasEmail: !!email,
        hasPasskey: !!passkeyId
      });

      user = new User(userData);
      await user.save();
    } else {
      // Update existing user with new auth method if not already present
      let updated = false;
      
      if (authMethod && !user.authMethods.includes(authMethod)) {
        user.authMethods.push(authMethod);
        updated = true;
      }
      
      // Update contact info if provided
      if (email && !user.email) {
        user.email = email;
        updated = true;
      }
      if (phone && !user.phone) {
        user.phone = phone;
        updated = true;
      }
      if (passkeyId && !user.passkeyId) {
        user.passkeyId = passkeyId;
        updated = true;
      }
      
      // Update last login time
      user.lastLoginAt = new Date();
      updated = true;
      
      if (updated) {
        await user.save();
      }
      
      console.log('Updated existing Dynamic user:', { 
        dynamicUserId: userId, 
        authMethods: user.authMethods,
        hasEmail: !!user.email,
        hasPasskey: !!user.passkeyId
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        dynamicUserId: userId,
        walletAddress: user.walletAddress,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const response = {
      success: true,
      token,
      user: {
        id: user._id,
        walletAddress: user.walletAddress,
        email: user.email,
        name: user.name,
        role: user.role,
        authMethods: user.authMethods,
        hasPasskey: !!user.passkeyId,
        isAnonymous: user.isAnonymous,
        walletProvider: user.walletProvider
      },
      message: user.isAnonymous ? 
        'Anonymous wallet authenticated successfully' : 
        'User authenticated successfully'
    };

    console.log('Dynamic auth successful:', { 
      userId: user._id, 
      walletAddress: user.walletAddress,
      hasPasskey: !!user.passkeyId 
    });

    res.json(response);

  } catch (error) {
    console.error('Dynamic auth error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Authentication failed',
      message: 'Failed to authenticate with Dynamic SDK. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};