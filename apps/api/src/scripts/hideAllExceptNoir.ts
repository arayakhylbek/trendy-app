// One-off: hide every template except "Noir Editorial" (1rgAkbN9EnhiAGljw1Ny).
// Fully reversible — writes a restore snapshot to docs/hidden-backup.json.
// Run:  node --env-file=../../.env.local --import tsx src/scripts/hideAllExceptNoir.ts
import { writeFileSync } from 'node:fs';
import { db } from '../lib/firebase.js';
import { STATIC_TEMPLATES } from '../routes/templates.js';

const KEEP = '1rgAkbN9EnhiAGljw1Ny'; // Noir Editorial — stays visible

async function main() {
  // --- snapshot current state for exact restore ---
  const hiddenRef = db.collection('hiddenTemplates').doc('static');
  const priorHidden: string[] = (await hiddenRef.get()).data()?.['ids'] ?? [];

  const snap = await db.collection('templates').get();
  const firestoreDocs = snap.docs.map((d) => ({ id: d.id, status: d.data()['status'] ?? null }));

  const backup = {
    savedAt: new Date().toISOString(),
    priorHiddenStaticIds: priorHidden,
    firestoreStatuses: firestoreDocs, // {id, prior status} for every doc
  };
  // Run from apps/api, so repo root is two levels up
  writeFileSync('../../docs/hidden-backup.json', JSON.stringify(backup, null, 2));

  // --- hide all static templates ---
  const allStaticIds = STATIC_TEMPLATES.map((t) => t.id);
  const mergedHidden = Array.from(new Set([...priorHidden, ...allStaticIds]));
  await hiddenRef.set({ ids: mergedHidden }, { merge: true });

  // --- hide every Firestore template except KEEP (status=pending, reversible) ---
  let hiddenCount = 0;
  for (const d of firestoreDocs) {
    if (d.id === KEEP) continue;
    if (d.status === 'pending') continue;
    await db.collection('templates').doc(d.id).update({ status: 'pending' });
    hiddenCount++;
  }

  console.log(`Hidden ${allStaticIds.length} static templates`);
  console.log(`Hidden ${hiddenCount} Firestore templates (set status=pending)`);
  console.log(`Kept visible: ${KEEP}`);
  console.log('Restore snapshot -> docs/hidden-backup.json');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
