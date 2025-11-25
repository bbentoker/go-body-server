const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// Provider login routes
router.post('/admin/login', authController.loginAdminProvider);
router.post('/worker/login', authController.loginWorkerProvider);

// User registration and login routes
router.post('/user/register', authController.registerUser);
router.post('/user/login', authController.loginUser);
router.post('/user/reset-password', authController.resetUserPassword);
router.post('/provider/reset-password', authController.resetProviderPassword);

// Token management routes
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/logout-all', authController.logoutAll);

module.exports = router;

