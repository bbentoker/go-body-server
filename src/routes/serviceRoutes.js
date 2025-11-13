const express = require('express');

const serviceController = require('../controllers/serviceController');

const router = express.Router();

router.post('/', serviceController.createService);
router.get('/', serviceController.listServices);
router.get('/:serviceId', serviceController.getServiceById);
router.put('/:serviceId', serviceController.updateService);
router.delete('/:serviceId', serviceController.deleteService);

module.exports = router;

