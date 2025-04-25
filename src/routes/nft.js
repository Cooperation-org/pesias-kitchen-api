// src/routes/nft.js
const express = require('express');
const nftController = require('../controllers/nftController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get all NFTs owned by the authenticated user
router.get('/user', authenticate, nftController.getUserNFTs);

// Get NFT details
router.get('/:nftId', authenticate, nftController.getNFTDetails);

// Get NFT image
router.get('/:nftId/image', nftController.getNFTImage);

module.exports = router;