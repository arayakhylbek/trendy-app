import { Router } from 'express';
import { ensureAuth } from '../middleware/auth.js';
import { ensureUser, getUserDoc } from '../services/userService.js';
import { adminAuth } from '../lib/firebase.js';

const router: ReturnType<typeof Router> = Router();

router.get('/me', ensureAuth, async (req, res, next) => {
  try {
    // Idempotently create the doc so a brand-new user never 404s here (which
    // used to race the POST /me create and leave the UI without quota data).
    const authUser = await adminAuth.getUser(req.uid).catch(() => null);
    await ensureUser(req.uid, {
      email: authUser?.email,
      displayName: authUser?.displayName ?? null,
    });
    const user = await getUserDoc(req.uid);
    res.json({ user });
  } catch (e) {
    next(e);
  }
});

router.post('/me', ensureAuth, async (req, res, next) => {
  try {
    const authUser = await adminAuth.getUser(req.uid);
    await ensureUser(req.uid, {
      email: authUser.email,
      displayName: authUser.displayName,
    });
    res.json({ uid: req.uid });
  } catch (e) {
    next(e);
  }
});

export default router;
