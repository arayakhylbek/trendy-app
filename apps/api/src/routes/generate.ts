import { Router } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { ensureAuth } from '../middleware/auth.js';
import { checkQuota } from '../middleware/quota.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { db } from '../lib/firebase.js';
import { GenerateRequestSchema, ValidationError, AppError } from '@trendy/shared';
import { GeminiProvider } from '../ai/GeminiProvider.js';
import { faceSwap, upscaleImage } from '../services/replicateService.js';
// Nano Banana Pro chain (recomposeTemplate + faceSwap + upscaleImage, ~$0.27/gen) —
// swap the import back to '../services/geminiImageService.js' to restore it.

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

      // Cheap chain: dedicated Replicate face swap (literal face insert), then
      // Nano Banana (gemini-2.5-flash-image) reworks pose/angle/framing/quality,
      // then Real-ESRGAN upscales past Flash's ~1K ceiling. ~$0.07/gen total.
      const swapped1 = await faceSwap(templateInput, imageBase64);
      const swapped = imageBase64_2 ? await faceSwap(swapped1, imageBase64_2) : swapped1;

      const gemini = new GeminiProvider();
      try {
        imageDataUri = await gemini.personalizeImage(swapped, prompt);
      } catch (firstErr) {
        // Retry once — Gemini image edits fail transiently fairly often
        try {
          imageDataUri = await gemini.personalizeImage(swapped, prompt);
        } catch (retryErr) {
          console.warn(
            `personalizeImage failed twice, returning raw face-swap (template pose unchanged): ${
              (firstErr as Error).message
            } | retry: ${(retryErr as Error).message}`,
          );
          imageDataUri = swapped;
        }
      }
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
