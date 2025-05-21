// routes/linkedTrust.js
const express = require('express');
const linkedTrustController = require('../controllers/linkedTrustController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Route to share an NFT to LinkedTrust
router.post(
  '/share/:nftId',
  authenticate,
  linkedTrustController.shareNFTToLinkedTrust
);

// Route to get authentication link for LinkedTrust
router.get(
  '/auth',
  authenticate,
  linkedTrustController.getLinkedTrustAuthLink
);

module.exports = router;