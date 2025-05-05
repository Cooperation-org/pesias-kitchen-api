const express = require('express');
const userController = require('../controllers/userController');
const { authenticate, checkRole } = require('../middleware/auth');

const router = express.Router();

router.get('/profile', authenticate, userController.getCurrentUser);
router.put('/profile', authenticate, userController.updateProfile);
router.get('/', authenticate, checkRole(['admin']), userController.getAllUsers);
router.get('/:userId', authenticate, checkRole(['admin']), userController.getUserById);
router.put('/:userId/role', authenticate, checkRole(['admin']), userController.updateUserRole);

module.exports = router;