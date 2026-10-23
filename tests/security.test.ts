import { describe, it, expect } from 'vitest';
import type { User } from '@supabase/supabase-js';
import { createRateLimiter, corsPolicy } from '../src/server/security';
import { roleOf, isApprovedUser } from '../src/server/auth';

describe('rate limiter', () => {
  it('blocks after the limit and recovers after the window', () => {
    const allow = createRateLimiter(3, 1000);
    expect([1, 2, 3].map(() => allow('a', 0))).toEqual([true, true, true]);
    expect(allow('a', 10)).toBe(false);
    expect(allow('b', 10)).toBe(true);
    expect(allow('a', 1500)).toBe(true);
  });
});

describe('roles', () => {
  const u = (app_metadata: Record<string, unknown>, email = 'x@y.com') => ({ app_metadata, email }) as unknown as User;
  it('defaults to admin and honours viewer/staff', () => {
    expect(roleOf(u({}))).toBe('admin');
    expect(roleOf(u({ crm_role: 'viewer' }))).toBe('viewer');
    expect(roleOf(u({ crm_role: 'staff' }))).toBe('staff');
    expect(roleOf(u({ crm_role: 'nonsense' }))).toBe('admin');
  });
  it('requires crm_access to be approved', () => {
    expect(isApprovedUser(u({ crm_access: true }))).toBe(true);
    expect(isApprovedUser(u({}))).toBe(false);
  });
});

describe('cors policy', () => {
  const run = (origin: string, path: string) => {
    const headers: Record<string, string> = {};
    const req: any = { headers: { origin }, path, method: 'POST' };
    const res: any = { setHeader: (k: string, v: string) => (headers[k] = v) };
    corsPolicy(req, res, () => {});
    return headers['Access-Control-Allow-Origin'];
  };
  it('opens only the enquiry endpoint to any site', () => {
    expect(run('https://evil.com', '/website-inquiry')).toBe('*');
    expect(run('https://evil.com', '/leads')).toBeUndefined();
    expect(run('https://crm.zsevents.in', '/leads')).toBe('https://crm.zsevents.in');
  });
});
