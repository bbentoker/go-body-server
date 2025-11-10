const { User, Reservation } = require('../models');

const defaultUserInclude = [
  {
    model: Reservation,
    as: 'reservations',
  },
];

async function createUser(payload) {
  return User.create(payload);
}

async function getUserById(userId, options = {}) {
  return User.findByPk(userId, {
    include: options.includeReservations ? defaultUserInclude : undefined,
  });
}

async function getUsers(options = {}) {
  return User.findAll({
    include: options.includeReservations ? defaultUserInclude : undefined,
    where: options.where,
    limit: options.limit,
    offset: options.offset,
    order: options.order,
  });
}

async function updateUser(userId, updates) {
  const user = await User.findByPk(userId);
  if (!user) {
    return null;
  }

  await user.update(updates);
  return user;
}

async function deleteUser(userId) {
  const deletedCount = await User.destroy({
    where: { user_id: userId },
  });

  return deletedCount > 0;
}

module.exports = {
  createUser,
  getUserById,
  getUsers,
  updateUser,
  deleteUser,
};

