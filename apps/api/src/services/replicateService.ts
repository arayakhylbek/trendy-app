import Replicate from 'replicate';
import { AppError } from '@trendy/shared';

const FACE_SWAP_VERSION =
  'cdingram/face-swap:d1d6ea8c8be89d664a07a457526f7128109dee7030fdac424788d762c71ed111';

function getClient(): Replicate {
  const token = process.env['REPLICATE_API_TOKEN'];
  if (!token) throw new AppError('MISSING_CONFIG', 'REPLICATE_API_TOKEN not configured', 500);
  return new Replicate({ auth: token });
}

export async function faceSwap(
  templateBase64: string,
  userPhotoBase64: string,
): Promise<string> {
  const replicate = getClient();

  const output = await replicate.run(FACE_SWAP_VERSION, {
    input: {
      input_image: templateBase64,
      swap_image: userPhotoBase64,
    },
  }) as { url(): URL };

  const resultUrl = output.url().href;
  const response = await fetch(resultUrl);
  if (!response.ok) throw new AppError('REPLICATE_FETCH', 'Failed to fetch result image', 502);

  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  return `data:image/jpeg;base64,${base64}`;
}
