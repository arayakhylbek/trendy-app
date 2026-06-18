import { useRef, useState } from 'react';
import type { Template } from '@trendy/shared';

interface Props {
  template: Template | null;
  onClose: () => void;
  onGenerate: (template: Template, imageBase64: string | undefined) => void;
}

export function TemplateModal({ template, onClose, onGenerate }: Props) {
  const [previewSrc, setPreviewSrc] = useState<string | undefined>();
  const [hasPhoto, setHasPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!template) return null;

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      setPreviewSrc(src);
      setHasPhoto(true);
    };
    reader.readAsDataURL(file);
  }

  function handleGenerate() {
    if (!hasPhoto) return;
    const base64 = previewSrc?.split(',')[1];
    onGenerate(template!, base64);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-surface rounded-2xl border border-surface-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-white font-display text-lg">{template.label}</h2>
            <p className="text-text-muted text-sm">{template.style}</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-white transition-colors text-xl">
            ✕
          </button>
        </div>

        <div
          className={`
            relative rounded-xl overflow-hidden cursor-pointer border-2 border-dashed transition-colors mb-4
            ${hasPhoto ? 'border-accent' : 'border-surface-border hover:border-white/20'}
          `}
          style={{ aspectRatio: '3/4' }}
          onClick={() => fileInputRef.current?.click()}
        >
          {previewSrc ? (
            <img src={previewSrc} alt="Your photo" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-text-muted gap-2">
              <span className="text-4xl">📷</span>
              <p className="text-sm">Upload your photo</p>
              <span className="text-xs text-text-dim">Tap to choose</span>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />

        <button
          onClick={handleGenerate}
          disabled={!hasPhoto}
          className="w-full py-3 rounded-xl font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-accent text-black hover:opacity-90"
        >
          {hasPhoto ? 'Generate ✦' : 'Upload a photo first'}
        </button>

        <p className="text-text-dim text-xs text-center mt-3">~30 seconds · uses 1 generation</p>
      </div>
    </div>
  );
}
