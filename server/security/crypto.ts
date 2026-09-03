import crypto from 'crypto';

// Secret key for HMAC token signing (falls back to a stable cryptographic instance secret)
const SESSION_SECRET = process.env.SESSION_SECRET || 'isp_billing_sec_key_2026_@92!kb_fiber_pro_v2_sign';

const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_SALT_LENGTH = 16;
const SCRYPT_COST = 16384; // N=16384
const SCRYPT_BLOCK_SIZE = 8; // r=8
const SCRYPT_PARALLELISM = 1; // p=1

/**
 * Derives a strong salted cryptographic hash using Node.js native scrypt.
 * Output format: scrypt$v1$<salt_hex>$<hash_hex>
 */
export function hashPassword(password: string): string {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a valid non-empty string');
  }

  const salt = crypto.randomBytes(SCRYPT_SALT_LENGTH).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, SCRYPT_KEY_LENGTH, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK_SIZE,
    p: SCRYPT_PARALLELISM,
  });

  return `scrypt$v1$${salt}$${derivedKey.toString('hex')}`;
}

export interface PasswordVerificationResult {
  valid: boolean;
  needsUpgrade: boolean;
}

/**
 * Verifies a plain text password against a stored password hash.
 * Handles both modern scrypt salted hashes and legacy SHA-256 hashes seamlessly.
 * Uses constant-time buffer comparison to prevent timing attacks.
 */
export function verifyPassword(password: string, storedHash: string): PasswordVerificationResult {
  if (!password || !storedHash || typeof password !== 'string' || typeof storedHash !== 'string') {
    return { valid: false, needsUpgrade: false };
  }

  // Modern salted scrypt format: scrypt$v1$<salt>$<hash>
  if (storedHash.startsWith('scrypt$v1$')) {
    const parts = storedHash.split('$');
    if (parts.length !== 4) {
      return { valid: false, needsUpgrade: false };
    }

    const salt = parts[2];
    const expectedHashHex = parts[3];

    try {
      const derivedKey = crypto.scryptSync(password, salt, SCRYPT_KEY_LENGTH, {
        N: SCRYPT_COST,
        r: SCRYPT_BLOCK_SIZE,
        p: SCRYPT_PARALLELISM,
      });

      const actualHashBuffer = Buffer.from(derivedKey.toString('hex'), 'hex');
      const expectedHashBuffer = Buffer.from(expectedHashHex, 'hex');

      if (actualHashBuffer.length !== expectedHashBuffer.length) {
        return { valid: false, needsUpgrade: false };
      }

      const match = crypto.timingSafeEqual(actualHashBuffer, expectedHashBuffer);
      return { valid: match, needsUpgrade: false };
    } catch {
      return { valid: false, needsUpgrade: false };
    }
  }

  // Legacy SHA-256 fallback (for existing seeded/stored accounts)
  try {
    const legacyHash = crypto.createHash('sha256').update(password).digest('hex');
    const legacyHashBuffer = Buffer.from(legacyHash, 'hex');
    const storedHashBuffer = Buffer.from(storedHash, 'hex');

    if (legacyHashBuffer.length === storedHashBuffer.length && crypto.timingSafeEqual(legacyHashBuffer, storedHashBuffer)) {
      // Valid password, but needs upgrade to salted scrypt
      return { valid: true, needsUpgrade: true };
    }
  } catch {
    // If stored hash was not hex or invalid
  }

  return { valid: false, needsUpgrade: false };
}

/**
 * Token Payload structure for cryptographically signed session tokens
 */
export interface TokenPayload {
  userId: string;
  username: string;
  roleId: string;
  roleName: string;
  tokenId: string;
  iat: number; // Issued at (Unix timestamp in ms)
  exp: number; // Expires at (Unix timestamp in ms)
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Creates a cryptographically signed session token with HMAC-SHA256.
 * Token expires after durationMs (default: 24 hours).
 */
export function createSessionToken(
  user: { id: string; username: string; roleId: string; roleName: string },
  durationMs: number = 24 * 60 * 60 * 1000
): { token: string; payload: TokenPayload } {
  const now = Date.now();
  const payload: TokenPayload = {
    userId: user.id,
    username: user.username,
    roleId: user.roleId,
    roleName: user.roleName,
    tokenId: crypto.randomBytes(16).toString('hex'),
    iat: now,
    exp: now + durationMs,
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signatureData = `${encodedHeader}.${encodedPayload}`;

  const hmac = crypto.createHmac('sha256', SESSION_SECRET);
  hmac.update(signatureData);
  const signature = base64UrlEncode(hmac.digest('base64'));

  const token = `${signatureData}.${signature}`;
  return { token, payload };
}

/**
 * Verifies a session token's cryptographic HMAC signature and validity window.
 */
export function verifySessionToken(token: string): TokenPayload | null {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  const signatureData = `${encodedHeader}.${encodedPayload}`;

  try {
    const hmac = crypto.createHmac('sha256', SESSION_SECRET);
    hmac.update(signatureData);
    const expectedSignature = base64UrlEncode(hmac.digest('base64'));

    const sigBuf = Buffer.from(signature);
    const expSigBuf = Buffer.from(expectedSignature);

    if (sigBuf.length !== expSigBuf.length || !crypto.timingSafeEqual(sigBuf, expSigBuf)) {
      return null;
    }

    const payloadJson = base64UrlDecode(encodedPayload);
    const payload: TokenPayload = JSON.parse(payloadJson);

    // Check expiration timestamp
    if (Date.now() > payload.exp) {
      return null;
    }

    // Check valid issued timestamp
    if (payload.iat > Date.now() + 60000) {
      // Token issued in the future (beyond clock skew tolerance)
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
