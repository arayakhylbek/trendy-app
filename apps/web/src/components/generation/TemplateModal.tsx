import { useRef, useState } from 'react';
import type { Template } from '@trendy/shared';
import { compressImage } from '../../lib/compressImage';

interface Props {
  template: Template | null;
  onClose: () => void;
  onGenerate: (template: Template, imageBase64: string | undefined, imageBase64_2?: string | undefined) => void;
}

interface PhotoSlot {
  previewSrc: string | undefined;
  compressedBase64: string | undefined;
  ready: boolean;
}

const EMPTY_SLOT: PhotoSlot = { previewSrc: undefined, compressedBase64: undefined, ready: false };

export function TemplateModal({ template, onClose, onGenerate }: Props) {
  const [slot1, setSlot1] = useState<PhotoSlot>(EMPTY_SLOT);
  const [slot2, setSlot2] = useState<PhotoSlot>(EMPTY_SLOT);
  const ref1 = useRef<HTMLInputElement>(null);
  const ref2 = useRef<HTMLInputElement>(null);

  if (!template) return null;

  const isCouple = template.isCouple === true;
  const canGenerate = isCouple ? slot1.ready && slot2.ready : slot1.ready;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>, slot: 1 | 2) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const src = ev.target?.result as string;
      const compressed = await compressImage(src, 1024, 0.85);
      const base64 = compressed.split(',')[1];
      const update: PhotoSlot = { previewSrc: src, compressedBase64: base64, ready: true };
      if (slot === 1) setSlot1(update);
      else setSlot2(update);
    };
    reader.readAsDataURL(file);
  }

  function handleGenerate() {
    if (!canGenerate) return;
    onGenerate(template!, slot1.compressedBase64, isCouple ? slot2.compressedBase64 : undefined);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm bg-surface rounded-2xl border border-surface-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-white font-display text-lg">{template.label}</h2>
            <p className="text-text-muted text-sm">
              {isCouple ? '💑 Couple · upload 2 photos' : template.style}
            </p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-white transition-colors text-xl">✕</button>
        </div>

        {isCouple ? (
          /* Couple mode: two side-by-side slots */
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <PhotoUploadSlot
              slot={slot1}
              label="Her photo"
              emoji="👧"
              onClick={() => ref1.current?.click()}
            />
            <PhotoUploadSlot
              slot={slot2}
              label="His photo"
              emoji="👦"
              onClick={() => ref2.current?.click()}
            />
          </div>
        ) : (
          /* Solo mode: single large slot */
          <div
            className={`
              relative rounded-xl overflow-hidden cursor-pointer border-2 border-dashed transition-colors mb-4
              ${slot1.ready ? 'border-accent' : 'border-surface-border hover:border-white/20'}
            `}
            style={{ aspectRatio: '3/4' }}
            onClick={() => ref1.current?.click()}
          >
            {slot1.previewSrc ? (
              <img src={slot1.previewSrc} alt="Your photo" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-text-muted gap-2">
                <span className="text-4xl">📷</span>
                <p className="text-sm">Upload your photo</p>
                <span className="text-xs text-text-dim">Tap to choose</span>
              </div>
            )}
          </div>
        )}

        <input ref={ref1} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e, 1)} />
        <input ref={ref2} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e, 2)} />

        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="w-full py-3 rounded-xl font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-accent text-black hover:opacity-90"
        >
          {canGenerate
            ? 'Generate ✦'
            : isCouple
              ? slot1.ready ? 'Upload his photo' : 'Upload her photo first'
              : 'Upload a photo first'}
        </button>

        <p className="text-text-dim text-xs text-center mt-3">
          {isCouple ? '~60 seconds · uses 1 generation' : '~30 seconds · uses 1 generation'}
        </p>
      </div>
    </div>
  );
}

function PhotoUploadSlot({
  slot, label, emoji, onClick,
}: { slot: PhotoSlot; label: string; emoji: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        aspectRatio: '3/4',
        borderRadius: 12,
        border: `2px dashed ${slot.ready ? 'rgb(var(--color-accent, 255 107 157))' : 'rgba(255,255,255,0.1)'}`,
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
        background: '#16161a',
      }}
    >
      {slot.previewSrc ? (
        <img src={slot.previewSrc} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#666' }}>
          <span style={{ fontSize: 28 }}>{emoji}</span>
          <span style={{ fontSize: 11, textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
          <span style={{ fontSize: 10, color: '#444' }}>Tap to choose</span>
        </div>
      )}
      {slot.ready && (
        <div style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.7)', borderRadius: 20, padding: '2px 8px', fontSize: 10, color: '#4ade80' }}>
          ✓
        </div>
      )}
    </div>
  );
}
