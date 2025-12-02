const { Role, User } = require('../models');

const defaultRoleInclude = [
  {
    model: User,
    as: 'users',
    attributes: ['user_id', 'first_name', 'last_name', 'email', 'role_id'],
  },
];

async function createRole(payload) {
  return Role.create(payload);
}

async function getRoleById(roleId, options = {}) {
  const includeUsers = options.includeUsers ?? options.includeProviders;
  return Role.findByPk(roleId, {
    include: includeUsers ? defaultRoleInclude : undefined,
  });
}

async function getRoles(options = {}) {
  const includeUsers = options.includeUsers ?? options.includeProviders;
  return Role.findAll({
    include: includeUsers ? defaultRoleInclude : undefined,
    where: options.where,
    limit: options.limit,
    offset: options.offset,
    order: options.order,
  });
}

async function updateRole(roleId, updates) {
  const role = await Role.findByPk(roleId);
  if (!role) {
    return null;
  }

  await role.update(updates);
  return role;
}

async function deleteRole(roleId) {
  const deletedCount = await Role.destroy({
    where: { role_id: roleId },
  });

  return deletedCount > 0;
}

module.exports = {
  createRole,
  getRoleById,
  getRoles,
  updateRole,
  deleteRole,
};
