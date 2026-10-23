import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '../src/server/db';
import { runExpoFinder, finderState } from '../src/server/expoFinder';

const results = [
  { title: 'Bangalore Wedding Expo 2026 | Palace Grounds', link: 'https://example.com/bwe-2026', snippet: 'Dec 12-14' },
  { title: 'Top 10 wedding venues in Bangalore', link: 'https://example.com/venues', snippet: 'Article' },
  { title: 'Bridal Fair Bengaluru - Tickets', link: 'https://www.instagram.com/p/abc', snippet: 'Fair' },
];

describe('expo finder (no AI key: titles only)', () => {
  beforeEach(() => {
    db.expos = [];
    (db.settings as any).expoFinder = undefined;
    process.env.SERPAPI_KEY = 'test';
    delete process.env.ANTHROPIC_API_KEY;
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ organic_results: results }))));
  });
  afterEach(() => vi.unstubAllGlobals());

  it('adds expos once, skips non-expo pages and counts searches', async () => {
    const first = await runExpoFinder('manual');
    expect(first.added).toBe(2);
    expect(db.expos.map((e) => e.status)).toEqual(['DISCOVERED', 'DISCOVERED']);
    expect(db.expos.find((e) => e.sourceUrl?.includes('instagram'))?.source).toBe('INSTAGRAM');
    expect(finderState().searchesUsed).toBe(first.searches);

    const second = await runExpoFinder('manual');
    expect(second.added).toBe(0); // duplicates are not added again
  });

  it('refuses to run without a SerpApi key', async () => {
    delete process.env.SERPAPI_KEY;
    await expect(runExpoFinder('manual')).rejects.toThrow(/SERPAPI_KEY/);
  });
});
