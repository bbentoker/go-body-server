const { Provider, Service, Reservation } = require('../models');

const defaultProviderInclude = [
  {
    model: Service,
    as: 'services',
    through: { attributes: [] },
  },
  {
    model: Reservation,
    as: 'reservations',
  },
];

async function createProvider(payload) {
  return Provider.create(payload);
}

async function getProviderById(providerId, options = {}) {
  return Provider.findByPk(providerId, {
    include: options.includeRelations ? defaultProviderInclude : undefined,
  });
}

async function getProviders(options = {}) {
  return Provider.findAll({
    include: options.includeRelations ? defaultProviderInclude : undefined,
    where: options.where,
    limit: options.limit,
    offset: options.offset,
    order: options.order,
  });
}

async function updateProvider(providerId, updates) {
  const provider = await Provider.findByPk(providerId);
  if (!provider) {
    return null;
  }

  await provider.update(updates);
  return provider;
}

async function deleteProvider(providerId) {
  const deletedCount = await Provider.destroy({
    where: { provider_id: providerId },
  });

  return deletedCount > 0;
}

module.exports = {
  createProvider,
  getProviderById,
  getProviders,
  updateProvider,
  deleteProvider,
};

