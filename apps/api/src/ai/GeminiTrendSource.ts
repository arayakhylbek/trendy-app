import type { TrendSource, Trend } from '@trendy/shared';
import { AppError } from '@trendy/shared';

interface GeminiTextResponse {
  candidates?: Array<{
    content: { parts: Array<{ text?: string }> };
  }>;
}

export class GeminiTrendSource implements TrendSource {
  async getTrendingTopics(): Promise<Trend[]> {
    const apiKey = process.env['GEMINI_API_KEY'];
    if (!apiKey) throw new AppError('MISSING_CONFIG', 'GEMINI_API_KEY not configured', 500);

    const today = new Date().toISOString().slice(0, 10);
    const prompt = `Today is ${today}. List 5 currently trending aesthetic, cultural, or visual themes popular on TikTok and Instagram.

For each trend, return a JSON array item with:
- topic: trend name (2-4 words)
- category: one of: kdrama, aesthetic, anime, fantasy, vintage
- keywords: array of 3 related keywords
- score: relevance score 1-10
- source: "gemini"

Return ONLY a valid JSON array, no markdown.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      }
    );

    if (!res.ok) {
      throw new AppError('GEMINI_ERROR', `Gemini trends error ${res.status}`, 502);
    }

    const data = (await res.json()) as GeminiTextResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      throw new AppError('GEMINI_PARSE_ERROR', 'Failed to parse Gemini trends response', 502);
    }

    const trends = JSON.parse(jsonMatch[0]) as Trend[];
    return trends.map((t) => ({
      topic: t.topic ?? 'Unknown trend',
      category: t.category ?? 'aesthetic',
      keywords: t.keywords ?? [],
      score: t.score ?? 5,
      source: 'gemini',
    }));
  }
}
