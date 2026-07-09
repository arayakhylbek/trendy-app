import '../lib/firebase.js';
import { db } from '../lib/firebase.js';

function arg(name: string, required = true): string {
  const idx = process.argv.indexOf(`--${name}`);
  const val = idx !== -1 ? process.argv[idx + 1] : undefined;
  if (required && !val) {
    console.error(`Missing --${name}`);
    process.exit(1);
  }
  return val ?? '';
}

const id = arg('id');
const emoji = arg('emoji');
const label = arg('label');
const style = arg('style', false) || label;
const cat = arg('cat');
const prompt = arg('prompt');
const isTrending = process.argv.includes('--trending');
const isCouple = process.argv.includes('--couple');

async function run() {
  const ref = db.collection('templates').doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    console.error(`No template with id ${id}`);
    process.exit(1);
  }
  await ref.update({
    emoji,
    label,
    style,
    styleName: style,
    cat,
    prompt,
    isTrending,
    ...(isCouple ? { isCouple: true } : {}),
    status: 'published',
  });
  console.log(`Published "${label}" (id: ${id})`);
  process.exit(0);
}

run().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
