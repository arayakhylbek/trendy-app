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
    const { prompt, imageBase64, templateBase64 } = parsed.data;

    const enhancer = new ClaudePromptEnhancer();
    const enhancedPrompt = await enhancer.enhance(prompt, imageBase64);

    const gemini = new GeminiProvider();
    let imageDataUri: string;

    if (imageBase64 && templateBase64 && useReplicate) {
      // Fast path: template image already exists → just face-swap, no Gemini needed
      imageDataUri = await faceSwap(templateBase64, imageBase64);
    } else if (imageBase64 && useReplicate) {
      // No template image: generate one with Gemini first, then face-swap
      const templateImage = await gemini.generateTemplateOnly(enhancedPrompt);
      imageDataUri = await faceSwap(templateImage, imageBase64);
    } else {
      // Fallback: original Gemini image-to-image flow
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
