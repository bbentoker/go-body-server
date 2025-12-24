const { ServiceCategory } = require('../models');

async function createCategory(payload) {
  return ServiceCategory.create(payload);
}

async function getCategoryById(categoryId) {
  return ServiceCategory.findByPk(categoryId);
}

async function getCategories(options = {}) {
  return ServiceCategory.findAll({
    where: options.where,
    limit: options.limit,
    offset: options.offset,
    order: options.order,
  });
}

async function updateCategory(categoryId, updates) {
  const category = await ServiceCategory.findByPk(categoryId);
  if (!category) {
    return null;
  }

  await category.update(updates);
  return category;
}

async function deleteCategory(categoryId) {
  const deletedCount = await ServiceCategory.destroy({
    where: { service_category_id: categoryId },
  });

  return deletedCount > 0;
}

module.exports = {
  createCategory,
  getCategoryById,
  getCategories,
  updateCategory,
  deleteCategory,
};
