import { Router } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { ensureAuth } from '../middleware/auth.js';
import { checkQuota } from '../middleware/quota.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { db } from '../lib/firebase.js';
import { GenerateRequestSchema, ValidationError, AppError } from '@trendy/shared';
import { GeminiProvider } from '../ai/GeminiProvider.js';

const router: ReturnType<typeof Router> = Router();

router.post('/', ensureAuth, rateLimit(10), checkQuota, async (req, res, next) => {
  try {
    const parsed = GenerateRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new ValidationError(parsed.error.message));
    }
    const { prompt, imageBase64, templateBase64, templateId, templateImageSrc } = parsed.data;

    const appBaseUrl = process.env['APP_BASE_URL'] ?? 'https://mytrendy.app';
    let imageDataUri: string;

    if (imageBase64) {
      // Resolve template image
      let resolvedTemplateBase64: string | undefined = templateBase64;

      if (!resolvedTemplateBase64) {
        if (templateImageSrc?.startsWith('data:')) {
          resolvedTemplateBase64 = templateImageSrc;
        } else if (templateImageSrc) {
          const url = templateImageSrc.startsWith('http')
            ? templateImageSrc
            : `${appBaseUrl}${templateImageSrc}`;
          const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
          if (resp.ok) {
            const buf = await resp.arrayBuffer();
            const mime = resp.headers.get('content-type') ?? 'image/jpeg';
            resolvedTemplateBase64 = `data:${mime};base64,${Buffer.from(buf).toString('base64')}`;
          }
        } else if (templateId) {
          const snap = await db.collection('templates').doc(templateId).get();
          resolvedTemplateBase64 = (snap.data()?.['image'] as string | undefined) ?? undefined;
        }
      }

      if (!resolvedTemplateBase64) throw new AppError('NO_TEMPLATE', 'Could not resolve template image', 400);

      const userPhotoUri = imageBase64.startsWith('data:')
        ? imageBase64
        : `data:image/jpeg;base64,${imageBase64}`;

      const gemini = new GeminiProvider();
      imageDataUri = await gemini.generateUserImage(prompt, userPhotoUri, resolvedTemplateBase64);
    } else {
      // No selfie — text-to-image
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
