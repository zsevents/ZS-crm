import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '../src/server/db';
import { runExpoFinder, finderState } from '../src/server/expoFinder';

const results = [
  { title: 'Bangalore Wedding Expo 2026 | Palace Grounds', link: 'https://example.com/bwe-2026', snippet: 'Join us 12-14 Dec 2099 at Palace Grounds, Bengaluru' },
  { title: 'Old Wedding Fair', link: 'https://example.com/old', snippet: 'Held on March 3, 2020 in Chennai' },
  { title: 'Top 10 wedding venues in Bangalore', link: 'https://example.com/venues', snippet: 'Article' },
  { title: 'Bridal Fair Bengaluru - Tickets', link: 'https://www.instagram.com/p/abc', snippet: 'Fair' },
];

describe('expo finder', () => {
  beforeEach(() => {
    db.expos = [];
    (db.settings as any).expoFinder = undefined;
    process.env.SERPAPI_KEY = 'test';
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ organic_results: results }))));
  });
  afterEach(() => vi.unstubAllGlobals());

  it('adds expos once, skips non-expo pages and counts searches', async () => {
    const first = await runExpoFinder('manual');
    expect(first.added).toBe(2);
    expect(db.expos.map((e) => e.status)).toEqual(['DISCOVERED', 'DISCOVERED']);
    expect(db.expos.find((e) => e.sourceUrl?.includes('instagram'))?.source).toBe('INSTAGRAM');
    expect(finderState().searchesUsed).toBe(first.searches);
    const bwe = db.expos.find((e) => e.sourceUrl === 'https://example.com/bwe-2026')!;
    expect([bwe.startDate, bwe.endDate, bwe.city]).toEqual(['2099-12-12', '2099-12-14', 'Bengaluru']);
    expect(db.expos.some((e) => e.name === 'Old Wedding Fair')).toBe(false); // already over

    const second = await runExpoFinder('manual');
    expect(second.added).toBe(0); // duplicates are not added again
  });

  it('refuses to run without a SerpApi key', async () => {
    delete process.env.SERPAPI_KEY;
    await expect(runExpoFinder('manual')).rejects.toThrow(/SERPAPI_KEY/);
  });
});
