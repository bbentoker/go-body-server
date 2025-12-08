const emailService = require('../services/emailService');

/**
 * Handle Resend webhook events
 * POST /webhooks/resend
 */
async function handleResendWebhook(req, res) {
  try {
    const payload = req.body;

    // Validate payload structure
    if (!payload || !payload.type || !payload.data) {
      console.warn('Invalid webhook payload received:', payload);
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    // Validate event type
    const validEventTypes = [
      'email.sent',
      'email.delivered',
      'email.delivery_delayed',
      'email.complained',
      'email.bounced',
      'email.opened',
      'email.clicked',
    ];

    if (!validEventTypes.includes(payload.type)) {
      console.warn('Unknown webhook event type:', payload.type);
      // Still return 200 to acknowledge receipt
      return res.status(200).json({ received: true, processed: false });
    }

    // Process the event
    const event = await emailService.processWebhookEvent(payload);

    console.log(`Processed ${payload.type} event for email ${payload.data.email_id}`);

    return res.status(200).json({
      received: true,
      processed: true,
      event_id: event.event_id,
    });
  } catch (error) {
    console.error('Webhook processing error:', error);

    // Still return 200 to prevent Resend from retrying
    // Log the error for investigation
    return res.status(200).json({
      received: true,
      processed: false,
      error: error.message,
    });
  }
}

module.exports = {
  handleResendWebhook,
};

