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

    // Mix of body-pose changes and camera-angle changes so results vary in more than one way
    const POSES = [
      'body turned 3/4 to the left, face looking back over the left shoulder toward the camera, confident gaze',
      'body turned 3/4 to the right, chin slightly raised, eyes directed straight at camera with a soft expression',
      'slight side profile facing right, face angled toward camera, hair falling naturally to one side',
      'facing camera directly, one hand lightly touching hair, relaxed candid expression',
      'body angled left, weight on back foot, eyes looking at camera with a calm confident look',
      'leaning slightly forward toward camera, intimate close framing, direct eye contact',
      'low camera angle looking slightly upward at the subject, subject looking down toward camera with a calm expression',
      'body turned away slightly, glancing back at camera over the shoulder with a natural expression',
      'camera positioned slightly higher than eye level, shooting down at a gentle angle, subject looking up toward the lens',
      'wider framing shot from a few steps back showing more of the body and scene, subject turned slightly to one side',
      'close-up crop from chest height, camera at eye level, subject looking directly into the lens',
      'dynamic low angle from hip height looking up, subject glancing down toward camera, editorial energy',
    ];
    const pose = POSES[Math.floor(Math.random() * POSES.length)]!;

    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: swappedData } });
    parts.push({
      text: `The attached image is one frame from a professional photo shoot of a real person. Generate the NEXT frame from the same shoot: the photographer has asked the subject to change position, and moved the camera.

THE NEW SHOT — this is the whole point of the task:
${pose}

The new frame MUST be composed clearly differently from the attached one. If the output has the same pose, same framing, and same camera angle as the input, the task has FAILED. Move the body, move the camera, re-compose.

SAME SHOOT, SAME EVERYTHING ELSE:
- Same person: identical face, bone structure, skin tone, identity — this is a real individual and must stay recognizably them
- Same outfit: identical clothes, colors, accessories
- Same location and lighting setup: the same environment and mood, naturally seen from the new camera position
- Same hairstyle, hair color, and length

PHOTOGRAPHIC QUALITY — render the new frame hyper-realistically:
- Skin: natural pores, texture, fine hairs, faint imperfections — no plastic, waxy, or airbrushed AI look
- Eyes: sharp, wet, alive — real catchlights matching the scene's light sources, natural iris detail, visible eyelashes
- Face: seamlessly lit and integrated — lighting direction, color temperature, and shadows (nose, chin, cheekbones, eye sockets) must match the scene from the new angle
- Hair: individual strands, natural flyaways, per-strand lighting
- Lens realism: subtle film grain, natural depth of field, cinematic color grade matching the scene mood
- Sharpness: crisp high-resolution detail on face and clothing — no softness, blur, warping, or AI artifacts

Scene context: ${templatePrompt}

Output: a single photorealistic photograph — the next frame of the same person, same outfit, same scene, in the new pose and camera angle.`,
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
