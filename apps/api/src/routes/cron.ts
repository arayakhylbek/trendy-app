import { Router } from 'express';
import type { DocumentReference } from 'firebase-admin/firestore';
import { db } from '../lib/firebase.js';
import { logger } from '../lib/logger.js';
import { GeminiTrendSource } from '../ai/GeminiTrendSource.js';
import { GeminiProvider } from '../ai/GeminiProvider.js';

const router: ReturnType<typeof Router> = Router();

const TEMPLATES_PER_RUN = 6; // Generate 6 templates daily

router.post('/generate-daily', async (req, res) => {
  if (req.headers['authorization'] !== `Bearer ${process.env['CRON_SECRET']}`) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } });
    return;
  }

  const date = new Date().toISOString().slice(0, 10);
  const runRef = db.collection('generationRuns').doc(date);

  const existing = await runRef.get();
  if (existing.exists && existing.data()?.['status'] === 'completed') {
    res.json({ ok: true, skipped: true, date });
    return;
  }

  await runRef.set({
    date,
    status: 'pending',
    templatesGenerated: 0,
    startedAt: new Date().toISOString(),
  });

  // Respond immediately so Vercel cron doesn't time out (fire-and-forget)
  res.json({ ok: true, date, status: 'running' });

  // Run generation asynchronously
  runGeneration(date, runRef).catch((e) => {
    logger.error(e, 'Daily generation crashed');
  });
});

async function runGeneration(
  date: string,
  runRef: DocumentReference
) {
  const trendSource = new GeminiTrendSource();
  const gemini = new GeminiProvider();
  let count = 0;
  const errors: string[] = [];

  try {
    // Get real trends from TikTok + Pinterest + Gemini Google Search
    logger.info({ date }, 'Fetching trends from TikTok, Pinterest, and Gemini Search');
    const trends = await trendSource.getTrendingTopics();

    logger.info({ date, trendCount: trends.length }, 'Got trends, generating templates');

    // Take top N trends sorted by score
    const topTrends = trends.slice(0, TEMPLATES_PER_RUN);

    for (const trend of topTrends) {
      try {
        logger.info({ topic: trend.topic, source: trend.source }, 'Generating template');

        const concept = await gemini.generateTemplateConcept(trend);
        const imageDataUri = await gemini.generateTemplateImage(concept);

        // Upload base64 image to Firestore (or Storage if large)
        // For now store as data URI — move to Storage in production
        await db.collection('templates').add({
          emoji: concept.emoji,
          label: concept.label,
          style: concept.style,
          cat: concept.cat,
          prompt: concept.prompt,
          image: imageDataUri,       // matches TemplateSchema
          trendTopic: trend.topic,
          trendSource: trend.source,
          trendKeywords: trend.keywords,
          trendContext: (trend as { trendContext?: string }).trendContext ?? null,
          isTrending: true,
          isNew: true,
          isPro: false,
          likes: 0,
          uses: 0,
          generatedDate: date,
          createdAt: new Date().toISOString(),
        });

        count++;
        logger.info({ topic: trend.topic, count }, 'Template generated and saved');
      } catch (e) {
        const msg = `${trend.topic}: ${String(e)}`;
        errors.push(msg);
        logger.error(e, `Failed to generate template for trend: ${trend.topic}`);
      }
    }

    await runRef.update({
      status: 'completed',
      templatesGenerated: count,
      errors: errors.length > 0 ? errors : null,
      completedAt: new Date().toISOString(),
    });

    logger.info({ date, count, errors: errors.length }, 'Daily generation completed');
  } catch (e) {
    logger.error(e, 'Daily generation failed');
    await runRef.update({
      status: 'failed',
      error: String(e),
      templatesGenerated: count,
    });
  }
}

export default router;
