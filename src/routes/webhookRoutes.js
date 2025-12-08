const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

/**
 * Resend webhook endpoint
 * POST /webhooks/resend
 * 
 * This endpoint receives webhook events from Resend for email tracking.
 * Events include: email.sent, email.delivered, email.bounced, email.opened, etc.
 * 
 * Note: This endpoint should NOT require authentication as it's called by Resend.
 * In production, you should verify the webhook signature.
 */
router.post('/resend', webhookController.handleResendWebhook);

module.exports = router;

