import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  firstRequestTime: number;
  lockoutUntil?: number;
}

// In-memory sliding window stores (automatically pruned)
const authAttemptsStore = new Map<string, RateLimitRecord>();
const apiRateLimitStore = new Map<string, RateLimitRecord>();

// Periodic pruning of stale rate limiter records (every 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of authAttemptsStore.entries()) {
    if (record.lockoutUntil && record.lockoutUntil < now && now - record.firstRequestTime > 30 * 60 * 1000) {
      authAttemptsStore.delete(key);
    } else if (!record.lockoutUntil && now - record.firstRequestTime > 15 * 60 * 1000) {
      authAttemptsStore.delete(key);
    }
  }

  for (const [key, record] of apiRateLimitStore.entries()) {
    if (now - record.firstRequestTime > 60 * 1000) {
      apiRateLimitStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || '127.0.0.1';
}

/**
 * Authentication Rate Limiter (Brute-force protection for login and password resets)
 * Limit: 5 failed attempts per 15 minutes. Lockout: 15 minutes.
 */
export function authRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIp(req);
  const username = typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : '';
  const key = `auth:${ip}:${username || 'anon'}`;
  const now = Date.now();

  const record = authAttemptsStore.get(key);

  if (record && record.lockoutUntil && record.lockoutUntil > now) {
    const remainingSeconds = Math.ceil((record.lockoutUntil - now) / 1000);
    res.setHeader('Retry-After', remainingSeconds);
    return res.status(429).json({
      error: `Too many failed login attempts. This account is temporarily locked for security. Please try again in ${remainingSeconds} seconds.`,
      code: 'AUTH_RATE_LIMITED',
    });
  }

  next();
}

/**
 * Record a failed authentication attempt
 */
export function recordFailedAuth(req: Request) {
  const ip = getClientIp(req);
  const username = typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : '';
  const key = `auth:${ip}:${username || 'anon'}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes window
  const maxAttempts = 5;
  const lockoutMs = 15 * 60 * 1000; // 15 minutes lockout

  const record = authAttemptsStore.get(key) || { count: 0, firstRequestTime: now };

  if (now - record.firstRequestTime > windowMs) {
    record.count = 1;
    record.firstRequestTime = now;
    record.lockoutUntil = undefined;
  } else {
    record.count += 1;
  }

  if (record.count >= maxAttempts) {
    record.lockoutUntil = now + lockoutMs;
  }

  authAttemptsStore.set(key, record);
}

/**
 * Reset authentication failure count upon successful login
 */
export function clearAuthFailures(req: Request) {
  const ip = getClientIp(req);
  const username = typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : '';
  const key = `auth:${ip}:${username || 'anon'}`;
  authAttemptsStore.delete(key);
}

/**
 * General API Rate Limiter
 * Limit: 300 requests per minute per IP address
 */
export function apiRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIp(req);
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 300;

  const record = apiRateLimitStore.get(ip) || { count: 0, firstRequestTime: now };

  if (now - record.firstRequestTime > windowMs) {
    record.count = 1;
    record.firstRequestTime = now;
  } else {
    record.count += 1;
  }

  apiRateLimitStore.set(ip, record);

  res.setHeader('X-RateLimit-Limit', maxRequests);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));

  if (record.count > maxRequests) {
    res.setHeader('Retry-After', 60);
    return res.status(429).json({
      error: 'API rate limit exceeded. Too many requests. Please slow down.',
      code: 'API_RATE_LIMITED',
    });
  }

  next();
}
