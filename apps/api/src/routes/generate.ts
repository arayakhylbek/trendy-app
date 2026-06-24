import { Router } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { ensureAuth } from '../middleware/auth.js';
import { checkQuota } from '../middleware/quota.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { db } from '../lib/firebase.js';
import { GenerateRequestSchema, ValidationError, AppError } from '@trendy/shared';
import { ClaudePromptEnhancer } from '../ai/ClaudePromptEnhancer.js';
import { GeminiProvider } from '../ai/GeminiProvider.js';
import { faceSwap } from '../services/replicateService.js';

const router: ReturnType<typeof Router> = Router();

const useReplicate = !!process.env['REPLICATE_API_TOKEN'];

router.post('/', ensureAuth, rateLimit(10), checkQuota, async (req, res, next) => {
  try {
    const parsed = GenerateRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new ValidationError(parsed.error.message));
    }
    const { prompt, imageBase64, templateBase64, templateId, templateImageSrc } = parsed.data;

    const appBaseUrl = process.env['APP_BASE_URL'] ?? 'https://mytrendy.app';
    let imageDataUri: string;
    let enhancedPrompt = prompt;

    if (imageBase64 && useReplicate) {
      // Replicate face-swap path — resolve template to a URL or base64
      let templateInput: string | undefined;

      if (templateBase64) {
        templateInput = templateBase64;
      } else if (templateImageSrc?.startsWith('data:')) {
        templateInput = templateImageSrc;
      } else if (templateImageSrc) {
        templateInput = templateImageSrc.startsWith('http')
          ? templateImageSrc
          : `${appBaseUrl}${templateImageSrc}`;
      } else if (templateId) {
        const snap = await db.collection('templates').doc(templateId).get();
        templateInput = (snap.data()?.['image'] as string | undefined) ?? undefined;
      }

      if (!templateInput) throw new AppError('NO_TEMPLATE', 'Could not resolve template image', 400);
      imageDataUri = await faceSwap(templateInput, imageBase64);
    } else {
      // Gemini fallback — text-to-image or no Replicate token
      const enhancer = new ClaudePromptEnhancer();
      enhancedPrompt = await enhancer.enhance(prompt, imageBase64);
      const gemini = new GeminiProvider();
      imageDataUri = await gemini.generateUserImage(enhancedPrompt, imageBase64, templateBase64);
    }

    await db
      .collection('users')
      .doc(req.uid)
      .update({
        generationsUsed: FieldValue.increment(1),
        updatedAt: new Date().toISOString(),
      });

    res.json({ image: imageDataUri, prompt: enhancedPrompt });
  } catch (e) {
    next(e);
  }
});

export default router;
