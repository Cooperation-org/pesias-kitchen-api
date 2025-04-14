const express = require('express');
const {
  createActivity,
  getActivities,
  getActivity,
  updateActivity,
  deleteActivity,
  joinActivity,
  verifyParticipation
} = require('../controllers/activityController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(getActivities)
  .post(protect, authorize('admin', 'volunteer'), createActivity);

router.route('/:id')
  .get(getActivity)
  .put(protect, updateActivity)
  .delete(protect, deleteActivity);

router.route('/:id/join')
  .post(protect, joinActivity);

router.route('/:id/verify')
  .post(protect, verifyParticipation);

module.exports = router;