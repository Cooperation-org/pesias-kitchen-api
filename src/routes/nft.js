const express = require('express');
const nftController = require('../controllers/nftController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/user', authenticate, nftController.getUserNFTs);
router.get('/:nftId', authenticate, nftController.getNFTDetails);
router.get('/:nftId/image', nftController.getNFTImage);

module.exports = router;