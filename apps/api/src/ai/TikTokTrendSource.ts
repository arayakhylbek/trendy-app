import { logger } from '../lib/logger.js';

export interface RawTrend {
  name: string;
  type: 'hashtag' | 'keyword' | 'topic';
  score: number;
  source: 'tiktok' | 'pinterest' | 'google';
}

interface TikTokHashtag {
  hashtag_name?: string;
  hashtag_id?: string;
  rank?: number;
  video_posts?: number;
}

interface TikTokResponse {
  code?: number;
  data?: {
    list?: TikTokHashtag[];
  };
}

// TikTok Creative Center – public API, no auth required
export async function fetchTikTokTrends(): Promise<RawTrend[]> {
  try {
    const url =
      'https://ads.tiktok.com/business/creativecenter/api/v1/trending_hashtags/list?' +
      new URLSearchParams({
        period: '7',
        country_code: 'US',
        page_size: '20',
      });

    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36',
        Referer: 'https://ads.tiktok.com/business/creativecenter/inspiration/trending/hashtag/pc/en',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      logger.warn({ status: res.status }, 'TikTok Creative Center returned non-200');
      return [];
    }

    const json = (await res.json()) as TikTokResponse;
    const list = json?.data?.list ?? [];

    return list.map((item, i) => ({
      name: (item.hashtag_name ?? '').replace(/^#/, ''),
      type: 'hashtag' as const,
      score: Math.max(1, 10 - i),
      source: 'tiktok' as const,
    })).filter((t) => t.name.length > 0).slice(0, 15);
  } catch (e) {
    logger.warn({ err: e }, 'TikTok trend fetch failed');
    return [];
  }
}
