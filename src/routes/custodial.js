const express = require('express');
const router = express.Router();
const { createCustodialUser } = require('../services/custodialWalletService');
const Activity = require('../models/Activity');
const Event = require('../models/Event');
const QRCode = require('../models/QRCode');
const jwt = require('jsonwebtoken');

router.post('/scan-qr', async (req, res) => {
  try {
    const {
      identifier,
      identifierType,
      name,
      qrData,
      walletAddress 
    } = req.body;

    if (walletAddress) {
      const existingWalletUser = await User.findOne({ 
        walletAddress: walletAddress.toLowerCase() 
      });
      
      if (existingWalletUser) {
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
            message: 'Event or QR code not found'
          });
        }

        const existingActivity = await Activity.findOne({
          user: existingWalletUser._id,
          event: qrData.eventId
        });

        if (existingActivity) {
          return res.status(400).json({
            success: false,
            message: 'You have already participated in this event'
          });
        }

        const activity = new Activity({
          user: existingWalletUser._id,
          event: event._id,
          qrCode: qrCode._id,
          quantity: qrData.quantity || event.defaultQuantity || 1,
          notes: qrData.notes || ''
        });

        await activity.save();
        existingWalletUser.activities.push(activity._id);
        await existingWalletUser.save();

        const token = jwt.sign(
          { userId: existingWalletUser._id, role: existingWalletUser.role },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );

        return res.json({
          success: true,
          isWalletUser: true,
          message: 'Activity recorded for your connected wallet!',
          user: {
            id: existingWalletUser._id,
            walletAddress: existingWalletUser.walletAddress,
            role: existingWalletUser.role,
            name: existingWalletUser.name
          },
          activity: activity,
          token: token
        });
      }
    }

    if (!identifier || !identifierType) {
      return res.status(400).json({
        success: false,
        message: 'Phone number or email required for custodial account'
      });
    }

    const { user, isNew } = await createCustodialUser(
      identifier, 
      identifierType, 
      name
    );

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
        message: 'Event or QR code not found' 
      });
    }

    const activity = new Activity({
      user: user._id,
      event: event._id,
      qrCode: qrCode._id,
      quantity: qrData.quantity || event.defaultQuantity || 1,
      notes: qrData.notes || ''
    });

    await activity.save();
    user.activities.push(activity._id);
    await user.save();

    const token = jwt.sign(
  { userId: user._id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

    res.json({
      success: true,
      isNewUser: isNew,
      token: token,  // Add this
        walletAddress: user.walletAddress, 
      user: {
        id: user._id,
        name: user.name,
        walletAddress: user.walletAddress
      },
      activity: activity,
      message: isNew ? 'Welcome! Your custodial account has been created.' : 'Welcome back!'
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});


module.exports = router;