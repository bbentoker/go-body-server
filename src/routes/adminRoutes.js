const express = require('express');
const languageController = require('../controllers/languageController');
const serviceController = require('../controllers/serviceController');
const packageController = require('../controllers/packageController');
const decisionTreeController = require('../controllers/decisionTreeController');
const { authenticateToken, authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication and admin privileges
router.use(authenticateToken);
router.use(authenticateAdmin);

// Route for admins to update their own language preference
router.patch('/language', languageController.updateProviderLanguagePreference);

// Service management
router.get('/services', serviceController.listServices);
router.post('/services', serviceController.createService);
router.get('/services/:serviceId', serviceController.getServiceById);
router.put('/services/:serviceId', serviceController.updateService);
router.delete('/services/:serviceId', serviceController.deleteService);

// Service variant management
router.post('/services/:serviceId/variants', serviceController.createServiceVariant);
router.get('/services/:serviceId/variants', serviceController.listServiceVariants);
router.get('/service-variants/:variantId', serviceController.getServiceVariantById);
router.put('/service-variants/:variantId', serviceController.updateServiceVariant);
router.delete('/service-variants/:variantId', serviceController.deleteServiceVariant);

// Package management
router.post('/packages', packageController.createPackage);
router.get('/packages', packageController.listPackages);
router.get('/packages/:packageId', packageController.getPackageById);
router.put('/packages/:packageId', packageController.updatePackage);
router.delete('/packages/:packageId', packageController.deletePackage);

// Decision tree management
router.post('/decision-trees', decisionTreeController.createDecisionTree);
router.get('/decision-trees', decisionTreeController.listDecisionTrees);
router.get('/decision-trees/:treeId', decisionTreeController.getDecisionTreeById);
router.get('/decision-trees/:treeId/submissions', decisionTreeController.getTreeSubmissions);

module.exports = router;

