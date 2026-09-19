import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Browser-side Supabase client, used for authentication only.
//
// Uses the PUBLISHABLE key, which is designed to be public and is constrained
// by Row Level Security. CRM data still goes through the /api routes.

const url = import.meta.env.VITE_SUPABASE_URL ?? '';
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '';

export function isSupabaseConfigured(): boolean {
  return Boolean(url && publishableKey);
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and ' +
        'VITE_SUPABASE_PUBLISHABLE_KEY in .env.local, then restart the dev server.'
    );
  }

  if (!client) {
    client = createClient(url, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'zse_auth_session',
      },
    });
  }

  return client;
}
