const express = require('express');
const { handleGoodDollarLogin } = require('../controllers/goodDollarAuthController');

const router = express.Router();

router.post('/login', handleGoodDollarLogin);

module.exports = router;