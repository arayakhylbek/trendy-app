import { Router } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { ensureAuth } from '../middleware/auth.js';
import { checkQuota } from '../middleware/quota.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { db } from '../lib/firebase.js';
import { GenerateRequestSchema, ValidationError } from '@trendy/shared';
import { GeminiProvider } from '../ai/GeminiProvider.js';
import { generateFromPrompt as geminiGenerate } from '../services/geminiImageService.js';
import { generateFromPrompt as openaiGenerate } from '../services/openaiImageService.js';

const router: ReturnType<typeof Router> = Router();

// Image provider switch: IMAGE_PROVIDER=openai → GPT Image, otherwise Gemini.
const generateFromPrompt =
  process.env['IMAGE_PROVIDER'] === 'openai' ? openaiGenerate : geminiGenerate;

router.post('/', ensureAuth, rateLimit(10), checkQuota, async (req, res, next) => {
  try {
    const parsed = GenerateRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new ValidationError(parsed.error.message));
    }
    const { prompt, imageBase64, imageBase64_2, templateId } = parsed.data;

    const appBaseUrl = process.env['APP_BASE_URL'] ?? 'https://mytrendy.app';
    let imageDataUri: string;

    if (imageBase64) {
      // Nano Banana Pro only: the stored text prompt + the user's face. The
      // template image is never sent, so only the user's face reaches the model
      // (maximum likeness). Replicate (recompose / face-swap / upscale) is not used.
      let genPrompt = prompt;
      let secondRef = imageBase64_2;
      if (templateId) {
        const snap = await db.collection('templates').doc(templateId).get();
        const tpl = snap.data();
        if (tpl) {
          genPrompt = (tpl['genPrompt'] as string | undefined) ?? prompt;
          // Optional fixed second reference stored with the template (e.g. a
          // celebrity's face); falls back to a second user upload if absent.
          const refImg = tpl['referenceImage'] as string | undefined;
          if (refImg) secondRef = refImg.startsWith('http') ? refImg : `${appBaseUrl}${refImg}`;
        }
      }
      imageDataUri = await generateFromPrompt(genPrompt, imageBase64, secondRef);
      res.json({ image: imageDataUri, prompt: genPrompt });
      return;
    }

    const gemini = new GeminiProvider();
    imageDataUri = await gemini.generateUserImage(prompt, undefined, undefined);

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
