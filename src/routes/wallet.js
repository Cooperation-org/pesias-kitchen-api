const express = require('express');
const router = express.Router();
const { getWalletProvider } = require('../services/walletService');
const Activity = require('../models/Activity');
const Event = require('../models/Event');
const QRCode = require('../models/QRCode');
const { mintNFT } = require('../services/goodDollarService');

router.post('/scan-qr', async (req, res) => {
  try {
    const { qrData, walletAddress, anonymous = false } = req.body;

    // Validate required fields
    if (!qrData || !walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: qrData and walletAddress'
      });
    }

    // Get appropriate wallet handler
    const walletResult = getWalletProvider(req);
    if (walletResult.error) {
      return res.status(400).json({
        success: false,
        message: walletResult.error
      });
    }

    const { provider, handler } = walletResult;

    // Create or find user
    const { user, isNew } = await handler(walletAddress);

    // Validate event and QR code
    const event = await Event.findById(qrData.eventId);
    const qrCode = await QRCode.findOne({
      event: qrData.eventId,
      type: qrData.type,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });

    if (!event || !qrCode) {
      return res.status(404).json({
        success: false,
        message: 'Event or QR code not found or expired'
      });
    }

    // Check for duplicate participation
    const existingActivity = await Activity.findOne({
      user: user._id,
      event: qrData.eventId
    });

    if (existingActivity) {
      return res.status(400).json({
        success: false,
        message: 'You have already participated in this event',
        user: {
          id: user._id,
          walletAddress: user.walletAddress,
          provider: user.walletProvider,
          isAnonymous: user.isAnonymous
        }
      });
    }

    // Create new activity
    const activity = new Activity({
      user: user._id,
      event: event._id,
      qrCode: qrCode._id,
      quantity: qrData.quantity || event.defaultQuantity || 1,
      notes: qrData.notes || `${provider} wallet participation`,
      rewardAmount: event.rewardAmount || 1 // Store the actual reward amount
    });

    await activity.save();
    user.activities.push(activity._id);
    await user.save();

    // Activity recorded successfully - user can claim rewards later

    // Success response
    return res.json({
      success: true,
      provider: provider,
      isNewUser: isNew,
      message: qrCode.type === 'volunteer' ? 
        `Welcome! Your ${provider} wallet has been connected and activity recorded. You can now claim your G$ rewards!` : 
        isNew ? 
          `Welcome! Your ${provider} wallet has been connected and activity recorded.` : 
          `Welcome back! Activity recorded successfully.`,
      user: {
        id: user._id,
        walletAddress: user.walletAddress,
        role: user.role,
        name: user.name,
        provider: user.walletProvider,
        isAnonymous: user.isAnonymous
      },
      activity: {
        id: activity._id,
        type: qrCode.type,
        quantity: activity.quantity,
        rewardAmount: event.rewardAmount || 1,
        eventTitle: event.title,
        eventLocation: event.location,
        timestamp: activity.createdAt,
        canClaimReward: qrCode.type === 'volunteer'
      },
      event: {
        id: event._id,
        title: event.title,
        description: event.description,
        location: event.location
      }
    });

  } catch (error) {
    console.error('Wallet scan error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error. Please try again.' 
    });
  }
});

module.exports = router;