const QRCode = require('../models/QRCode');
const Event = require('../models/Event');

// Return an existing quiz QR or create one for this event
exports.getOrCreateQuizQRCode = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({ message: 'eventId is required' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Try to reuse an existing quiz QR for this event
    let qrCode = await QRCode.findOne({
      event: event._id,
      type: 'volunteer',
      isActive: true,
      isQuizGenerated: true,
    });

    if (!qrCode) {
      // Create a new quiz QR valid for a long time (e.g. 1 year)
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setFullYear(now.getFullYear() + 1);

      qrCode = new QRCode({
        event: event._id,
        type: 'volunteer',
        ipfsCid: null,
        expiresAt,
        isActive: true,
        createdBy: req.user?.userId || null,
        isQuizGenerated: true,
      });

      await qrCode.save();
    }

    return res.status(200).json({
      message: 'Quiz QR code ready',
      qrCode: {
        id: qrCode._id,
        event: {
          id: event._id,
          title: event.title,
          activityType: event.activityType,
          location: event.location,
          defaultQuantity: event.defaultQuantity,
        },
        type: qrCode.type,
      },
    });
  } catch (error) {
    console.error('Error in getOrCreateQuizQRCode:', error);
    return res.status(500).json({
      message: 'Unable to create quiz QR code. Please try again later.',
    });
  }
};