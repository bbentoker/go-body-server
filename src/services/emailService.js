const { Resend } = require('resend');
const { Email, EmailEvent, User } = require('../models');

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
  PENDING_RESERVATION_REQUEST: 'pending_reservation_request',
  RESERVATION_APPROVED: 'reservation_approved',
  RESERVATION_REJECTED: 'reservation_rejected',
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

    case EMAIL_TEMPLATES.PENDING_RESERVATION_REQUEST:
      return wrapHtml(`
        <h2>Yeni Rezervasyon Talebi</h2>
        <p>Merhaba ${data.adminName || 'Admin'},</p>
        <p>Yeni bir rezervasyon talebi gönderildi ve incelemenizi bekliyor:</p>
        <div style="background-color: #f8f9fa; border-left: 4px solid #4F46E5; padding: 15px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #2d3748;">Talep Detayları</h3>
          <ul style="list-style: none; padding: 0; margin: 0;">
            <li style="margin-bottom: 8px;"><strong>Müşteri:</strong> ${data.customerName}</li>
            <li style="margin-bottom: 8px;"><strong>E-posta:</strong> ${data.customerEmail}</li>
            ${data.customerPhone ? `<li style="margin-bottom: 8px;"><strong>Telefon:</strong> ${data.customerPhone}</li>` : ''}
            <li style="margin-bottom: 8px;"><strong>Hizmet:</strong> ${data.serviceName}</li>
            <li style="margin-bottom: 8px;"><strong>Tarih:</strong> ${data.date}</li>
            <li style="margin-bottom: 8px;"><strong>Saat:</strong> ${data.time}</li>
            <li style="margin-bottom: 8px;"><strong>Süre:</strong> ${data.duration} dakika</li>
            ${data.notes ? `<li style="margin-bottom: 8px;"><strong>Notlar:</strong> ${data.notes}</li>` : ''}
          </ul>
        </div>
        <p>Lütfen bu talebi inceleyip onaylayın veya reddedin.</p>
        ${data.dashboardUrl ? `<a href="${data.dashboardUrl}" class="button">Panelde Görüntüle</a>` : ''}
      `);

    case EMAIL_TEMPLATES.RESERVATION_APPROVED:
      return wrapHtml(`
        <h2>Rezervasyonunuz Onaylandı! 🎉</h2>
        <p>Merhaba ${data.firstName},</p>
        <p>Harika haber! Rezervasyon talebiniz onaylandı.</p>
        <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #155724;">Rezervasyon Detayları</h3>
          <ul style="list-style: none; padding: 0; margin: 0;">
            <li style="margin-bottom: 8px;"><strong>Hizmet:</strong> ${data.serviceName}</li>
            <li style="margin-bottom: 8px;"><strong>Tarih:</strong> ${data.date}</li>
            <li style="margin-bottom: 8px;"><strong>Saat:</strong> ${data.time}</li>
            <li style="margin-bottom: 8px;"><strong>Süre:</strong> ${data.duration} dakika</li>
            ${data.providerName ? `<li style="margin-bottom: 8px;"><strong>Hizmet Veren:</strong> ${data.providerName}</li>` : ''}
          </ul>
        </div>
        <p>Sizi görmek için sabırsızlanıyoruz!</p>
        <p>Herhangi bir değişiklik yapmanız gerekirse lütfen bizimle iletişime geçin.</p>
      `);

    case EMAIL_TEMPLATES.RESERVATION_REJECTED:
      return wrapHtml(`
        <h2>Rezervasyon Talebi Güncellemesi</h2>
        <p>Merhaba ${data.firstName},</p>
        <p>Üzgünüz, rezervasyon talebiniz şu anda onaylanamadı.</p>
        <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #721c24;">Talep Detayları</h3>
          <ul style="list-style: none; padding: 0; margin: 0;">
            <li style="margin-bottom: 8px;"><strong>Hizmet:</strong> ${data.serviceName}</li>
            <li style="margin-bottom: 8px;"><strong>Tarih:</strong> ${data.date}</li>
            <li style="margin-bottom: 8px;"><strong>Saat:</strong> ${data.time}</li>
          </ul>
          ${data.reason ? `<p style="margin-top: 15px;"><strong>Sebep:</strong> ${data.reason}</p>` : ''}
        </div>
        <p>Verdiğimiz rahatsızlık için özür dileriz. Farklı bir zaman için yeni bir rezervasyon talebi gönderebilirsiniz.</p>
        ${data.bookingUrl ? `<a href="${data.bookingUrl}" style="display: inline-block; padding: 12px 30px; background-color: #4F46E5; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0;">Yeni Randevu Al</a>` : ''}
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

    case EMAIL_TEMPLATES.PENDING_RESERVATION_REQUEST:
      return `Yeni Rezervasyon Talebi\n\nMerhaba ${data.adminName || 'Admin'},\n\nYeni bir rezervasyon talebi gönderildi ve incelemenizi bekliyor:\n\nTalep Detayları:\n- Müşteri: ${data.customerName}\n- E-posta: ${data.customerEmail}\n${data.customerPhone ? `- Telefon: ${data.customerPhone}\n` : ''}- Hizmet: ${data.serviceName}\n- Tarih: ${data.date}\n- Saat: ${data.time}\n- Süre: ${data.duration} dakika\n${data.notes ? `- Notlar: ${data.notes}\n` : ''}\nLütfen bu talebi inceleyip onaylayın veya reddedin.${data.dashboardUrl ? `\n\nPanelde Görüntüle: ${data.dashboardUrl}` : ''}`;

    case EMAIL_TEMPLATES.RESERVATION_APPROVED:
      return `Rezervasyonunuz Onaylandı!\n\nMerhaba ${data.firstName},\n\nHarika haber! Rezervasyon talebiniz onaylandı.\n\nRezervasyon Detayları:\n- Hizmet: ${data.serviceName}\n- Tarih: ${data.date}\n- Saat: ${data.time}\n- Süre: ${data.duration} dakika\n${data.providerName ? `- Hizmet Veren: ${data.providerName}\n` : ''}\nSizi görmek için sabırsızlanıyoruz!\n\nHerhangi bir değişiklik yapmanız gerekirse lütfen bizimle iletişime geçin.`;

    case EMAIL_TEMPLATES.RESERVATION_REJECTED:
      return `Rezervasyon Talebi Güncellemesi\n\nMerhaba ${data.firstName},\n\nÜzgünüz, rezervasyon talebiniz şu anda onaylanamadı.\n\nTalep Detayları:\n- Hizmet: ${data.serviceName}\n- Tarih: ${data.date}\n- Saat: ${data.time}\n${data.reason ? `\nSebep: ${data.reason}\n` : ''}\nVerdiğimiz rahatsızlık için özür dileriz. Farklı bir zaman için yeni bir rezervasyon talebi gönderebilirsiniz.${data.bookingUrl ? `\n\nYeni Randevu Al: ${data.bookingUrl}` : ''}`;

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

/**
 * Notify users with role_id 1 about a new pending reservation request
 * @param {Object} reservation - The reservation object with relations
 * @param {Object} customer - The customer who made the request
 * @returns {Promise<Object[]>} Array of email send results
 */
async function notifyAdminsOfPendingReservation(reservation, customer) {
  try {
    // Get all users with role_id 1 (admins)
    const adminUsers = await User.findAll({
      where: { role_id: 1 },
      attributes: ['user_id', 'email', 'first_name', 'last_name'],
    });

    if (adminUsers.length === 0) {
      console.log('No admin users found with role_id 1 to notify');
      return [];
    }

    // Format date and time for display (Turkish locale and timezone)
    const startDate = new Date(reservation.start_time);
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/Istanbul' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' };
    const formattedDate = startDate.toLocaleDateString('tr-TR', dateOptions);
    const formattedTime = startDate.toLocaleTimeString('tr-TR', timeOptions);

    // Extract service and variant names from the reservation
    const serviceName = reservation.variant?.service?.name || 'Bilinmeyen Hizmet';
    const variantName = reservation.variant?.name || null;
    const duration = reservation.variant?.duration_minutes || 0;

    // Build dashboard URL using FRONTEND_URL environment variable
    const dashboardUrl = process.env.FRONTEND_URL
      ? `${process.env.FRONTEND_URL}/admin/reservations/pending`
      : null;

    // Customer info
    const customerName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Bilinmeyen Müşteri';
    const customerEmail = customer.email || 'E-posta belirtilmemiş';
    const customerPhone = customer.phone_number || null;

    // Send email to each admin
    const emailPromises = adminUsers.map(async (admin) => {
      const adminPlain = admin.get({ plain: true });
      const adminName = `${adminPlain.first_name || ''} ${adminPlain.last_name || ''}`.trim() || 'Admin';

      try {
        return await sendTemplateEmail({
          to: adminPlain.email,
          subject: `${customerName} tarafından Yeni Rezervasyon Talebi`,
          template: EMAIL_TEMPLATES.PENDING_RESERVATION_REQUEST,
          data: {
            adminName,
            customerName,
            customerEmail,
            customerPhone,
            serviceName,
            variantName,
            date: formattedDate,
            time: formattedTime,
            duration,
            notes: reservation.notes || null,
            dashboardUrl,
          },
          userId: adminPlain.user_id,
        });
      } catch (emailError) {
        console.error(`Failed to send pending reservation notification to ${adminPlain.email}:`, emailError);
        return { error: emailError.message, email: adminPlain.email };
      }
    });

    const results = await Promise.all(emailPromises);
    console.log(`Sent pending reservation notifications to ${results.filter(r => !r.error).length} admin(s)`);
    return results;
  } catch (error) {
    console.error('Error notifying admins of pending reservation:', error);
    throw error;
  }
}

/**
 * Notify customer that their reservation has been approved
 * @param {Object} reservation - The reservation object with relations
 * @param {Object} customer - The customer who made the request
 * @returns {Promise<Object>} Email send result
 */
async function notifyCustomerOfApprovedReservation(reservation, customer) {
  try {
    if (!customer || !customer.email) {
      console.log('Cannot notify customer: no email address available');
      return null;
    }

    // Format date and time for display (Turkish locale and timezone)
    const startDate = new Date(reservation.start_time);
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/Istanbul' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' };
    const formattedDate = startDate.toLocaleDateString('tr-TR', dateOptions);
    const formattedTime = startDate.toLocaleTimeString('tr-TR', timeOptions);

    // Extract service and variant names from the reservation
    const serviceName = reservation.variant?.service?.name || 'Bilinmeyen Hizmet';
    const variantName = reservation.variant?.name || null;
    const duration = reservation.variant?.duration_minutes || 0;

    // Provider info
    const providerName = reservation.provider
      ? `${reservation.provider.first_name || ''} ${reservation.provider.last_name || ''}`.trim()
      : null;

    const result = await sendTemplateEmail({
      to: customer.email,
      subject: 'Rezervasyonunuz Onaylandı! 🎉',
      template: EMAIL_TEMPLATES.RESERVATION_APPROVED,
      data: {
        firstName: customer.first_name || 'Customer',
        serviceName,
        variantName,
        date: formattedDate,
        time: formattedTime,
        duration,
        providerName,
      },
      userId: customer.user_id,
    });

    console.log(`Sent reservation approved notification to ${customer.email}`);
    return result;
  } catch (error) {
    console.error('Error notifying customer of approved reservation:', error);
    throw error;
  }
}

/**
 * Notify customer that their reservation has been rejected
 * @param {Object} reservation - The reservation object with relations
 * @param {Object} customer - The customer who made the request
 * @param {string} [reason] - Optional rejection reason
 * @returns {Promise<Object>} Email send result
 */
async function notifyCustomerOfRejectedReservation(reservation, customer, reason = null) {
  try {
    if (!customer || !customer.email) {
      console.log('Cannot notify customer: no email address available');
      return null;
    }

    // Format date and time for display (Turkish locale and timezone)
    const startDate = new Date(reservation.start_time);
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/Istanbul' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' };
    const formattedDate = startDate.toLocaleDateString('tr-TR', dateOptions);
    const formattedTime = startDate.toLocaleTimeString('tr-TR', timeOptions);

    // Extract service and variant names from the reservation
    const serviceName = reservation.variant?.service?.name || 'Bilinmeyen Hizmet';
    const variantName = reservation.variant?.name || null;

    // Build booking URL using FRONTEND_URL environment variable
    const bookingUrl = process.env.FRONTEND_URL
      ? `${process.env.FRONTEND_URL}/reservation-request`
      : null;

    const result = await sendTemplateEmail({
      to: customer.email,
      subject: 'Rezervasyon Talebiniz Hakkında',
      template: EMAIL_TEMPLATES.RESERVATION_REJECTED,
      data: {
        firstName: customer.first_name || 'Customer',
        serviceName,
        variantName,
        date: formattedDate,
        time: formattedTime,
        reason,
        bookingUrl,
      },
      userId: customer.user_id,
    });

    console.log(`Sent reservation rejected notification to ${customer.email}`);
    return result;
  } catch (error) {
    console.error('Error notifying customer of rejected reservation:', error);
    throw error;
  }
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

  // Notification functions
  notifyAdminsOfPendingReservation,
  notifyCustomerOfApprovedReservation,
  notifyCustomerOfRejectedReservation,
};

