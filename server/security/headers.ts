import { Request, Response, NextFunction } from 'express';

/**
 * Enterprise-grade HTTP Security Headers Middleware.
 * Defends against XSS, clickjacking, MIME-sniffing, and insecure protocol downgrades.
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent Clickjacking while allowing Google AI Studio iframe embed
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' ws: wss: https:",
      "frame-ancestors 'self' https://*.google.com https://*.aistudio.google.com https://*.googleusercontent.com",
      "object-src 'none'",
      "base-uri 'self'",
    ].join('; ')
  );

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (limit browser hardware APIs unless requested)
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

  // Legacy XSS filter for older browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Remove server identification header
  res.removeHeader('X-Powered-By');

  // HSTS in production or when accessed via HTTPS
  if (process.env.NODE_ENV === 'production' || req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  next();
}
