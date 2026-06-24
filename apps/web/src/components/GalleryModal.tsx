import { useState } from 'react';
import { useGallery, useDeleteGeneration, type GalleryItem } from '../hooks/useGallery';

interface Props {
  uid: string;
  onClose: () => void;
}

export function GalleryModal({ uid, onClose }: Props) {
  const { data: items = [], isLoading } = useGallery(uid);
  const deleteMut = useDeleteGeneration(uid);
  const [preview, setPreview] = useState<GalleryItem | null>(null);

  async function download(item: GalleryItem) {
    try {
      const res = await fetch(item.imageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trendy-${item.templateLabel.replace(/\s+/g, '-').toLowerCase()}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(item.imageUrl, '_blank');
    }
  }

  function handleDelete(id: string) {
    deleteMut.mutate(id);
    if (preview?.id === id) setPreview(null);
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 600,
        background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(14px)',
        display: 'flex', flexDirection: 'column', overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          position: 'sticky', top: 0, zIndex: 2,
          background: 'rgba(13,13,15,0.92)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '1.1rem 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <h2
          style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: 22, fontWeight: 700, color: '#fff', margin: 0,
          }}
        >
          Your{' '}
          <em
            style={{
              fontStyle: 'italic',
              background: 'linear-gradient(135deg,#ff6b9d,#c084fc)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}
          >
            gallery
          </em>
        </h2>
        <button
          onClick={onClose}
          style={{
            background: '#1e1e24', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '50%', width: 32, height: 32,
            color: '#888', cursor: 'pointer', fontSize: 15,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '1.5rem', maxWidth: 900, width: '100%', margin: '0 auto', flex: 1 }}>
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#888', fontSize: 14 }}>
            Loading your creations…
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '5rem 1rem', color: '#888' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🪄</div>
            <p style={{ fontSize: 15, marginBottom: '1.5rem' }}>
              Your gallery is empty — generate something beautiful!
            </p>
            <button
              onClick={onClose}
              style={{
                padding: '12px 24px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg,#ff6b9d,#c084fc)',
                color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                fontFamily: '"DM Sans", sans-serif',
              }}
            >
              Browse Templates
            </button>
          </div>
        )}

        {!isLoading && items.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 16,
            }}
          >
            {items.map((item) => (
              <GalleryCard
                key={item.id}
                item={item}
                onPreview={() => setPreview(item)}
                onDownload={() => download(item)}
                onDelete={() => handleDelete(item.id)}
                deleting={deleteMut.isPending && deleteMut.variables === item.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Full-screen preview */}
      {preview && (
        <div
          onClick={() => setPreview(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 700,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '1rem', gap: 16,
          }}
        >
          <img
            src={preview.imageUrl}
            alt={preview.templateLabel}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw', maxHeight: '75vh',
              borderRadius: 20, objectFit: 'contain',
              boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
            }}
          />
          <div
            style={{ display: 'flex', gap: 12 }}
            onClick={(e) => e.stopPropagation()}
          >
            <ActionBtn
              onClick={() => download(preview)}
              style={{ background: 'linear-gradient(135deg,#ff6b9d,#c084fc)', color: '#fff', border: 'none' }}
            >
              ↓ Download
            </ActionBtn>
            <ActionBtn onClick={() => setPreview(null)}>
              Close
            </ActionBtn>
          </div>
        </div>
      )}
    </div>
  );
}

function GalleryCard({
  item, onPreview, onDownload, onDelete, deleting,
}: {
  item: GalleryItem;
  onPreview: () => void;
  onDownload: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const date = new Date(item.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#16161a',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16, overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        transition: 'transform .2s, box-shadow .2s',
        transform: hovered ? 'translateY(-4px)' : 'none',
        boxShadow: hovered ? '0 16px 40px rgba(0,0,0,0.5)' : 'none',
        cursor: 'pointer',
      }}
    >
      {/* Image */}
      <div
        onClick={onPreview}
        style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden' }}
      >
        <img
          src={item.imageUrl}
          alt={item.templateLabel}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        {hovered && (
          <div
            style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)',
              display: 'flex', alignItems: 'flex-end', padding: 10,
            }}
          >
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 500 }}>
              Tap to preview
            </span>
          </div>
        )}
      </div>

      {/* Meta */}
      <div style={{ padding: '8px 10px 4px' }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: '#f0f0f5', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.templateEmoji} {item.templateLabel}
        </div>
        <div style={{ fontSize: 11, color: '#555' }}>{date}</div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, padding: '6px 10px 10px' }}>
        <ActionBtn onClick={onDownload} style={{ flex: 1, fontSize: 12, padding: '6px 4px' }}>
          ↓ Save
        </ActionBtn>
        <ActionBtn
          onClick={onDelete}
          disabled={deleting}
          style={{ flex: 1, fontSize: 12, padding: '6px 4px' }}
          danger
        >
          {deleting ? '…' : '✕'}
        </ActionBtn>
      </div>
    </div>
  );
}

function ActionBtn({
  children, onClick, style: extraStyle = {}, danger, disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  danger?: boolean;
  disabled?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '8px 16px', borderRadius: 10, cursor: disabled ? 'not-allowed' : 'pointer',
        border: '1px solid rgba(255,255,255,0.08)',
        background: hovered
          ? (danger ? 'rgba(239,68,68,0.15)' : '#252530')
          : '#1e1e24',
        color: hovered ? (danger ? '#ef4444' : '#f0f0f5') : '#888',
        fontSize: 13, fontWeight: 500,
        fontFamily: '"DM Sans", sans-serif',
        transition: 'all .15s',
        opacity: disabled ? 0.5 : 1,
        textAlign: 'center',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        ...extraStyle,
      }}
    >
      {children}
    </button>
  );
}
