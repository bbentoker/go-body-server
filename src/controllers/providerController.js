const providerService = require('../services/providerService');
const providerRoleService = require('../services/providerRoleService');

const ADMIN_ROLE_ID = Number.parseInt(process.env.ADMIN_ROLE_ID || '1', 10);
const WORKER_ROLE_ID = Number.parseInt(process.env.WORKER_ROLE_ID || '2', 10);
const ADMIN_ROLE_NAME = process.env.ADMIN_ROLE_NAME || 'admin';
const WORKER_ROLE_NAME = process.env.WORKER_ROLE_NAME || 'worker';

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function parseIncludeRelations(req) {
  return req.query.includeRelations === 'true' || req.query.includeRelations === '1';
}

function extractProviderPayload(body, overrides = {}, options = {}) {
  const fields = [
    'first_name',
    'last_name',
    'email',
    'phone_number',
    'password',
    'title',
    'bio',
    'role_id',
    'is_active',
  ];

  const {
    requiredFields = [],
    includeNull = true,
  } = options;

  const raw = { ...body, ...overrides };
  const payload = {};

  fields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(raw, field)) {
      const value = raw[field];
      if (typeof value !== 'undefined' && (includeNull || value !== null)) {
        payload[field] = value;
      }
    }
  });

  const missingRequired = requiredFields.filter(
    (field) =>
      !Object.prototype.hasOwnProperty.call(payload, field) ||
      typeof payload[field] === 'undefined'
  );

  return { payload, missingRequired };
}

async function ensureRoleExists(roleId, defaults) {
  if (!roleId) {
    return null;
  }

  const existingRole = await providerRoleService.getProviderRoleById(roleId);
  if (existingRole) {
    return existingRole;
  }

  if (!defaults) {
    return null;
  }

  return providerRoleService.createProviderRole({
    role_id: roleId,
    ...defaults,
  });
}

const createAdminProvider = asyncHandler(async (req, res) => {
  await ensureRoleExists(ADMIN_ROLE_ID, {
    role_name: ADMIN_ROLE_NAME,
    description: 'Administrative provider role with elevated privileges',
  });

  const { payload, missingRequired } = extractProviderPayload(
    req.body,
    { role_id: ADMIN_ROLE_ID },
    { requiredFields: ['first_name', 'last_name', 'email', 'password'], includeNull: false }
  );

  if (missingRequired.length > 0) {
    return res.status(400).json({
      message: `Missing required fields: ${missingRequired.join(', ')}`,
    });
  }

  const provider = await providerService.createProvider(payload);
  return res.status(201).json(provider);
});

const createWorkerProvider = asyncHandler(async (req, res) => {
  await ensureRoleExists(WORKER_ROLE_ID, {
    role_name: WORKER_ROLE_NAME,
    description: 'Standard provider role',
  });

  const { payload, missingRequired } = extractProviderPayload(
    req.body,
    { role_id: WORKER_ROLE_ID },
    { requiredFields: ['first_name', 'last_name', 'email', 'password'], includeNull: false }
  );
  
  if (missingRequired.length > 0) {
    return res.status(400).json({
      message: `Missing required fields: ${missingRequired.join(', ')}`,
    });
  }
  const provider = await providerService.createProvider(payload);
  return res.status(201).json(provider);
});

const loginAdminProvider = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const provider = await providerService.authenticateProvider(email, password, ADMIN_ROLE_ID);
  if (!provider) {
    return res.status(401).json({ message: 'Invalid admin credentials' });
  }

  return res.json(provider);
});

const loginWorkerProvider = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const provider = await providerService.authenticateProvider(email, password, WORKER_ROLE_ID);
  if (!provider) {
    return res.status(401).json({ message: 'Invalid worker credentials' });
  }

  return res.json(provider);
});

const createProvider = asyncHandler(async (req, res) => {
  const { payload, missingRequired } = extractProviderPayload(
    req.body,
    {},
    {
      requiredFields: ['first_name', 'last_name', 'email', 'role_id'],
      includeNull: false,
    }
  );

  if (missingRequired.length > 0) {
    return res.status(400).json({
      message: `Missing required fields: ${missingRequired.join(', ')}`,
    });
  }

  const targetRole = await ensureRoleExists(payload.role_id);
  if (!targetRole) {
    return res.status(400).json({ message: `Role with id ${payload.role_id} does not exist` });
  }

  const provider = await providerService.createProvider(payload);
  return res.status(201).json(provider);
});

const listProviders = asyncHandler(async (req, res) => {
  const includeRelations = parseIncludeRelations(req);
  const providers = await providerService.getProviders({ includeRelations });
  return res.json(providers);
});

const getProviderById = asyncHandler(async (req, res) => {
  const includeRelations = parseIncludeRelations(req);
  const provider = await providerService.getProviderById(req.params.providerId, {
    includeRelations,
  });

  if (!provider) {
    return res.status(404).json({ message: 'Provider not found' });
  }

  return res.json(provider);
});

const updateProvider = asyncHandler(async (req, res) => {
  const { payload } = extractProviderPayload(req.body, {}, { includeNull: false });

  if (Object.prototype.hasOwnProperty.call(payload, 'role_id')) {
    const targetRole = await ensureRoleExists(payload.role_id);
    if (!targetRole) {
      return res.status(400).json({ message: `Role with id ${payload.role_id} does not exist` });
    }
  }
  
  const provider = await providerService.updateProvider(req.params.providerId, payload);

  if (!provider) {
    return res.status(404).json({ message: 'Provider not found' });
  }

  return res.json(provider);
});

const deleteProvider = asyncHandler(async (req, res) => {
  const deleted = await providerService.deleteProvider(req.params.providerId);

  if (!deleted) {
    return res.status(404).json({ message: 'Provider not found' });
  }

  return res.status(204).send();
});

module.exports = {
  createAdminProvider,
  createWorkerProvider,
  loginAdminProvider,
  loginWorkerProvider,
  createProvider,
  listProviders,
  getProviderById,
  updateProvider,
  deleteProvider,
};


