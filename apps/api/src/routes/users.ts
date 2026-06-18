import { type Router as ExpressRouter, Router } from 'express';
import { ensureAuth } from '../middleware/auth.js';
import { ensureUser, getUserDoc } from '../services/userService.js';
import { adminAuth } from '../lib/firebase.js';
import { NotFoundError } from '@trendy/shared';

const router: ExpressRouter = Router();

router.get('/me', ensureAuth, async (req, res, next) => {
  try {
    const user = await getUserDoc(req.uid);
    if (!user) return next(new NotFoundError('User'));
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
