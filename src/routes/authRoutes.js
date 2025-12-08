const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// User registration and login routes (login covers all roles)
router.post('/user/register', authController.registerUser);
router.post('/user/login', authController.loginUser);
router.post('/user/reset-password', authController.resetUserPassword);
router.post('/provider/reset-password', authController.resetProviderPassword);

// Password reset flow routes (email-based)
router.post('/password/request-reset', authController.requestPasswordReset);
router.post('/password/confirm-reset', authController.confirmPasswordReset);

// Token management routes
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/logout-all', authController.logoutAll);

module.exports = router;

