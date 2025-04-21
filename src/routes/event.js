const express = require('express');
const eventController = require('../controllers/eventController');
const { authenticate, checkRole } = require('../middleware/auth');

const router = express.Router();

// Get all events
router.get('/', authenticate, eventController.getAllEvents);

// Get event by ID
router.get('/:eventId', authenticate, eventController.getEventById);

// Create event (admin only)
router.post('/', authenticate, checkRole(['admin']), eventController.createEvent);

// Update event (admin only)
router.put('/:eventId', authenticate, checkRole(['admin']), eventController.updateEvent);

// Delete event (admin only)
router.delete('/:eventId', authenticate, checkRole(['admin']), eventController.deleteEvent);

// Join event
router.post('/:eventId/join', authenticate, eventController.joinEvent);

// Leave event
router.post('/:eventId/leave', authenticate, eventController.leaveEvent);

module.exports = router;