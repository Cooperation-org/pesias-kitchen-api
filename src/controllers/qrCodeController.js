const QRCode = require('../models/QRCode');
const Event = require('../models/Event');
const qrcode = require('qrcode');
const { uploadToIPFS } = require('../services/ipfsService');
const activityController = require('./activityController');

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
    
    const expiration = new Date(event.date);
    
    const qrData = {
      eventId: event._id,
      type,
      timestamp: new Date().toISOString(),
      id: Math.random().toString(36).substring(2, 15) // Simple unique ID
    };
    
    const qrImage = await qrcode.toDataURL(JSON.stringify(qrData));
    
    const ipfsCid = await uploadToIPFS(qrImage);
    
    const newQRCode = new QRCode({
      event: event._id,
      type,
      ipfsCid,
      expiresAt: expiration,
      createdBy: req.user.userId
    });
    
    await newQRCode.save();
    
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
    
    const parsedData = JSON.parse(qrData);
    
    if (!parsedData.id || !parsedData.eventId) {
      return res.status(400).json({ message: 'Invalid QR code format' });
    }
    
    const event = await Event.findById(parsedData.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    const qrCode = await QRCode.findOne({
      event: parsedData.eventId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });
    
    if (!qrCode) {
      return res.status(404).json({ message: 'QR code not found or expired' });
    }
    
    qrCode.usedCount += 1;
    await qrCode.save();
    
    res.status(200).json({
      message: 'QR code verified successfully',
      qrCode: {
        id: qrCode._id,
        type: qrCode.type,
        event: {
          id: event._id,
          title: event.title,
          activityType: event.activityType,
          location: event.location,
          defaultQuantity: event.defaultQuantity || 1
        }
      }
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
    
    const parsedData = JSON.parse(qrData);
    
    if (!parsedData.id || !parsedData.eventId) {
      return res.status(400).json({ message: 'Invalid QR code format' });
    }
    
    const event = await Event.findById(parsedData.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    const qrCode = await QRCode.findOne({
      event: parsedData.eventId,
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
    
 
    const nftReq = {
      params: {
        activityId: newActivity._id
      },
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
    
    res.status(200).json({
      message: 'QR code verified, activity recorded, and NFT minted successfully',
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
      }
    });
  } catch (error) {
    console.error('Error in QR verification and NFT minting process:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};