const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { authenticate, checkRole } = require('../middleware/auth');

const router = express.Router();

// router.get('/food-heroes-impact', authenticate, checkRole(['admin', 'superadmin']), analyticsController.getFoodHeroesImpact);
router.get('/dashboard/impact', authenticate, checkRole(['admin', 'superadmin']), analyticsController.getFoodHeroesImpact);

router.get('/dashboard/event/:eventId', authenticate, checkRole(['admin', 'superadmin']), analyticsController.getSingleEventImpact);
module.exports = router;