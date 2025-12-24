const { Service, ServiceVariant, ServiceCategory, User } = require('../models');

const providerInclude = {
  model: User,
  as: 'providers',
  through: { attributes: [] },
};

const variantInclude = {
  model: ServiceVariant,
  as: 'variants',
};

const categoryInclude = {
  model: ServiceCategory,
  as: 'category',
};

function buildInclude(options = {}) {
  const include = [];

  if (options.includeProviders) {
    include.push(providerInclude);
  }

  if (options.includeVariants) {
    include.push(variantInclude);
  }

  if (options.includeCategory) {
    include.push(categoryInclude);
  }

  return include.length > 0 ? include : undefined;
}

async function createService(payload) {
  return Service.create(payload);
}

async function getServiceById(serviceId, options = {}) {
  return Service.findByPk(serviceId, {
    include: buildInclude(options),
  });
}

async function getServices(options = {}) {
  return Service.findAll({
    include: buildInclude(options),
    where: options.where,
    limit: options.limit,
    offset: options.offset,
    order: options.order,
  });
}

async function updateService(serviceId, updates) {
  const service = await Service.findByPk(serviceId);
  if (!service) {
    return null;
  }

  await service.update(updates);
  return service;
}

async function deleteService(serviceId) {
  const deletedCount = await Service.destroy({
    where: { service_id: serviceId },
  });

  return deletedCount > 0;
}

module.exports = {
  createService,
  getServiceById,
  getServices,
  updateService,
  deleteService,
};

