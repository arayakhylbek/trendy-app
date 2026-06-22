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
      signal: AbortSignal.timeout(55000),
    }
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new AppError('GEMINI_ERROR', `Gemini API error ${res.status}: ${detail}`, 502);
  }

  return res.json() as Promise<GeminiResponse>;
}

export class GeminiProvider implements AIProvider {
  async generateTemplateConcept(trend: Trend & { trendContext?: string }): Promise<TemplateConcept> {
    const contextHint = trend.trendContext ? `\nContext: ${trend.trendContext}` : '';
    const keywordsHint =
      trend.keywords?.length > 0 ? `\nRelated hashtags: ${trend.keywords.join(', ')}` : '';

    const prompt = `You are a creative director for a viral photo app. Create an AI photo template concept.

Trend: "${trend.topic}" (${trend.category})${contextHint}${keywordsHint}

The template will be used so users can insert their face/photo into a generated scene. Design it to be:
- Highly shareable on TikTok/Instagram
- Photorealistic, cinematic quality
- Have a clear aesthetic identity

Return ONLY valid JSON with these fields:
{
  "emoji": "single relevant emoji",
  "label": "catchy 2-3 word name",
  "style": "style descriptor (1-2 words, e.g. Cinematic, Ethereal, Editorial)",
  "cat": "one of: kdrama, aesthetic, anime, fantasy, vintage, fashion, nature, urban",
  "prompt": "detailed image generation prompt (100-150 words): describe the full scene, lighting, colors, mood, camera angle, background details. Include 'face placeholder area' or 'portrait position' for where the user's face will go. Optimized for Gemini image generation."
}`;

    const result = await geminiPost('gemini-2.5-flash:generateContent', {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.9, maxOutputTokens: 1024 },
    });

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new AppError('GEMINI_PARSE_ERROR', 'Failed to parse concept response', 502);
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

  // Generates a template preview image (no user face)
  async generateTemplateImage(concept: TemplateConcept): Promise<string> {
    const result = await geminiPost(
      'gemini-2.0-flash-preview-image-generation:generateContent',
      {
        contents: [
          {
            parts: [
              {
                text: `Create a stunning, photorealistic template preview image for social media.

Style: ${concept.style} | Category: ${concept.cat}
Label: ${concept.label} ${concept.emoji}

Image generation prompt:
${concept.prompt}

Requirements:
- Photorealistic, professional photography quality
- Cinematic lighting and composition
- Leave a natural portrait/face area visible in the foreground
- Do NOT include a real human face, show the scene empty or with a silhouette placeholder
- Ultra high quality, 4K detail`,
              },
            ],
          },
        ],
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

  // Generates a styled template image (with a person, no user face) for face-swap
  async generateTemplateOnly(prompt: string): Promise<string> {
    const result = await geminiPost('gemini-2.0-flash-preview-image-generation:generateContent', {
      contents: [{
        parts: [{
          text: `Generate a photorealistic styled portrait photo of a person:\n\n${prompt}\n\nRequirements:\n- A person must be clearly visible with a well-lit face\n- Professional photography, cinematic quality\n- The face should be prominent in the frame\n- Photorealistic, high detail`,
        }],
      }],
      generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
    });

    const parts = result.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p) => p.inlineData);
    if (!imagePart?.inlineData) {
      throw new AppError('GEMINI_NO_IMAGE', 'No template image returned from Gemini', 502);
    }
    const { mimeType, data } = imagePart.inlineData;
    return `data:${mimeType};base64,${data}`;
  }

  // Generates a personalized image using both the template image and the user's face photo
  async generateUserImage(templatePrompt: string, userImageBase64?: string, templateImageBase64?: string): Promise<string> {
    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

    if (userImageBase64 && templateImageBase64) {
      // Face-swap: send template image first, then user face image
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: templateImageBase64.replace(/^data:[^;]+;base64,/, ''),
        },
      });
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: userImageBase64.replace(/^data:[^;]+;base64,/, ''),
        },
      });
      parts.push({
        text: 'Take the first image as the base template. Replace ONLY the face in the first image with the face from the second image. Keep absolutely everything else exactly the same — same background, same clothes, same pose, same lighting, same composition. Only the face should change. The result must look natural and photorealistic.',
      });
    } else if (userImageBase64) {
      const base64Data = userImageBase64.replace(/^data:[^;]+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Data,
        },
      });
      parts.push({
        text: `You have the user's photo above. Apply this visual style template to them:\n\n${templatePrompt}\n\nInstructions:\n- Preserve the person's facial features, skin tone, and likeness\n- Apply the template's background, lighting, color grade, and artistic style\n- Blend the person naturally into the scene\n- Output a high-quality, photorealistic, portrait-format image\n- Make it look like a professional styled photo shoot`,
      });
    } else {
      parts.push({
        text: `Generate a high-quality, photorealistic styled portrait image:\n\n${templatePrompt}\n\nCreate a beautiful, magazine-quality photo that would go viral on TikTok and Instagram.\nPortrait orientation, cinematic lighting, ultra-detailed.`,
      });
    }

    const result = await geminiPost(
      'gemini-2.0-flash-preview-image-generation:generateContent',
      {
        contents: [{ parts }],
        generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
      }
    );

    const responseParts = result.candidates?.[0]?.content?.parts ?? [];
    const imagePart = responseParts.find((p) => p.inlineData);
    if (!imagePart?.inlineData) {
      throw new AppError('GEMINI_NO_IMAGE', 'No image returned from Gemini', 502);
    }

    const { mimeType, data } = imagePart.inlineData;
    return `data:${mimeType};base64,${data}`;
  }
}
