const { Provider, Service, Reservation, ProviderRole } = require('../models');
const encryptor = require('./encryptor');

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
  {
    model: ProviderRole,
    as: 'role',
  },
];

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
    const provider = await Provider.create(providerData);
    return sanitizeProvider(provider);
  }
  catch(error){
    console.error("Error creating provider", error);
    throw error;
  }
}

async function getProviderById(providerId, options = {}) {
  try {
    const provider = await Provider.findByPk(providerId, {
      include: options.includeRelations ? defaultProviderInclude : undefined,
    });

    return sanitizeProvider(provider);
  } catch (error) {
    console.error('Error in getProviderById service:', error);
    throw error;
  }
}

async function getProviders(options = {}) {
  try {
    const providers = await Provider.findAll({
      include: options.includeRelations ? defaultProviderInclude : undefined,
      where: options.where,
      limit: options.limit,
      offset: options.offset,
      order: options.order,
    });

    return providers.map(sanitizeProvider);
  } catch (error) {
    console.error('Error in getProviders service:', error);
    throw error;
  }
}

async function updateProvider(providerId, updates) {
  try {
    const provider = await Provider.findByPk(providerId);
    if (!provider) {
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
    const deletedCount = await Provider.destroy({
      where: { provider_id: providerId },
    });

    return deletedCount > 0;
  } catch (error) {
    console.error('Error in deleteProvider service:', error);
    throw error;
  }
}

async function getProviderByEmail(email, options = {}) {
  try {
    const provider = await Provider.findOne({
      where: { email },
      include: options.includeRelations ? defaultProviderInclude : undefined,
    });

    return sanitizeProvider(provider);
  } catch (error) {
    console.error('Error in getProviderByEmail service:', error);
    throw error;
  }
}

async function authenticateProvider(email, password, roleId) {
  try {
    const provider = await Provider.findOne({
      where: {
        email,
        ...(roleId ? { role_id: roleId } : {}),
      }
    });

    if (!provider || !provider.password_hash) {
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
};

