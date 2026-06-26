import { Router } from 'express';
import { ensureAuth } from '../middleware/auth.js';
import { adminAuth, db } from '../lib/firebase.js';
import { GeminiProvider } from '../ai/GeminiProvider.js';
import { AppError } from '@trendy/shared';

const ADMIN_EMAILS = ['araiakhylbek78@gmail.com', 'potizhmoti@gmail.com'];

const THEMES = [
  'stadium cam',
  'magazine cover',
  'fashion doll',
  'golden hour portrait',
  'café scene',
  'airport lounge',
  'rooftop party',
  'beach sunset',
  'ski resort',
  'red carpet',
  'concert VIP',
  'flower field',
  'rainy day aesthetic',
  'bookstore cozy',
  'gym mirror selfie',
];

const router: ReturnType<typeof Router> = Router();

router.post('/', ensureAuth, async (req, res, next) => {
  try {
    const userRecord = await adminAuth.getUser(req.uid);
    if (!ADMIN_EMAILS.includes(userRecord.email ?? '')) {
      return next(new AppError('FORBIDDEN', 'Admin only', 403));
    }

    const theme = THEMES[Math.floor(Math.random() * THEMES.length)]!;

    const gemini = new GeminiProvider();

    const concept = await gemini.generateTemplateConcept({
      topic: theme,
      category: 'aesthetic',
      keywords: [],
      score: 1,
      source: 'admin',
      trendContext: `Create a photorealistic template for "${theme}" theme. The image should have a clearly visible face area for future face swapping. Viral TikTok aesthetic, 4K quality, professional photography.`,
    });

    const imageDataUri = await gemini.generateTemplateImage(concept);

    const templateData = {
      emoji: concept.emoji,
      label: concept.label,
      style: concept.style,
      styleName: concept.style,
      cat: concept.cat,
      isTrending: true,
      isNew: true,
      isPro: false,
      likes: 0,
      uses: 0,
      createdAt: new Date().toISOString(),
      image: imageDataUri,
      prompt: concept.prompt,
    };

    const docRef = await db.collection('templates').add(templateData);

    res.json({ template: { id: docRef.id, ...templateData } });
  } catch (e) {
    next(e);
  }
});

export default router;
