const express = require('express');
const {
  getUserParticipations,
  getActivityParticipations,
  recordRewardTransaction
} = require('../controllers/participationController');

const router = express.Router();

router.get('/user/:walletAddress', getUserParticipations);
router.get('/activity/:activityId', getActivityParticipations);
router.post('/reward', recordRewardTransaction);

module.exports = router;