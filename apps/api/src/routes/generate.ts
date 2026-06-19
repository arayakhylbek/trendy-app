import { Router } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { ensureAuth } from '../middleware/auth.js';
import { checkQuota } from '../middleware/quota.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { db } from '../lib/firebase.js';
import { GenerateRequestSchema, ValidationError } from '@trendy/shared';
import { ClaudePromptEnhancer } from '../ai/ClaudePromptEnhancer.js';
import { GeminiProvider } from '../ai/GeminiProvider.js';

const router: ReturnType<typeof Router> = Router();

router.post('/', ensureAuth, rateLimit(10), checkQuota, async (req, res, next) => {
  try {
    const parsed = GenerateRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new ValidationError(parsed.error.message));
    }
    const { prompt, imageBase64, templateBase64 } = parsed.data;

    // Step 1: Claude enhances the template prompt (skip if ANTHROPIC_API_KEY not set)
    const enhancer = new ClaudePromptEnhancer();
    const enhancedPrompt = await enhancer.enhance(prompt, imageBase64);

    // Step 2: Gemini generates the personalized image
    // If both template and user photo provided → face-swap mode
    // If only user photo → style-transfer generation
    // If no photo → pure text-to-image
    const gemini = new GeminiProvider();
    const imageDataUri = await gemini.generateUserImage(enhancedPrompt, imageBase64, templateBase64);

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
