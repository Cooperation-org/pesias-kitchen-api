const express = require('express');
const {
  createActivity,
  getActivities,
  getActivity,
  updateActivityStatus,
  completeActivity,
  getActivityParticipants
} = require('../controllers/activityController');

const router = express.Router();

router.post('/', createActivity);
router.get('/', getActivities);
router.get('/:id', getActivity);
router.put('/:id/status', updateActivityStatus);
router.put('/:id/complete', completeActivity);
router.get('/:id/participants', getActivityParticipants);

module.exports = router;