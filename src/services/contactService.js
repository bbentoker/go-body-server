const { ContactSubmission } = require('../models');
const emailService = require('./emailService');

/**
 * Create a new contact submission
 * @param {Object} data - Contact form data
 * @returns {Promise<Object>} Created contact submission
 */
async function createContactSubmission(data) {
    const { name, email, subject, message } = data;

    // Create the submission in the database
    const contactSubmission = await ContactSubmission.create({
        name,
        email,
        subject,
        message,
    });

    // Notify admin via email
    try {
        await emailService.notifyAdminOfContactSubmission(contactSubmission.get({ plain: true }));
    } catch (error) {
        console.error('Failed to send contact submission email:', error);
        // We don't throw here as the database record was already created
    }

    return contactSubmission.get({ plain: true });
}

module.exports = {
    createContactSubmission,
};
