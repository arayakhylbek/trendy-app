import Replicate from 'replicate';
import { AppError } from '@trendy/shared';

const FACE_SWAP_VERSION =
  'cdingram/face-swap:d1d6ea8c8be89d664a07a457526f7128109dee7030fdac424788d762c71ed111';

function getClient(): Replicate {
  // Vercel uses REPLICATE_API_TOKEN, .env.local uses REPLICATE_TOKEN — accept both
  const token = process.env['REPLICATE_API_TOKEN'] ?? process.env['REPLICATE_TOKEN'];
  if (!token) throw new AppError('MISSING_CONFIG', 'REPLICATE_API_TOKEN not configured', 500);
  return new Replicate({ auth: token });
}

function dataUriToBlob(dataUri: string): Blob {
  const [header, data] = dataUri.split(',');
  const mimeType = header?.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
  const bytes = Buffer.from(data ?? '', 'base64');
  return new Blob([bytes], { type: mimeType });
}

async function toReplicateUrl(replicate: Replicate, input: string): Promise<string> {
  if (input.startsWith('http')) return input;
  const dataUri = input.startsWith('data:') ? input : `data:image/jpeg;base64,${input}`;
  const file = await replicate.files.create(dataUriToBlob(dataUri), { filename: 'image.jpg' });
  return file.urls.get;
}

async function fetchResultAsBase64(url: string): Promise<string> {
  const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new AppError('REPLICATE_FETCH', `Failed to fetch result: ${response.status}`, 502);
  const buffer = await response.arrayBuffer();
  return `data:image/jpeg;base64,${Buffer.from(buffer).toString('base64')}`;
}

/**
 * FLUX Kontext Pro — state-of-art identity-preserving scene transfer.
 * Takes user's selfie + scene description → generates the person in that scene.
 * Cosine similarity 0.92+ for face identity preservation.
 */
export async function fluxKontextFaceInsert(
  userPhotoBase64: string,
  scenePrompt: string,
): Promise<string> {
  const replicate = getClient();
  const userUrl = await toReplicateUrl(replicate, userPhotoBase64);

  const output = await replicate.run('black-forest-labs/flux-kontext-pro', {
    input: {
      prompt: `The same person from the input photo, now photographed in this exact setting: ${scenePrompt}. Keep the person's face, skin tone, eye shape, and facial features EXACTLY as in the input photo. Only change the background, environment, lighting, outfit, and pose to match the scene. Photorealistic, professional editorial photography, cinematic quality, 4K.`,
      input_image: userUrl,
      aspect_ratio: '2:3',
      output_format: 'jpg',
      safety_tolerance: 2,
      output_quality: 90,
    },
  }) as string | string[];

  const resultUrl = Array.isArray(output) ? output[0] : output;
  if (!resultUrl) throw new AppError('REPLICATE_EMPTY', 'Flux Kontext returned no output', 502);
  return fetchResultAsBase64(resultUrl);
}

/**
 * Real-ESRGAN + GFPGAN face enhance — upscales the final image and sharpens
 * facial detail after Gemini's ~1024px generation ceiling.
 */
export async function upscaleImage(imageBase64: string): Promise<string> {
  const replicate = getClient();
  const imageUrl = await toReplicateUrl(replicate, imageBase64);

  const output = (await replicate.run('nightmareai/real-esrgan', {
    input: { image: imageUrl, scale: 2, face_enhance: true },
  })) as string | string[];

  const resultUrl = Array.isArray(output) ? output[0] : output;
  if (!resultUrl) throw new AppError('REPLICATE_EMPTY', 'Upscale returned no output', 502);
  return fetchResultAsBase64(resultUrl);
}

/** Legacy face-swap — kept as fallback */
export async function faceSwap(
  templateInput: string,
  userPhotoBase64: string,
): Promise<string> {
  const replicate = getClient();
  const [templateUrl, userUrl] = await Promise.all([
    toReplicateUrl(replicate, templateInput),
    toReplicateUrl(replicate, `data:image/jpeg;base64,${userPhotoBase64}`),
  ]);

  const output = await replicate.run(FACE_SWAP_VERSION, {
    input: { input_image: templateUrl, swap_image: userUrl },
  }) as { url(): URL } | string;

  const resultUrl = typeof output === 'string' ? output : output.url().href;
  return fetchResultAsBase64(resultUrl);
}
