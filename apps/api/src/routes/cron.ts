import { Router } from 'express';
import { db } from '../lib/firebase.js';
import { logger } from '../lib/logger.js';
import { GeminiTrendSource } from '../ai/GeminiTrendSource.js';
import { GeminiProvider } from '../ai/GeminiProvider.js';

const router = Router();

router.post('/generate-daily', async (req, res) => {
  if (req.headers['authorization'] !== `Bearer ${process.env['CRON_SECRET']}`) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } });
  }

  const date = new Date().toISOString().slice(0, 10);
  const runRef = db.collection('generationRuns').doc(date);

  const existing = await runRef.get();
  if (existing.exists && existing.data()?.['status'] === 'completed') {
    return res.json({ ok: true, skipped: true, date });
  }

  await runRef.set({
    date,
    status: 'pending',
    templatesGenerated: 0,
    startedAt: new Date().toISOString(),
  });

  try {
    const trendSource = new GeminiTrendSource();
    const aiProvider = new GeminiProvider();

    const trends = await trendSource.getTrendingTopics();
    let count = 0;

    for (const trend of trends.slice(0, 3)) {
      try {
        const concept = await aiProvider.generateTemplateConcept(trend);
        const imageDataUri = await aiProvider.generateTemplateImage(concept);

        await db.collection('templates').add({
          ...concept,
          isTrending: true,
          isNew: true,
          isPro: false,
          likes: 0,
          uses: 0,
          image: imageDataUri,
          createdAt: new Date().toISOString(),
        });
        count++;
      } catch (e) {
        logger.error(e, `Failed to generate template for trend: ${trend.topic}`);
      }
    }

    await runRef.update({
      status: 'completed',
      templatesGenerated: count,
      completedAt: new Date().toISOString(),
    });

    logger.info({ date, count }, 'Daily generation completed');
    res.json({ ok: true, date, templatesGenerated: count });
  } catch (e) {
    logger.error(e, 'Daily generation failed');
    await runRef.update({ status: 'failed', error: String(e) });
    res.status(500).json({ error: { code: 'GENERATION_FAILED', message: 'Generation failed' } });
  }
});

export default router;
