const { Service, Provider } = require('../models');

const defaultServiceInclude = [
  {
    model: Provider,
    as: 'providers',
    through: { attributes: [] },
  },
];

async function createService(payload) {
  return Service.create(payload);
}

async function getServiceById(serviceId, options = {}) {
  return Service.findByPk(serviceId, {
    include: options.includeProviders ? defaultServiceInclude : undefined,
  });
}

async function getServices(options = {}) {
  return Service.findAll({
    include: options.includeProviders ? defaultServiceInclude : undefined,
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

