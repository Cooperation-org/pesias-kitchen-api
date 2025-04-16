const express = require('express');
const { generateQR, verifyQR } = require('../controllers/qrController');

const router = express.Router();

router.get('/generate/:activityId', generateQR);
router.post('/verify', verifyQR);

module.exports = router;