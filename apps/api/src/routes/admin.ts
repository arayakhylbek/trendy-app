import { Router } from 'express';
import { db } from '../lib/firebase.js';
import { ensureOwner } from '../middleware/ensureOwner.js';
import { AppError } from '@trendy/shared';
import { runGeneration } from './cron.js';
import { GeminiProvider } from '../ai/GeminiProvider.js';

// Realistic styled template prompts — cycles through on each call
const STYLED_PROMPTS: Array<{ emoji: string; label: string; style: string; cat: string; prompt: string }> = [
  // K-Drama
  { emoji: '🌧️', label: 'Seoul Rain', style: 'K-Drama', cat: 'kdrama', prompt: 'Cinematic live-action Korean drama scene. Real woman standing on a quiet Seoul street at night in the rain holding a transparent bubble umbrella, wearing a soft pastel trench coat. CU convenience store glowing behind with Korean neon signs. Wet cobblestone reflections, warm-cool cinematic color grade. Photorealistic professional photography, not illustration, 4K.' },
  { emoji: '🌸', label: 'School Crush', style: 'K-Drama', cat: 'kdrama', prompt: 'Real-life Korean high school drama. Young woman sitting at a classroom desk by a large window in a Korean navy school uniform with plaid skirt and red bow. Cherry blossom petals falling past the open window behind her. Soft golden afternoon light, dreamy expression. Photorealistic photography, cinematic, 4K.' },
  { emoji: '🏮', label: 'Hanbok Evening', style: 'K-Drama', cat: 'kdrama', prompt: 'Photorealistic period K-drama portrait. Woman in a stunning traditional Korean hanbok — pale pink silk with gold floral embroidery. Standing alone in a wooden hanok courtyard at dusk, paper lanterns glowing around her, plum blossoms behind. Real actress-quality photography, cinematic depth of field, 4K.' },
  // Anime-inspired real-life
  { emoji: '🎀', label: 'Harajuku Girl', style: 'Anime', cat: 'anime', prompt: 'Photorealistic Harajuku street fashion editorial. Real woman in a bold Harajuku kawaii outfit — pastel pink layered petticoat skirt, lace-trimmed blouse, platform Mary Janes, giant bow hair accessories. Tokyo Takeshita Street behind her with colorful shops. Real photography, not illustration, editorial fashion, 4K.' },
  { emoji: '🌙', label: 'Cosplay Moon', style: 'Anime', cat: 'anime', prompt: 'High-quality cosplay portrait photoshoot. Real woman in a professional Sailor Moon-inspired costume — white sailor fuku with blue pleated skirt, red bow, with twin buns hairstyle. Dark starry background with glowing crescent moon. Studio photography, photorealistic, not cartoon, professional cosplay photography, 4K.' },
  { emoji: '🍡', label: 'Matsuri Night', style: 'Anime', cat: 'anime', prompt: 'Real-life Japanese summer festival scene. Young woman in a beautiful floral yukata with obi sash, holding a paper lantern, standing on a festival street lit with rows of orange chochin lanterns at night. Bokeh festival lights behind. Photorealistic photography, warm candlelight tones, cinematic 4K.' },
  // Fantasy
  { emoji: '🌿', label: 'Forest Queen', style: 'Fantasy', cat: 'fantasy', prompt: 'Live-action high fantasy portrait. Real woman with silver-white hair wearing an intricate dark green velvet gown with gold leaf embroidery, standing in an ancient enchanted forest at twilight. Glowing golden fireflies and bioluminescent blue flowers surround her. Photorealistic cinematography, not illustration, LOTR film quality, 4K.' },
  { emoji: '🔮', label: 'Spell Caster', style: 'Fantasy', cat: 'fantasy', prompt: 'Photorealistic dark fantasy portrait. Real woman with long dark hair, wearing a dramatic black velvet cloak with crescent moon and star embroidery, both hands holding a glowing crystal orb with purple magical energy. Ancient candlelit library behind with floating spell books. Real photography with VFX lighting, 4K.' },
  { emoji: '🦋', label: 'Fairy Wing', style: 'Fantasy', cat: 'fantasy', prompt: 'Photorealistic fairy fantasy portrait. Real woman with flowing auburn hair in an ethereal white and lavender gossamer dress with translucent iridescent fairy wings. Standing in a sunlit meadow full of wildflowers and floating golden dust particles. Real-world photography quality, soft cinematic lighting, 4K.' },
  // Vintage
  { emoji: '🕶️', label: '70s Disco', style: 'Vintage', cat: 'vintage', prompt: 'Authentic 1970s disco fashion portrait. Real woman in a sparkly gold halter jumpsuit with wide bell-bottoms, big hoop earrings, voluminous blow-dried hair. Standing under a mirror ball in a retro disco club with colorful neon lights. Real photography, warm Kodachrome film grain, 4K.' },
  { emoji: '📸', label: 'Film Noir', style: 'Vintage', cat: 'vintage', prompt: '1940s film noir photorealistic portrait. Real woman in a classic 1940s look — red lips, finger-waved hair, black belted trench coat, holding a cigarette. Standing in a rainy city street under a lamppost at night. Black and white with high contrast shadows. Real photography quality, cinematic film noir mood, 4K.' },
  { emoji: '🌺', label: '90s Mall', style: 'Vintage', cat: 'vintage', prompt: 'Real 1990s American mall fashion scene. Young woman with feathered hair, wearing a plaid flannel shirt tied at the waist over a floral slip dress, platform sneakers. Leaning against a mall railing with neon store signs behind. Warm over-saturated 90s film photography aesthetic. Real photography, 4K.' },
];

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

// POST /api/admin/generate-styled?count=3 — generate styled template candidates
router.post('/generate-styled', async (req, res, next) => {
  try {
    const count = Math.min(Number(req.query['count']) || 3, 6);
    const gemini = new GeminiProvider();

    // Pick `count` prompts, rotating by time so each call returns different ones
    const offset = Math.floor(Date.now() / 1000) % STYLED_PROMPTS.length;
    const selected = [];
    for (let i = 0; i < count; i++) {
      selected.push(STYLED_PROMPTS[(offset + i) % STYLED_PROMPTS.length]!);
    }

    let generated = 0;
    const errors: string[] = [];

    for (const p of selected) {
      try {
        const imageDataUri = await gemini.generateTemplateOnly(p.prompt);
        await db.collection('templates').add({
          emoji: p.emoji,
          label: p.label,
          style: p.style,
          styleName: p.style,
          cat: p.cat,
          prompt: p.prompt,
          image: imageDataUri,
          isTrending: false,
          isNew: true,
          isPro: false,
          likes: 0,
          uses: 0,
          status: 'pending',
          generatedDate: new Date().toISOString().slice(0, 10),
          createdAt: new Date().toISOString(),
        });
        generated++;
      } catch (e) {
        errors.push(`${p.label}: ${String(e)}`);
      }
    }

    res.json({ ok: true, generated, errors: errors.length ? errors : null });
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
