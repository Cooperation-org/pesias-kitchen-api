const QRCode = require('../models/QRCode');
const Event = require('../models/Event');
const qrcode = require('qrcode');
const { uploadToIPFS } = require('../services/ipfsService');
const activityController = require('./activityController');
const Activity = require('../models/Activity');
const User = require('../models/User');

exports.generateQRCode = async (req, res) => {
  try {
    const { eventId, type } = req.body;
    
    if (!eventId || !type) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.qrCodes[type]) {
      return res.status(400).json({ 
        message: `${type} QR code already exists for this event` 
      });
    }
    
    const expiration = new Date(event.date);
    
    const qrData = {
      eventId: event._id,
      type,
      timestamp: new Date().toISOString(),
      id: Math.random().toString(36).substring(2, 15) // Simple unique ID
    };
    
    // const qrImage = await qrcode.toDataURL(JSON.stringify(qrData));
    

    // Create a URL that phones can open
    const baseUrl = 'https://pesias-kitchen-app-brown.vercel.app';
    const qrDataEncoded = encodeURIComponent(JSON.stringify(qrData));
    const qrUrl = `${baseUrl}/custodial-scan?data=${qrDataEncoded}`;

    // Generate QR code with the URL
    const qrImage = await qrcode.toDataURL(qrUrl);


    const ipfsCid = await uploadToIPFS(qrImage);
    
    const newQRCode = new QRCode({
      event: event._id,
      type,
      ipfsCid,
      expiresAt: expiration,
      createdBy: req.user.userId
    });
    
    await newQRCode.save();
    
    event.qrCodes[type] = newQRCode._id;
    await event.save();

    res.status(201).json({
      message: 'QR code generated successfully',
      qrCode: {
        id: newQRCode._id,
        ipfsCid,
        expiresAt: newQRCode.expiresAt,
        qrImage,
        eventTitle: event.title,
        eventLocation: event.location,
        eventType: event.activityType
      }
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.verifyQRCode = async (req, res) => {
  try {
    const { qrData } = req.body;
    
    
    if (!qrData) {
      return res.status(400).json({ message: 'QR data is required' });
    }
    
    let parsedData;
    
    // Handle different QR data formats
    let qrString;
    if (typeof qrData === 'string') {
      qrString = qrData;
    } else if (Array.isArray(qrData) && qrData.length > 0) {
      // Handle QR scanner result arrays - use first result
      const firstResult = qrData[0];
      qrString = firstResult.rawValue || firstResult.text || firstResult.data || JSON.stringify(firstResult);
    } else if (qrData && typeof qrData === 'object') {
      // Handle QR scanner result objects with rawValue property
      qrString = qrData.rawValue || qrData.text || qrData.data || JSON.stringify(qrData);
    } else {
      qrString = String(qrData);
    }
    
    
    try {
      // Handle URL-encoded QR codes (custodial scan)
      if (qrString.startsWith('http')) {
        const url = new URL(qrString);
        const encodedData = url.searchParams.get('data');
        if (!encodedData) {
          return res.status(400).json({ message: 'No data parameter found in QR URL' });
        }
        const decodedData = decodeURIComponent(encodedData);
        parsedData = JSON.parse(decodedData);
      } else {
        // Handle direct JSON QR codes (in-app scan)
        parsedData = JSON.parse(qrString);
      }
    } catch (error) {
      return res.status(400).json({ message: 'Invalid QR code format: ' + error.message });
    }
    
    if (!parsedData.id || !parsedData.eventId) {
      return res.status(400).json({ message: 'Invalid QR code format' });
    }
    
    const event = await Event.findById(parsedData.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    const qrCode = await QRCode.findOne({
      event: parsedData.eventId,
      type: parsedData.type,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });
    
    if (!qrCode) {
      return res.status(404).json({ message: 'QR code not found or expired' });
    }

    let message, userRole, nextSteps;
    
    if (qrCode.type === 'volunteer') {
      message = 'Volunteer QR verified successfully!';
      userRole = 'volunteer';
      nextSteps = 'Proceed to record your volunteer activity and earn NFT rewards.';
      context = 'This QR code allows you to participate as a volunteer in this event and earn NFT rewards.';
    } else if (qrCode.type === 'recipient') {
      message = 'Recipient QR verified successfully!';
      userRole = 'recipient';
      nextSteps = 'Proceed to record your food receipt for tracking purposes.';
      context = 'This QR code is for recipients to verify food receipt without earning rewards.';
    }
    
    qrCode.usedCount += 1;
    await qrCode.save();
    
    res.status(200).json({
      message,
      userRole,
      nextSteps,
      qrCode: {
        id: qrCode._id,
        type: qrCode.type,
        usedCount: qrCode.usedCount,
        event: {
          id: event._id,
          title: event.title,
          activityType: event.activityType,
          location: event.location,
          defaultQuantity: event.defaultQuantity || 1
        }
      },
      context: qrCode.type === 'volunteer' 
        ? 'This QR code is for volunteers who will earn NFTs and G$ rewards for their service.'
        : 'This QR code is for recipients to verify food receipt.'
    });
  } catch (error) {
    console.error('Error verifying QR code:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.verifyQRAndMintNFT = async (req, res) => {
  try {
    const { qrData, quantity, notes } = req.body;
    
    if (!qrData) {
      return res.status(400).json({ message: 'QR data is required' });
    }
    
    let parsedData;
    
    // Handle different QR data formats
    let qrString;
    if (typeof qrData === 'string') {
      qrString = qrData;
    } else if (Array.isArray(qrData) && qrData.length > 0) {
      // Handle QR scanner result arrays - use first result
      const firstResult = qrData[0];
      qrString = firstResult.rawValue || firstResult.text || firstResult.data || JSON.stringify(firstResult);
    } else if (qrData && typeof qrData === 'object') {
      // Handle QR scanner result objects with rawValue property
      qrString = qrData.rawValue || qrData.text || qrData.data || JSON.stringify(qrData);
    } else {
      qrString = String(qrData);
    }
    
    try {
      // Handle URL-encoded QR codes (custodial scan)
      if (qrString.startsWith('http')) {
        const url = new URL(qrString);
        const encodedData = url.searchParams.get('data');
        if (!encodedData) {
          return res.status(400).json({ message: 'No data parameter found in QR URL' });
        }
        parsedData = JSON.parse(decodeURIComponent(encodedData));
      } else {
        // Handle direct JSON QR codes (in-app scan)
        parsedData = JSON.parse(qrString);
      }
    } catch (error) {
      return res.status(400).json({ message: 'Invalid QR code format: ' + error.message });
    }
    
    if (!parsedData.id || !parsedData.eventId) {
      return res.status(400).json({ message: 'Invalid QR code format' });
    }
    
    const event = await Event.findById(parsedData.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    const existingActivity = await Activity.findOne({
      user: req.user.userId,
      event: parsedData.eventId
    });
    
    if (existingActivity) {
      return res.status(400).json({ 
        message: 'You have already participated in this event and received rewards'
      });
    }
    
    const qrCode = await QRCode.findOne({
      event: parsedData.eventId,
      type: parsedData.type,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });
    
    if (!qrCode) {
      return res.status(404).json({ message: 'QR code not found or expired' });
    }
    
    qrCode.usedCount += 1;
    await qrCode.save();
    
    const activityReq = {
      body: {
        eventId: event._id,
        qrCodeId: qrCode._id,
        quantity: quantity || event.defaultQuantity || 1,
        notes: notes || ''
      },
      user: req.user 
    };
    
    const activityRes = {
      status: function(statusCode) {
        this.statusCode = statusCode;
        return this;
      },
      json: function(data) {
        this.data = data;
        return this;
      }
    };
    
    await activityController.recordActivity(activityReq, activityRes);
    
    if (activityRes.statusCode !== 201) {
      return res.status(activityRes.statusCode).json(activityRes.data);
    }
    
    const newActivity = activityRes.data.activity;
    
    if (qrCode.type === 'volunteer') {
      const nftReq = {
        params: { activityId: newActivity._id },
        user: req.user
      };
      
      const nftRes = {
        status: function(statusCode) {
          this.statusCode = statusCode;
          return this;
        },
        json: function(data) {
          this.data = data;
          return this;
        }
      };
      
      await activityController.mintActivityNFT(nftReq, nftRes);
      
      if (nftRes.statusCode !== 200) {
        return res.status(nftRes.statusCode).json(nftRes.data);
      }
      
      await User.findByIdAndUpdate(
        req.user.userId,
        { $addToSet: { activities: newActivity._id } }
      );
      
      res.status(200).json({
        message: 'Volunteer activity recorded and NFT minted successfully! Thank you for your service.',
        activity: newActivity,
        nft: {
          nftId: nftRes.data.nftId,
          txHash: nftRes.data.txHash,
          rewardAmount: nftRes.data.rewardAmount || '~'
        },
        event: {
          title: event.title,
          activityType: event.activityType,
          location: event.location
        },
        userRole: 'volunteer'
      });
      
    } else if (qrCode.type === 'recipient') {
      await User.findByIdAndUpdate(
        req.user.userId,
        { $addToSet: { activities: newActivity._id } }
      );
      
      res.status(200).json({
        message: 'Thank you for participating! Your food receipt has been recorded.',
        activity: newActivity,
        event: {
          title: event.title,
          activityType: event.activityType,
          location: event.location
        },
        userRole: 'recipient',
        note: 'Recipient activities do not earn NFTs or G$ rewards'
      });
    }
    
  } catch (error) {
    console.error('Error in QR verification and NFT minting process:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};