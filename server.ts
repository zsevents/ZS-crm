import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './src/server/routes.js';
import { withPersistence } from './src/server/persistence.js';
import { apiRateLimit, corsPolicy, securityHeaders, requestLogger, errorHandler } from './src/server/security.js';
import { requireAuth } from './src/server/auth.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

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

  app.use(errorHandler);

  // Vite middleware setup
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
    console.log(`🌸 BloomCraft Florist CRM & Project Management running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

