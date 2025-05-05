const express = require('express');
const rewardsController = require('../controllers/rewardsController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/history', authenticate, rewardsController.getRewardHistory);

module.exports = router;