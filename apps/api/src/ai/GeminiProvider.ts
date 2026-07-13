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

    const raw = result.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const cleaned = raw.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new AppError('GEMINI_PARSE_ERROR', `No JSON in concept response: ${cleaned.slice(0, 300)}`, 502);
    }
    let parsed: TemplateConcept;
    try {
      parsed = JSON.parse(jsonMatch[0]) as TemplateConcept;
    } catch {
      throw new AppError('GEMINI_PARSE_ERROR', `Invalid concept JSON: ${jsonMatch[0].slice(0, 200)}`, 502);
    }
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
      'gemini-2.5-flash-image:generateContent',
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
    const result = await geminiPost('gemini-2.5-flash-image:generateContent', {
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

  // Photo retouching after face-swap: improves realism/quality without touching faces.
  async enhanceImage(imageBase64: string): Promise<string> {
    const data = imageBase64.replace(/^data:[^;]+;base64,/, '');
    const result = await geminiPost('gemini-2.5-flash-image:generateContent', {
      contents: [{
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data } },
          {
            text: `You are a professional photo retoucher. This image has a face-swap applied to it — the face is already correct and must not be touched.

TASK: Apply post-processing to make the image look more realistic and high quality. Think of this as Lightroom/Photoshop retouching, not image generation.

WHAT TO IMPROVE:
- Blend the face edges into the background more naturally (fix face-swap seams)
- Match the color temperature and lighting of the face to the scene lighting
- Reduce any "AI look" — make skin texture, hair, and clothing look like a real photo
- Sharpen details, reduce noise, improve dynamic range
- Apply subtle cinematic color grading that matches the scene mood

ABSOLUTE RULES — DO NOT VIOLATE:
- Do NOT change the face features, shape, or identity — the face is already correct
- Do NOT change the hairstyle, hair color, or hair length
- Do NOT alter the body, clothing, or pose
- Do NOT move, replace, or modify the background
- Do NOT regenerate or reimagine anything — only retouch what is there

Output: the same photo, retouched to look like a professional cinematic photograph.`,
          },
        ],
      }],
      generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
    });

    const parts = result.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p) => p.inlineData);
    if (!imagePart?.inlineData) {
      return imageBase64;
    }
    const { mimeType, data: outData } = imagePart.inlineData;
    return `data:${mimeType};base64,${outData}`;
  }

  async personalizeImage(
    faceSwappedBase64: string,
    templatePrompt: string,
  ): Promise<string> {
    const swappedData = faceSwappedBase64.replace(/^data:[^;]+;base64,/, '');

    // Independent variation axes — one random pick from each, so two users on the
    // same template land on the same combination only ~1 time in 1200
    const POSES = [
      'body turned 3/4 to the left, face looking back over the left shoulder toward the camera',
      'body turned 3/4 to the right, chin slightly raised, eyes directed straight at camera',
      'slight side profile facing right, face angled toward camera, hair falling naturally to one side',
      'facing camera directly, one hand lightly touching hair',
      'body angled left, weight shifted onto the back foot, relaxed stance',
      'leaning slightly forward toward the camera, engaged posture',
      'body turned away slightly, glancing back at the camera over the shoulder',
      'mid-motion candid — caught adjusting clothing or hair, natural unposed body language',
      'arms loosely crossed, shoulders relaxed, head tilted a few degrees',
      'one hand in pocket or resting at the hip, casual editorial stance',
    ];
    const ANGLES = [
      'camera at eye level, straight-on',
      'low camera angle from chest height looking slightly upward at the subject',
      'camera slightly above eye level, shooting down at a gentle angle, subject looking up toward the lens',
      'camera offset to the side, shooting at a 30-degree angle across the subject',
      'dynamic low angle from hip height looking up, editorial energy',
      'camera at eye level but rotated a few degrees for a subtle dutch tilt',
    ];
    const FRAMINGS = [
      'tight close-up crop from the chest up',
      'classic half-body portrait framing',
      'wider framing from a few steps back showing most of the body and more of the scene',
      'medium shot cropped mid-thigh, subject slightly off-center for a natural editorial composition',
    ];
    const EXPRESSIONS = [
      'confident direct gaze',
      'soft relaxed expression with the hint of a smile',
      'calm neutral editorial expression',
      'genuine warm smile',
      'candid mid-laugh moment, eyes slightly narrowed',
    ];
    const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]!;
    const pose = pick(POSES);
    const angle = pick(ANGLES);
    const framing = pick(FRAMINGS);
    const expression = pick(EXPRESSIONS);

    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: swappedData } });
    parts.push({
      text: `The attached photo is one frame from a professional photo shoot. Create the NEXT frame from the same shoot — the photographer changed the composition:

- Pose: ${pose}
- Camera angle: ${angle}
- Framing: ${framing}
- Expression: ${expression}

The new frame must look clearly different from the attached one (different pose, angle, framing). Everything else stays exactly the same:
- same person, same face
- same outfit and accessories
- same hairstyle
- same location, props and lighting
- any text or logos reproduced exactly, letter for letter

Scene: ${templatePrompt}

Make it look like a real photo from a professional camera: natural skin texture, sharp detailed eyes, detailed hair, realistic lighting, high sharpness, no AI artifacts.
The face especially must look like real photography: visible skin pores, fine facial hairs, subtle natural imperfections, real catchlights in the eyes — no smoothing, no airbrushed or beauty-filter look.`,
    });

    const result = await geminiPost('gemini-2.5-flash-image:generateContent', {
      contents: [{ parts }],
      generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
    });

    const responseParts = result.candidates?.[0]?.content?.parts ?? [];
    const imagePart = responseParts.find((p) => p.inlineData);
    if (!imagePart?.inlineData) {
      const textPart = responseParts.find((p) => p.text);
      console.warn(
        `personalizeImage: Gemini returned no image (text: ${textPart?.text?.slice(0, 200) ?? 'none'}) — falling back to enhance-only (pose will NOT change)`,
      );
      return this.enhanceImage(faceSwappedBase64);
    }
    const { mimeType, data: outData } = imagePart.inlineData;
    return `data:${mimeType};base64,${outData}`;
  }

  // Generates a personalized image using both the template image and the user's face photo
  async generateUserImage(templatePrompt: string, userImageBase64?: string, templateImageBase64?: string): Promise<string> {
    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

    if (userImageBase64 && templateImageBase64) {
      const templateMime = templateImageBase64.match(/^data:([^;]+);/)?.[1] ?? 'image/jpeg';

      // USER PHOTO FIRST — Gemini treats first image as the subject to transform
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: userImageBase64.replace(/^data:[^;]+;base64,/, ''),
        },
      });
      // TEMPLATE SECOND — used as style/scene reference
      parts.push({
        inlineData: {
          mimeType: templateMime,
          data: templateImageBase64.replace(/^data:[^;]+;base64,/, ''),
        },
      });
      parts.push({
        text: `You have two images.
Image 1: a selfie of a real person (their face, skin tone, eye shape, hair).
Image 2: a styled photo template (background, outfit, lighting, pose, scene).

Generate a single photorealistic portrait of the SAME PERSON from Image 1 placed into the SCENE from Image 2.

Rules:
- Face: reproduce the person's face from Image 1 as closely as possible — same eye shape, skin tone, facial bone structure, hair color and texture
- Scene: use the background, lighting, color palette, outfit and pose from Image 2
- The result must look like a real professional photo of that specific person in that setting
- Do NOT generate a random or generic face
- Photorealistic, cinematic, editorial quality

Scene: ${templatePrompt}`,
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
      'gemini-2.5-flash-image:generateContent',
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
