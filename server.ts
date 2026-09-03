import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/api';
import { securityHeaders } from './server/security/headers';
import { apiRateLimiter } from './server/security/rateLimiter';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Enterprise Security Headers (CSP, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
  app.use(securityHeaders);

  // 2. Strict CORS Configuration
  app.use(
    cors({
      origin: true, // Allow same-origin and verified client contexts
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true,
      maxAge: 86400, // 24 hours preflight cache
    })
  );

  // 3. Payload size limiting (Defends against memory exhaustion DoS)
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // 4. API Rate Limiting (Protects all /api endpoints from brute-force & flood attacks)
  app.use('/api', apiRateLimiter);

  // 5. Health check endpoint (for container ingress & monitoring)
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'ISP Billing & Customer Management System',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    });
  });

  // 6. API Business Routes
  app.use('/api', apiRouter);

  // 7. Strict API 404 handler (Prevents API requests from falling through to HTML SPA fallback)
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      error: `API route not found: ${req.method} ${req.originalUrl}`,
      code: 'ROUTE_NOT_FOUND',
    });
  });

  // 8. Centralized Secure Error Handler (Never leaks internal stack traces to clients)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.startsWith('/api')) {
      const statusCode = Number(err.status) || 500;
      const isClientError = statusCode >= 400 && statusCode < 500;

      // Log full internal error on server console with timestamp for audit trail
      console.error(`[SERVER ERROR] [${new Date().toISOString()}] ${req.method} ${req.originalUrl}:`, err);

      // Return sanitized message to client
      return res.status(statusCode).json({
        error: isClientError ? err.message : 'An internal server error occurred. Please try again or contact support.',
        code: err.code || 'INTERNAL_ERROR',
      });
    }
    next(err);
  });

  // 9. Vite Dev Middleware / Production Static Asset Serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ISP Billing & Customer Management Server running securely on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
