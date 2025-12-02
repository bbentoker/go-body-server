const providerService = require('../services/providerService');
const userService = require('../services/userService');
const authService = require('../services/authService');
const roleService = require('../services/providerRoleService');

const ADMIN_ROLE_ID = Number.parseInt(process.env.ADMIN_ROLE_ID || '1', 10);
const WORKER_ROLE_ID = Number.parseInt(process.env.WORKER_ROLE_ID || '2', 10);
const CUSTOMER_ROLE_ID = Number.parseInt(process.env.CUSTOMER_ROLE_ID || '3', 10);

const ADMIN_ROLE_KEY = process.env.ADMIN_ROLE_KEY || 'admin';
const WORKER_ROLE_KEY = process.env.WORKER_ROLE_KEY || 'worker';
const CUSTOMER_ROLE_KEY = process.env.CUSTOMER_ROLE_KEY || 'customer';

const ADMIN_ROLE_NAME = process.env.ADMIN_ROLE_NAME || 'Admin';
const WORKER_ROLE_NAME = process.env.WORKER_ROLE_NAME || 'Worker';
const CUSTOMER_ROLE_NAME = process.env.CUSTOMER_ROLE_NAME || 'Customer';

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

async function ensureRoleExists(roleId, defaults) {
  if (!roleId) {
    return null;
  }

  const existingRole = await roleService.getRoleById(roleId);
  if (existingRole) {
    return existingRole;
  }

  if (!defaults) {
    return null;
  }

  return roleService.createRole({
    role_id: roleId,
    ...defaults,
  });
}

const loginAdminProvider = asyncHandler(async (req, res) => {
  await ensureRoleExists(ADMIN_ROLE_ID, {
    role_key: ADMIN_ROLE_KEY,
    role_name: ADMIN_ROLE_NAME,
    description: 'Administrative role with elevated privileges',
    is_provider: true,
  });
  
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const provider = await userService.authenticateUser(email, password, { roleIds: [ADMIN_ROLE_ID] });
  if (!provider || !provider.role?.is_provider) {
    return res.status(401).json({ message: 'Invalid admin credentials' });
  }

  const tokens = await authService.generateTokenPair(provider);
  
  return res.json({
    user: provider,
    ...tokens,
  });
});

const loginWorkerProvider = asyncHandler(async (req, res) => {
  await ensureRoleExists(WORKER_ROLE_ID, {
    role_key: WORKER_ROLE_KEY,
    role_name: WORKER_ROLE_NAME,
    description: 'Standard provider role',
    is_provider: true,
  });

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const provider = await userService.authenticateUser(email, password, { roleIds: [WORKER_ROLE_ID] });
  if (!provider || !provider.role?.is_provider) {
    return res.status(401).json({ message: 'Invalid worker credentials' });
  }

  const tokens = await authService.generateTokenPair(provider);
  
  return res.json({
    user: provider,
    ...tokens,
  });
});

const registerUser = asyncHandler(async (req, res) => {
  const { first_name, last_name, email, password, phone_number, language_id } = req.body;

  await ensureRoleExists(CUSTOMER_ROLE_ID, {
    role_key: CUSTOMER_ROLE_KEY,
    role_name: CUSTOMER_ROLE_NAME,
    description: 'Standard customer account',
    is_provider: false,
  });

  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ 
      message: 'First name, last name, email, and password are required' 
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  if (password.length < 6) {
    return res.status(400).json({ 
      message: 'Password must be at least 6 characters long' 
    });
  }

  const existingUser = await userService.getUserByEmail(email);
  if (existingUser) {
    return res.status(409).json({ message: 'User with this email already exists' });
  }

  const userData = {
    first_name,
    last_name,
    email,
    password,
    phone_number,
    language_id: language_id || 4,
    role_id: CUSTOMER_ROLE_ID,
    is_verified: false,
  };

  const user = await userService.createUser(userData);
  
  if (!user) {
    return res.status(500).json({ message: 'Failed to create user' });
  }

  const tokens = await authService.generateTokenPair(user);
  
  return res.status(201).json({
    message: 'User registered successfully',
    user,
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
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const tokens = await authService.generateTokenPair(user);
  
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
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ message: 'userId is required' });
  }
  
  await authService.revokeAllUserTokens(userId);
  
  return res.json({ message: 'All sessions logged out successfully' });
});

const resetUserPassword = asyncHandler(async (req, res) => {
  const { email, new_password } = req.body;

  if (!email || !new_password) {
    return res.status(400).json({ message: 'Email and new_password are required' });
  }

  if (String(new_password).length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  const user = await userService.resetUserPasswordByEmail(email, new_password);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.json({ message: 'Password reset successfully' });
});

const resetProviderPassword = asyncHandler(async (req, res) => {
  const { email, new_password } = req.body;

  if (!email || !new_password) {
    return res.status(400).json({ message: 'Email and new_password are required' });
  }

  if (String(new_password).length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  const provider = await providerService.resetProviderPasswordByEmail(email, new_password);
  if (!provider) {
    return res.status(404).json({ message: 'Provider not found' });
  }

  return res.json({ message: 'Password reset successfully' });
});

module.exports = {
  registerUser,
  loginUser,
  refreshToken,
  logout,
  logoutAll,
  resetUserPassword,
  resetProviderPassword,
};
