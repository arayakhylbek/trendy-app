import { Router } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { ensureAuth } from '../middleware/auth.js';
import { checkQuota } from '../middleware/quota.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { db } from '../lib/firebase.js';
import { GenerateRequestSchema, ValidationError, AppError } from '@trendy/shared';
import { GeminiProvider } from '../ai/GeminiProvider.js';
import { faceSwap, upscaleImage } from '../services/replicateService.js';
import { generateFromPrompt } from '../services/geminiImageService.js';

const router: ReturnType<typeof Router> = Router();

// Gemini needs the image inline — fetch http(s) templates into a data URI
async function toDataUri(input: string): Promise<string> {
  if (input.startsWith('data:')) return input;
  if (!input.startsWith('http')) return `data:image/jpeg;base64,${input}`;
  const res = await fetch(input, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new AppError('IMAGE_FETCH', `Failed to fetch template: ${res.status}`, 502);
  const mime = res.headers.get('content-type')?.split(';')[0] ?? 'image/jpeg';
  const buffer = await res.arrayBuffer();
  return `data:${mime};base64,${Buffer.from(buffer).toString('base64')}`;
}

router.post('/', ensureAuth, rateLimit(10), checkQuota, async (req, res, next) => {
  try {
    const parsed = GenerateRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new ValidationError(parsed.error.message));
    }
    const { prompt, imageBase64, imageBase64_2, templateBase64, templateId, templateImageSrc } = parsed.data;

    const appBaseUrl = process.env['APP_BASE_URL'] ?? 'https://mytrendy.app';
    let imageDataUri: string;

    if (imageBase64) {
      // Prompt-only templates: the stored text prompt + the user's face go to
      // Nano Banana Pro directly; the template image is never sent, so only one
      // face reaches the model (maximum likeness, Gemini-chat-style result).
      if (templateId) {
        const snap = await db.collection('templates').doc(templateId).get();
        const tpl = snap.data();
        if (tpl?.['promptOnly'] === true) {
          const genPrompt = (tpl['genPrompt'] as string | undefined) ?? prompt;
          imageDataUri = await generateFromPrompt(genPrompt, imageBase64, imageBase64_2);
          res.json({ image: imageDataUri, prompt: genPrompt });
          return;
        }
      }

      let templateInput: string | undefined = templateBase64;

      if (!templateInput) {
        if (templateImageSrc?.startsWith('data:')) {
          templateInput = templateImageSrc;
        } else if (templateImageSrc) {
          templateInput = templateImageSrc.startsWith('http')
            ? templateImageSrc
            : `${appBaseUrl}${templateImageSrc}`;
        } else if (templateId) {
          const snap = await db.collection('templates').doc(templateId).get();
          templateInput = (snap.data()?.['image'] as string | undefined) ?? undefined;
        }
      }

      if (!templateInput) throw new AppError('NO_TEMPLATE', 'Could not resolve template image', 400);

      // Face LAST so nothing re-renders it (a generative pass after the swap
      // always destroys likeness — verified in prod):
      // 1) Nano Banana (gemini-2.5-flash-image) recomposes the template alone
      //    (new pose/angle/framing, user photo not involved),
      // 2) dedicated Replicate face swap pastes the user's face onto the result.
      // ~$0.07/gen total.
      const templateDataUri = await toDataUri(templateInput);

      const gemini = new GeminiProvider();
      let recomposed: string;
      try {
        recomposed = await gemini.personalizeImage(templateDataUri, prompt);
      } catch (firstErr) {
        // Retry once — Gemini image edits fail transiently fairly often
        try {
          recomposed = await gemini.personalizeImage(templateDataUri, prompt);
        } catch (retryErr) {
          console.warn(
            `personalizeImage failed twice, swapping onto the original template (pose unchanged): ${
              (firstErr as Error).message
            } | retry: ${(retryErr as Error).message}`,
          );
          recomposed = templateDataUri;
        }
      }

      const swapped1 = await faceSwap(recomposed, imageBase64);
      imageDataUri = imageBase64_2 ? await faceSwap(swapped1, imageBase64_2) : swapped1;
    } else {
      const gemini = new GeminiProvider();
      imageDataUri = await gemini.generateUserImage(prompt, undefined, undefined);
    }

    // Real-ESRGAN + face enhance — cheap best-effort quality/resolution boost
    try {
      imageDataUri = await upscaleImage(imageDataUri);
    } catch {
      // fall back to the pre-upscale image on failure
    }

    res.json({ image: imageDataUri, prompt });
  } catch (e) {
    // Generation failed after quota was reserved — refund the slot
    try {
      await db.collection('users').doc(req.uid).update({
        generationsUsed: FieldValue.increment(-1),
        updatedAt: new Date().toISOString(),
      });
    } catch { /* ignore refund error */ }
    next(e);
  }
});

export default router;
