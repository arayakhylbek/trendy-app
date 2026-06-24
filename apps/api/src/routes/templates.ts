import { Router } from 'express';
import { db } from '../lib/firebase.js';
import { NotFoundError } from '@trendy/shared';

const router: ReturnType<typeof Router> = Router();

const NOW = '2026-06-18T00:00:00.000Z';

const STATIC_TEMPLATES = [
  {
    id: '24',
    emoji: '⚾',
    label: 'Baseball Stadium Cam',
    style: 'Cinematic',
    styleName: 'Cinematic',
    cat: 'kdrama',
    isTrending: true,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: '/templates/Gemini_Generated_Image_mp2jsfmp2jsfmp2j.png',
    prompt:
      "Photorealistic broadcast TV camera screenshot of a young woman accidentally caught on live Korean baseball KBO broadcast camera, she notices the camera and gives a soft natural smile directly into the lens, relaxed and candid moment. She is seated in stadium bleachers wearing a dark navy Doosan Bears jersey. She is holding red thunder sticks loosely in her lap. Background is softly blurred — a few calm seated fans behind her, no chaos or movement. Stadium lighting is cool blue-tinted LED floodlights, cinematic night game atmosphere. Shallow depth of field, subject is sharp and in focus. Framed as a live TV broadcast screenshot: scoreboard graphic overlay in top-left corner with Korean team names and score, fictional Korean sports channel logo top-right corner reading 'KSBN LIVE' in clean broadcast font. Lower-third Korean text subtitle visible at bottom. The overall feel is calm, beautiful, intimate — like a quiet moment caught by the broadcast camera. Hyper-realistic, 4K broadcast quality, film grain, cinematic.",
  },
  {
    id: '25',
    emoji: '💕',
    label: 'Fashion Doll',
    style: 'Aesthetic',
    styleName: 'Aesthetic',
    cat: 'aesthetic',
    isTrending: true,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: '/templates/Gemini_Generated_Image_7aatlu7aatlu7aat.png',
    prompt:
      "Ultra-stylish fashion editorial photo transformed into a living doll aesthetic. Subject styled as a hyper-glamorous Y2K fashion doll — flawless porcelain skin, big sparkling eyes with lash extensions, glossy pink lips, perfectly sculpted cheekbones. Wearing a chic pink mini dress with satin ribbon details, pearl accessories, and platform heels. Background is a dreamy pastel pink studio with soft bokeh. Lighting is high-key fashion photography with ring light catchlights in the eyes. The overall feel is playful, luxurious, and fashion-forward — like a Barbie come to life. Hyper-realistic, editorial quality, 4K, fashion magazine cover aesthetic.",
  },
  {
    id: '26',
    emoji: '📸',
    label: 'Magazine Cover',
    style: 'Editorial',
    styleName: 'Editorial',
    cat: 'aesthetic',
    isTrending: true,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: '/templates/Gemini_Generated_Image_b5jmleb5jmleb5jm.png',
    prompt:
      "Hyper-realistic high-fashion magazine cover photo shoot. Subject transformed into a stunning editorial model on the cover of a prestigious fashion magazine. Flawless retouched skin, dramatic makeup — sharp contour, bold lip, sculpted brows. Wearing a couture designer outfit — structured blazer or avant-garde dress in bold color. Shot against a clean studio background or iconic cityscape. Lighting is dramatic fashion photography — strong key light, sculpted shadows, magazine-quality retouching. Magazine logo in bold serif font at the top, cover lines with fashion headlines overlaid. The overall feel is powerful, glamorous, and iconic — a real magazine cover moment. Hyper-realistic, 4K, Vogue/Harper's Bazaar editorial quality.",
  },
  {
    id: '27',
    emoji: '🌤️',
    label: 'Windy Day',
    style: 'Aesthetic',
    styleName: 'Aesthetic',
    cat: 'aesthetic',
    isTrending: true,
    isNew: false,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: '/templates/Gemini_Generated_Image_w4se3zw4se3zw4se.png',
    prompt:
      "Cinematic outdoor portrait on a beautifully windy day. Subject's hair flowing naturally in the breeze, candid and carefree expression. Soft natural daylight with scattered clouds creating dynamic shadow play. Subject wearing a light flowy dress or oversized jacket. Background is an open field, coastal cliff, or city street with leaves drifting past. The wind adds movement and life to every element of the frame — hair, fabric, surrounding foliage. Shallow depth of field, warm-toned color grade, film photography aesthetic. The overall mood is free-spirited, romantic, and effortlessly beautiful. Hyper-realistic, 4K, editorial outdoor photography.",
  },
  {
    id: '28',
    emoji: '✨',
    label: 'Golden Hour',
    style: 'Aesthetic',
    styleName: 'Aesthetic',
    cat: 'aesthetic',
    isTrending: false,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: '/templates/Gemini_Generated_Image_x0qd5xx0qd5xx0qd.png',
    prompt:
      'Stunning golden hour portrait bathed in warm sunset light. Subject glowing with the magical hour light — skin luminous with warm orange and amber tones, soft rim lighting creating a natural halo effect. Shot outdoors — open field, rooftop, beach, or hilltop. The sun is low on the horizon creating long shadows and lens flares. Subject is relaxed and radiant, wearing something light and airy. Background sky is a gradient of deep orange, pink, and purple. The overall mood is dreamy, warm, and cinematic — the perfect end-of-day glow. Hyper-realistic, 4K, golden hour photography.',
  },
  {
    id: '29',
    emoji: '🌅',
    label: 'Morning Glow',
    style: 'Aesthetic',
    styleName: 'Aesthetic',
    cat: 'aesthetic',
    isTrending: false,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: '/templates/Gemini_Generated_Image_y38do0y38do0y38d.png',
    prompt:
      'Soft and luminous morning portrait in the first light of day. Subject waking up to gentle sunrise light streaming through sheer curtains or captured outdoors at dawn. Skin looks dewy and naturally glowing — warm peachy tones, minimal makeup, fresh-faced beauty. Wearing a cozy oversized sweater, silk robe, or simple white outfit. Background is soft and airy — bedroom window, balcony, or misty morning landscape. Light is diffused and golden, creating an ethereal haze. The overall mood is calm, intimate, and beautifully soft — the quiet magic of early morning. Hyper-realistic, 4K, soft morning light photography.',
  },
  {
    id: '30',
    emoji: '💗',
    label: 'Hotel Glam',
    style: 'Aesthetic',
    styleName: 'Aesthetic',
    cat: 'aesthetic',
    isTrending: true,
    isNew: false,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: '/templates/Gemini_Generated_Image_aqvtgtaqvtgtaqvt.png',
    prompt:
      'Ultra-glamorous luxury hotel room portrait. Subject looking effortlessly chic in a five-star hotel setting — marble bathroom, plush king-size bed with crisp white linens, floor-to-ceiling windows with city skyline view. Dressed in a silk slip dress or elegant loungewear. Makeup is polished and glam — glossy lips, defined eyes. Lighting is a mix of warm bedside lamps and cool ambient window light creating a moody, luxurious atmosphere. The vibe is aspirational travel content meets fashion editorial — rich textures, opulent details, cinematic color grade. Hyper-realistic, 4K, luxury lifestyle photography.',
  },
  {
    id: '31',
    emoji: '🎬',
    label: 'Scream Night',
    style: 'Horror',
    styleName: 'Horror',
    cat: 'aesthetic',
    isTrending: true,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: '/templates/Gemini_Generated_Image_a3rcpta3rcpta3rc.png',
    prompt:
      'Cinematic horror movie still inspired by classic slasher films. Subject styled as the iconic final girl — wide frightened eyes, disheveled hair, torn or blood-splattered clothing. Scene set at night in a dark suburban street, haunted house, or dimly lit corridor. Dramatic chiaroscuro lighting with harsh shadows and a single flickering light source. Color grade is desaturated with deep blues and harsh white highlights — classic horror film look. The overall atmosphere is terrifying, suspenseful, and cinematic — like a frame from a 90s horror blockbuster. Hyper-realistic, 4K, horror film cinematography.',
  },
  {
    id: '35',
    emoji: '🩵',
    label: 'Cyan Editorial',
    style: 'Editorial',
    styleName: 'Editorial',
    cat: 'aesthetic',
    isTrending: true,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: '/templates/cyan-editorial.jpg',
    prompt:
      'Close-up editorial portrait. Subject with flowing auburn brown hair, smoky eye makeup and deep berry lip. Shot against a bold cyan blue geometric background with dramatic shadows. Intense gaze directed slightly upward, confident expression. Soft natural skin texture, fashion magazine quality lighting. High fashion editorial photography, 4K.',
  },
  {
    id: '36',
    emoji: '🌸',
    label: 'Pink Beauty',
    style: 'Beauty',
    styleName: 'Beauty',
    cat: 'aesthetic',
    isTrending: true,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: '/templates/pink-beauty.jpg',
    prompt:
      'Minimalist beauty portrait. Subject with dark hair swept up in a loose bun with soft curtain bangs framing the face. Wearing gold hoop earrings and a delicate gold chain necklace. Soft pink pastel background, clean natural makeup, dewy skin, golden-brown eyes. Intimate close-up, beauty campaign aesthetic, soft diffused studio lighting. High fashion beauty photography, 4K.',
  },
  {
    id: '37',
    emoji: '🧥',
    label: 'Denim Edge',
    style: 'Street',
    styleName: 'Street',
    cat: 'urban',
    isTrending: true,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: '/templates/denim-edge.jpg',
    prompt:
      'Street fashion portrait. Subject with dramatic dark hair swept up in a tousled updo, wearing a classic blue denim jacket over a white tee and large silver hoop earrings. Soft coral lip, strong brow, intense direct gaze into camera. Muted pink urban wall background. Cool-girl street style meets editorial fashion. Portrait format, natural light, 4K.',
  },
  {
    id: '38',
    emoji: '💙',
    label: 'Blue Neon',
    style: 'Futuristic',
    styleName: 'Futuristic',
    cat: 'aesthetic',
    isTrending: true,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: '/templates/blue-neon.jpg',
    prompt:
      'Futuristic studio portrait. Subject with sleek dark hair worn back, wearing a black fitted turtleneck. Face dramatically lit with cool electric blue neon light from one side, creating a striking split-light effect against a soft lavender-grey background. Minimal makeup, clean dewy skin, serene direct expression. Sci-fi editorial aesthetic, cinematic quality, 4K.',
  },
  {
    id: '39',
    emoji: '✨',
    label: 'Afro Glow',
    style: 'Artistic',
    styleName: 'Artistic',
    cat: 'aesthetic',
    isTrending: true,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: '/templates/afro-glow.jpg',
    prompt:
      'Artistic beauty portrait. Subject with a voluminous natural afro halo, glowing deep skin, soft golden highlights. Dreamy pink-peach pastel background with soft atmospheric mist at the base. Bare shoulders, no jewellery, natural luminous skin with a subtle sheen. Gazing slightly upward with a contemplative expression. Fine art beauty photography, cinematic, 4K.',
  },
  {
    id: '32',
    emoji: '🌺',
    label: 'Maldives Lunch',
    style: 'Luxury',
    styleName: 'Luxury',
    cat: 'aesthetic',
    isTrending: true,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: '/templates/maldives-lunch.jpg',
    prompt:
      'Luxury resort lifestyle photo. Subject seated at an outdoor beachside restaurant table with a plate of fresh sushi, turquoise Maldives ocean and palm trees in the background. Wearing a sleek black swimsuit top and white linen skirt. Warm tropical sunlight, natural glowing skin, effortless beauty. Shot on a bright sunny day with crystal clear water behind. Editorial travel photography, cinematic, 4K.',
  },
  {
    id: '33',
    emoji: '🪩',
    label: 'Pearl Glow',
    style: 'Editorial',
    styleName: 'Editorial',
    cat: 'aesthetic',
    isTrending: true,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: '/templates/pearl-glow.jpg',
    prompt:
      'Elegant editorial portrait. Subject wearing a classic white off-shoulder blouse with layered pearl and gold chain necklaces and a delicate bracelet. Hair loosely pinned up with soft strands falling across the face. Clean light grey studio background, soft diffused lighting that emphasizes skin texture and natural beauty. Intimate, timeless, luxury jewelry campaign aesthetic. High fashion photography, 4K, film grain.',
  },
  {
    id: '34',
    emoji: '🌸',
    label: 'Flower Field',
    style: 'Romantic',
    styleName: 'Romantic',
    cat: 'aesthetic',
    isTrending: true,
    isNew: true,
    isPro: false,
    likes: 0,
    uses: 0,
    createdAt: NOW,
    image: '/templates/flower-field.jpg',
    prompt:
      'Dreamy romantic portrait of a person lying in a lush green flower field surrounded by blooming pink daisies. Wearing a pink floral ruffled sundress. Flowers tucked into hair, flower-shaped earrings. Close-up face shot looking directly into camera with soft natural expression. Warm golden sunlight filtering through greenery. Soft bokeh background, freckled dewy skin, vibrant yet tender mood. Editorial nature photography, 4K, cinematic.',
  },
  // ── K-Drama (3) ──────────────────────────────────────────────────────────────
  {
    id: '40', emoji: '🌧️', label: 'Seoul Rain', style: 'K-Drama', styleName: 'K-Drama',
    cat: 'kdrama', isTrending: true, isNew: true, isPro: false, likes: 0, uses: 0, createdAt: NOW,
    image: '/templates/kdrama-rain.jpg',
    prompt: 'Cinematic Korean drama scene. Standing on a quiet Seoul street at night in the rain holding a transparent bubble umbrella, pastel trench coat, warm neon CU convenience store signs in Korean glowing behind. Wet pavement reflections, cinematic warm-cool color grade, K-drama lead energy, 4K.',
  },
  {
    id: '41', emoji: '🌸', label: 'School Romance', style: 'K-Drama', styleName: 'K-Drama',
    cat: 'kdrama', isTrending: true, isNew: true, isPro: false, likes: 0, uses: 0, createdAt: NOW,
    image: '/templates/kdrama-uniform.jpg',
    prompt: 'Korean high school drama aesthetic. Sitting by a large classroom window in a Korean school uniform — white shirt, navy blazer, plaid skirt. Cherry blossom petals float past the open window. Resting chin on hand, dreamy expression. Warm golden afternoon light, clean pastel tones, K-drama school romance, 4K.',
  },
  {
    id: '42', emoji: '🏮', label: 'Hanok Night', style: 'K-Drama', styleName: 'K-Drama',
    cat: 'kdrama', isTrending: false, isNew: true, isPro: false, likes: 0, uses: 0, createdAt: NOW,
    image: '/templates/kdrama-hanok.jpg',
    prompt: 'Period Korean drama romantic scene. Traditional pink silk hanbok with gold embroidery, standing in a wooden hanok courtyard with paper lanterns and plum blossom trees in full bloom. Gentle evening light, floating petals, dramatic yet delicate atmosphere. Historical K-drama romance, cinematic 4K.',
  },
  // ── Anime (3) ────────────────────────────────────────────────────────────────
  {
    id: '43', emoji: '🎒', label: 'Sailor Class', style: 'Anime', styleName: 'Anime',
    cat: 'anime', isTrending: true, isNew: true, isPro: false, likes: 0, uses: 0, createdAt: NOW,
    image: '/templates/anime-school.jpg',
    prompt: 'Anime aesthetic in real life. Sitting on top of a school desk in a Japanese sailor uniform — white sailor blouse, red bow, dark pleated skirt, white thigh-high socks. Classroom with golden sunset light, cherry blossoms outside the window. Large bright eyes, anime heroine real-life style, 4K.',
  },
  {
    id: '44', emoji: '⭐', label: 'Magical Girl', style: 'Anime', styleName: 'Anime',
    cat: 'anime', isTrending: true, isNew: true, isPro: false, likes: 0, uses: 0, createdAt: NOW,
    image: '/templates/anime-magical.jpg',
    prompt: 'Magical girl transformation in real life. Stunning pink and lavender pleated skirt outfit, white gloves, star accessories, holding a glowing star wand. Pastel blue and pink swirling background with hanging star lights and a glowing magic circle. Sailor Moon energy, dramatic pose, 4K editorial.',
  },
  {
    id: '45', emoji: '🌆', label: 'Tokyo Rooftop', style: 'Anime', styleName: 'Anime',
    cat: 'anime', isTrending: true, isNew: true, isPro: false, likes: 0, uses: 0, createdAt: NOW,
    image: '/templates/anime-rooftop.jpg',
    prompt: 'Anime-style rooftop at sunset. Sitting on a rooftop fence in a Japanese school uniform, wind blowing through hair. Tokyo city skyline and orange-pink sky with Tokyo Tower visible behind, tiny sparkles in the air. Dreamy anime illustration aesthetic rendered in photorealistic style, golden hour, 4K.',
  },
  // ── Fantasy (3) ──────────────────────────────────────────────────────────────
  {
    id: '46', emoji: '🧝', label: 'Forest Elf', style: 'Fantasy', styleName: 'Fantasy',
    cat: 'fantasy', isTrending: false, isNew: true, isPro: false, likes: 0, uses: 0, createdAt: NOW,
    image: '/templates/fantasy-elf.jpg',
    prompt: 'High fantasy elven portrait. Silver-blonde hair and pointed ears, intricate flowing emerald green gown with leaf-and-vine embroidery. Enchanted ancient forest with glowing fireflies and bioluminescent flowers behind. Regal posture, intense intelligent eyes. LOTR-level fantasy cinematics, 8K detail.',
  },
  {
    id: '47', emoji: '🔮', label: 'Dark Witch', style: 'Fantasy', styleName: 'Fantasy',
    cat: 'fantasy', isTrending: true, isNew: true, isPro: false, likes: 0, uses: 0, createdAt: NOW,
    image: '/templates/fantasy-witch.jpg',
    prompt: 'Dark fantasy witch portrait. Black wavy hair, dramatic black velvet cloak with moon and star embroidery, holding a glowing crystal ball. Mystical tower library with floating candles, ancient spell books and purple magical smoke. Deep violet and gold tones, cinematic dark fantasy, 4K.',
  },
  {
    id: '48', emoji: '🏰', label: 'Castle Princess', style: 'Fantasy', styleName: 'Fantasy',
    cat: 'fantasy', isTrending: true, isNew: true, isPro: false, likes: 0, uses: 0, createdAt: NOW,
    image: '/templates/fantasy-princess.jpg',
    prompt: 'Fairy tale princess on a magical castle balcony at twilight. Ethereal white tulle ball gown with silver embroidery and tiny crystals. Stars and moonlight behind, glowing fireflies around the dress, flowering vines on stone railing. Disney princess meets editorial photography, whimsical, 4K.',
  },
  // ── Vintage (3) ──────────────────────────────────────────────────────────────
  {
    id: '49', emoji: '🪩', label: '70s Soul', style: 'Vintage', styleName: 'Vintage',
    cat: 'vintage', isTrending: false, isNew: true, isPro: false, likes: 0, uses: 0, createdAt: NOW,
    image: '/templates/vintage-70s.jpg',
    prompt: '1970s fashion portrait. Natural afro hairstyle, bold rust-orange wide-collar blouse, high-waist flared denim jeans, platform heels, hands on hips. Retro living room with yellow-orange geometric wallpaper, lava lamp, vintage record player on a wooden sideboard. Kodachrome film aesthetic, 4K.',
  },
  {
    id: '50', emoji: '🥐', label: 'Paris 60s', style: 'Vintage', styleName: 'Vintage',
    cat: 'vintage', isTrending: false, isNew: true, isPro: false, likes: 0, uses: 0, createdAt: NOW,
    image: '/templates/vintage-paris.jpg',
    prompt: '1960s French New Wave cinema aesthetic. Short chic bob haircut, striped Breton top, high-waist wide-leg trousers, sitting at a Parisian sidewalk café table with espresso. Cobblestone street, classic French cars behind. Black and white film with warm sepia tint, Godard film aesthetic, 4K.',
  },
  {
    id: '51', emoji: '📼', label: '90s Hallway', style: 'Vintage', styleName: 'Vintage',
    cat: 'vintage', isTrending: true, isNew: true, isPro: false, likes: 0, uses: 0, createdAt: NOW,
    image: '/templates/vintage-90s.jpg',
    prompt: '90s nostalgia fashion. Straight-across bangs, butterfly hair clips, slip dress over white t-shirt, chunky platform sneakers. Leaning against a school locker covered in Nirvana and Spice Girls posters and polaroid photos. Warm overexposed film grain, vintage 90s color palette, nostalgic, 4K.',
  },
];

function isFirebaseUnconfigured(e: unknown): boolean {
  return e instanceof Error && e.message.includes('Firebase Admin credentials not configured');
}

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
    const firestoreTemplates = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((t: Record<string, unknown>) => t['status'] !== 'pending');

    // Merge: Firestore first (AI-generated), then STATIC_TEMPLATES not already in Firestore
    const firestoreIds = new Set(firestoreTemplates.map((t) => t.id));
    let statics = STATIC_TEMPLATES.filter((t) => !firestoreIds.has(t.id));
    if (typeof cat === 'string' && cat !== 'all') {
      if (cat === 'trending') {
        statics = statics.filter((t) => t.isTrending);
      } else {
        statics = statics.filter((t) => t.cat === cat);
      }
    }

    return res.json({ templates: [...firestoreTemplates, ...statics] });
  } catch (e) {
    if (isFirebaseUnconfigured(e)) {
      let templates = STATIC_TEMPLATES;
      const { cat } = req.query;
      if (typeof cat === 'string' && cat !== 'all') {
        if (cat === 'trending') {
          templates = STATIC_TEMPLATES.filter((t) => t.isTrending);
        } else {
          templates = STATIC_TEMPLATES.filter((t) => t.cat === cat);
        }
      }
      return res.json({ templates });
    }
    return next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const snap = await db.collection('templates').doc(req.params.id).get();
    if (!snap.exists) return next(new NotFoundError('Template'));
    res.json({ template: { id: snap.id, ...snap.data() } });
  } catch (e) {
    if (isFirebaseUnconfigured(e)) {
      const template = STATIC_TEMPLATES.find((t) => t.id === req.params.id);
      if (!template) return next(new NotFoundError('Template'));
      return res.json({ template });
    }
    next(e);
  }
});

export default router;
