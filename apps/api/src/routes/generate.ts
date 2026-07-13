import { Router } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { ensureAuth } from '../middleware/auth.js';
import { checkQuota } from '../middleware/quota.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { db } from '../lib/firebase.js';
import { GenerateRequestSchema, ValidationError, AppError } from '@trendy/shared';
import { GeminiProvider } from '../ai/GeminiProvider.js';
// Legacy Replicate pipeline — restore this import to roll back:
// import { faceSwap, upscaleImage } from '../services/replicateService.js';
import { recomposeTemplate, faceSwap, upscaleImage } from '../services/geminiImageService.js';

const router: ReturnType<typeof Router> = Router();

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

      // Legacy 3-step chain (faceSwap → personalizeImage → upscaleImage) — restore to roll back:
      // const swapped1 = await faceSwap(templateInput, imageBase64);
      // const swapped = imageBase64_2 ? await faceSwap(swapped1, imageBase64_2) : swapped1;
      // const gemini = new GeminiProvider();
      // try {
      //   imageDataUri = await gemini.personalizeImage(swapped, prompt);
      // } catch (firstErr) {
      //   try {
      //     imageDataUri = await gemini.personalizeImage(swapped, prompt);
      //   } catch (retryErr) {
      //     console.warn(`personalizeImage failed twice, returning raw face-swap: ${(firstErr as Error).message} | retry: ${(retryErr as Error).message}`);
      //     imageDataUri = swapped;
      //   }
      // }
      // ... plus the post-branch upscaleImage(imageDataUri) call.

      // Two Nano Banana Pro calls, face LAST so nothing re-renders it:
      // 1) recompose the template (new pose/angle/framing, 2K) without the user photo,
      // 2) strict face swap of the user's face onto the recomposed frame.
      const runChain = async (): Promise<string> => {
        const recomposed = await recomposeTemplate(templateInput, prompt);
        const swapped1 = await faceSwap(recomposed, imageBase64);
        return imageBase64_2 ? faceSwap(swapped1, imageBase64_2) : swapped1;
      };
      try {
        imageDataUri = await runChain();
      } catch (firstErr) {
        // Retry once — image generations fail transiently fairly often
        console.warn(`generation chain failed, retrying once: ${(firstErr as Error).message}`);
        imageDataUri = await runChain();
      }
    } else {
      const gemini = new GeminiProvider();
      imageDataUri = await gemini.generateUserImage(prompt, undefined, undefined);
      // Text-only path still renders at ~1K on Flash — upscale is best-effort
      try {
        imageDataUri = await upscaleImage(imageDataUri);
      } catch {
        // fall back to the pre-upscale image on failure
      }
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
