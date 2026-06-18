interface Props {
  imageUrl: string | null;
  templateEmoji?: string;
  onClose: () => void;
  onNew: () => void;
}

export function ResultModal({ imageUrl, templateEmoji, onClose, onNew }: Props) {
  if (!imageUrl && !templateEmoji) return null;

  async function handleShare() {
    if (!imageUrl) return;
    try {
      await navigator.clipboard.writeText(imageUrl);
      alert('Image URL copied!');
    } catch {
      alert('Could not copy link');
    }
  }

  function handleDownload() {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = 'trendy-result.webp';
    a.click();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-surface rounded-2xl border border-surface-border overflow-hidden">
        <div className="relative" style={{ aspectRatio: '3/4' }}>
          {imageUrl ? (
            <img src={imageUrl} alt="Generated result" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-8xl bg-gradient-to-br from-surface to-surface2">
              {templateEmoji}
            </div>
          )}
          <div className="absolute bottom-2 right-2 text-white/50 text-xs font-medium">✦ Trendy</div>
        </div>

        <div className="p-4 flex gap-3">
          <button
            onClick={handleShare}
            className="flex-1 py-2.5 rounded-xl border border-surface-border text-text-muted hover:text-white hover:border-white/20 transition-colors text-sm"
          >
            Share
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 py-2.5 rounded-xl border border-surface-border text-text-muted hover:text-white hover:border-white/20 transition-colors text-sm"
          >
            Save
          </button>
          <button
            onClick={onNew}
            className="flex-1 py-2.5 rounded-xl bg-gradient-accent text-black font-medium text-sm hover:opacity-90 transition-opacity"
          >
            New ✦
          </button>
        </div>

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
