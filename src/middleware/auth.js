const authService = require('../services/authService');

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
function authenticateAdmin(req, res, next) {
  authenticateProvider(req, res, () => {
    // Additional admin-specific checks could go here
    // For now, just check if it's a provider
    next();
  });
}

module.exports = {
  authenticateToken,
  authorizeUser,
  authenticateProvider,
  authenticateAdmin,
};

