const serviceCategoryService = require('../services/serviceCategoryService');

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function extractCategoryPayload(body, overrides = {}, options = {}) {
  const fields = ['name', 'description', 'is_active'];
  const { requiredFields = [], includeNull = true } = options;

  const raw = { ...body, ...overrides };
  const payload = {};

  fields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(raw, field)) {
      const value = raw[field];
      if (typeof value !== 'undefined' && (includeNull || value !== null)) {
        payload[field] = value;
      }
    }
  });

  const missingRequired = requiredFields.filter(
    (field) =>
      !Object.prototype.hasOwnProperty.call(payload, field) ||
      typeof payload[field] === 'undefined'
  );

  return { payload, missingRequired };
}

const createCategory = asyncHandler(async (req, res) => {
  const { payload, missingRequired } = extractCategoryPayload(
    req.body,
    {},
    {
      requiredFields: ['name'],
      includeNull: false,
    }
  );

  if (missingRequired.length > 0) {
    return res.status(400).json({
      message: `Missing required fields: ${missingRequired.join(', ')}`,
    });
  }

  const category = await serviceCategoryService.createCategory(payload);
  return res.status(201).json(category);
});

const listCategories = asyncHandler(async (req, res) => {
  const categories = await serviceCategoryService.getCategories();
  return res.json(categories);
});

const getCategoryById = asyncHandler(async (req, res) => {
  const category = await serviceCategoryService.getCategoryById(req.params.categoryId);

  if (!category) {
    return res.status(404).json({ message: 'Service category not found' });
  }

  return res.json(category);
});

const updateCategory = asyncHandler(async (req, res) => {
  const { payload } = extractCategoryPayload(req.body, {}, { includeNull: false });

  if (Object.keys(payload).length === 0) {
    return res.status(400).json({ message: 'No valid fields to update' });
  }

  const category = await serviceCategoryService.updateCategory(req.params.categoryId, payload);

  if (!category) {
    return res.status(404).json({ message: 'Service category not found' });
  }

  return res.json(category);
});

const deleteCategory = asyncHandler(async (req, res) => {
  const deleted = await serviceCategoryService.deleteCategory(req.params.categoryId);

  if (!deleted) {
    return res.status(404).json({ message: 'Service category not found' });
  }

  return res.status(204).send();
});

module.exports = {
  createCategory,
  listCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
