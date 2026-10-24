import express from 'express';
import { requireAuth } from './auth.js';
import { withPersistence } from './persistence.js';
import { pingDatabase } from './store.js';
import { apiRouter } from './routes.js';
import { apiRateLimit, corsPolicy, errorHandler, requestLogger, securityHeaders } from './security.js';

/** The CRM API, shared by the Vercel function (api/index.ts) and the local server (server.ts). */
export function createApp() {
  const app = express();

  // Behind Vercel's proxy: use X-Forwarded-For so req.ip is the visitor, not the proxy
  app.set('trust proxy', true);

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // Same-origin by default; only the enquiry endpoint is open to any website
  app.use('/api', securityHeaders, requestLogger, corsPolicy, apiRateLimit);

  // Reject unauthenticated calls before touching the database
  app.use('/api', requireAuth);

  // Keep the in-memory store in sync with Postgres around every request
  app.use('/api', withPersistence);

  app.use('/api', apiRouter);

  app.get('/api/health', async (_req, res) => {
    const database = await pingDatabase().catch(() => false);
    res.status(database ? 200 : 503).json({
      status: database ? 'ok' : 'degraded',
      database: database ? 'ok' : 'unreachable',
      time: new Date().toISOString(),
    });
  });

  // API 404 handler to prevent HTML fallthrough
  app.all('/api/*', (req, res) => {
    res.status(404).json({ success: false, error: `Endpoint not found: ${req.method} ${req.path}` });
  });

  // Report unhandled errors (structured log + Sentry when SENTRY_DSN is set)
  app.use(errorHandler);

  return app;
}
