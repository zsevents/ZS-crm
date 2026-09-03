import type { RequestHandler } from 'express';
import { hydrate, flush } from './store.js';
import { isSupabaseConfigured } from './supabase.js';

// Express middleware that makes the in-memory database durable.
//
// Before every request the in-memory arrays are refreshed from Postgres, so
// each serverless instance sees the same data. For mutating requests the
// arrays are written back *before* the response is sent - flushing after the
// response would risk the instance being frozen mid-write and losing data.
//
// When Supabase is not configured this is a no-op and the app behaves exactly
// as it did with pure in-memory storage.

const READ_ONLY = new Set(['GET', 'HEAD', 'OPTIONS']);

export const withPersistence: RequestHandler = async (req, res, next) => {
  if (!isSupabaseConfigured()) return next();

  try {
    await hydrate();
  } catch (err: any) {
    return res
      .status(503)
      .json({ success: false, error: `Database unavailable: ${err.message}` });
  }

  if (READ_ONLY.has(req.method)) return next();

  const sendJson = res.json.bind(res);

  res.json = ((body: any) => {
    // Only persist when the handler reports success.
    if (res.statusCode >= 400 || body?.success === false) {
      return sendJson(body);
    }

    flush().then(
      () => sendJson(body),
      (err: any) =>
        sendJson({ success: false, error: `Failed to save: ${err.message}` })
    );

    return res;
  }) as typeof res.json;

  next();
};
