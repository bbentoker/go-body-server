const { Resend } = require('resend');
const { Email, EmailEvent } = require('../models');

// Initialize Resend client
const resend = new Resend(process.env.RESEND_KEY);

// Default sender - configure based on your verified domain
const DEFAULT_FROM = process.env.EMAIL_FROM || 'Go Body <noreply@go-body.co>';

/**
 * Email Templates - Centralized template definitions
 * Add your email templates here
 */
const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  PASSWORD_RESET: 'password_reset',
  EMAIL_VERIFICATION: 'email_verification',
  RESERVATION_CONFIRMATION: 'reservation_confirmation',
  RESERVATION_REMINDER: 'reservation_reminder',
  RESERVATION_CANCELLED: 'reservation_cancelled',
};

/**
 * Generate HTML content based on template name and data
 * @param {string} templateName - Template identifier
 * @param {Object} data - Data to populate the template
 * @returns {string} HTML content
 */
function generateHtmlFromTemplate(templateName, data) {
  // Base template wrapper
  const wrapHtml = (content) => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Go Body</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; }
        .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #eee; }
        .header h1 { color: #2d3748; margin: 0; }
        .content { padding: 30px 20px; }
        .button { display: inline-block; padding: 12px 30px; background-color: #4F46E5; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; border-top: 1px solid #eee; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Go Body</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Go Body. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  switch (templateName) {
    case EMAIL_TEMPLATES.WELCOME:
      return wrapHtml(`
        <h2>Welcome to Go Body, ${data.firstName}!</h2>
        <p>We're excited to have you on board. Your account has been created successfully.</p>
        <p>You can now book appointments and explore our services.</p>
        ${data.verificationUrl ? `<a href="${data.verificationUrl}" class="button">Verify Your Email</a>` : ''}
        <p>If you have any questions, feel free to reach out to our support team.</p>
      `);

    case EMAIL_TEMPLATES.PASSWORD_RESET:
      return wrapHtml(`
        <h2>Password Reset Request</h2>
        <p>Hi ${data.firstName || 'there'},</p>
        <p>We received a request to reset your password. Click the button below to set a new password:</p>
        <a href="${data.resetUrl}" class="button">Reset Password</a>
        <p>This link will expire in ${data.expiresIn || '1 hour'}.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `);

    case EMAIL_TEMPLATES.EMAIL_VERIFICATION:
      return wrapHtml(`
        <h2>Verify Your Email Address</h2>
        <p>Hi ${data.firstName || 'there'},</p>
        <p>Please verify your email address by clicking the button below:</p>
        <a href="${data.verificationUrl}" class="button">Verify Email</a>
        <p>This link will expire in ${data.expiresIn || '24 hours'}.</p>
      `);

    case EMAIL_TEMPLATES.RESERVATION_CONFIRMATION:
      return wrapHtml(`
        <h2>Reservation Confirmed!</h2>
        <p>Hi ${data.firstName},</p>
        <p>Your reservation has been confirmed:</p>
        <ul>
          <li><strong>Service:</strong> ${data.serviceName}</li>
          <li><strong>Date:</strong> ${data.date}</li>
          <li><strong>Time:</strong> ${data.time}</li>
          <li><strong>Duration:</strong> ${data.duration} minutes</li>
          ${data.providerName ? `<li><strong>Provider:</strong> ${data.providerName}</li>` : ''}
        </ul>
        <p>We look forward to seeing you!</p>
      `);

    case EMAIL_TEMPLATES.RESERVATION_REMINDER:
      return wrapHtml(`
        <h2>Appointment Reminder</h2>
        <p>Hi ${data.firstName},</p>
        <p>This is a reminder about your upcoming appointment:</p>
        <ul>
          <li><strong>Service:</strong> ${data.serviceName}</li>
          <li><strong>Date:</strong> ${data.date}</li>
          <li><strong>Time:</strong> ${data.time}</li>
        </ul>
        <p>See you soon!</p>
      `);

    case EMAIL_TEMPLATES.RESERVATION_CANCELLED:
      return wrapHtml(`
        <h2>Reservation Cancelled</h2>
        <p>Hi ${data.firstName},</p>
        <p>Your reservation has been cancelled:</p>
        <ul>
          <li><strong>Service:</strong> ${data.serviceName}</li>
          <li><strong>Date:</strong> ${data.date}</li>
          <li><strong>Time:</strong> ${data.time}</li>
        </ul>
        ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
        <p>If you'd like to book another appointment, please visit our website.</p>
      `);

    default:
      // For custom HTML, return the data.html if provided
      return data.html || '';
  }
}

/**
 * Generate plain text content from template
 * @param {string} templateName - Template identifier
 * @param {Object} data - Data to populate the template
 * @returns {string} Plain text content
 */
function generateTextFromTemplate(templateName, data) {
  switch (templateName) {
    case EMAIL_TEMPLATES.WELCOME:
      return `Welcome to Go Body, ${data.firstName}!\n\nWe're excited to have you on board. Your account has been created successfully.\n\n${data.verificationUrl ? `Verify your email: ${data.verificationUrl}` : ''}`;

    case EMAIL_TEMPLATES.PASSWORD_RESET:
      return `Password Reset Request\n\nHi ${data.firstName || 'there'},\n\nWe received a request to reset your password. Visit this link to set a new password:\n${data.resetUrl}\n\nThis link will expire in ${data.expiresIn || '1 hour'}.\n\nIf you didn't request this, you can safely ignore this email.`;

    case EMAIL_TEMPLATES.EMAIL_VERIFICATION:
      return `Verify Your Email Address\n\nHi ${data.firstName || 'there'},\n\nPlease verify your email address by visiting:\n${data.verificationUrl}\n\nThis link will expire in ${data.expiresIn || '24 hours'}.`;

    case EMAIL_TEMPLATES.RESERVATION_CONFIRMATION:
      return `Reservation Confirmed!\n\nHi ${data.firstName},\n\nYour reservation has been confirmed:\n- Service: ${data.serviceName}\n- Date: ${data.date}\n- Time: ${data.time}\n- Duration: ${data.duration} minutes\n${data.providerName ? `- Provider: ${data.providerName}` : ''}\n\nWe look forward to seeing you!`;

    case EMAIL_TEMPLATES.RESERVATION_REMINDER:
      return `Appointment Reminder\n\nHi ${data.firstName},\n\nThis is a reminder about your upcoming appointment:\n- Service: ${data.serviceName}\n- Date: ${data.date}\n- Time: ${data.time}\n\nSee you soon!`;

    case EMAIL_TEMPLATES.RESERVATION_CANCELLED:
      return `Reservation Cancelled\n\nHi ${data.firstName},\n\nYour reservation has been cancelled:\n- Service: ${data.serviceName}\n- Date: ${data.date}\n- Time: ${data.time}\n${data.reason ? `\nReason: ${data.reason}` : ''}\n\nIf you'd like to book another appointment, please visit our website.`;

    default:
      return data.text || '';
  }
}

/**
 * Send an email using a template
 * @param {Object} options - Email options
 * @param {string|string[]} options.to - Recipient email(s)
 * @param {string} options.subject - Email subject
 * @param {string} options.template - Template name from EMAIL_TEMPLATES
 * @param {Object} options.data - Data for template
 * @param {number} [options.userId] - Associated user ID
 * @param {string} [options.from] - Custom from address
 * @param {string|string[]} [options.cc] - CC recipients
 * @param {string|string[]} [options.bcc] - BCC recipients
 * @param {string} [options.replyTo] - Reply-to address
 * @param {Object[]} [options.tags] - Resend tags
 * @returns {Promise<Object>} Email record
 */
async function sendTemplateEmail(options) {
  const {
    to,
    subject,
    template,
    data,
    userId = null,
    from = DEFAULT_FROM,
    cc = null,
    bcc = null,
    replyTo = null,
    tags = null,
  } = options;

  const toArray = Array.isArray(to) ? to : [to];
  const ccArray = cc ? (Array.isArray(cc) ? cc : [cc]) : null;
  const bccArray = bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : null;

  const htmlContent = generateHtmlFromTemplate(template, data);
  const textContent = generateTextFromTemplate(template, data);

  return sendEmail({
    to: toArray,
    subject,
    html: htmlContent,
    text: textContent,
    userId,
    from,
    cc: ccArray,
    bcc: bccArray,
    replyTo,
    tags,
    templateName: template,
    templateData: data,
  });
}

/**
 * Send a raw email (without template)
 * @param {Object} options - Email options
 * @param {string|string[]} options.to - Recipient email(s)
 * @param {string} options.subject - Email subject
 * @param {string} [options.html] - HTML content
 * @param {string} [options.text] - Plain text content
 * @param {number} [options.userId] - Associated user ID
 * @param {string} [options.from] - Custom from address
 * @param {string|string[]} [options.cc] - CC recipients
 * @param {string|string[]} [options.bcc] - BCC recipients
 * @param {string} [options.replyTo] - Reply-to address
 * @param {Object[]} [options.tags] - Resend tags
 * @param {string} [options.templateName] - Template name for tracking
 * @param {Object} [options.templateData] - Template data for tracking
 * @returns {Promise<Object>} Email record
 */
async function sendEmail(options) {
  const {
    to,
    subject,
    html = null,
    text = null,
    userId = null,
    from = DEFAULT_FROM,
    cc = null,
    bcc = null,
    replyTo = null,
    tags = null,
    templateName = null,
    templateData = null,
  } = options;

  const toArray = Array.isArray(to) ? to : [to];
  const ccArray = cc ? (Array.isArray(cc) ? cc : [cc]) : null;
  const bccArray = bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : null;

  // Create email record in pending state
  const emailRecord = await Email.create({
    user_id: userId,
    from_address: from,
    to_addresses: toArray,
    cc_addresses: ccArray,
    bcc_addresses: bccArray,
    reply_to: replyTo,
    subject,
    html_content: html,
    text_content: text,
    template_name: templateName,
    template_data: templateData,
    tags,
    status: 'pending',
  });

  try {
    // Build Resend payload
    const resendPayload = {
      from,
      to: toArray,
      subject,
    };

    if (html) resendPayload.html = html;
    if (text) resendPayload.text = text;
    if (ccArray) resendPayload.cc = ccArray;
    if (bccArray) resendPayload.bcc = bccArray;
    if (replyTo) resendPayload.reply_to = replyTo;
    if (tags) resendPayload.tags = tags;

    // Send via Resend
    const { data, error } = await resend.emails.send(resendPayload);

    if (error) {
      // Update email record with error
      await emailRecord.update({
        status: 'failed',
        error_message: error.message || JSON.stringify(error),
      });

      console.error('Resend API error:', error);
      throw new Error(error.message || 'Failed to send email via Resend');
    }

    // Update email record with success
    await emailRecord.update({
      resend_id: data.id,
      status: 'sent',
      sent_at: new Date(),
    });

    return emailRecord.get({ plain: true });
  } catch (error) {
    // If we haven't already updated the status to failed
    if (emailRecord.status === 'pending') {
      await emailRecord.update({
        status: 'failed',
        error_message: error.message,
      });
    }

    console.error('Email sending failed:', error);
    throw error;
  }
}

/**
 * Process a webhook event from Resend
 * @param {Object} payload - Webhook payload from Resend
 * @returns {Promise<Object>} Created event record
 */
async function processWebhookEvent(payload) {
  const { type, created_at, data } = payload;

  // Find the email record by resend_id
  const emailRecord = await Email.findOne({
    where: { resend_id: data.email_id },
  });

  // Create event record
  const eventRecord = await EmailEvent.create({
    email_id: emailRecord?.email_id || null,
    resend_email_id: data.email_id,
    event_type: type,
    webhook_id: data.webhook_id || null,
    recipient_email: data.to?.[0] || null,
    bounce_type: data.bounce?.type || null,
    bounce_classification: data.bounce?.classification || null,
    click_url: data.click?.link || null,
    user_agent: data.click?.userAgent || data.open?.userAgent || null,
    ip_address: data.click?.ipAddress || data.open?.ipAddress || null,
    raw_payload: payload,
    occurred_at: new Date(created_at),
  });

  // Update email record status based on event type
  if (emailRecord) {
    const updates = {};

    switch (type) {
      case 'email.sent':
        updates.status = 'sent';
        updates.sent_at = updates.sent_at || new Date(created_at);
        break;
      case 'email.delivered':
        updates.status = 'delivered';
        updates.delivered_at = new Date(created_at);
        break;
      case 'email.bounced':
        updates.status = 'bounced';
        updates.bounced_at = new Date(created_at);
        break;
      case 'email.complained':
        updates.status = 'complained';
        updates.complained_at = new Date(created_at);
        break;
      case 'email.opened':
        if (!emailRecord.opened_at) {
          updates.opened_at = new Date(created_at);
        }
        break;
      case 'email.clicked':
        if (!emailRecord.clicked_at) {
          updates.clicked_at = new Date(created_at);
        }
        break;
      // email.delivery_delayed doesn't change status
    }

    if (Object.keys(updates).length > 0) {
      await emailRecord.update(updates);
    }
  }

  return eventRecord.get({ plain: true });
}

/**
 * Get email by ID
 * @param {number} emailId - Email ID
 * @param {Object} [options] - Options
 * @param {boolean} [options.includeEvents] - Include related events
 * @returns {Promise<Object|null>} Email record
 */
async function getEmailById(emailId, options = {}) {
  const include = options.includeEvents ? [{ model: EmailEvent, as: 'events' }] : [];
  
  const email = await Email.findByPk(emailId, { include });
  return email ? email.get({ plain: true }) : null;
}

/**
 * Get email by Resend ID
 * @param {string} resendId - Resend email ID
 * @param {Object} [options] - Options
 * @param {boolean} [options.includeEvents] - Include related events
 * @returns {Promise<Object|null>} Email record
 */
async function getEmailByResendId(resendId, options = {}) {
  const include = options.includeEvents ? [{ model: EmailEvent, as: 'events' }] : [];
  
  const email = await Email.findOne({
    where: { resend_id: resendId },
    include,
  });
  return email ? email.get({ plain: true }) : null;
}

/**
 * Get emails for a user
 * @param {number} userId - User ID
 * @param {Object} [options] - Query options
 * @returns {Promise<Object[]>} Email records
 */
async function getEmailsByUserId(userId, options = {}) {
  const emails = await Email.findAll({
    where: { user_id: userId },
    include: options.includeEvents ? [{ model: EmailEvent, as: 'events' }] : [],
    order: [['created_at', 'DESC']],
    limit: options.limit,
    offset: options.offset,
  });

  return emails.map((email) => email.get({ plain: true }));
}

/**
 * Get events for an email
 * @param {number} emailId - Email ID
 * @returns {Promise<Object[]>} Event records
 */
async function getEventsByEmailId(emailId) {
  const events = await EmailEvent.findAll({
    where: { email_id: emailId },
    order: [['occurred_at', 'ASC']],
  });

  return events.map((event) => event.get({ plain: true }));
}

/**
 * Get email statistics
 * @param {Object} [options] - Query options
 * @param {Date} [options.startDate] - Start date filter
 * @param {Date} [options.endDate] - End date filter
 * @returns {Promise<Object>} Statistics
 */
async function getEmailStats(options = {}) {
  const { Op } = require('sequelize');
  
  const where = {};
  if (options.startDate || options.endDate) {
    where.created_at = {};
    if (options.startDate) where.created_at[Op.gte] = options.startDate;
    if (options.endDate) where.created_at[Op.lte] = options.endDate;
  }

  const emails = await Email.findAll({ where });
  
  const stats = {
    total: emails.length,
    pending: 0,
    sent: 0,
    delivered: 0,
    bounced: 0,
    complained: 0,
    failed: 0,
    opened: 0,
    clicked: 0,
  };

  emails.forEach((email) => {
    stats[email.status] = (stats[email.status] || 0) + 1;
    if (email.opened_at) stats.opened++;
    if (email.clicked_at) stats.clicked++;
  });

  return stats;
}

module.exports = {
  // Constants
  EMAIL_TEMPLATES,
  DEFAULT_FROM,
  
  // Core sending functions
  sendEmail,
  sendTemplateEmail,
  
  // Webhook processing
  processWebhookEvent,
  
  // Query functions
  getEmailById,
  getEmailByResendId,
  getEmailsByUserId,
  getEventsByEmailId,
  getEmailStats,
};

