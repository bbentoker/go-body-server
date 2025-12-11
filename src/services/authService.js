const crypto = require('crypto');
const { RefreshToken, PasswordResetToken, User } = require('../models');

const {
  JWT_ACCESS_SECRET = 'change_this_access_secret',
  JWT_REFRESH_SECRET = 'change_this_refresh_secret',
  JWT_ACCESS_EXPIRY = '60m',
  FRONTEND_URL = 'http://localhost:3000',
} = process.env;

// Handle empty string environment variables with proper fallbacks
const JWT_REFRESH_EXPIRY_DAYS = Number.parseInt(process.env.JWT_REFRESH_EXPIRY_DAYS, 10) || 7;
const PASSWORD_RESET_EXPIRY_MINUTES = Number.parseInt(process.env.PASSWORD_RESET_EXPIRY_MINUTES, 10) || 60;

const REFRESH_EXPIRY_MS = JWT_REFRESH_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
const PASSWORD_RESET_EXPIRY_MS = PASSWORD_RESET_EXPIRY_MINUTES * 60 * 1000;

// Simple JWT implementation without external dependencies
function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString('utf8');
}

function createSignature(header, payload, secret) {
  const data = `${header}.${payload}`;
  return crypto.createHmac('sha256', secret).update(data).digest('base64url');
}

function generateJWT(payload, secret, expiresIn) {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  
  const now = Math.floor(Date.now() / 1000);
  const exp = expiresIn.endsWith('m')
    ? now + Number.parseInt(expiresIn, 10) * 60
    : now + Number.parseInt(expiresIn, 10);
  
  const jwtPayload = {
    ...payload,
    iat: now,
    exp,
  };
  
  const encodedPayload = base64UrlEncode(JSON.stringify(jwtPayload));
  const signature = createSignature(header, encodedPayload, secret);
  
  return `${header}.${encodedPayload}.${signature}`;
}

function verifyJWT(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const [header, payload, signature] = parts;
    const expectedSignature = createSignature(header, payload, secret);
    
    if (signature !== expectedSignature) {
      return null;
    }
    
    const decodedPayload = JSON.parse(base64UrlDecode(payload));
    
    const now = Math.floor(Date.now() / 1000);
    if (decodedPayload.exp && decodedPayload.exp < now) {
      return null;
    }
    
    return decodedPayload;
  } catch (error) {
    return null;
  }
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateRandomToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function generateTokenPair(user) {
  const role = user.role || {};
  const userId = user.user_id;
  const accessTokenPayload = {
    id: userId,
    email: user.email,
    role: {
      id: role.role_id || user.role_id,
      key: role.role_key,
      name: role.role_name,
      is_provider: Boolean(role.is_provider),
    },
  };
  
  const accessToken = generateJWT(accessTokenPayload, JWT_ACCESS_SECRET, JWT_ACCESS_EXPIRY);
  
  const refreshToken = generateRandomToken();
  const refreshTokenHash = hashToken(refreshToken);
  
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRY_MS);
  
  try {
    await RefreshToken.create({
      token_hash: refreshTokenHash,
      user_id: userId,
      expires_at: expiresAt,
    });
  } catch (error) {
    console.error('RefreshToken.create error:', error.message);
    console.error('Error details:', error.original || error);
    throw error;
  }
  
  return {
    accessToken,
    refreshToken,
    expiresIn: JWT_ACCESS_EXPIRY,
  };
}

async function verifyAccessToken(token) {
  return verifyJWT(token, JWT_ACCESS_SECRET);
}

async function refreshAccessToken(refreshToken) {
  const tokenHash = hashToken(refreshToken);
  
  const storedToken = await RefreshToken.findOne({
    where: {
      token_hash: tokenHash,
      revoked_at: null,
    },
  });
  
  if (!storedToken) {
    return null;
  }
  
  if (new Date() > new Date(storedToken.expires_at)) {
    await storedToken.update({ revoked_at: new Date() });
    return null;
  }
  
  const { User, Role } = require('../models');
  const user = await User.findByPk(storedToken.user_id, {
    include: [
      {
        model: Role,
        as: 'role',
        attributes: ['role_id', 'role_key', 'role_name', 'is_provider'],
      },
    ],
  });
  if (!user) {
    await storedToken.update({ revoked_at: new Date() });
    return null;
  }
  
  await storedToken.update({ revoked_at: new Date() });
  
  return generateTokenPair(user);
}

async function revokeRefreshToken(refreshToken) {

  const tokenHash = hashToken(refreshToken);

  const storedToken = await RefreshToken.findOne({
    where: {
      token_hash: tokenHash,
      revoked_at: null,
    },
  });
  
  if (!storedToken) {
    return false;
  }
  
  await storedToken.update({ revoked_at: new Date() });
  return true;
}

async function revokeAllUserTokens(userId) {
  const where = { user_id: userId, revoked_at: null };

  await RefreshToken.update(
    { revoked_at: new Date() },
    { where }
  );
}

/**
 * Check if user has a non-expired, unused password reset request
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} True if valid request exists
 */
async function hasValidPasswordResetRequest(userId) {
  const { Op } = require('sequelize');
  
  const existingToken = await PasswordResetToken.findOne({
    where: {
      user_id: userId,
      used_at: null,
      expires_at: { [Op.gt]: new Date() },
    },
  });
  
  return !!existingToken;
}

/**
 * Create a password reset token for a user
 * @param {number} userId - User ID
 * @returns {Promise<string>} The plain reset code (to be sent via email)
 */
async function createPasswordResetToken(userId) {
  const resetCode = generateRandomToken();
  const tokenHash = hashToken(resetCode);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS);
  
  await PasswordResetToken.create({
    token_hash: tokenHash,
    user_id: userId,
    expires_at: expiresAt,
  });
  
  return resetCode;
}

/**
 * Verify a password reset code and return the user if valid
 * @param {string} resetCode - The reset code from the email
 * @returns {Promise<Object|null>} User object if valid, null otherwise
 */
async function verifyPasswordResetCode(resetCode) {
  const { Op } = require('sequelize');
  const tokenHash = hashToken(resetCode);
  
  const resetToken = await PasswordResetToken.findOne({
    where: {
      token_hash: tokenHash,
      used_at: null,
      expires_at: { [Op.gt]: new Date() },
    },
  });
  
  if (!resetToken) {
    return null;
  }
  
  const user = await User.findByPk(resetToken.user_id);
  if (!user) {
    return null;
  }
  
  return {
    user,
    tokenId: resetToken.token_id,
  };
}

/**
 * Mark a password reset token as used
 * @param {number} tokenId - Token ID
 */
async function markPasswordResetTokenAsUsed(tokenId) {
  await PasswordResetToken.update(
    { used_at: new Date() },
    { where: { token_id: tokenId } }
  );
}

/**
 * Get the frontend URL for password reset
 * @param {string} resetCode - The reset code
 * @returns {string} Full URL for password reset
 */
function getPasswordResetUrl(resetCode) {
  return `${FRONTEND_URL}/auth/reset-password?code=${resetCode}`;
}

/**
 * Get password reset expiry in human-readable format
 * @returns {string} Expiry time string
 */
function getPasswordResetExpiryString() {
  const minutes = Number.parseInt(PASSWORD_RESET_EXPIRY_MINUTES, 10);
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  return `${minutes} minute${minutes > 1 ? 's' : ''}`;
}

module.exports = {
  generateTokenPair,
  verifyAccessToken,
  refreshAccessToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  // Password reset functions
  hasValidPasswordResetRequest,
  createPasswordResetToken,
  verifyPasswordResetCode,
  markPasswordResetTokenAsUsed,
  getPasswordResetUrl,
  getPasswordResetExpiryString,
};

