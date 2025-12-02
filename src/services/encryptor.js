const crypto = require('crypto');

const {
  PASSWORD_ITERATIONS = '310000',
  PASSWORD_KEY_LENGTH = '64',
  PASSWORD_DIGEST = 'sha512',
  ENCRYPTION_SECRET = 'change_this_secret',
} = process.env;

const ITERATIONS = Number.parseInt(PASSWORD_ITERATIONS, 10);
const KEY_LENGTH = Number.parseInt(PASSWORD_KEY_LENGTH, 10);
const DIGEST = PASSWORD_DIGEST;
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';

function getEncryptionKey() {
  return crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest().slice(0, 32);
}

function pbkdf2(password, salt, iterations, keylen, digest) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, iterations, keylen, digest, (error, derivedKey) => {
      if (error) {
        reject(error);
      } else {
        resolve(derivedKey);
      }
    });
  });
}

async function hashPassword(password) {
  if (!password) {
    throw new Error('Password must be provided for hashing');
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, DIGEST);

  return `pbkdf2$${DIGEST}$${ITERATIONS}$${salt}$${derivedKey.toString('hex')}`;
}

/**
 * Hash an arbitrary string using the same PBKDF2 routine as passwords.
 */
async function hashString(value) {
  return hashPassword(String(value || ''));
}

async function verifyPassword(password, storedHash) {
  if (!password || !storedHash) {
    return false;
  }

  const parts = storedHash.split('$');
  if (parts.length !== 5 || parts[0] !== 'pbkdf2') {
    return false;
  }

  const [, digest, iterationsStr, salt, hashHex] = parts;
  const iterations = Number.parseInt(iterationsStr, 10);
  const derivedKey = await pbkdf2(password, salt, iterations, hashHex.length / 2, digest);
  const storedBuffer = Buffer.from(hashHex, 'hex');

  if (storedBuffer.length !== derivedKey.length) {
    return false;
  }

  return crypto.timingSafeEqual(storedBuffer, derivedKey);
}

function encrypt(plaintext) {
  if (typeof plaintext === 'undefined' || plaintext === null) {
    throw new Error('Plaintext must be provided for encryption');
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, ciphertext]).toString('base64');
}

function decrypt(payload) {
  if (!payload) {
    throw new Error('Cipher payload must be provided for decryption');
  }

  const buffer = Buffer.from(payload, 'base64');
  if (buffer.length < 28) {
    throw new Error('Invalid cipher payload');
  }

  const iv = buffer.slice(0, 12);
  const authTag = buffer.slice(12, 28);
  const ciphertext = buffer.slice(28);
  const key = getEncryptionKey();

  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString('utf8');
}

module.exports = {
  hashPassword,
  hashString,
  verifyPassword,
  encrypt,
  decrypt,
};


