// const express = require('express');
// const activityController = require('../controllers/activityController');
// const { authenticate } = require('../middleware/auth');

// const router = express.Router();

// router.post(
//   '/record',
//   authenticate,
//   activityController.recordActivity
// );

// router.post(
//   '/mint/:activityId',
//   authenticate,
//   activityController.mintActivityNFT
// );

// router.get(
//   '/user',
//   authenticate,
//   activityController.getUserActivities
// );

// module.exports = router;


// src/routes/activity.js
const express = require('express');
const activityController = require('../controllers/activityController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Create a new activity
router.post(
  '/record',
  authenticate,
  activityController.recordActivity
);

// Mint NFT for an activity
router.post(
  '/mint/:activityId',
  authenticate,
  activityController.mintActivityNFT
);

// Get activities for the authenticated user
router.get(
  '/user',
  authenticate,
  activityController.getUserActivities
);

// Get a specific activity by ID
router.get(
  '/:activityId',
  authenticate,
  activityController.getActivityById
);

// Get all activities (admin only)
router.get(
  '/',
  authenticate,
  activityController.getAllActivities
);

module.exports = router;