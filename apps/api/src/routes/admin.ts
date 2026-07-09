import { Router } from 'express';
import { db, adminStorage } from '../lib/firebase.js';
import { ensureOwner } from '../middleware/ensureOwner.js';
import { AppError } from '@trendy/shared';
import { runGeneration } from './cron.js';
import { GeminiProvider } from '../ai/GeminiProvider.js';
import { STATIC_TEMPLATES } from './templates.js';

const router: ReturnType<typeof Router> = Router();

router.use(ensureOwner);

// Upload image buffer to Firebase Storage → return public URL
async function uploadTemplateImage(buffer: Buffer, label: string): Promise<string> {
  const bucket = adminStorage.bucket();
  const filename = `templates/${Date.now()}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.jpg`;
  const file = bucket.file(filename);
  await file.save(buffer, { contentType: 'image/jpeg', metadata: { cacheControl: 'public, max-age=31536000' } });
  await file.makePublic();
  return `https://storage.googleapis.com/${bucket.name}/${filename}`;
}

// Trending TikTok / Instagram AI photo aesthetics — updated regularly
// Based on: #aiart #aiphoto #aiportrait #aestheticphoto trends
const STYLED_PROMPTS: Array<{ emoji: string; label: string; style: string; cat: string; prompt: string }> = [
  // K-Drama / Korean aesthetic
  { emoji: '🌧️', label: 'Seoul Rain', style: 'K-Drama', cat: 'kdrama',
    prompt: 'Cinematic photorealistic portrait. Real woman standing on a quiet Seoul street at night in the rain, holding a transparent bubble umbrella, wearing a soft pastel pink trench coat. CU convenience store neon signs glowing in Korean behind her. Wet cobblestone pavement reflections. Warm-cool cinematic color grade. Professional photography, 4K.' },
  { emoji: '🌸', label: 'Cherry Blossom', style: 'K-Drama', cat: 'kdrama',
    prompt: 'Photorealistic K-drama portrait. Young woman in a Korean high school uniform — navy blazer, plaid skirt, red bow tie — sitting at a classroom desk by a large open window with cherry blossoms drifting in. Soft golden afternoon light. Clean, dreamy, professional photography, 4K cinematic.' },
  { emoji: '☕', label: 'Café Seoul', style: 'K-Drama', cat: 'kdrama',
    prompt: 'Photorealistic editorial portrait. Elegant woman in a modern Seoul café, wearing a camel wool coat, holding a ceramic coffee cup, looking out a rain-streaked window. Warm amber café interior lights, soft bokeh. Professional fashion photography, cinematic color grade, 4K.' },

  // Trending TikTok aesthetics (2024-2025: coquette, dark academia, Y2K, editorial)
  { emoji: '🎀', label: 'Coquette Bow', style: 'Aesthetic', cat: 'aesthetic',
    prompt: 'Viral TikTok coquette aesthetic photorealistic portrait. Woman in a soft pink satin slip dress with large satin ribbon bow in hair, holding a bouquet of white roses. Soft pink and cream background with sheer curtain. Dreamy pastel tones, professional beauty photography, 4K.' },
  { emoji: '📚', label: 'Dark Academia', style: 'Aesthetic', cat: 'aesthetic',
    prompt: 'Dark academia aesthetic editorial portrait. Woman in a camel blazer, Oxford shirt, and plaid trousers, standing in an atmospheric old university library with towering bookshelves, wooden ladders, warm lamp light. Moody brown-green tones, dust motes in light beams. Photorealistic professional photography, 4K.' },
  { emoji: '💿', label: 'Y2K Glam', style: 'Aesthetic', cat: 'aesthetic',
    prompt: 'Y2K early 2000s nostalgia fashion editorial. Real woman in a silver iridescent halter top, low-rise flared jeans, chunky platform shoes, butterfly clips in hair. Fun colorful early-2000s background. Oversaturated warm pop colors, professional fashion photography, 4K.' },

  // K-Drama / Hanok
  { emoji: '🏮', label: 'Hanok Lanterns', style: 'K-Drama', cat: 'kdrama',
    prompt: 'Photorealistic period K-drama portrait. Woman in a traditional Korean hanbok — pale blush silk with gold floral embroidery — standing alone in a wooden hanok courtyard at dusk. Paper lanterns glowing warmly around her, plum blossoms in the background. Real photography quality, cinematic 4K.' },

  // Vintage (90s, 70s)
  { emoji: '📼', label: '90s School', style: 'Vintage', cat: 'vintage',
    prompt: 'Authentic 1990s American high school nostalgia portrait. Young woman with feathered bangs and butterfly clips, wearing a floral slip dress over white t-shirt, chunky sneakers. Leaning on a school locker with Spice Girls and Nirvana posters. Warm overexposed film grain, real photography aesthetic, 4K.' },
  { emoji: '🪩', label: '70s Groovy', style: 'Vintage', cat: 'vintage',
    prompt: 'Authentic 1970s fashion portrait. Confident woman with a full afro, wearing a rust-orange wide-collar printed blouse, high-waist flared trousers, platform shoes. Retro apartment with groovy geometric wallpaper and lava lamp. Warm Kodachrome film photography aesthetic, 4K.' },
  { emoji: '🎞️', label: 'Film Noir', style: 'Vintage', cat: 'vintage',
    prompt: 'Photorealistic 1940s film noir portrait. Glamorous woman with victory rolls hairstyle, red lips, wearing a belted black trench coat, standing under a lamppost on a rainy cobblestone street at night. High-contrast shadows, black and white with slight sepia. Real photography quality, 4K.' },

  // Trending: editorial & nature
  { emoji: '🌿', label: 'Cottagecore', style: 'Aesthetic', cat: 'aesthetic',
    prompt: 'Cottagecore aesthetic editorial portrait. Woman in a vintage floral prairie dress with puffed sleeves, standing in a wildflower meadow at golden hour. Holding a wicker basket with flowers. Soft warm backlighting, bokeh flowers, earthy tones. Photorealistic, professional photography, 4K.' },
  { emoji: '🌙', label: 'Moonlit Night', style: 'Aesthetic', cat: 'aesthetic',
    prompt: 'Dreamy moonlit night editorial portrait. Woman in a silver satin evening gown standing on a coastal cliff at night with a full moon over the ocean behind her. Moonlight illuminating her face and dress, silver and navy tones. Photorealistic cinematic photography, 4K.' },

  // Sports / senior-photo aesthetic
  { emoji: '🎾', label: 'Tennis Ace', style: 'Sporty', cat: 'sports',
    prompt: 'Photorealistic sporty editorial portrait. Young woman sitting on a tennis court, one leg extended, wearing an all-white tennis fit — ribbed tank top, pleated tennis skirt, matching headband, white sneakers and crew socks. Tennis racket and two tennis balls resting beside her on the court. Court is bold blue and green with white sideline markings, tennis net visible behind her. Bright, clean daylight, high-fashion sports editorial lighting. Confident, relaxed pose, subtle smile. Hyper-realistic, 4K, professional sports lifestyle photography.' },
  { emoji: '🏐', label: 'Volleyball Star', style: 'Sporty', cat: 'sports',
    prompt: 'Dramatic photorealistic sports portrait. Young woman leaning against a volleyball net, wearing a long-sleeve blue volleyball jersey with a bold number and team lettering, knee pads, holding a volleyball at her hip. Backlit rim lighting cutting through the net, dark moody gym background with subtle lens flare. Intense, focused expression, athletic confident stance. Hyper-realistic, 4K, dramatic senior sports photography.' },
  { emoji: '🏀', label: 'Hoop Dreams', style: 'Sporty', cat: 'sports',
    prompt: 'Photorealistic studio sports portrait. Young woman crouching low, dribbling a basketball, wearing a yellow and navy basketball uniform, hair in double braids, basketball sneakers. Clean bright white studio background, soft even lighting with subtle shadow. Confident, powerful athletic pose, direct gaze at camera. Hyper-realistic, 4K, professional sports studio photography.' },
  { emoji: '🏐', label: 'Varsity Volleyball', style: 'Sporty', cat: 'sports',
    prompt: 'Photorealistic senior sports portrait. Young woman standing side-on against a plain dark studio backdrop, wearing a navy volleyball uniform with an arm sleeve and bold number, holding a volleyball against her hip, warm confident smile, long hair loose. Soft dramatic side lighting with a subtle rim light. Hyper-realistic, 4K, professional senior sports photography.' },
  { emoji: '⛳', label: 'Country Club Cart', style: 'Preppy', cat: 'sports',
    prompt: 'Photorealistic preppy lifestyle portrait. Young woman sitting in a golf cart on a sunny golf course, wearing a white sports-bra top, matching pleated skirt, cream knit cardigan, and white visor, one hand adjusting the visor. Golf clubs visible in the bag beside her, lush green fairway and trees in the background. Bright natural daylight, clean aspirational lifestyle photography. Relaxed, chic pose. Hyper-realistic, 4K, editorial lifestyle photography.' },
  { emoji: '🎾', label: 'Clay Court Glow', style: 'Sporty', cat: 'sports',
    prompt: 'Photorealistic golden hour tennis portrait. Young woman standing at the net on a red clay tennis court, wearing a fitted white halter tennis dress and white visor, holding a tennis racket, warm low sunlight creating soft flare and glow. Elegant, poised stance, looking off to the side. Hyper-realistic, 4K, editorial sports lifestyle photography.' },
  { emoji: '🎾', label: 'Match Point Smile', style: 'Sporty', cat: 'sports',
    prompt: 'Photorealistic sporty portrait. Young woman standing on an outdoor tennis court, wearing a white zip-up tennis polo and holding a tennis racket over her shoulder and a tennis ball in hand, bright genuine smile, long wavy hair. Soft overcast daylight, clean green court background. Hyper-realistic, 4K, professional sports lifestyle photography.' },
  { emoji: '🏀', label: 'Fire on the Court', style: 'Sporty', cat: 'sports',
    prompt: 'Cinematic dramatic sports portrait. Young woman sitting on a folding chair on a basketball court surrounded by basketballs, wearing a white and red basketball uniform with an arm sleeve, resting a basketball on her lap, one foot propped on a ball. Thick orange smoke and dramatic rim lighting fill the background, moody gym atmosphere. Hyper-realistic, 4K, dramatic senior sports photography.' },
  { emoji: '⛳', label: 'Fairway Glam', style: 'Preppy', cat: 'sports',
    prompt: 'Photorealistic glamorous golf lifestyle portrait. Young woman lounging playfully in a golf cart, wearing a fitted white sleeveless golf dress and white cap, legs draped over the seat, playful joyful smile, golf clubs and bag beside her. Warm bright sunny daylight on a manicured golf course. Hyper-realistic, 4K, aspirational lifestyle photography.' },
];

// GET /api/admin/templates?status=pending|published|all
// Returns Firestore templates + STATIC_TEMPLATES (for admin view)
router.get('/templates', async (req, res, next) => {
  try {
    const status = (req.query['status'] as string) || 'pending';
    const includeStatic = req.query['includeStatic'] === 'true';

    const snap = await db.collection('templates').orderBy('createdAt', 'desc').limit(200).get();
    let firestoreTemplates: Record<string, unknown>[] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    if (status === 'pending') {
      firestoreTemplates = firestoreTemplates.filter((t) => t['status'] === 'pending');
    } else if (status === 'published') {
      firestoreTemplates = firestoreTemplates.filter((t) => !t['status'] || t['status'] === 'published');
    }

    // Fetch hidden static template IDs
    const hiddenSnap = await db.collection('hiddenTemplates').doc('static').get();
    const hiddenIds: string[] = (hiddenSnap.data()?.['ids'] as string[] | undefined) ?? [];

    let templates: Record<string, unknown>[] = firestoreTemplates;

    if (includeStatic) {
      const firestoreIds = new Set(firestoreTemplates.map((t) => t['id'] as string));
      const staticTemplates = STATIC_TEMPLATES
        .filter((t) => !hiddenIds.includes(t.id) && !firestoreIds.has(t.id))
        .map((t) => ({ ...t, _isStatic: true }));
      templates = [...staticTemplates, ...firestoreTemplates];
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
// Works for both Firestore templates and static templates (hides them)
router.delete('/templates/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const isStatic = STATIC_TEMPLATES.some((t) => t.id === id);

    if (isStatic) {
      // Add to hidden list in Firestore
      const hiddenRef = db.collection('hiddenTemplates').doc('static');
      const hiddenSnap = await hiddenRef.get();
      const current: string[] = (hiddenSnap.data()?.['ids'] as string[] | undefined) ?? [];
      if (!current.includes(id)) {
        await hiddenRef.set({ ids: [...current, id] }, { merge: true });
      }
    } else {
      await db.collection('templates').doc(id).delete();
    }

    res.json({ ok: true, id });
  } catch (e) {
    next(e);
  }
});

// POST /api/admin/generate-styled?count=3 — generate trend-based styled templates
// POST /api/admin/generate-styled?cat=sports — generate ALL prompts in that category (no rotation)
router.post('/generate-styled', async (req, res, next) => {
  try {
    const cat = typeof req.query['cat'] === 'string' ? req.query['cat'] : undefined;
    const gemini = new GeminiProvider();

    let selected: typeof STYLED_PROMPTS;
    if (cat) {
      selected = STYLED_PROMPTS.filter((p) => p.cat === cat);
    } else {
      const count = Math.min(Number(req.query['count']) || 3, 6);
      // Rotate through prompts so each call gives different templates
      const offset = Math.floor(Date.now() / 60000) % STYLED_PROMPTS.length;
      selected = [];
      for (let i = 0; i < count; i++) {
        selected.push(STYLED_PROMPTS[(offset + i) % STYLED_PROMPTS.length]!);
      }
    }

    let generated = 0;
    const errors: string[] = [];

    for (const p of selected) {
      try {
        const imageDataUri = await gemini.generateTemplateOnly(p.prompt);
        const base64Data = imageDataUri.replace(/^data:[^;]+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // Upload to Firebase Storage (no Firestore size limit)
        const imageUrl = await uploadTemplateImage(imageBuffer, p.label);

        await db.collection('templates').add({
          emoji: p.emoji,
          label: p.label,
          style: p.style,
          styleName: p.style,
          cat: p.cat,
          prompt: p.prompt,
          image: imageUrl,
          isTrending: false,
          isNew: true,
          isPro: false,
          likes: 0,
          uses: 0,
          status: 'published',
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

// POST /api/admin/generate — trigger manual trend-based generation run
router.post('/generate', async (_req, res, next) => {
  try {
    const date = new Date().toISOString().slice(0, 10);
    const runRef = db.collection('generationRuns').doc(`${date}-manual-${Date.now()}`);
    await runRef.set({
      date, status: 'pending', templatesGenerated: 0,
      startedAt: new Date().toISOString(), triggeredBy: 'admin',
    });

    await runGeneration(date, runRef);

    const snap = await runRef.get();
    const runData = snap.data() as Record<string, unknown>;
    res.json({
      ok: true, date,
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

// POST /api/admin/users/grant-bonus { email, bonus }
// Adds bonus generations on top of plan limit (shows on screen as plan limit + bonus)
router.post('/users/grant-bonus', async (req, res, next) => {
  try {
    const { email, bonus } = req.body as { email?: string; bonus?: number };
    if (!email || bonus === undefined || bonus < 0) {
      throw new AppError('BAD_REQUEST', 'email and bonus (>=0) required', 400);
    }

    const snap = await db.collection('users').where('email', '==', email.toLowerCase().trim()).limit(1).get();
    if (snap.empty) {
      throw new AppError('NOT_FOUND', `User not found: ${email}`, 404);
    }

    const doc = snap.docs[0];
    await doc.ref.update({
      bonusGenerations: bonus,
      generationsUsed: 0,
      updatedAt: new Date().toISOString(),
    });

    res.json({ ok: true, email, bonusGenerations: bonus });
  } catch (e) {
    next(e);
  }
});

export default router;
