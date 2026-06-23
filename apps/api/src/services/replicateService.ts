import Replicate from 'replicate';
import { AppError } from '@trendy/shared';

const FACE_SWAP_VERSION =
  'cdingram/face-swap:d1d6ea8c8be89d664a07a457526f7128109dee7030fdac424788d762c71ed111';

const CODEFORMER_VERSION =
  'sczhou/codeformer:27778a621403be737f3b7dc4f1e355f9cc8e856e733b1900a587015f400d0b17';

function getClient(): Replicate {
  const token = process.env['REPLICATE_API_TOKEN'];
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
  if (input.startsWith('http')) {
    // Already a URL — Replicate can fetch directly
    return input;
  }
  // base64 data URI — upload to Replicate
  const file = await replicate.files.create(dataUriToBlob(input), {
    filename: 'image.jpg',
  });
  return file.urls.get;
}

export async function faceSwap(
  templateInput: string,
  userPhotoBase64: string,
): Promise<string> {
  const replicate = getClient();

  const [templateUrl, userUrl] = await Promise.all([
    toReplicateUrl(replicate, templateInput),
    toReplicateUrl(replicate, `data:image/jpeg;base64,${userPhotoBase64}`),
  ]);

  // Step 1: face swap
  const swapOutput = await replicate.run(FACE_SWAP_VERSION, {
    input: { input_image: templateUrl, swap_image: userUrl },
  }) as { url(): URL } | string;
  const swapUrl = typeof swapOutput === 'string' ? swapOutput : swapOutput.url().href;

  // Step 2: CodeFormer face restoration — fixes blurry eyes, artifacts, sharpens face
  const restoredOutput = await replicate.run(CODEFORMER_VERSION, {
    input: {
      image: swapUrl,
      codeformer_fidelity: 0.7,
      background_enhance: true,
      face_upsample: true,
      upscale: 2,
    },
  }) as string | { url(): URL };
  const restoredUrl = typeof restoredOutput === 'string' ? restoredOutput : restoredOutput.url().href;

  const response = await fetch(restoredUrl, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) {
    throw new AppError('REPLICATE_FETCH', `Failed to fetch result: ${response.status}`, 502);
  }

  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  return `data:image/jpeg;base64,${base64}`;
}
