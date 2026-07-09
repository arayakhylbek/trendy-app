import { useRef, useState } from 'react';
import type { Template } from '@trendy/shared';
import { compressImage } from '../../lib/compressImage';
import { CameraCapture } from './CameraCapture';

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
  const [cameraSlot, setCameraSlot] = useState<1 | 2 | null>(null);
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
      const compressed = await compressImage(src, 2048, 0.92);
      const base64 = compressed.split(',')[1];
      const update: PhotoSlot = { previewSrc: src, compressedBase64: base64, ready: true };
      if (slot === 1) setSlot1(update);
      else setSlot2(update);
    };
    reader.readAsDataURL(file);
  }

  async function handleCameraCapture(base64: string, previewSrc: string) {
    const compressed = await compressImage(previewSrc, 2048, 0.92);
    const compressedBase64 = compressed.split(',')[1]!;
    const update: PhotoSlot = { previewSrc, compressedBase64, ready: true };
    if (cameraSlot === 1) setSlot1(update);
    else if (cameraSlot === 2) setSlot2(update);
    setCameraSlot(null);
    void base64; // raw base64 unused, we use compressed
  }

  function handleGenerate() {
    if (!canGenerate) return;
    onGenerate(template!, slot1.compressedBase64, isCouple ? slot2.compressedBase64 : undefined);
    onClose();
  }

  if (cameraSlot !== null) {
    return (
      <CameraCapture
        onCapture={handleCameraCapture}
        onClose={() => setCameraSlot(null)}
      />
    );
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
              onGallery={() => ref1.current?.click()}
              onCamera={() => setCameraSlot(1)}
            />
            <PhotoUploadSlot
              slot={slot2}
              label="His photo"
              emoji="👦"
              onGallery={() => ref2.current?.click()}
              onCamera={() => setCameraSlot(2)}
            />
          </div>
        ) : (
          /* Solo mode: single large slot */
          <div
            className={`relative rounded-xl overflow-hidden border-2 border-dashed transition-colors mb-4 ${slot1.ready ? 'border-accent' : 'border-surface-border'}`}
            style={{ aspectRatio: '3/4' }}
          >
            {slot1.previewSrc ? (
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <img src={slot1.previewSrc} alt="Your photo" className="w-full h-full object-cover" />
                {/* Retake overlay */}
                <button
                  onClick={() => setSlot1(EMPTY_SLOT)}
                  style={{
                    position: 'absolute', top: 8, right: 8,
                    background: 'rgba(0,0,0,0.6)', border: 'none',
                    borderRadius: 20, padding: '4px 10px',
                    color: '#fff', fontSize: 11, cursor: 'pointer',
                  }}
                >
                  ✕ Retake
                </button>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-4">
                <span className="text-4xl">🤳</span>
                <p className="text-text-muted text-sm">Add your photo</p>
                <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                  <ActionBtn icon="📁" label="Gallery" onClick={() => ref1.current?.click()} />
                  <ActionBtn icon="📷" label="Camera" onClick={() => setCameraSlot(1)} accent />
                </div>
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
  slot, label, emoji, onGallery, onCamera,
}: { slot: PhotoSlot; label: string; emoji: string; onGallery: () => void; onCamera: () => void }) {
  return (
    <div style={{
      aspectRatio: '3/4', borderRadius: 12,
      border: `2px dashed ${slot.ready ? '#ff6b9d' : 'rgba(255,255,255,0.1)'}`,
      overflow: 'hidden', position: 'relative', background: '#16161a',
    }}>
      {slot.previewSrc ? (
        <img src={slot.previewSrc} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 10 }}>
          <span style={{ fontSize: 24 }}>{emoji}</span>
          <span style={{ fontSize: 10, color: '#666', textAlign: 'center' }}>{label}</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
            <button onClick={onGallery} style={slotBtnStyle}>📁 Gallery</button>
            <button onClick={onCamera} style={{ ...slotBtnStyle, background: 'rgba(255,107,157,0.12)', borderColor: 'rgba(255,107,157,0.3)', color: '#ff6b9d' }}>📷 Camera</button>
          </div>
        </div>
      )}
      {slot.ready && (
        <div style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.7)', borderRadius: 20, padding: '2px 8px', fontSize: 10, color: '#4ade80' }}>✓</div>
      )}
    </div>
  );
}

const slotBtnStyle: React.CSSProperties = {
  width: '100%', padding: '6px 4px', borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.04)',
  color: '#888', fontSize: 10, cursor: 'pointer',
  fontFamily: '"DM Sans", sans-serif',
};

function ActionBtn({ icon, label, onClick, accent }: { icon: string; label: string; onClick: () => void; accent?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: '10px 8px', borderRadius: 12,
        border: `1px solid ${accent ? 'rgba(255,107,157,0.35)' : 'rgba(255,255,255,0.1)'}`,
        background: accent ? 'rgba(255,107,157,0.1)' : 'rgba(255,255,255,0.04)',
        color: accent ? '#ff6b9d' : '#888',
        fontSize: 13, cursor: 'pointer',
        fontFamily: '"DM Sans", sans-serif',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      }}
    >
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 500 }}>{label}</span>
    </button>
  );
}
