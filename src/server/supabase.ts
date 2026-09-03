import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Server-side Supabase client.
//
// Uses the SECRET key, which bypasses Row Level Security. This module must
// only ever be imported by server code (the Express API). Never expose these
// values to the browser and never prefix them with VITE_, or Vite will inline
// them into the public bundle.

const url = process.env.SUPABASE_URL ?? '';
const secretKey = process.env.SUPABASE_SECRET_KEY ?? '';

export const isSupabaseConfigured = Boolean(url && secretKey);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY ' +
        '(see .env.local locally, or the Vercel project environment variables).'
    );
  }

  if (!client) {
    client = createClient(url, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return client;
}
