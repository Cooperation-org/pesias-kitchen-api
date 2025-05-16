const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { authenticate, checkRole } = require('../middleware/auth');

const router = express.Router();

router.get('/food-heroes-impact', authenticate, checkRole(['admin']), analyticsController.getFoodHeroesImpact);

router.get('/event-impact', authenticate, checkRole(['admin']), analyticsController.getEventImpactAnalytics);

module.exports = router;