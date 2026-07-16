import { AppError } from '@trendy/shared';

// OpenAI GPT Image via the images/edits endpoint. Same signature as the Gemini
// service's generateFromPrompt so generate.ts can switch providers with one env
// var (IMAGE_PROVIDER=openai). Model id is overridable via OPENAI_IMAGE_MODEL
// (e.g. 'gpt-image-1', or a newer id like 'gpt-image-2' once confirmed).
const IMAGE_MODEL = process.env['OPENAI_IMAGE_MODEL'] ?? 'gpt-image-1';

// Accepts an http(s) URL, a data URI, or a raw base64 string → Blob
async function toBlob(input: string): Promise<Blob> {
  if (input.startsWith('http')) {
    const res = await fetch(input, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new AppError('IMAGE_FETCH', `Failed to fetch image: ${res.status}`, 502);
    return await res.blob();
  }
  const match = input.match(/^data:([^;]+);base64,(.*)$/s);
  const mime = match ? match[1]! : 'image/jpeg';
  const b64 = match ? match[2]! : input;
  return new Blob([Buffer.from(b64, 'base64')], { type: mime });
}

function buildPrompt(promptText: string): string {
  return `${promptText}

STRICT RULES:
- The attached photo(s) are the identity reference(s) of the real person/people (in order: reference image 1, then 2). Reproduce each person's face with MAXIMUM likeness — the output face must be unmistakably the SAME person as their reference. Copy the underlying facial features and geometry exactly: overall face shape, jawline, chin, cheekbones, forehead and hairline; eye shape, size, spacing and iris color; eyebrow shape and thickness; nose bridge, length and tip; lip shape and proportions; skin tone and undertone; and every distinguishing mark (moles, freckles) in the same places. Age, gender and ethnicity must read identical to the reference. Do NOT beautify, slim, smooth, or idealize the face.
- Copy the FEATURES only — NOT the reference photo's expression, gaze, head angle, lighting or crop. The person's expression, pose, and framing come from the description above.
- Follow the description above EXACTLY. Do not add objects, props, text, people, or background elements that are not written in it.
- Output a photorealistic 9:16 vertical image (TikTok / Instagram Reels).`;
}

/**
 * Prompt-only generation on GPT Image: the template's stored text prompt + the
 * user's face photo(s) → a finished personalized shot. Mirrors the Gemini
 * service so it's a drop-in provider swap.
 */
export async function generateFromPrompt(
  promptText: string,
  userPhotoBase64: string,
  userPhoto2Base64?: string,
): Promise<string> {
  const apiKey = process.env['OPENAI_API_KEY'];
  if (!apiKey) throw new AppError('MISSING_CONFIG', 'OPENAI_API_KEY not configured', 500);

  const [blob1, blob2] = await Promise.all([
    toBlob(userPhotoBase64),
    userPhoto2Base64 ? toBlob(userPhoto2Base64) : Promise.resolve(undefined),
  ]);

  const form = new FormData();
  form.append('model', IMAGE_MODEL);
  form.append('prompt', buildPrompt(promptText));
  form.append('size', '1024x1536'); // portrait; closest GPT Image size to 9:16
  // input_fidelity preserves the input face, but only gpt-image-1/1.5 accept it;
  // gpt-image-2 rejects it with a 400 (invalid_input_fidelity_model).
  if (IMAGE_MODEL.startsWith('gpt-image-1')) {
    form.append('input_fidelity', 'high');
  }
  // Return JPEG, not the default PNG: a 1024x1536 PNG base64 blows past Vercel's
  // 4.5 MB serverless response limit → the function 502s with an empty body.
  form.append('output_format', 'jpeg');
  form.append('image[]', blob1, 'reference-1.png');
  if (blob2) form.append('image[]', blob2, 'reference-2.png');

  const res = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
    // gpt-image-2 (esp. high quality + edits) can take >2 min; stay under the
    // Vercel function maxDuration (300s) so we fail gracefully, not killed.
    signal: AbortSignal.timeout(280000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error(`[openai] images error ${res.status} model=${IMAGE_MODEL}: ${detail.slice(0, 800)}`);
    throw new AppError(
      'OPENAI_IMAGE_ERROR',
      `OpenAI images error ${res.status}: ${detail.slice(0, 500)}`,
      502,
    );
  }

  const data = (await res.json()) as { data?: Array<{ b64_json?: string }> };
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new AppError('OPENAI_IMAGE_EMPTY', 'OpenAI returned no image', 502);
  const bytes = Math.round((b64.length * 3) / 4);
  console.log(`[openai] image ok model=${IMAGE_MODEL} ~${Math.round(bytes / 1024)}KB (base64 ${b64.length})`);
  return `data:image/jpeg;base64,${b64}`;
}
