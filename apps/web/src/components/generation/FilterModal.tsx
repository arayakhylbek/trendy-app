import { useRef, useState } from 'react';
import { compressImage } from '../../lib/compressImage';
import { applyFilter } from '../../lib/applyFilter';
import { CameraCapture } from './CameraCapture';

interface FilterDef {
  id: string;
  emoji: string;
  label: string;
  sub: string;
}

interface Props {
  filter: FilterDef;
  onClose: () => void;
  onResult: (imageDataUrl: string) => void;
}

interface PhotoSlot {
  previewSrc: string | undefined;
  dataUrl: string | undefined;
  ready: boolean;
}

const EMPTY: PhotoSlot = { previewSrc: undefined, dataUrl: undefined, ready: false };

export function FilterModal({ filter, onClose, onResult }: Props) {
  const [slot, setSlot] = useState<PhotoSlot>(EMPTY);
  const [camera, setCamera] = useState(false);
  const [applying, setApplying] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const src = ev.target?.result as string;
      const compressed = await compressImage(src, 1280, 0.92);
      setSlot({ previewSrc: src, dataUrl: compressed, ready: true });
    };
    reader.readAsDataURL(file);
  }

  async function handleCameraCapture(_base64: string, previewSrc: string) {
    const compressed = await compressImage(previewSrc, 1280, 0.92);
    setSlot({ previewSrc, dataUrl: compressed, ready: true });
    setCamera(false);
  }

  async function handleApply() {
    if (!slot.dataUrl) return;
    setApplying(true);
    try {
      const result = await applyFilter(slot.dataUrl, filter.id);
      onResult(result);
      onClose();
    } finally {
      setApplying(false);
    }
  }

  if (camera) {
    return <CameraCapture onCapture={handleCameraCapture} onClose={() => setCamera(false)} />;
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm bg-surface rounded-2xl border border-surface-border p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-white font-display text-lg">{filter.emoji} {filter.label}</h2>
            <p className="text-text-muted text-sm">{filter.sub}</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-white transition-colors text-xl">✕</button>
        </div>

        {/* Photo slot */}
        <div
          className={`relative rounded-xl overflow-hidden border-2 border-dashed transition-colors mb-4 ${slot.ready ? 'border-accent' : 'border-surface-border'}`}
          style={{ aspectRatio: '3/4' }}
        >
          {slot.previewSrc ? (
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <img src={slot.previewSrc} alt="Your photo" className="w-full h-full object-cover" />
              <button
                onClick={() => setSlot(EMPTY)}
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
                <ActionBtn icon="📁" label="Gallery" onClick={() => fileRef.current?.click()} />
                <ActionBtn icon="📷" label="Camera" onClick={() => setCamera(true)} accent />
              </div>
            </div>
          )}
        </div>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

        {/* Apply button */}
        <button
          onClick={handleApply}
          disabled={!slot.ready || applying}
          className="w-full py-3 rounded-xl font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-accent text-black hover:opacity-90"
        >
          {applying ? 'Applying…' : slot.ready ? `Apply ${filter.label} ✦` : 'Choose a photo first'}
        </button>

        <p className="text-text-dim text-xs text-center mt-3">Instant · no generation used</p>
      </div>
    </div>
  );
}

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
