const express = require('express');
const userController = require('../controllers/userController');
const reservationController = require('../controllers/reservationController');
const languageController = require('../controllers/languageController');
const countryController = require('../controllers/countryController');
const blogController = require('../controllers/blogController');
const serviceController = require('../controllers/serviceController');
const decisionTreeController = require('../controllers/decisionTreeController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Route for authenticated users to get their own profile
router.get('/profile', authenticateToken, userController.getOwnProfile);

// Route for authenticated users to update their own profile
router.put('/profile', authenticateToken, userController.updateOwnProfile);

// Route for authenticated users to update their language preference
router.patch('/language', authenticateToken, userController.updateLanguagePreference);

// Route for getting available languages (no authentication required)
router.get('/languages', languageController.getActiveLanguages);

// Route for getting countries list (no authentication required)
router.get('/countries', countryController.getCountriesList);

// Route for getting public reservations by date range (for viewing availability)
// This helps users see existing reservations and services to choose available time slots
router.get('/reservations', reservationController.getPublicReservationsByDateRange);

// Route for authenticated users to get their own reservations (all statuses)
router.get('/my-reservations', authenticateToken, reservationController.getMyReservations);

// Route for authenticated users to create a reservation request (pending status)
router.post('/reservation-request', authenticateToken, reservationController.createReservationRequest);

// Route for getting published blogs (public)
router.get('/blogs', blogController.listPublishedBlogs);

// Route for getting available services/products without price (public)
router.get('/services', serviceController.listServicesWithoutPrice);

// Decision tree routes
router.get('/decision-tree', decisionTreeController.getLatestDecisionTree);
router.post('/decision-tree-submission', authenticateToken, decisionTreeController.createSubmission);
router.get('/my-decision-tree-submissions', authenticateToken, decisionTreeController.getMySubmissions);

module.exports = router;

