const express = require('express');
const eventController = require('../controllers/eventController');
const { authenticate, checkRole } = require('../middleware/auth');

const router = express.Router();


router.get('/', authenticate, eventController.getAllEvents);
router.get('/:eventId', authenticate, eventController.getEventById)
router.post('/', authenticate, checkRole(['admin', 'superadmin']), eventController.createEvent);
router.put('/:eventId', authenticate, checkRole(['admin', 'superadmin']), eventController.updateEvent);
router.delete('/:eventId', authenticate, checkRole(['admin', 'superadmin']), eventController.deleteEvent);
router.post('/:eventId/join', authenticate, eventController.joinEvent);
router.post('/:eventId/leave', authenticate, eventController.leaveEvent);

module.exports = router;