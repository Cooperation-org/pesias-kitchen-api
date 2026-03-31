const express = require('express');
const router = express.Router();
const qrQuizController = require('../controllers/qrQuizController');
const { authenticate } = require('../middleware/auth');

// New: get/create quiz QR for a specific event
router.post(
  '/quiz/:eventId',
  authenticate,
  qrQuizController.getOrCreateQuizQRCode,
);

module.exports = router;