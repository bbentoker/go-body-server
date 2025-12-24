const express = require('express');

const serviceCategoryController = require('../controllers/serviceCategoryController');

const router = express.Router();

router.post('/', serviceCategoryController.createCategory);
router.get('/', serviceCategoryController.listCategories);
router.get('/:categoryId', serviceCategoryController.getCategoryById);
router.put('/:categoryId', serviceCategoryController.updateCategory);
router.delete('/:categoryId', serviceCategoryController.deleteCategory);

module.exports = router;
