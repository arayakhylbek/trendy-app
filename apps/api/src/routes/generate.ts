import { Router } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { ensureAuth } from '../middleware/auth.js';
import { checkQuota } from '../middleware/quota.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { db } from '../lib/firebase.js';
import { GenerateRequestSchema, ValidationError, AppError } from '@trendy/shared';
import { GeminiProvider } from '../ai/GeminiProvider.js';
import { faceSwap } from '../services/replicateService.js';

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
      // Resolve template image
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

      // Replicate face-swap — returns the result directly, no Gemini post-processing
      // Gemini regenerates faces instead of preserving them, so we skip it entirely
      const swapped1 = await faceSwap(templateInput, imageBase64);

      if (imageBase64_2) {
        // Couple mode: second face-swap on the already-swapped result
        imageDataUri = await faceSwap(swapped1, imageBase64_2);
      } else {
        imageDataUri = swapped1;
      }
    } else {
      // No selfie — pure Gemini text-to-image
      const gemini = new GeminiProvider();
      imageDataUri = await gemini.generateUserImage(prompt, undefined, undefined);
    }

    await db
      .collection('users')
      .doc(req.uid)
      .update({
        generationsUsed: FieldValue.increment(1),
        updatedAt: new Date().toISOString(),
      });

    res.json({ image: imageDataUri, prompt });
  } catch (e) {
    next(e);
  }
});

export default router;
