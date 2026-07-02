import { useEffect, useState } from 'react';

interface Props {
  imageUrl: string | null;
  templateEmoji?: string;
  onClose: () => void;
  onNew: () => void;
  onViewGallery?: () => void;
}

function dataUriToBlob(dataUri: string): Blob {
  const [header, data] = dataUri.split(',');
  const mime = header?.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
  const binary = atob(data ?? '');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function getExtension(dataUri: string): string {
  const mime = dataUri.match(/data:(image\/\w+);/)?.[1];
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const canShareFiles = !!(navigator.canShare && navigator.canShare({ files: [new File([], 'x.jpg', { type: 'image/jpeg' })] }));

export function ResultModal({ imageUrl, templateEmoji, onClose, onNew, onViewGallery }: Props) {
  const [saved, setSaved] = useState(false);

  // Auto-download on Android (programmatic <a> click is allowed for downloads)
  useEffect(() => {
    if (!imageUrl || isIOS) return;
    const ext = imageUrl.startsWith('data:') ? getExtension(imageUrl) : 'jpg';
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `trendy-result.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setSaved(true);
  }, [imageUrl]);

  if (!imageUrl && !templateEmoji) return null;

  const isDataUri = imageUrl?.startsWith('data:');

  async function handleSaveToGallery() {
    if (!imageUrl) return;
    try {
      if (isDataUri && canShareFiles) {
        const blob = dataUriToBlob(imageUrl);
        const ext = getExtension(imageUrl);
        const file = new File([blob], `trendy.${ext}`, { type: blob.type });
        await navigator.share({ files: [file], title: 'Made with Trendy ✦' });
        setSaved(true);
      } else {
        handleDownload();
        setSaved(true);
      }
    } catch {
      // user cancelled share sheet — that's fine
    }
  }

  async function handleShare() {
    if (!imageUrl) return;
    try {
      if (isDataUri && navigator.share) {
        const blob = dataUriToBlob(imageUrl);
        const ext = getExtension(imageUrl);
        const file = new File([blob], `trendy.${ext}`, { type: blob.type });
        await navigator.share({ files: [file], title: 'Made with Trendy ✦' });
      } else if (navigator.share) {
        await navigator.share({ url: imageUrl, title: 'Made with Trendy ✦' });
      } else {
        handleDownload();
      }
    } catch {
      handleDownload();
    }
  }

  function handleDownload() {
    if (!imageUrl) return;
    const ext = isDataUri ? getExtension(imageUrl) : 'jpg';
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `trendy-result.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm bg-surface rounded-2xl border border-surface-border overflow-hidden">
        <div className="relative" style={{ aspectRatio: '3/4' }}>
          {imageUrl ? (
            <img src={imageUrl} alt="Generated result" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-8xl bg-gradient-to-br from-surface to-surface2">
              {templateEmoji}
            </div>
          )}
          <div className="absolute bottom-2 right-2 text-white/50 text-xs font-medium">✦ Trendy</div>

          {/* Saved badge */}
          {saved && (
            <div style={{
              position: 'absolute', top: 12, left: 12,
              background: 'rgba(34,197,94,0.85)', borderRadius: 20,
              padding: '4px 12px', fontSize: 12, color: '#fff', fontWeight: 600,
              fontFamily: '"DM Sans", sans-serif',
              backdropFilter: 'blur(4px)',
            }}>
              ✓ Saved
            </div>
          )}
        </div>

        {/* iOS: save to gallery button */}
        {isIOS && imageUrl && (
          <div style={{ padding: '12px 16px 0' }}>
            <button
              onClick={handleSaveToGallery}
              style={{
                width: '100%', padding: '12px',
                borderRadius: 14,
                background: saved ? 'rgba(34,197,94,0.15)' : 'linear-gradient(135deg, #ff6b9d, #a78bfa)',
                border: saved ? '1px solid rgba(34,197,94,0.4)' : 'none',
                color: saved ? '#4ade80' : '#000',
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                fontFamily: '"DM Sans", sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background .3s',
              }}
            >
              {saved ? '✓ Saved to Photos' : '📲 Save to Gallery'}
            </button>
          </div>
        )}

        <div className="p-4 flex gap-3">
          <button
            onClick={handleShare}
            className="flex-1 py-2.5 rounded-xl border border-surface-border text-text-muted hover:text-white hover:border-white/20 transition-colors text-sm"
          >
            Share
          </button>
          {!isIOS && (
            <button
              onClick={handleDownload}
              className="flex-1 py-2.5 rounded-xl border border-surface-border text-text-muted hover:text-white hover:border-white/20 transition-colors text-sm"
            >
              ↓ Save
            </button>
          )}
          <button
            onClick={onNew}
            className="flex-1 py-2.5 rounded-xl bg-gradient-accent text-black font-medium text-sm hover:opacity-90 transition-opacity"
          >
            New ✦
          </button>
        </div>
        {onViewGallery && (
          <div className="px-4 pb-4">
            <button
              onClick={onViewGallery}
              className="w-full py-2.5 rounded-xl border border-surface-border text-text-muted hover:text-white hover:border-white/20 transition-colors text-sm"
            >
              🖼 View Gallery
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
