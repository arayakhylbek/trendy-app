import { Router } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { ensureAuth } from '../middleware/auth.js';
import { checkQuota } from '../middleware/quota.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { db, adminStorage } from '../lib/firebase.js';
import { GenerateRequestSchema, ValidationError, AppError } from '@trendy/shared';
import { GeminiProvider } from '../ai/GeminiProvider.js';
import { faceSwap } from '../services/replicateService.js';

const router: ReturnType<typeof Router> = Router();

async function uploadGenerationImage(
  dataUri: string,
  uid: string,
): Promise<string> {
  const base64 = dataUri.replace(/^data:[^;]+;base64,/, '');
  const buffer = Buffer.from(base64, 'base64');
  const filename = `generations/${uid}/${Date.now()}.jpg`;
  const bucket = adminStorage.bucket();
  const file = bucket.file(filename);
  await file.save(buffer, {
    contentType: 'image/jpeg',
    metadata: { cacheControl: 'public, max-age=31536000' },
  });
  await file.makePublic();
  return `https://storage.googleapis.com/${bucket.name}/${filename}`;
}

router.post('/', ensureAuth, rateLimit(10), checkQuota, async (req, res, next) => {
  try {
    const parsed = GenerateRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new ValidationError(parsed.error.message));
    }
    const {
      prompt, imageBase64, imageBase64_2,
      templateBase64, templateId, templateImageSrc,
      templateLabel, templateEmoji,
    } = parsed.data;

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

      const swapped1 = await faceSwap(templateInput, imageBase64);
      const swapped = imageBase64_2 ? await faceSwap(swapped1, imageBase64_2) : swapped1;

      const gemini = new GeminiProvider();
      imageDataUri = await gemini.personalizeImage(swapped, prompt);
    } else {
      const gemini = new GeminiProvider();
      imageDataUri = await gemini.generateUserImage(prompt, undefined, undefined);
    }

    // Upload to Firebase Storage (no size limits) and save URL to Firestore gallery
    const imageUrl = await uploadGenerationImage(imageDataUri, req.uid);
    await db.collection('users').doc(req.uid).collection('generations').add({
      imageUrl,
      templateLabel: templateLabel ?? 'Generation',
      templateEmoji: templateEmoji ?? '✨',
      createdAt: new Date().toISOString(),
    });

    res.json({ image: imageUrl, prompt });
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
