import { AppError } from '@trendy/shared';

// Nano Banana Pro via the Gemini Interactions API.
// Replaces the Replicate pipeline (face-swap + Real-ESRGAN upscale) — see
// services/replicateService.ts for the commented-out legacy implementation.
const IMAGE_MODEL = 'gemini-3-pro-image';

type InputPart =
  | { type: 'text'; text: string }
  | { type: 'image'; mime_type: string; data: string };

interface InteractionResponse {
  output_image?: { data?: string; mime_type?: string };
  steps?: Array<{
    type?: string;
    content?: Array<{ type?: string; data?: string; mime_type?: string }>;
  }>;
}

async function interactionsPost(
  input: InputPart[],
  imageSize: '1K' | '2K' | '4K' = '2K',
): Promise<string> {
  const apiKey = process.env['GEMINI_API_KEY'];
  if (!apiKey) throw new AppError('MISSING_CONFIG', 'GEMINI_API_KEY not configured', 500);

  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      input,
      response_format: { type: 'image', mime_type: 'image/jpeg', image_size: imageSize },
    }),
    signal: AbortSignal.timeout(120000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new AppError('GEMINI_IMAGE_ERROR', `Interactions API error ${res.status}: ${detail.slice(0, 500)}`, 502);
  }

  const data = (await res.json()) as InteractionResponse;

  // Preferred: the convenience property
  if (data.output_image?.data) {
    return `data:${data.output_image.mime_type ?? 'image/jpeg'};base64,${data.output_image.data}`;
  }
  // Fallback: scan the steps array for an image content block
  for (const step of data.steps ?? []) {
    for (const block of step.content ?? []) {
      if (block.type === 'image' && block.data) {
        return `data:${block.mime_type ?? 'image/jpeg'};base64,${block.data}`;
      }
    }
  }
  throw new AppError('GEMINI_IMAGE_EMPTY', 'Interactions API returned no image', 502);
}

// Accepts an http(s) URL, a data URI, or a raw base64 string
async function toImagePart(input: string): Promise<InputPart> {
  if (input.startsWith('http')) {
    const response = await fetch(input, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) {
      throw new AppError('IMAGE_FETCH', `Failed to fetch image: ${response.status}`, 502);
    }
    const mime = response.headers.get('content-type')?.split(';')[0] ?? 'image/jpeg';
    const buffer = await response.arrayBuffer();
    return { type: 'image', mime_type: mime, data: Buffer.from(buffer).toString('base64') };
  }
  const match = input.match(/^data:([^;]+);base64,(.*)$/s);
  if (match) return { type: 'image', mime_type: match[1]!, data: match[2]! };
  return { type: 'image', mime_type: 'image/jpeg', data: input };
}

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

/**
 * Single-call generation on Nano Banana Pro: template + user face photo(s) →
 * finished personalized shot at 2K. Replaces the legacy 3-step chain
 * (faceSwap → personalizeImage → upscaleImage) with one request.
 */
export async function generatePersonalizedShot(
  templateInput: string,
  userPhotoBase64: string,
  userPhoto2Base64: string | undefined,
  scenePrompt: string,
): Promise<string> {
  const [templatePart, userPart, user2Part] = await Promise.all([
    toImagePart(templateInput),
    toImagePart(userPhotoBase64),
    userPhoto2Base64 ? toImagePart(userPhoto2Base64) : Promise.resolve(undefined),
  ]);

  const pose = pick(POSES);
  const angle = pick(ANGLES);
  const framing = pick(FRAMINGS);
  const expression = pick(EXPRESSIONS);

  const subjectLines = user2Part
    ? `The FIRST and SECOND images are the SOURCE FACES — two real people. The most prominent person in the template gets the face from the FIRST image, the other person gets the face from the SECOND image.`
    : `The FIRST image is the SOURCE FACE — a real person.`;

  const text = `Perform a FACE REPLACEMENT combined with a RECOMPOSITION, producing one photograph.

${subjectLines}
The LAST image is the TARGET TEMPLATE.

STEP 1 — REPLACE THE FACE:
Take the template photo and completely replace the face of the person in it with the face from the source photo: exact facial features, bone structure, eye shape, nose, lips, jawline, and skin tone of the SOURCE person. The template person's face is DELETED — none of their facial features may survive into the output, no matter how clear or prominent their face is. If the output face resembles the template's person or a blend of the two people, the task has FAILED. Keep the template's hairstyle, adapted naturally to the new face.

STEP 2 — KEEP THE TEMPLATE'S WORLD:
- Outfit: the EXACT clothing from the template — same garments, colors, fabrics, accessories. Do not invent or substitute clothing; if a garment is only partially visible, extend it plausibly in the same style
- Text and graphics: if the template contains text, logos, or overlays (e.g. a magazine cover), reproduce them EXACTLY, character-for-character, in the same fonts, colors, and layout — including stylized or fictional brand names. Do not correct, translate, or substitute any word
- Location, props, and lighting mood: the same environment and atmosphere

STEP 3 — RECOMPOSE THE SHOT (do NOT copy the template's pose and framing):
- Pose: ${pose}
- Camera: ${angle}
- Framing: ${framing}
- Expression: ${expression}
The background may naturally shift, reveal, or blur as this camera move would cause.

QUALITY — render at flagship-camera, magazine-cover level; do not inherit any flaws or artifacts from the input images:
- Skin: natural pores, texture, fine hairs, faint imperfections — no plastic, waxy, or airbrushed AI look
- Eyes: sharp, wet, alive — real catchlights matching the scene's light sources, natural iris detail, visible eyelashes
- Lighting: fully coherent from the new camera position — direction, color temperature, and shadows consistent with the scene's light sources
- Hair: individual strands, natural flyaways, per-strand lighting
- Lens realism: subtle film grain, natural depth of field appropriate to the framing, cinematic color grade matching the scene mood
- Sharpness: crisp high-resolution detail on the face and clothing — no blur, warping, or artifacts

Scene context: ${scenePrompt}

Output: one photorealistic photograph — the source person's face, in the template's outfit and world, in the new pose, angle, and framing specified above.

FINAL CHECK before you output: compare the face in your result against the SOURCE face (the FIRST image). It must be the SAME person — same eyes, nose, lips, jawline, and skin tone. Not the template's person, not a blend.`;

  const input: InputPart[] = [{ type: 'text', text }, userPart];
  if (user2Part) input.push(user2Part);
  input.push(templatePart);

  return interactionsPost(input, '2K');
}

/**
 * Face swap on Nano Banana Pro: puts the face from the user's photo onto the
 * person in the template image. Same signature as the legacy Replicate version.
 */
export async function faceSwap(
  templateInput: string,
  userPhotoBase64: string,
): Promise<string> {
  const [templatePart, userPart] = await Promise.all([
    toImagePart(templateInput),
    toImagePart(userPhotoBase64),
  ]);

  return interactionsPost([
    {
      type: 'text',
      text: `The FIRST image is a template photo. The SECOND image shows a real person's face.

Replace the face of the person in the FIRST image with the face of the person from the SECOND image. The result must be the exact same template photo — same pose, body, outfit, background, lighting, framing — but the person's face, facial features, and skin tone are now those of the person from the SECOND image, seamlessly blended: matching the scene's lighting direction, color temperature, and grain, with no visible seams.

Do not change anything else in the template. Output only the edited photograph.`,
    },
    templatePart,
    userPart,
  ]);
}

/**
 * Quality upscale on Nano Banana Pro: re-renders the image at 2K with
 * retouch-only instructions. Replaces the legacy Real-ESRGAN upscale.
 */
export async function upscaleImage(imageBase64: string): Promise<string> {
  const imagePart = await toImagePart(imageBase64);

  return interactionsPost(
    [
      {
        type: 'text',
        text: `Upscale and retouch this photograph. This is a retouch-only task — do NOT change the person's identity, face, pose, outfit, background, or composition in any way.

Improve: resolution and sharpness, natural skin texture (pores, fine detail — no plastic airbrushed look), crisp eyes with real catchlights, individual hair strands, clean edges, reduced noise and compression artifacts, subtle cinematic color grade consistent with the existing mood.

Output the same photograph at maximum photographic quality.`,
      },
      imagePart,
    ],
    '2K',
  );
}
