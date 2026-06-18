import type { TrendSource, Trend } from '@trendy/shared';
import { AppError } from '@trendy/shared';
import { logger } from '../lib/logger.js';
import { fetchTikTokTrends } from './TikTokTrendSource.js';
import { fetchPinterestTrends } from './PinterestTrendSource.js';
import type { RawTrend } from './TikTokTrendSource.js';

interface GeminiGroundedResponse {
  candidates?: Array<{
    content: { parts: Array<{ text?: string }> };
    groundingMetadata?: {
      webSearchQueries?: string[];
      groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
    };
  }>;
}

async function geminiGroundedSearch(prompt: string): Promise<string> {
  const apiKey = process.env['GEMINI_API_KEY'];
  if (!apiKey) throw new AppError('MISSING_CONFIG', 'GEMINI_API_KEY not configured', 500);

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tools: [{ google_search: {} }],
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new AppError('GEMINI_ERROR', `Gemini grounded search error ${res.status}: ${err}`, 502);
  }

  const data = (await res.json()) as GeminiGroundedResponse;
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

export class GeminiTrendSource implements TrendSource {
  async getTrendingTopics(): Promise<Trend[]> {
    const today = new Date().toISOString().slice(0, 10);

    // Fetch real data from TikTok and Pinterest in parallel
    const [tikTokRaw, pinterestRaw] = await Promise.all([
      fetchTikTokTrends().catch(() => [] as RawTrend[]),
      fetchPinterestTrends().catch(() => [] as RawTrend[]),
    ]);

    logger.info(
      { tikTokCount: tikTokRaw.length, pinterestCount: pinterestRaw.length },
      'Scraped raw trends'
    );

    const rawSignals = [
      ...tikTokRaw.slice(0, 10).map((t) => `TikTok: #${t.name}`),
      ...pinterestRaw.slice(0, 8).map((t) => `Pinterest: "${t.name}"`),
    ].join('\n');

    // Use Gemini with Google Search grounding to synthesize REAL current trends
    const prompt = `Today is ${today}. You are a visual trend analyst for a photo editing app.

${rawSignals.length > 0 ? `Here are signals from real platforms scraped right now:\n${rawSignals}\n\n` : ''}Use Google Search to find what visual aesthetics, photo styles, and fashion trends are viral TODAY on TikTok and Pinterest.

Generate 8 distinct AI photo template ideas based on what's actually trending. Each template should:
- Be a visual aesthetic people want to recreate in photos of themselves
- Be inspired by real viral TikTok/Pinterest content today
- Have a unique, scroll-stopping style

Return a JSON array (no markdown) where each object has:
- topic: specific trend name (3-5 words, e.g. "Dark Academia Library Look", "Soft Cottagecore Picnic")
- category: one of: kdrama, aesthetic, anime, fantasy, vintage, fashion, nature, urban
- keywords: array of 4 TikTok/Pinterest hashtags without # symbol
- score: relevance score 1-10 (10 = most viral right now)
- source: "tiktok" | "pinterest" | "google"
- trendContext: one sentence describing WHY this is trending right now

Return ONLY the JSON array.`;

    let text = '';
    try {
      text = await geminiGroundedSearch(prompt);
    } catch (e) {
      logger.warn({ err: e }, 'Gemini grounded search failed, falling back to ungrounded');
      // Fallback: ungrounded Gemini
      const apiKey = process.env['GEMINI_API_KEY']!;
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.8, maxOutputTokens: 2048 },
          }),
        }
      );
      const data = (await res.json()) as { candidates?: Array<{ content: { parts: Array<{ text?: string }> } }> };
      text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    }

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new AppError('GEMINI_PARSE_ERROR', 'Failed to parse Gemini trends response', 502);
    }

    const trends = JSON.parse(jsonMatch[0]) as Array<Partial<Trend> & { trendContext?: string }>;

    return trends
      .map((t) => ({
        topic: t.topic ?? 'Trending Aesthetic',
        category: t.category ?? 'aesthetic',
        keywords: Array.isArray(t.keywords) ? t.keywords : [],
        score: typeof t.score === 'number' ? t.score : 5,
        source: t.source ?? 'google',
        trendContext: t.trendContext,
      }))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }
}
