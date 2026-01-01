const contactService = require('../services/contactService');

/**
 * Handle new contact form submission
 */
async function createSubmission(req, res) {
    try {
        const { name, email, subject, message } = req.body;

        // Validate request body
        if (!name || typeof name !== 'string') {
            return res.status(400).json({ error: 'name is required' });
        }

        if (!email || typeof email !== 'string') {
            return res.status(400).json({ error: 'email is required' });
        }

        if (!subject || typeof subject !== 'string') {
            return res.status(400).json({ error: 'subject is required' });
        }

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'message is required' });
        }

        const submission = await contactService.createContactSubmission({
            name,
            email,
            subject,
            message,
        });

        res.status(201).json({
            message: 'Contact form submitted successfully',
            data: submission,
        });
    } catch (error) {
        console.error('Error in contactController.createSubmission:', error);
        res.status(500).json({ error: 'Failed to process contact form', details: error.message });
    }
}

module.exports = {
    createSubmission,
};
