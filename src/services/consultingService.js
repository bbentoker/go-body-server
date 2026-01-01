const { ConsultingRequest } = require('../models');
const emailService = require('./emailService');

/**
 * Create a new consulting request
 * @param {Object} data - Consulting request data
 * @returns {Promise<Object>} Created consulting request
 */
async function createConsultingRequest(data) {
    const { name, email, selectedAreas, message, timestamp } = data;

    // Create the request in the database
    const consultingRequest = await ConsultingRequest.create({
        name,
        email,
        selected_areas: selectedAreas,
        message,
        request_timestamp: timestamp ? new Date(timestamp) : new Date(),
    });

    // Notify admin via email
    try {
        await emailService.notifyAdminOfConsultingRequest(consultingRequest.get({ plain: true }));
    } catch (error) {
        console.error('Failed to send consulting request email:', error);
        // We don't throw here as the database record was already created
    }

    return consultingRequest.get({ plain: true });
}

module.exports = {
    createConsultingRequest,
};
