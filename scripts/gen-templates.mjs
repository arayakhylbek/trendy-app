/**
 * Generates styled AI template images via Gemini and saves to public/templates/
 */
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '../apps/web/public/templates');
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('GEMINI_API_KEY not set');
  process.exit(1);
}

const TEMPLATES = [
  // ── K-Drama ───────────────────────────────────────────────────────────────
  {
    filename: 'kdrama-rain.jpg',
    prompt: `Cinematic Korean drama portrait template. A young woman standing on a quiet Seoul street at night in the rain, holding a transparent bubble umbrella with colorful city lights reflecting in the wet pavement behind her. She wears a pastel trench coat and looks thoughtfully into the camera. Glowing convenience store signs in Korean in the background. Warm-cool color grade, soft bokeh, cinematic 4K quality. K-drama lead energy, emotional and romantic.`,
  },
  {
    filename: 'kdrama-uniform.jpg',
    prompt: `Korean high school drama aesthetic. A student sitting by a large classroom window in a neat Korean school uniform — white shirt, navy blazer with gold badge, pleated skirt. Cherry blossom petals float past the open window behind her. She rests her chin on her hand looking softly toward camera. Warm golden afternoon light, clean pastel tones, dreamy K-drama school romance vibe, 4K cinematic.`,
  },
  {
    filename: 'kdrama-hanok.jpg',
    prompt: `Period K-drama romantic scene. A young woman in a traditional Korean hanbok — soft pink silk with gold embroidery — standing in a beautiful wooden hanok courtyard with lanterns and plum blossom trees in full bloom. Gentle evening light, floating petals, dramatic yet delicate atmosphere. Kdrama historical romance, cinematic 4K.`,
  },

  // ── Anime ────────────────────────────────────────────────────────────────
  {
    filename: 'anime-school.jpg',
    prompt: `Photorealistic anime aesthetic. A young woman sitting on top of a school desk in a classic Japanese school uniform — white sailor blouse, red bow tie, dark pleated skirt, thigh-high white socks. Classroom with large windows and golden sunset light streaming in. Cherry blossoms visible outside. She looks playfully into camera. Very clean skin, large bright eyes, anime-inspired real-life portrait, 4K.`,
  },
  {
    filename: 'anime-magical.jpg',
    prompt: `Magical girl real-life anime aesthetic. A young woman in a stunning magical girl transformation outfit — flowing pastel pink and lavender skirt, white gloves, sparkle accessories, star wand. She poses dramatically against a glowing pastel sky with floating sparkles and magical circles around her. Dramatic fantasy lighting, hyper-detailed fabric, anime heroine energy in real life, 4K editorial.`,
  },
  {
    filename: 'anime-rooftop.jpg',
    prompt: `Anime-style rooftop scene in real life. A young woman in a Japanese school uniform sitting on a rooftop fence at sunset, wind blowing through her hair. City skyline and orange-pink sky behind her, tiny sparkles in the air. She gazes off into the distance with a peaceful expression. Very large bright eyes, clean dewy skin, anime-real hybrid aesthetic, golden hour, cinematic 4K.`,
  },

  // ── Fantasy ───────────────────────────────────────────────────────────────
  {
    filename: 'fantasy-elf.jpg',
    prompt: `High fantasy portrait. A beautiful elven woman with long silver-blonde hair and pointed ears, wearing an intricate flowing emerald green gown with leaf-and-vine embroidery. She stands in an enchanted ancient forest with glowing fireflies, bioluminescent flowers, and shafts of ethereal light breaking through giant ancient trees. Intense intelligent eyes, regal posture, LOTR-level fantasy cinematics, 8K ultra detail.`,
  },
  {
    filename: 'fantasy-witch.jpg',
    prompt: `Dark fantasy witch portrait. A young woman with black wavy hair and intense dark eyes, wearing a dramatic black velvet cloak with moon and star embroidery, holding a glowing crystal ball. She stands in a mystical library tower with floating candles, ancient spell books, and purple magical smoke. Deep violet and gold tones, cinematic lighting, dark fantasy editorial, 4K.`,
  },
  {
    filename: 'fantasy-princess.jpg',
    prompt: `Fairy tale princess portrait. A young woman in an ethereal ball gown — layers of soft white tulle with delicate silver embroidery and tiny crystals — standing on the stone balcony of a magical castle at twilight. Stars and moonlight behind her, glowing fireflies around her dress, flower vines on the stone railing. Magical, whimsical, soft cinematic lighting, Disney princess meets editorial photography, 4K.`,
  },

  // ── Vintage ───────────────────────────────────────────────────────────────
  {
    filename: 'vintage-70s.jpg',
    prompt: `Authentic 1970s fashion portrait. A young woman with a voluminous afro or wavy feathered hair, wearing a bold 70s outfit — wide-collar rust-orange blouse, high-waist flared trousers, platform shoes. She poses confidently in a retro apartment with groovy wallpaper, lava lamp, and warm tungsten lighting. Vintage film grain, warm orange-brown tones, Kodachrome photography aesthetic, 4K.`,
  },
  {
    filename: 'vintage-paris.jpg',
    prompt: `Classic 1960s French New Wave cinema portrait. A young woman with a short chic bob haircut, wearing a striped Breton top and high-waist wide-leg trousers, sitting at a Parisian sidewalk café table with an espresso and a cigarette in hand. Cobblestone street, classic French cars, black and white film feel with slight warm sepia tint. Godard film aesthetic, 4K.`,
  },
  {
    filename: 'vintage-90s.jpg',
    prompt: `90s nostalgia fashion editorial. A young woman with straight-across bangs and chunky highlights in her hair, wearing a classic 90s look — tiny butterfly clips, slip dress over a white t-shirt, chunky platform sneakers. She poses in front of a classic American school locker hallway with polaroid photos pinned to the door. Warm overexposed film grain, very 90s color palette, nostalgic, 4K.`,
  },
];

async function geminiImage(prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error ${res.status}: ${err.slice(0, 200)}`);
  }

  const json = await res.json();
  const parts = json.candidates?.[0]?.content?.parts ?? [];
  const imgPart = parts.find((p) => p.inlineData);
  if (!imgPart?.inlineData) {
    const textPart = parts.find((p) => p.text);
    throw new Error(`No image returned. Text: ${textPart?.text?.slice(0, 200) ?? 'none'}`);
  }
  return imgPart.inlineData;
}

for (const t of TEMPLATES) {
  process.stdout.write(`Generating ${t.filename}... `);
  try {
    const { mimeType, data } = await geminiImage(t.prompt);
    const buffer = Buffer.from(data, 'base64');
    const outPath = join(OUT_DIR, t.filename);
    writeFileSync(outPath, buffer);
    console.log(`✓ saved (${Math.round(buffer.length / 1024)}KB)`);
  } catch (e) {
    console.log(`✗ FAILED: ${e.message}`);
  }
  // Small delay to avoid rate limits
  await new Promise((r) => setTimeout(r, 1500));
}

console.log('\nDone!');
