const express = require('express');
const reservationController = require('../controllers/reservationController');
const { authenticateToken, authorizeUser } = require('../middleware/auth');

const router = express.Router();

// Get reservations by date range (index route)
router.get('/index', reservationController.getReservationsByDateRange);

// Get public reservations by date range (sanitized, no sensitive data)
router.get('/public', reservationController.getPublicReservationsByDateRange);

// Get pending reservations (optionally filtered by provider_id, user_id, or service_id)
router.get('/pending', reservationController.getPendingReservations);

// Get pending reservations count (optionally filtered by provider_id)
router.get('/pending/count', reservationController.getPendingReservationsCount);

// Approve a pending reservation
router.patch('/:id/approve', reservationController.approveReservation);

// Reject a pending reservation
router.patch('/:id/reject', reservationController.rejectReservation);

// Create a new reservation
router.post('/', reservationController.createReservation);

// Get all reservations (with optional filters)
router.get('/', reservationController.getReservations);

// Get all reservations for a specific user (protected route)
router.get('/user/:userId', authenticateToken, authorizeUser, reservationController.getUserReservations);

// Get a specific reservation by ID
router.get('/:id', reservationController.getReservationById);

// Update a reservation
router.put('/:id', reservationController.updateReservation);

// Delete a reservation
router.delete('/:id', reservationController.deleteReservation);

module.exports = router;

