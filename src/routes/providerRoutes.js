const express = require('express');

const providerController = require('../controllers/providerController');

const router = express.Router();

router.post('/admin', providerController.createAdminProvider);
router.post('/worker', providerController.createWorkerProvider);
router.post('/admin/login', providerController.loginAdminProvider);
router.post('/worker/login', providerController.loginWorkerProvider);

router.post('/', providerController.createProvider);
router.get('/', providerController.listProviders);
router.get('/:providerId', providerController.getProviderById);
router.put('/:providerId', providerController.updateProvider);
router.delete('/:providerId', providerController.deleteProvider);

module.exports = router;

