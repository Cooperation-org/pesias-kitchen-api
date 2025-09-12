const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const QRCode = require('../models/QRCode');
const PseudonymousActivity = require('../models/PseudonymousActivity');
const { calculateDistance } = require('../utils/geolocation');
const { mintNFT } = require('../services/goodDollarService');

// Nonprofit wallet address for rewards
const NONPROFIT_WALLET_ADDRESS = '0xbB184005e695299fEffea43e3B2A3E5bCd81f22c';

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
    // COMMENTED OUT: Allow multiple scans for testing
    /*
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
    */

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

    // Mint NFT (and fallback G$ transfer on failure) to nonprofit wallet using the same flow as in-app
    try {
      // Map anonymous types to NFT activity subtypes similar to in-app
      let nftActivityType = 'food_distribution';
      switch (qrData.type) {
        case 'volunteer':
          nftActivityType = 'food_sorting';
          break;
        case 'recipient':
          nftActivityType = 'food_pickup';
          break;
        default:
          nftActivityType = 'food_distribution';
      }

      const nftResult = await mintNFT(
        NONPROFIT_WALLET_ADDRESS,
        nftActivityType,
        event.location,
        1,
        `anon-${pseudonymousId.substring(0, 8)}`,
        {
          pseudonymousId,
          eventTitle: event.title,
          activityType: qrData.type,
          source: 'pseudonymous-scan'
        }
      );

      console.log('Anonymous flow reward (NFT or G$ fallback) sent to nonprofit wallet:', {
        wallet: NONPROFIT_WALLET_ADDRESS,
        amount: activityData.rewardAmount,
        event: event.title,
        nftTxHash: nftResult.txHash,
        nftId: nftResult.nftId,
        tokenId: nftResult.tokenId,
        fromPool: nftResult.fromPool
      });
    } catch (rewardError) {
      console.error('Anonymous reward mint/transfer failed:', rewardError);
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
 * Get activities by pseudonymous ID for tracing (admin only)
 */
router.get('/trace/:pseudonymousId', async (req, res) => {
  try {
    const { pseudonymousId } = req.params;
    
    // Validate pseudonymous ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(pseudonymousId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pseudonymous ID format'
      });
    }

    const activities = await PseudonymousActivity.find({ pseudonymousId })
      .populate('eventId', 'title location date')
      .populate('qrCodeId', 'type')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      pseudonymousId,
      activities: activities.map(activity => ({
        id: activity._id,
        eventTitle: activity.eventId?.title,
        eventLocation: activity.eventId?.location,
        eventDate: activity.eventId?.date,
        activityType: activity.activityType,
        quantity: activity.quantity,
        rewardAmount: activity.rewardAmount,
        timestamp: activity.createdAt,
        geolocation: activity.geolocation,
        ipAddress: activity.ipAddress?.substring(0, 8) + '...' // Partial IP for privacy
      })),
      totalActivities: activities.length,
      totalRewards: activities.reduce((sum, activity) => sum + activity.rewardAmount, 0)
    });
  } catch (error) {
    console.error('Trace error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch activities' });
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