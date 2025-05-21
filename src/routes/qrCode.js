const express = require('express');
const qrCodeController = require('../controllers/qrCodeController');
const { authenticate, checkRole } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/generate',
  authenticate,
  checkRole(['admin', 'superadmin']),
  qrCodeController.generateQRCode
);

router.post('/verify', authenticate, qrCodeController.verifyQRCode);
router.post('/verify-and-mint', authenticate, qrCodeController.verifyQRAndMintNFT);

module.exports = router;