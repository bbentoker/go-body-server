const { ProviderServiceRelation, Provider, Service } = require('../models');

const defaultInclude = [
  {
    model: Provider,
    as: 'provider',
  },
  {
    model: Service,
    as: 'service',
  },
];

async function createProviderServiceRelation(payload) {
  return ProviderServiceRelation.create(payload);
}

async function getProviderServiceRelation(providerId, serviceId, options = {}) {
  return ProviderServiceRelation.findOne({
    where: {
      provider_id: providerId,
      service_id: serviceId,
    },
    include: options.includeRelations ? defaultInclude : undefined,
  });
}

async function getProviderServiceRelations(options = {}) {
  return ProviderServiceRelation.findAll({
    where: options.where,
    include: options.includeRelations ? defaultInclude : undefined,
    limit: options.limit,
    offset: options.offset,
    order: options.order,
  });
}

async function updateProviderServiceRelation(providerId, serviceId, updates) {
  const relation = await ProviderServiceRelation.findOne({
    where: {
      provider_id: providerId,
      service_id: serviceId,
    },
  });

  if (!relation) {
    return null;
  }

  const { provider_id, service_id, ...safeUpdates } = updates;
  await relation.update(safeUpdates);
  return relation;
}

async function deleteProviderServiceRelation(providerId, serviceId) {
  const deletedCount = await ProviderServiceRelation.destroy({
    where: {
      provider_id: providerId,
      service_id: serviceId,
    },
  });

  return deletedCount > 0;
}

module.exports = {
  createProviderServiceRelation,
  getProviderServiceRelation,
  getProviderServiceRelations,
  updateProviderServiceRelation,
  deleteProviderServiceRelation,
};

