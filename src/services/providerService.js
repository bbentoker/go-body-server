const { User, Service, Reservation, Role } = require('../models');
const encryptor = require('./encryptor');

const providerRoleAttributes = ['role_id', 'role_key', 'role_name', 'is_provider'];

const baseRoleInclude = {
  model: Role,
  as: 'role',
  attributes: providerRoleAttributes,
};

const defaultProviderInclude = [
  {
    model: Service,
    as: 'services',
    through: { attributes: [] },
  },
  {
    model: Reservation,
    as: 'provider_reservations',
  },
  baseRoleInclude,
];

function isProviderAccount(instance) {
  return Boolean(instance?.role?.is_provider);
}

function sanitizeProvider(providerInstance) {
  if (!providerInstance) {
    return null;
  }

  const provider = providerInstance.get
    ? providerInstance.get({ plain: true })
    : { ...providerInstance };

  if (provider.password_hash) {
    delete provider.password_hash;
  }

  if (provider.user_id && !provider.provider_id) {
    provider.provider_id = provider.user_id;
  }

  if (provider.provider_reservations && !provider.reservations) {
    provider.reservations = provider.provider_reservations;
    delete provider.provider_reservations;
  }

  return provider;
}

async function prepareProviderPayload(payload) {
  const providerData = { ...payload };
  if (Object.prototype.hasOwnProperty.call(providerData, 'password')) {
    if (providerData.password) {
      providerData.password_hash = await encryptor.hashPassword(providerData.password);
    }
    delete providerData.password;
  }
  
  Object.keys(providerData).forEach((key) => {
    if (typeof providerData[key] === 'undefined') {
      delete providerData[key];
    }
  });
  
  return providerData;
}

async function createProvider(payload) {
  try{
    const providerData = await prepareProviderPayload(payload);
    const provider = await User.create(providerData);
    return sanitizeProvider(provider);
  }
  catch(error){
    console.error("Error creating provider", error);
    throw error;
  }
}

async function getProviderById(providerId, options = {}) {
  try {
    const include = options.includeRelations ? defaultProviderInclude : [baseRoleInclude];
    const provider = await User.findOne({
      where: { user_id: providerId },
      include,
    });

    return isProviderAccount(provider) ? sanitizeProvider(provider) : null;
  } catch (error) {
    console.error('Error in getProviderById service:', error);
    throw error;
  }
}

async function getProviders(options = {}) {
  try {
    const include = options.includeRelations ? defaultProviderInclude : [baseRoleInclude];
    const providers = await User.findAll({
      include,
      where: options.where,
      limit: options.limit,
      offset: options.offset,
      order: options.order,
    });

    return providers.filter(isProviderAccount).map(sanitizeProvider);
  } catch (error) {
    console.error('Error in getProviders service:', error);
    throw error;
  }
}

async function updateProvider(providerId, updates) {
  try {
    const provider = await User.findByPk(providerId, { include: [baseRoleInclude] });
    if (!provider || !isProviderAccount(provider)) {
      return null;
    }

    const providerData = await prepareProviderPayload(updates);

    await provider.update(providerData);
    await provider.reload();
    return sanitizeProvider(provider);
  } catch (error) {
    console.error('Error in updateProvider service:', error);
    throw error;
  }
}

async function deleteProvider(providerId) {
  try {
    const deletedCount = await User.destroy({
      where: { user_id: providerId },
    });

    return deletedCount > 0;
  } catch (error) {
    console.error('Error in deleteProvider service:', error);
    throw error;
  }
}

async function getProviderByEmail(email, options = {}) {
  try {
    const include = options.includeRelations ? defaultProviderInclude : [baseRoleInclude];
    const provider = await User.findOne({
      where: { email },
      include,
    });

    return isProviderAccount(provider) ? sanitizeProvider(provider) : null;
  } catch (error) {
    console.error('Error in getProviderByEmail service:', error);
    throw error;
  }
}

async function resetProviderPasswordByEmail(email, newPassword) {
  try {
    const provider = await User.findOne({ where: { email }, include: [baseRoleInclude] });
    if (!provider || !isProviderAccount(provider)) {
      return null;
    }

    if (!newPassword || newPassword.length < 6) {
      const error = new Error('Password must be at least 6 characters long');
      error.statusCode = 400;
      throw error;
    }

    const password_hash = await encryptor.hashPassword(newPassword);
    await provider.update({ password_hash });

    return sanitizeProvider(provider);
  } catch (error) {
    console.error('Error in resetProviderPasswordByEmail service:', error);
    throw error;
  }
}

async function authenticateProvider(email, password, roleId) {
  try {
    const provider = await User.findOne({
      where: {
        email,
        ...(roleId ? { role_id: roleId } : {}),
      },
      include: [baseRoleInclude],
    });

    if (!isProviderAccount(provider) || !provider.password_hash) {
      return null;
    }

    const isValid = await encryptor.verifyPassword(password, provider.password_hash);
    if (!isValid) {
      return null;
    }

    return sanitizeProvider(provider);
  } catch (error) {
    console.error('Error in authenticateProvider service:', error);
    throw error;
  }
}

module.exports = {
  createProvider,
  getProviderById,
  getProviders,
  updateProvider,
  deleteProvider,
  getProviderByEmail,
  authenticateProvider,
  resetProviderPasswordByEmail,
};

