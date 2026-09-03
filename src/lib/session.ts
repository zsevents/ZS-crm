import type { Session } from '@supabase/supabase-js';
import { AuthSession, User } from '../types';
import { getSupabase } from './supabaseClient';

// Maps a Supabase session onto the app's existing AuthSession shape, so the
// rest of the UI keeps consuming the same { user, token } object it always has.
//
// Profile details live in public.profiles, created automatically by the
// on_auth_user_created trigger. If that row has not materialised yet (it is
// written in the same transaction as the signup, but a first read can race),
// fall back to the auth user's own metadata.

export async function sessionFromSupabase(session: Session): Promise<AuthSession> {
  const authUser = session.user;
  const meta = (authUser.user_metadata ?? {}) as Record<string, any>;

  let profile: Record<string, any> | null = null;
  try {
    const { data } = await getSupabase()
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();
    profile = data;
  } catch {
    profile = null;
  }

  const user: User = {
    id: authUser.id,
    name: profile?.name ?? meta.name ?? (authUser.email ?? '').split('@')[0],
    email: profile?.email ?? authUser.email ?? '',
    phone: profile?.phone ?? meta.phone ?? undefined,
    role: (profile?.role ?? meta.role ?? 'SALES_COORDINATOR') as User['role'],
    title: profile?.title ?? meta.title ?? undefined,
    avatarUrl: profile?.avatar_url ?? meta.avatar_url ?? undefined,
    createdAt: profile?.created_at ?? authUser.created_at ?? new Date().toISOString(),
  };

  return { user, token: session.access_token };
}
