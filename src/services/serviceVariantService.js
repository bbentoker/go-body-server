const { ServiceVariant, Service } = require('../models');

const serviceInclude = {
  model: Service,
  as: 'service',
};

function buildInclude(options = {}) {
  const include = [];

  if (options.includeService) {
    include.push(serviceInclude);
  }

  return include.length > 0 ? include : undefined;
}

async function createVariant(serviceId, payload) {
  return ServiceVariant.create({
    ...payload,
    service_id: serviceId,
  });
}

async function getVariantById(variantId, options = {}) {
  return ServiceVariant.findByPk(variantId, {
    include: buildInclude(options),
  });
}

async function getVariants(options = {}) {
  return ServiceVariant.findAll({
    where: options.where,
    include: buildInclude(options),
    limit: options.limit,
    offset: options.offset,
    order: options.order,
  });
}

async function getVariantsByService(serviceId, options = {}) {
  return ServiceVariant.findAll({
    where: {
      service_id: serviceId,
      ...options.where,
    },
    include: buildInclude(options),
    limit: options.limit,
    offset: options.offset,
    order: options.order,
  });
}

async function updateVariant(variantId, updates) {
  const variant = await ServiceVariant.findByPk(variantId);
  if (!variant) {
    return null;
  }

  await variant.update(updates);
  return variant;
}

async function deleteVariant(variantId) {
  const deletedCount = await ServiceVariant.destroy({
    where: { variant_id: variantId },
  });

  return deletedCount > 0;
}

module.exports = {
  createVariant,
  getVariantById,
  getVariants,
  getVariantsByService,
  updateVariant,
  deleteVariant,
};
