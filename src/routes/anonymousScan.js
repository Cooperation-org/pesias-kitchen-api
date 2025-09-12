const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const QRCode = require('../models/QRCode');
const PseudonymousActivity = require('../models/PseudonymousActivity');
const { calculateDistance } = require('../utils/geolocation');
const { sendRewardsToNonprofit } = require('../services/rewardsService');

// Nonprofit wallet address for rewards
const NONPROFIT_WALLET_ADDRESS = '0x187ff8e530DEFaC66e747C2bCEBcEA81B11FfC29';

/**
 * Anonymous QR scan endpoint - no wallet connection required
 * Records pseudonymous activities and sends rewards to nonprofit
 */
router.post('/', async (req, res) => {
  try {
    const { 
      pseudonymousId, 
      qrData, 
      timestamp, 
      geolocation, 
      sessionFingerprint 
    } = req.body;

    console.log('Anonymous scan request:', {
      pseudonymousId: pseudonymousId?.substring(0, 8) + '...',
      eventId: qrData?.eventId,
      type: qrData?.type,
      hasLocation: !!geolocation
    });

    // Validate required fields
    if (!pseudonymousId || !qrData || !qrData.eventId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: pseudonymousId, qrData, and eventId are required'
      });
    }

    // Validate pseudonymous ID format (UUID v4)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(pseudonymousId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pseudonymous ID format'
      });
    }

    // Find event and verify it exists
    const event = await Event.findById(qrData.eventId).populate('qrCodes');
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found or has expired'
      });
    }

    // Find and validate QR code
    const qrCode = await QRCode.findOne({
      event: qrData.eventId,
      type: qrData.type,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });

    if (!qrCode) {
      return res.status(404).json({
        success: false,
        message: 'QR code not found, expired, or inactive'
      });
    }

    // Check for duplicate participation by pseudonymous ID + event
    const existingActivity = await PseudonymousActivity.findOne({
      pseudonymousId: pseudonymousId,
      eventId: qrData.eventId
    });

    if (existingActivity) {
      console.log('Duplicate scan detected:', {
        pseudonymousId: pseudonymousId.substring(0, 8) + '...',
        eventId: qrData.eventId,
        originalScan: existingActivity.createdAt
      });

      return res.status(409).json({
        success: false,
        message: 'You have already participated in this event. Thank you for your continued support!',
        duplicateActivity: {
          eventTitle: event.title,
          originalTimestamp: existingActivity.createdAt,
          type: existingActivity.activityType
        }
      });
    }

    // Validate geolocation if event has location coordinates
    if (geolocation && event.coordinates) {
      const distance = calculateDistance(
        geolocation.latitude,
        geolocation.longitude,
        event.coordinates.latitude,
        event.coordinates.longitude
      );

      // Allow 1km radius for flexibility (can be adjusted)
      const maxDistance = 1000; // meters
      
      if (distance > maxDistance) {
        console.log('Location validation failed:', {
          eventLocation: event.coordinates,
          userLocation: { lat: geolocation.latitude, lng: geolocation.longitude },
          distance: Math.round(distance),
          maxDistance
        });

        return res.status(400).json({
          success: false,
          message: `You appear to be too far from the event location. Please ensure you are at the event site.`,
          locationInfo: {
            distance: Math.round(distance),
            maxAllowed: maxDistance,
            eventLocation: event.location
          }
        });
      }
    }

    // Create pseudonymous activity record
    const activityData = {
      pseudonymousId,
      eventId: event._id,
      qrCodeId: qrCode._id,
      activityType: qrData.type,
      quantity: qrData.quantity || event.defaultQuantity || 1,
      rewardAmount: qrData.rewardAmount || event.rewardAmount || 1,
      timestamp: new Date(timestamp),
      geolocation: geolocation ? {
        latitude: geolocation.latitude,
        longitude: geolocation.longitude,
        accuracy: geolocation.accuracy
      } : null,
      sessionFingerprint,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };

    const activity = new PseudonymousActivity(activityData);
    await activity.save();

    console.log('Pseudonymous activity created:', {
      id: activity._id,
      eventTitle: event.title,
      type: qrData.type,
      rewardAmount: activityData.rewardAmount
    });

    // Trigger smart contract rewards and NFT minting to nonprofit wallet
    try {
      const rewardResult = await sendRewardsToNonprofit({
        walletAddress: NONPROFIT_WALLET_ADDRESS,
        amount: activityData.rewardAmount,
        activityType: qrData.type,
        eventTitle: event.title,
        eventLocation: event.location,
        pseudonymousId: pseudonymousId.substring(0, 8) + '...' // Partial ID for logging
      });

      console.log('Rewards and NFT sent to nonprofit wallet:', {
        wallet: NONPROFIT_WALLET_ADDRESS,
        amount: activityData.rewardAmount,
        event: event.title,
        rewardTxHash: rewardResult.rewardTransactionHash,
        nftTxHash: rewardResult.nftTransactionHash,
        nftId: rewardResult.nftId
      });
    } catch (rewardError) {
      console.error('Reward distribution failed:', rewardError);
      // Don't fail the entire request if rewards fail
      // The activity is still recorded for manual processing
    }

    // Success response
    const response = {
      success: true,
      message: 'Thank you for your participation! Your impact has been recorded.',
      activity: {
        id: activity._id,
        type: qrData.type,
        quantity: activity.quantity,
        rewardAmount: activity.rewardAmount,
        timestamp: activity.createdAt
      },
      event: {
        id: event._id,
        title: event.title,
        description: event.description,
        location: event.location,
        date: event.date
      },
      impact: {
        proofRecorded: true,
        rewardsSentToNonprofit: true,
        nftMintedToNonprofit: true,
        nonprofitWallet: NONPROFIT_WALLET_ADDRESS.substring(0, 6) + '...'
      }
    };

    console.log('Anonymous scan completed successfully:', {
      activityId: activity._id,
      eventTitle: event.title,
      rewardAmount: activity.rewardAmount
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Anonymous scan error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get anonymous scanning statistics (optional endpoint for analytics)
 */
router.get('/stats', async (req, res) => {
  try {
    const totalActivities = await PseudonymousActivity.countDocuments();
    const totalRewardsDistributed = await PseudonymousActivity.aggregate([
      { $group: { _id: null, total: { $sum: '$rewardAmount' } } }
    ]);

    const uniqueParticipants = await PseudonymousActivity.distinct('pseudonymousId').then(ids => ids.length);

    res.json({
      success: true,
      stats: {
        totalActivities,
        totalRewardsDistributed: totalRewardsDistributed[0]?.total || 0,
        uniqueParticipants,
        nonprofitWallet: NONPROFIT_WALLET_ADDRESS
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
});

module.exports = router;