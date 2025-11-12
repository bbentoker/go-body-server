const { ProviderRole, Provider } = require('../models');

const defaultProviderRoleInclude = [
  {
    model: Provider,
    as: 'providers',
  },
];

async function createProviderRole(payload) {
  return ProviderRole.create(payload);
}

async function getProviderRoleById(roleId, options = {}) {
  const includeProviders = options.includeProviders ?? options.includeProvider;
  return ProviderRole.findByPk(roleId, {
    include: includeProviders ? defaultProviderRoleInclude : undefined,
  });
}

async function getProviderRoles(options = {}) {
  const includeProviders = options.includeProviders ?? options.includeProvider;
  return ProviderRole.findAll({
    include: includeProviders ? defaultProviderRoleInclude : undefined,
    where: options.where,
    limit: options.limit,
    offset: options.offset,
    order: options.order,
  });
}

async function updateProviderRole(roleId, updates) {
  const role = await ProviderRole.findByPk(roleId);
  if (!role) {
    return null;
  }

  await role.update(updates);
  return role;
}

async function deleteProviderRole(roleId) {
  const deletedCount = await ProviderRole.destroy({
    where: { role_id: roleId },
  });

  return deletedCount > 0;
}

module.exports = {
  createProviderRole,
  getProviderRoleById,
  getProviderRoles,
  updateProviderRole,
  deleteProviderRole,
};


