import { AppError } from '@trendy/shared';

interface PredictionResponse {
  id: string;
  status: string;
  output?: string | string[];
  error?: string;
}

export class ReplicateProvider {
  async generateImage(prompt: string): Promise<string> {
    const token = process.env['REPLICATE_TOKEN'];
    if (!token) {
      throw new AppError('MISSING_CONFIG', 'REPLICATE_TOKEN not configured', 500);
    }

    const createRes = await fetch(
      'https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions',
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: {
            prompt,
            aspect_ratio: '3:4',
            output_format: 'webp',
            output_quality: 90,
          },
        }),
      }
    );

    if (!createRes.ok) {
      const detail = await createRes.text().catch(() => '');
      throw new AppError('REPLICATE_ERROR', `Replicate error ${createRes.status}: ${detail}`, 502);
    }

    const prediction = (await createRes.json()) as PredictionResponse;
    const predId = prediction.id;

    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 2000));

      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${predId}`, {
        headers: { Authorization: `Token ${token}` },
      });

      if (!pollRes.ok) continue;

      const poll = (await pollRes.json()) as PredictionResponse;

      if (poll.status === 'succeeded' && poll.output) {
        return Array.isArray(poll.output) ? poll.output[0]! : poll.output;
      }
      if (poll.status === 'failed') {
        throw new AppError('REPLICATE_FAILED', `Generation failed: ${poll.error ?? 'unknown'}`, 502);
      }
    }

    throw new AppError('REPLICATE_TIMEOUT', 'Image generation timed out after 60s', 504);
  }
}
