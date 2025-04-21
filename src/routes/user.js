const express = require('express');
const userController = require('../controllers/userController');
const { authenticate, checkRole } = require('../middleware/auth');

const router = express.Router();

// Get current user profile
router.get('/profile', authenticate, userController.getCurrentUser);

// Update user profile
router.put('/profile', authenticate, userController.updateProfile);

// Get all users (admin only)
router.get('/', authenticate, checkRole(['admin']), userController.getAllUsers);

// Get user by ID (admin only)
router.get('/:userId', authenticate, checkRole(['admin']), userController.getUserById);

// Update user role (admin only)
router.put('/:userId/role', authenticate, checkRole(['admin']), userController.updateUserRole);

module.exports = router;