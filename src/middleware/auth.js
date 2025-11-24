const authService = require('../services/authService');
const providerService = require('../services/providerService');

const ADMIN_ROLE_ID = Number.parseInt(process.env.ADMIN_ROLE_ID || '1', 10);

/**
 * Middleware to verify JWT access token from Authorization header
 */
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = await authService.verifyAccessToken(token);
    
    if (!decoded) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // Attach user info to request object
    req.user = {
      id: decoded.id,
      type: decoded.type, // 'user' or 'provider'
      email: decoded.email,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({ error: 'Token verification failed' });
  }
}

/**
 * Middleware to ensure authenticated user can only access their own data
 */
function authorizeUser(req, res, next) {
  try {
    const { userId } = req.params;
    
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if authenticated user is of type 'user' (not provider)
    if (req.user.type !== 'user') {
      return res.status(403).json({ error: 'Access denied. User account required.' });
    }

    // Convert both to numbers for comparison (handles string and number types)
    const tokenUserId = parseInt(req.user.id, 10);
    const requestedUserId = parseInt(userId, 10);

    // Check if authenticated user ID matches the requested user ID
    if (tokenUserId !== requestedUserId) {
      return res.status(403).json({ error: 'Access denied. You can only access your own reservations.' });
    }

    next();
  } catch (error) {
    console.error('Authorization error:', error);
    return res.status(403).json({ error: 'Authorization failed' });
  }
}

/**
 * Middleware to verify provider authentication
 */
function authenticateProvider(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.type !== 'provider') {
    return res.status(403).json({ error: 'Access denied. Provider account required.' });
  }

  next();
}

/**
 * Middleware to verify admin provider authentication
 */
async function authenticateAdmin(req, res, next) {
  try {
    // First verify it's a provider
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.type !== 'provider') {
      return res.status(403).json({ error: 'Access denied. Provider account required.' });
    }

    // Convert provider ID to number (token might have it as string)
    const providerId = parseInt(req.user.id, 10);
    if (isNaN(providerId)) {
      console.error('Invalid provider ID:', req.user.id);
      return res.status(403).json({ error: 'Invalid provider ID' });
    }

    // Fetch provider to check role_id
    const provider = await providerService.getProviderById(providerId);
    if (!provider) {
      console.error('Provider not found for ID:', providerId);
      return res.status(403).json({ error: 'Provider not found' });
    }

    // Check if provider has admin role
    const providerRoleId = parseInt(provider.role_id, 10);
    if (providerRoleId !== ADMIN_ROLE_ID) {
      console.error(`Provider role_id (${providerRoleId}) does not match ADMIN_ROLE_ID (${ADMIN_ROLE_ID})`);
      return res.status(403).json({ 
        error: 'Access denied. Admin privileges required.',
        details: `Expected role_id: ${ADMIN_ROLE_ID}, got: ${providerRoleId}`
      });
    }

    next();
  } catch (error) {
    console.error('Admin authentication error:', error);
    return res.status(403).json({ error: 'Admin authentication failed' });
  }
}

module.exports = {
  authenticateToken,
  authorizeUser,
  authenticateProvider,
  authenticateAdmin,
};

