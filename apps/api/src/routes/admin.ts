import { Router } from 'express';
import { db } from '../lib/firebase.js';
import { ensureOwner } from '../middleware/ensureOwner.js';
import { AppError } from '@trendy/shared';

const router: ReturnType<typeof Router> = Router();

router.use(ensureOwner);

// GET /api/admin/templates?status=pending|published|all
router.get('/templates', async (req, res, next) => {
  try {
    const status = (req.query['status'] as string) || 'pending';

    // Fetch all and filter in code — avoids composite index requirement
    const snap = await db.collection('templates').orderBy('createdAt', 'desc').limit(200).get();
    let templates = snap.docs.map((d) => ({ id: d.id, ...d.data() as Record<string, unknown> }));

    if (status === 'pending') {
      templates = templates.filter((t) => t['status'] === 'pending');
    } else if (status === 'published') {
      // Old templates (no status field) are treated as published
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

// POST /api/admin/templates/generate — trigger manual generation run
router.post('/generate', async (req, res, next) => {
  try {
    const secret = process.env['CRON_SECRET'];
    const host = req.headers['host'] ?? 'localhost:3001';
    const proto = host.includes('localhost') ? 'http' : 'https';
    const resp = await fetch(`${proto}://${host}/api/cron/generate-daily`, {
      method: 'POST',
      headers: { authorization: `Bearer ${secret}` },
    });
    const json = await resp.json() as Record<string, unknown>;
    res.json({ ok: true, cron: json });
  } catch (e) {
    next(e);
  }
});

export default router;
