const express = require('express');
const userController = require('../controllers/userController');
const reservationController = require('../controllers/reservationController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Route for authenticated users to update their own profile
router.put('/profile', authenticateToken, userController.updateOwnProfile);

// Route for getting public reservations by date range (for viewing availability)
// This helps users see existing reservations and services to choose available time slots
router.get('/reservations', reservationController.getPublicReservationsByDateRange);

// Route for authenticated users to get their own reservations (all statuses)
router.get('/my-reservations', authenticateToken, reservationController.getMyReservations);

// Route for authenticated users to create a reservation request (pending status)
router.post('/reservation-request', authenticateToken, reservationController.createReservationRequest);

module.exports = router;

