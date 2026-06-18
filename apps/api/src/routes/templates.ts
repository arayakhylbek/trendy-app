import { Router } from 'express';
import { db } from '../lib/firebase.js';
import { NotFoundError } from '@trendy/shared';

const router: ReturnType<typeof Router> = Router();

router.get('/', async (req, res, next) => {
  try {
    const { cat, limit: limitStr } = req.query;
    const limit = Math.min(Number(limitStr) || 50, 100);

    let query = db.collection('templates').orderBy('createdAt', 'desc').limit(limit);

    if (typeof cat === 'string' && cat !== 'all') {
      if (cat === 'trending') {
        query = db
          .collection('templates')
          .where('isTrending', '==', true)
          .orderBy('createdAt', 'desc')
          .limit(limit);
      } else {
        query = db
          .collection('templates')
          .where('cat', '==', cat)
          .orderBy('createdAt', 'desc')
          .limit(limit);
      }
    }

    const snap = await query.get();
    const templates = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ templates });
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const snap = await db.collection('templates').doc(req.params.id).get();
    if (!snap.exists) return next(new NotFoundError('Template'));
    res.json({ template: { id: snap.id, ...snap.data() } });
  } catch (e) {
    next(e);
  }
});

export default router;
