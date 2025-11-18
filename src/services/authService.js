const crypto = require('crypto');
const { RefreshToken } = require('../models');

const {
  JWT_ACCESS_SECRET = 'change_this_access_secret',
  JWT_REFRESH_SECRET = 'change_this_refresh_secret',
  JWT_ACCESS_EXPIRY = '60m',
  JWT_REFRESH_EXPIRY_DAYS = '7',
} = process.env;

const REFRESH_EXPIRY_MS = Number.parseInt(JWT_REFRESH_EXPIRY_DAYS, 10) * 24 * 60 * 60 * 1000;

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

async function generateTokenPair(user, type = 'user') {
  const userId = type === 'user' ? user.user_id : user.provider_id;
  const accessTokenPayload = {
    id: userId,
    type,
    email: user.email,
  };
  
  const accessToken = generateJWT(accessTokenPayload, JWT_ACCESS_SECRET, JWT_ACCESS_EXPIRY);
  
  const refreshToken = generateRandomToken();
  const refreshTokenHash = hashToken(refreshToken);
  
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRY_MS);
  
  await RefreshToken.create({
    token_hash: refreshTokenHash,
    user_id: type === 'user' ? userId : null,
    provider_id: type === 'provider' ? userId : null,
    expires_at: expiresAt,
  });
  
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
  
  const type = storedToken.user_id ? 'user' : 'provider';
  const id = storedToken.user_id || storedToken.provider_id;
  
  const { Provider, User } = require('../models');
  const Model = type === 'user' ? User : Provider;
  const idField = type === 'user' ? 'user_id' : 'provider_id';
  
  const user = await Model.findByPk(id);
  if (!user) {
    await storedToken.update({ revoked_at: new Date() });
    return null;
  }
  
  await storedToken.update({ revoked_at: new Date() });
  
  return generateTokenPair(user, type);
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

async function revokeAllUserTokens(userId, type = 'user') {
  const where = type === 'user' 
    ? { user_id: userId, revoked_at: null }
    : { provider_id: userId, revoked_at: null };
  
  await RefreshToken.update(
    { revoked_at: new Date() },
    { where }
  );
}

module.exports = {
  generateTokenPair,
  verifyAccessToken,
  refreshAccessToken,
  revokeRefreshToken,
  revokeAllUserTokens,
};

