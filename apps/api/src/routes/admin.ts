import { Router } from 'express';
import { db } from '../lib/firebase.js';
import { ensureOwner } from '../middleware/ensureOwner.js';
import { AppError } from '@trendy/shared';
import { runGeneration } from './cron.js';

const router: ReturnType<typeof Router> = Router();

router.use(ensureOwner);

// GET /api/admin/templates?status=pending|published|all
router.get('/templates', async (req, res, next) => {
  try {
    const status = (req.query['status'] as string) || 'pending';

    // Fetch all and filter in code — avoids composite index requirement
    const snap = await db.collection('templates').orderBy('createdAt', 'desc').limit(200).get();
    let templates: Record<string, unknown>[] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    if (status === 'pending') {
      templates = templates.filter((t) => t['status'] === 'pending');
    } else if (status === 'published') {
      templates = templates.filter((t) => !t['status'] || t['status'] === 'published');
    }

    res.json({ templates, total: templates.length });
  } catch (e) {
    next(e);
  }
});

// PATCH /api/admin/templates/:id  { status: 'published' }
router.patch('/templates/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body as { status?: string };
    if (!status || !['published', 'pending', 'rejected'].includes(status)) {
      throw new AppError('BAD_REQUEST', 'Invalid status', 400);
    }
    await db.collection('templates').doc(id).update({ status });
    res.json({ ok: true, id, status });
  } catch (e) {
    next(e);
  }
});

// DELETE /api/admin/templates/:id
router.delete('/templates/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.collection('templates').doc(id).delete();
    res.json({ ok: true, id });
  } catch (e) {
    next(e);
  }
});

// POST /api/admin/generate — trigger manual generation run (synchronous, waits for completion)
router.post('/generate', async (_req, res, next) => {
  try {
    const date = new Date().toISOString().slice(0, 10);
    const runRef = db.collection('generationRuns').doc(`${date}-manual-${Date.now()}`);
    await runRef.set({
      date,
      status: 'pending',
      templatesGenerated: 0,
      startedAt: new Date().toISOString(),
      triggeredBy: 'admin',
    });

    // Run synchronously so Vercel doesn't kill the background task
    await runGeneration(date, runRef);

    const snap = await runRef.get();
    const runData = snap.data() as Record<string, unknown>;
    res.json({
      ok: true,
      date,
      status: runData['status'],
      templatesGenerated: runData['templatesGenerated'] ?? 0,
      errors: runData['errors'] ?? null,
      error: runData['error'] ?? null,
    });
  } catch (e) {
    next(e);
  }
});

// POST /api/admin/users/grant-credits { email, credits }
router.post('/users/grant-credits', async (req, res, next) => {
  try {
    const { email, credits } = req.body as { email?: string; credits?: number };
    if (!email || !credits || credits < 1) {
      throw new AppError('BAD_REQUEST', 'email and credits (>0) required', 400);
    }

    const snap = await db.collection('users').where('email', '==', email.toLowerCase().trim()).limit(1).get();
    if (snap.empty) {
      throw new AppError('NOT_FOUND', `User not found: ${email}`, 404);
    }

    const doc = snap.docs[0];
    const current = (doc.data()['generationsUsed'] as number) ?? 0;
    const newUsed = Math.max(0, current - credits);
    await doc.ref.update({ generationsUsed: newUsed, updatedAt: new Date().toISOString() });

    res.json({ ok: true, email, before: current, after: newUsed, granted: credits });
  } catch (e) {
    next(e);
  }
});

export default router;
