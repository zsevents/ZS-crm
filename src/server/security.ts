import type { ErrorRequestHandler,Request,RequestHandler } from 'express';

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------
// In-memory sliding window per IP. On serverless this is per warm instance, so
// it blunts bursts and brute-force attempts rather than enforcing a global quota.

export function createRateLimiter(max: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return function allow(key: string, now = Date.now()): boolean {
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= max) {
      hits.set(key, recent);
      return false;
    }
    recent.push(now);
    hits.set(key, recent);
    if (hits.size > 5000) hits.clear();
    return true;
  };
}

const apiAllow = createRateLimiter(240, 60_000); // 240 requests / minute / IP
const authFailAllow = createRateLimiter(20, 10 * 60_000); // 20 failed sign-ins / 10 min / IP

export const apiRateLimit: RequestHandler = (req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  if (!apiAllow(req.ip ?? 'unknown')) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ success: false, error: 'Too many requests. Please slow down.' });
  }
  next();
};

/** Call when a request presented a bad or missing token; returns false once the IP is locked out. */
export function recordAuthFailure(req: Request): boolean {
  return authFailAllow(req.ip ?? 'unknown');
}

// ---------------------------------------------------------------------------
// Headers + CORS
// ---------------------------------------------------------------------------

export const securityHeaders: RequestHandler = (_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cache-Control', 'no-store');
  next();
};

const PUBLIC_CORS_PATHS = new Set(['/website-inquiry', '/inquiry']);

function allowedOrigins(): Set<string> {
  const extra = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  return new Set([
    'https://crm.zsevents.in',
    'https://zsevents.in',
    'https://www.zsevents.in',
    'http://localhost:3000',
    ...extra,
  ]);
}

/**
 * The public enquiry endpoint stays open to any website (it is meant to be
 * posted from the marketing site). Everything else only answers cross-origin
 * requests from the studio's own domains.
 */
export const corsPolicy: RequestHandler = (req, res, next) => {
  const origin = req.headers.origin;
  const isPublic = PUBLIC_CORS_PATHS.has(req.path.replace(/\/$/, ''));
  if (origin && (isPublic || allowedOrigins().has(origin))) {
    res.setHeader('Access-Control-Allow-Origin', isPublic ? '*' : origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
};

// ---------------------------------------------------------------------------
// Logging + error tracking
// ---------------------------------------------------------------------------

export function logEvent(level: 'info' | 'warn' | 'error', msg: string, extra: Record<string, unknown> = {}) {
  const line = JSON.stringify({ level, msg, time: new Date().toISOString(), ...extra });
  (level === 'error' ? console.error : console.log)(line);
}

/** One structured line for every API request that fails (4xx/5xx) or is slow. */
export const requestLogger: RequestHandler = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    if (res.statusCode >= 400 || ms > 2000) {
      logEvent(res.statusCode >= 500 ? 'error' : 'warn', 'api_request', {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        ms,
        ip: req.ip,
      });
    }
  });
  next();
};

/**
 * Minimal Sentry-compatible reporter (no SDK, so serverless cold starts stay
 * fast). Active only when SENTRY_DSN is set; otherwise errors still go to the
 * structured log above.
 */
async function reportError(err: unknown, context: Record<string, unknown> = {}) {
  const e = err instanceof Error ? err : new Error(String(err));
  logEvent('error', e.message, { stack: e.stack, ...context });

  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  try {
    const url = new URL(dsn);
    const projectId = url.pathname.replace('/', '');
    const key = url.username;
    await fetch(`${url.protocol}//${url.host}/api/${projectId}/store/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${key}, sentry_client=zs-crm/1.0`,
      },
      body: JSON.stringify({
        event_id: crypto.randomUUID().replace(/-/g, ''),
        timestamp: new Date().toISOString(),
        platform: 'node',
        level: 'error',
        environment: process.env.VERCEL_ENV ?? 'development',
        message: e.message,
        exception: { values: [{ type: e.name, value: e.message }] },
        extra: { stack: e.stack, ...context },
      }),
    });
  } catch {
    // Never let error reporting break a request.
  }
}

export const errorHandler: ErrorRequestHandler = async (err, req, res, _next) => {
  const status = err?.status && err.status < 600 ? err.status : 500;
  // Only server faults go to Sentry; bad client input (4xx) would just burn the free quota.
  // Serverless freezes the function once the response is sent, so the report must finish first
  // (capped at 2.5s so a slow Sentry never hangs the request).
  if (status >= 500) {
    await Promise.race([
      reportError(err, { method: req.method, path: req.path }),
      new Promise((resolve) => setTimeout(resolve, 2500)),
    ]);
  }
  if (res.headersSent) return;
  res.status(status).json({
    success: false,
    error: 'Something went wrong on our side. The team has been notified.',
  });
};
