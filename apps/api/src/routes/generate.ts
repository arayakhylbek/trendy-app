import { Router } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { ensureAuth } from '../middleware/auth.js';
import { checkQuota } from '../middleware/quota.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { db } from '../lib/firebase.js';
import { GenerateRequestSchema, ValidationError } from '@trendy/shared';
import { GeminiProvider } from '../ai/GeminiProvider.js';
import { fluxKontextFaceInsert } from '../services/replicateService.js';

const router: ReturnType<typeof Router> = Router();

router.post('/', ensureAuth, rateLimit(10), checkQuota, async (req, res, next) => {
  try {
    const parsed = GenerateRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new ValidationError(parsed.error.message));
    }
    const { prompt, imageBase64 } = parsed.data;

    let imageDataUri: string;

    if (imageBase64) {
      // User uploaded selfie → FLUX Kontext Pro (identity-preserving scene transfer)
      // prompt = the template's scene description sent from the frontend
      imageDataUri = await fluxKontextFaceInsert(imageBase64, prompt);
    } else {
      // No selfie → Gemini text-to-image
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
