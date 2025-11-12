const providerService = require('../services/providerService');
const userService = require('../services/userService');
const authService = require('../services/authService');
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

const loginAdminProvider = asyncHandler(async (req, res) => {
  await ensureRoleExists(ADMIN_ROLE_ID, {
    role_name: ADMIN_ROLE_NAME,
    description: 'Administrative provider role with elevated privileges',
  });

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const provider = await providerService.authenticateProvider(email, password, ADMIN_ROLE_ID);
  if (!provider) {
    return res.status(401).json({ message: 'Invalid admin credentials' });
  }

  const tokens = await authService.generateTokenPair(provider, 'provider');
  
  return res.json({
    provider,
    ...tokens,
  });
});

const loginWorkerProvider = asyncHandler(async (req, res) => {
  await ensureRoleExists(WORKER_ROLE_ID, {
    role_name: WORKER_ROLE_NAME,
    description: 'Standard provider role',
  });

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const provider = await providerService.authenticateProvider(email, password, WORKER_ROLE_ID);
  if (!provider) {
    return res.status(401).json({ message: 'Invalid worker credentials' });
  }

  const tokens = await authService.generateTokenPair(provider, 'provider');
  
  return res.json({
    provider,
    ...tokens,
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await userService.authenticateUser(email, password);
  if (!user) {
    return res.status(401).json({ message: 'Invalid user credentials' });
  }

  const tokens = await authService.generateTokenPair(user, 'user');
  
  return res.json({
    user,
    ...tokens,
  });
});

const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }

  const tokens = await authService.refreshAccessToken(refreshToken);
  
  if (!tokens) {
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }

  return res.json(tokens);
});

const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }
  const revoked = await authService.revokeRefreshToken(refreshToken);
  
  if (!revoked) {
    return res.status(404).json({ message: 'Token not found or already revoked' });
  }

  return res.json({ message: 'Logged out successfully' });
});

const logoutAll = asyncHandler(async (req, res) => {
  const { userId, type } = req.body;
  
  if (!userId || !type) {
    return res.status(400).json({ message: 'userId and type (user/provider) are required' });
  }

  if (type !== 'user' && type !== 'provider') {
    return res.status(400).json({ message: 'type must be either "user" or "provider"' });
  }

  await authService.revokeAllUserTokens(userId, type);
  
  return res.json({ message: 'All sessions logged out successfully' });
});

module.exports = {
  loginAdminProvider,
  loginWorkerProvider,
  loginUser,
  refreshToken,
  logout,
  logoutAll,
};

