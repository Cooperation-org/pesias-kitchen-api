const express = require('express');
const poolController = require('../controllers/poolController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/info', authenticate, poolController.getPoolInfo);
router.get('/balance/:walletAddress', authenticate, poolController.getUserBalance);

module.exports = router;