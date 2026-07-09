import '../lib/firebase.js';
import { db } from '../lib/firebase.js';

async function run() {
  const snap = await db.collection('templates').where('cat', '==', 'pending').get();
  if (snap.empty) {
    console.log('No pending quick-uploads.');
    process.exit(0);
  }
  for (const doc of snap.docs) {
    const d = doc.data();
    console.log(`${doc.id}\t${d['image']}`);
  }
  process.exit(0);
}

run().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
