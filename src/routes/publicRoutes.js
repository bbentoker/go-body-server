const express = require('express');
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Route for authenticated users to update their own profile
router.put('/profile', authenticateToken, userController.updateOwnProfile);

module.exports = router;

