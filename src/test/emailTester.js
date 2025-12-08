/**
 * Email Service Tester (Standalone)
 * 
 * Run this file directly to test the email sending via Resend:
 *   node src/test/emailTester.js
 * 
 * Required environment variables:
 *   - RESEND_KEY: Your Resend API key
 *   - TEST_MAIL: Email address to send test emails to
 *   - GO_BODY_MAIL_ADDRESS: Sender email address (e.g., "Go Body <noreply@go-body.co>")
 */

require('dotenv').config();

const { Resend } = require('resend');

// Initialize Resend client
const resend = new Resend(process.env.RESEND_KEY);

// Validate required environment variables
function validateEnv() {
  const required = ['RESEND_KEY', 'TEST_MAIL', 'GO_BODY_MAIL_ADDRESS'];
  const missing = required.filter((key) => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach((key) => console.error(`   - ${key}`));
    process.exit(1);
  }
  
  console.log('✅ Environment variables validated');
  console.log(`   From: ${process.env.GO_BODY_MAIL_ADDRESS}`);
  console.log(`   To: ${process.env.TEST_MAIL}`);
  console.log('');
}

// HTML Template generator (mirrors the emailService templates)
function generateHtml(title, content) {
  return `
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
        .test-badge { background: #FEF3C7; color: #92400E; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <span class="test-badge">🧪 TEST EMAIL</span>
          <h1>Go Body</h1>
        </div>
        <div class="content">
          <h2>${title}</h2>
          ${content}
          <p style="margin-top: 30px; padding: 15px; background: #F3F4F6; border-radius: 8px; font-size: 13px;">
            <strong>Debug Info:</strong><br>
            Sent at: ${new Date().toISOString()}<br>
            From: ${process.env.GO_BODY_MAIL_ADDRESS}<br>
            To: ${process.env.TEST_MAIL}
          </p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Go Body. All rights reserved.</p>
          <p>This is a test email from the email service tester.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Test 1: Send a simple raw email
async function testRawEmail() {
  console.log('📧 Test 1: Sending raw email...');
  
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.GO_BODY_MAIL_ADDRESS,
      to: process.env.TEST_MAIL,
      subject: '🧪 Test Email - Raw HTML',
      html: generateHtml(
        'Raw Email Test',
        `<p>This is a <strong>raw HTML email</strong> sent from the Go Body email service tester.</p>
         <p>If you're seeing this, the Resend integration is working correctly! ✅</p>`
      ),
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    console.log('   ✅ Raw email sent successfully!');
    console.log(`   Resend ID: ${data.id}`);
    return data;
  } catch (error) {
    console.error('   ❌ Failed to send raw email:', error.message);
    throw error;
  }
}

// Test 2: Send a welcome template style email
async function testWelcomeTemplate() {
  console.log('📧 Test 2: Sending welcome template email...');
  
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.GO_BODY_MAIL_ADDRESS,
      to: process.env.TEST_MAIL,
      subject: '🧪 Test Email - Welcome Template',
      html: generateHtml(
        'Welcome to Go Body, Test User!',
        `<p>We're excited to have you on board. Your account has been created successfully.</p>
         <p>You can now book appointments and explore our services.</p>
         <a href="https://go-body.co/verify?token=test-token-123" class="button">Verify Your Email</a>
         <p>If you have any questions, feel free to reach out to our support team.</p>`
      ),
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    console.log('   ✅ Welcome template email sent successfully!');
    console.log(`   Resend ID: ${data.id}`);
    return data;
  } catch (error) {
    console.error('   ❌ Failed to send welcome template:', error.message);
    throw error;
  }
}

// Test 3: Send a password reset style email
async function testPasswordResetTemplate() {
  console.log('📧 Test 3: Sending password reset template email...');
  
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.GO_BODY_MAIL_ADDRESS,
      to: process.env.TEST_MAIL,
      subject: '🧪 Test Email - Password Reset Template',
      html: generateHtml(
        'Password Reset Request',
        `<p>Hi Test User,</p>
         <p>We received a request to reset your password. Click the button below to set a new password:</p>
         <a href="https://go-body.co/reset?token=reset-token-456" class="button">Reset Password</a>
         <p>This link will expire in 1 hour.</p>
         <p>If you didn't request this, you can safely ignore this email.</p>`
      ),
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    console.log('   ✅ Password reset template email sent successfully!');
    console.log(`   Resend ID: ${data.id}`);
    return data;
  } catch (error) {
    console.error('   ❌ Failed to send password reset template:', error.message);
    throw error;
  }
}

// Test 4: Send a reservation confirmation style email
async function testReservationTemplate() {
  console.log('📧 Test 4: Sending reservation confirmation template email...');
  
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.GO_BODY_MAIL_ADDRESS,
      to: process.env.TEST_MAIL,
      subject: '🧪 Test Email - Reservation Confirmation Template',
      html: generateHtml(
        'Reservation Confirmed! ✅',
        `<p>Hi Test User,</p>
         <p>Your reservation has been confirmed:</p>
         <ul style="background: #F9FAFB; padding: 20px 20px 20px 40px; border-radius: 8px;">
           <li><strong>Service:</strong> Deep Tissue Massage</li>
           <li><strong>Date:</strong> December 15, 2025</li>
           <li><strong>Time:</strong> 14:00</li>
           <li><strong>Duration:</strong> 60 minutes</li>
           <li><strong>Provider:</strong> Jane Smith</li>
         </ul>
         <p>We look forward to seeing you!</p>`
      ),
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    console.log('   ✅ Reservation confirmation template email sent successfully!');
    console.log(`   Resend ID: ${data.id}`);
    return data;
  } catch (error) {
    console.error('   ❌ Failed to send reservation confirmation template:', error.message);
    throw error;
  }
}

// Main test runner
async function runTests() {
  console.log('');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║       Go Body Email Service Tester         ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('');
  
  validateEnv();
  
  const results = {
    passed: 0,
    failed: 0,
    emails: [],
  };
  
  const tests = [
    { name: 'Raw Email', fn: testRawEmail },
    { name: 'Welcome Template', fn: testWelcomeTemplate },
    { name: 'Password Reset Template', fn: testPasswordResetTemplate },
    { name: 'Reservation Confirmation', fn: testReservationTemplate },
  ];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.passed++;
      results.emails.push({ test: test.name, resend_id: result.id, status: 'success' });
    } catch (error) {
      results.failed++;
      results.emails.push({ test: test.name, error: error.message, status: 'failed' });
    }
    console.log('');
  }
  
  // Summary
  console.log('╔════════════════════════════════════════════╗');
  console.log('║                  Summary                   ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log('');
  console.log('   Sent Emails:');
  results.emails.forEach((email) => {
    if (email.status === 'success') {
      console.log(`   • ${email.test}: ${email.resend_id}`);
    } else {
      console.log(`   • ${email.test}: FAILED - ${email.error}`);
    }
  });
  console.log('');
  console.log('📬 Check your inbox at:', process.env.TEST_MAIL);
  console.log('');
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
