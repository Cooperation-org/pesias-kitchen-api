const express = require('express');
const {
  getUserRewards,
  getActivityRewards,
  getAllRewards
} = require('../controllers/rewardController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/me', protect, getUserRewards);
router.get('/activity/:activityId', protect, getActivityRewards);
router.get('/', protect, authorize('admin'), getAllRewards);

module.exports = router;