import type { RequestHandler } from 'express';
import type { User } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from './supabase.js';

// API authentication.
//
// Every /api route requires a Supabase access token (Authorization: Bearer)
// belonging to an approved CRM user, except the handful of public routes
// below. The login screen alone only hides the UI; without this the API would
// hand customer phone numbers, invoices and bank details to anyone.
//
// A user is approved when either:
//   - app_metadata.crm_access === true (settable only with the secret key, so
//     a self-signup through the public key cannot grant it), or
//   - their email is listed in CRM_ALLOWED_EMAILS (comma separated).

const PUBLIC_ROUTES = new Set([
  'GET /health',
  'GET /website-inquiry',
  'POST /website-inquiry',
  'GET /inquiry',
  'POST /inquiry',
]);

// Verified tokens are cached briefly so a page load that fires ten API calls
// does not make ten round trips to Supabase Auth.
const TOKEN_TTL_MS = 60_000;
const tokenCache = new Map<string, { user: User; expires: number }>();

function allowedEmails(): Set<string> {
  return new Set(
    (process.env.CRM_ALLOWED_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isApprovedUser(user: User): boolean {
  if (user.app_metadata?.crm_access === true) return true;
  return allowedEmails().has((user.email ?? '').toLowerCase());
}

async function verifyToken(token: string): Promise<User | null> {
  const cached = tokenCache.get(token);
  if (cached && cached.expires > Date.now()) return cached.user;

  const { data, error } = await getSupabase().auth.getUser(token);
  if (error || !data.user) return null;

  if (tokenCache.size > 500) tokenCache.clear();
  tokenCache.set(token, { user: data.user, expires: Date.now() + TOKEN_TTL_MS });
  return data.user;
}

export const requireAuth: RequestHandler = async (req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  if (PUBLIC_ROUTES.has(`${req.method} ${req.path.replace(/\/$/, '')}`)) return next();

  // Local development without Supabase keeps working as a pure in-memory demo.
  if (!isSupabaseConfigured()) return next();

  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    return res.status(401).json({ success: false, error: 'Sign in required' });
  }

  try {
    const user = await verifyToken(token);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Session expired. Please sign in again.' });
    }
    if (!isApprovedUser(user)) {
      return res.status(403).json({
        success: false,
        error: 'This account has not been given CRM access. Ask the studio admin to approve it.',
      });
    }
    res.locals.user = user;
    next();
  } catch (err: any) {
    res.status(503).json({ success: false, error: `Auth service unavailable: ${err.message}` });
  }
};
