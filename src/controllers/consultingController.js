const consultingService = require('../services/consultingService');

/**
 * Handle new consulting request
 */
async function createRequest(req, res) {
    try {
        const { selectedAreas, message, name, email, timestamp } = req.body;

        // Validate request body
        if (!selectedAreas || !Array.isArray(selectedAreas) || selectedAreas.length === 0) {
            return res.status(400).json({ error: 'selectedAreas is required and must be a non-empty array' });
        }

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'message is required' });
        }

        if (!name || typeof name !== 'string') {
            return res.status(400).json({ error: 'name is required' });
        }

        if (!email || typeof email !== 'string') {
            return res.status(400).json({ error: 'email is required' });
        }

        const request = await consultingService.createConsultingRequest({
            selectedAreas,
            message,
            name,
            email,
            timestamp,
        });

        res.status(201).json({
            message: 'Consulting request received successfully',
            data: request,
        });
    } catch (error) {
        console.error('Error in consultingController.createRequest:', error);
        res.status(500).json({ error: 'Failed to process consulting request', details: error.message });
    }
}

module.exports = {
    createRequest,
};
