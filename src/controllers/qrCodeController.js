

// src/controllers/qrCodeController.js
const QRCode = require('../models/QRCode');
const Event = require('../models/Event');
const User = require('../models/User');
const qrcode = require('qrcode');
const { uploadToIPFS } = require('../services/ipfsService');

exports.generateQRCode = async (req, res) => {
  try {
    const { eventId, type } = req.body;
    
    if (!eventId || !type) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Find the event
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Set expiration date to event date
    const expiration = new Date(event.date);
    
    // Create QR code data
    const qrData = {
      eventId: event._id,
      type,
      timestamp: new Date().toISOString(),
      id: Math.random().toString(36).substring(2, 15) // Simple unique ID
    };
    
    // Generate QR code image
    const qrImage = await qrcode.toDataURL(JSON.stringify(qrData));
    
    // Upload QR code image to IPFS
    const ipfsCid = await uploadToIPFS(qrImage);
    
    // Create QR code record in database
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
    
    // Validate QR code format
    if (!parsedData.id || !parsedData.eventId) {
      return res.status(400).json({ message: 'Invalid QR code format' });
    }
    
    // Find related event
    const event = await Event.findById(parsedData.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Find QR code in database
    const qrCode = await QRCode.findOne({
      event: parsedData.eventId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });
    
    if (!qrCode) {
      return res.status(404).json({ message: 'QR code not found or expired' });
    }
    
    // Increment the used count
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