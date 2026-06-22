import { Router } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { ensureAuth } from '../middleware/auth.js';
import { checkQuota } from '../middleware/quota.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { db } from '../lib/firebase.js';
import { GenerateRequestSchema, ValidationError } from '@trendy/shared';
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

    if (imageBase64 && useReplicate) {
      // Resolve template image without calling Gemini
      let templateInput: string | undefined;

      if (templateBase64) {
        templateInput = templateBase64;
      } else if (templateImageSrc?.startsWith('data:')) {
        // base64 sent inline — use it
        templateInput = templateImageSrc;
      } else if (templateImageSrc && (templateImageSrc.startsWith('/') || templateImageSrc.startsWith('http'))) {
        // Static file path → make absolute URL for Replicate
        templateInput = templateImageSrc.startsWith('http')
          ? templateImageSrc
          : `${appBaseUrl}${templateImageSrc}`;
      } else if (templateId) {
        // Firestore template — fetch stored base64 image
        const snap = await db.collection('templates').doc(templateId).get();
        templateInput = (snap.data()?.['image'] as string | undefined) ?? undefined;
      }

      if (!templateInput) {
        throw new AppError('NO_TEMPLATE', 'Could not resolve template image', 400);
      }

      imageDataUri = await faceSwap(templateInput, imageBase64);
    } else {
      // No Replicate token or no user photo → Gemini fallback
      const enhancer = new ClaudePromptEnhancer();
      const enhancedPrompt = await enhancer.enhance(prompt, imageBase64);
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
