import '../lib/firebase.js';
import { db } from '../lib/firebase.js';
import { copyFileSync, existsSync } from 'fs';
import { join, extname } from 'path';

const TEMPLATES_DIR = join(__dirname, '../../../web/public/templates');

function arg(name: string, required = true): string {
  const idx = process.argv.indexOf(`--${name}`);
  const val = idx !== -1 ? process.argv[idx + 1] : undefined;
  if (required && !val) {
    console.error(`Missing --${name}`);
    process.exit(1);
  }
  return val ?? '';
}

const imagePath = arg('image');
const emoji = arg('emoji');
const label = arg('label');
const style = arg('style', false) || label;
const cat = arg('cat');
const prompt = arg('prompt');
const isTrending = process.argv.includes('--trending');
const isCouple = process.argv.includes('--couple');

if (!existsSync(imagePath)) {
  console.error(`Image not found: ${imagePath}`);
  process.exit(1);
}

const slug = label
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');
const ext = extname(imagePath) || '.jpg';
const filename = `${slug}${ext}`;
const destPath = join(TEMPLATES_DIR, filename);

if (existsSync(destPath)) {
  console.error(`File already exists: ${destPath} — pick a different --label`);
  process.exit(1);
}

copyFileSync(imagePath, destPath);

async function run() {
  const docRef = await db.collection('templates').add({
    emoji,
    label,
    style,
    styleName: style,
    cat,
    prompt,
    image: `/templates/${filename}`,
    isTrending,
    isNew: true,
    isPro: false,
    ...(isCouple ? { isCouple: true } : {}),
    likes: 0,
    uses: 0,
    status: 'published',
    createdAt: new Date().toISOString(),
  });
  console.log(`Added template "${label}" (id: ${docRef.id}) -> /templates/${filename}`);
  process.exit(0);
}

run().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
