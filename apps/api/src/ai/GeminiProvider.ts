import type { AIProvider, Trend, TemplateConcept } from '@trendy/shared';
import { AppError } from '@trendy/shared';

interface GeminiResponse {
  candidates?: Array<{
    content: { parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> };
  }>;
}

async function geminiPost(endpoint: string, body: unknown): Promise<GeminiResponse> {
  const apiKey = process.env['GEMINI_API_KEY'];
  if (!apiKey) throw new AppError('MISSING_CONFIG', 'GEMINI_API_KEY not configured', 500);

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${endpoint}?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new AppError('GEMINI_ERROR', `Gemini API error ${res.status}: ${detail}`, 502);
  }

  return res.json() as Promise<GeminiResponse>;
}

export class GeminiProvider implements AIProvider {
  async generateTemplateConcept(trend: Trend): Promise<TemplateConcept> {
    const prompt = `Generate a creative AI photo template for the trending topic: "${trend.topic}" (${trend.category}).

Return a JSON object with these exact fields:
- emoji: a single relevant emoji
- label: a catchy name (2-3 words)
- style: a short style description (1-2 words, e.g. "Cinematic", "Aesthetic", "Editorial")
- cat: category from this list: kdrama, aesthetic, anime, fantasy, vintage
- prompt: a detailed image generation prompt (80-120 words) optimized for AI face insertion, photorealistic, viral on TikTok/Instagram

Return ONLY valid JSON, no markdown.`;

    const result = await geminiPost('gemini-2.0-flash:generateContent', {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.9, maxOutputTokens: 1024 },
    });

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new AppError('GEMINI_PARSE_ERROR', 'Failed to parse Gemini concept response', 502);
    }

    const parsed = JSON.parse(jsonMatch[0]) as TemplateConcept;
    return {
      emoji: parsed.emoji ?? '✨',
      label: parsed.label ?? trend.topic,
      style: parsed.style ?? 'Aesthetic',
      cat: parsed.cat ?? 'aesthetic',
      prompt: parsed.prompt ?? '',
    };
  }

  async generateTemplateImage(concept: TemplateConcept): Promise<string> {
    const result = await geminiPost(
      'gemini-2.0-flash-preview-image-generation:generateContent',
      {
        contents: [{ parts: [{ text: concept.prompt }] }],
        generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
      }
    );

    const parts = result.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p) => p.inlineData);

    if (!imagePart?.inlineData) {
      throw new AppError('GEMINI_NO_IMAGE', 'No image returned from Gemini', 502);
    }

    const { mimeType, data } = imagePart.inlineData;
    return `data:${mimeType};base64,${data}`;
  }
}
