const express = require('express');
const {
  getMe,
  updateProfile,
  connectWallet,
  createWallet
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/me', protect, getMe);
router.put('/update', protect, updateProfile);
router.post('/wallet/connect', protect, connectWallet);
router.post('/wallet/create', protect, createWallet);

module.exports = router;