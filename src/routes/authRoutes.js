const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// Provider login routes
router.post('/admin/login', authController.loginAdminProvider);
router.post('/worker/login', authController.loginWorkerProvider);

// User login route
router.post('/user/login', authController.loginUser);

// Token management routes
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/logout-all', authController.logoutAll);

module.exports = router;

