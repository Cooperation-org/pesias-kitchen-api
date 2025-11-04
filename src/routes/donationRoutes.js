const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');
const { authenticate, checkRole } = require('../middleware/auth');

// Public routes (with optional authentication)
router.post('/record', (req, res, next) => {
  // Try to authenticate, but don't require it
  if (req.headers.authorization) {
    return authenticate(req, res, next);
  }
  next();
}, donationController.recordDonation);

router.get('/tx/:txHash', donationController.getDonationByTxHash);

// Public statistics
router.get('/stats', donationController.getDonationStats);

// Protected routes (admin only)
router.get('/', authenticate, checkRole(['admin', 'superadmin']), donationController.getAllDonations);

router.post('/verify/:txHash', authenticate, checkRole(['admin', 'superadmin']), donationController.verifyDonation);

module.exports = router;
