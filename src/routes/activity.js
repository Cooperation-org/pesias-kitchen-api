const express = require('express');
const activityController = require('../controllers/activityController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/record',
  authenticate,
  activityController.recordActivity
);

router.post(
  '/mint/:activityId',
  authenticate,
  activityController.mintActivityNFT
);

router.get(
  '/user',
  authenticate,
  activityController.getUserActivities
);

router.get(
  '/:activityId',
  authenticate,
  activityController.getActivityById
);

router.get(
  '/',
  authenticate,
  activityController.getAllActivities
);

module.exports = router;