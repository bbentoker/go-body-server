const { User, Reservation, Language } = require('../models');
const encryptor = require('./encryptor');

const defaultUserInclude = [
  {
    model: Reservation,
    as: 'reservations',
  },
  {
    model: Language,
    as: 'language',
    attributes: ['language_id', 'code', 'name', 'native_name'],
  },
];

function sanitizeUser(userInstance) {
  if (!userInstance) {
    return null;
  }

  const user = userInstance.get
    ? userInstance.get({ plain: true })
    : { ...userInstance };

  if (user.password_hash) {
    delete user.password_hash;
  }

  return user;
}

async function prepareUserPayload(payload) {
  const userData = { ...payload };
  if (Object.prototype.hasOwnProperty.call(userData, 'password')) {
    if (userData.password) {
      userData.password_hash = await encryptor.hashPassword(userData.password);
    }
    delete userData.password;
  }
  
  Object.keys(userData).forEach((key) => {
    if (typeof userData[key] === 'undefined') {
      delete userData[key];
    }
  });
  
  return userData;
}

async function createUser(payload) {
  try {
    const userData = await prepareUserPayload(payload);
    const user = await User.create(userData);
    // Reload with language relation
    await user.reload({
      include: [
        {
          model: Language,
          as: 'language',
          attributes: ['language_id', 'code', 'name', 'native_name'],
        },
      ],
    });
    return sanitizeUser(user);
  } catch (error) {
    console.error('Error creating user', error);
    throw error;
  }
}

async function getUserById(userId, options = {}) {
  try {
    const user = await User.findByPk(userId, {
      include: options.includeReservations ? defaultUserInclude : undefined,
    });

    return sanitizeUser(user);
  } catch (error) {
    console.error('Error in getUserById service:', error);
    throw error;
  }
}

async function getUsers(options = {}) {
  try {
    const users = await User.findAll({
      include: options.includeReservations ? defaultUserInclude : undefined,
      where: options.where,
      limit: options.limit,
      offset: options.offset,
      order: options.order,
    });

    return users.map(sanitizeUser);
  } catch (error) {
    console.error('Error in getUsers service:', error);
    throw error;
  }
}

async function updateUser(userId, updates) {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return null;
    }

    const userData = await prepareUserPayload(updates);

    await user.update(userData);
    await user.reload({
      include: [
        {
          model: Language,
          as: 'language',
          attributes: ['language_id', 'code', 'name', 'native_name'],
        },
      ],
    });
    return sanitizeUser(user);
  } catch (error) {
    console.error('Error in updateUser service:', error);
    throw error;
  }
}

async function deleteUser(userId) {
  try {
    const deletedCount = await User.destroy({
      where: { user_id: userId },
    });

    return deletedCount > 0;
  } catch (error) {
    console.error('Error in deleteUser service:', error);
    throw error;
  }
}

async function getUserByEmail(email, options = {}) {
  try {
    const user = await User.findOne({
      where: { email },
      include: options.includeReservations ? defaultUserInclude : undefined,
    });

    return sanitizeUser(user);
  } catch (error) {
    console.error('Error in getUserByEmail service:', error);
    throw error;
  }
}

async function authenticateUser(email, password) {
  try {
    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: Language,
          as: 'language',
          attributes: ['language_id', 'code', 'name', 'native_name'],
        },
      ],
    });

    if (!user || !user.password_hash) {
      return null;
    }

    const isValid = await encryptor.verifyPassword(password, user.password_hash);
    if (!isValid) {
      return null;
    }

    return sanitizeUser(user);
  } catch (error) {
    console.error('Error in authenticateUser service:', error);
    throw error;
  }
}

async function resetUserPasswordByEmail(email, newPassword) {
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return null;
    }

    if (!newPassword || newPassword.length < 6) {
      const error = new Error('Password must be at least 6 characters long');
      error.statusCode = 400;
      throw error;
    }

    const password_hash = await encryptor.hashPassword(newPassword);
    await user.update({ password_hash });

    return sanitizeUser(user);
  } catch (error) {
    console.error('Error in resetUserPasswordByEmail service:', error);
    throw error;
  }
}

module.exports = {
  createUser,
  getUserById,
  getUsers,
  updateUser,
  deleteUser,
  getUserByEmail,
  authenticateUser,
  resetUserPasswordByEmail,
};

