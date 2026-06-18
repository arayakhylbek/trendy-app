import { logger } from '../lib/logger.js';
import type { RawTrend } from './TikTokTrendSource.js';

interface PinterestSuggestItem {
  display_name?: string;
  term?: string;
  query?: string;
}

interface PinterestSuggestResponse {
  data?: PinterestSuggestItem[];
  items?: PinterestSuggestItem[];
}

// Aesthetic search seeds to extract trending topics from Pinterest
const SEED_QUERIES = ['aesthetic', 'outfit', 'vintage', 'dreamy', 'editorial'];

// Pinterest public search suggestions – no auth required
export async function fetchPinterestTrends(): Promise<RawTrend[]> {
  const results: RawTrend[] = [];

  for (const seed of SEED_QUERIES) {
    try {
      const url =
        `https://www.pinterest.com/resource/SearchBarResource/get/?` +
        new URLSearchParams({
          source_url: '/',
          data: JSON.stringify({
            options: { q: seed, article: 'pin', corpus: 'pins', followed_only: false, bookmarks: [] },
            context: {},
          }),
          _: String(Date.now()),
        });

      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36',
          'X-Pinterest-AppState': 'active',
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(6000),
      });

      if (!res.ok) continue;

      const json = (await res.json()) as { resource_response?: PinterestSuggestResponse };
      const items = json?.resource_response?.data ?? json?.resource_response?.items ?? [];

      for (const item of items.slice(0, 4)) {
        const name = item.display_name ?? item.term ?? item.query ?? '';
        if (name) {
          results.push({ name, type: 'keyword', score: 6, source: 'pinterest' });
        }
      }
    } catch (e) {
      logger.warn({ err: e, seed }, 'Pinterest trend fetch failed for seed');
    }
  }

  // De-duplicate by name
  const seen = new Set<string>();
  return results.filter((t) => {
    const key = t.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
