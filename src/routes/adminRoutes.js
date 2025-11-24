const express = require('express');
const languageController = require('../controllers/languageController');
const { authenticateToken, authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication and admin privileges
router.use(authenticateToken);
router.use(authenticateAdmin);

// Route for admins to update their own language preference
router.patch('/language', languageController.updateProviderLanguagePreference);

module.exports = router;

