import express from 'express';
import { apiRouter } from '../src/server/routes.js';
import { withPersistence } from '../src/server/persistence.js';
import { apiRateLimit, corsPolicy, securityHeaders, requestLogger, errorHandler } from '../src/server/security.js';
import { requireAuth } from '../src/server/auth.js';

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

// Mount API endpoints first
app.use('/api', apiRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// API 404 handler to prevent HTML fallthrough
app.all('/api/*', (req, res) => {
  res.status(404).json({ success: false, error: `Endpoint not found: ${req.method} ${req.path}` });
});

// Report unhandled errors (structured log + Sentry when SENTRY_DSN is set)
app.use(errorHandler);

export default app;
