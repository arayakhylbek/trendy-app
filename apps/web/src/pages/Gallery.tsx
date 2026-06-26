import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGallery, useDeleteGeneration, type GalleryItem } from '../hooks/useGallery';

export function Gallery() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: items = [], isLoading } = useGallery(user?.uid);
  const deleteMut = useDeleteGeneration(user?.uid);
  const [preview, setPreview] = useState<GalleryItem | null>(null);

  if (!user) {
    navigate('/auth');
    return null;
  }

  function download(item: GalleryItem) {
    const a = document.createElement('a');
    a.href = item.imageUrl;
    a.download = `trendy-${item.templateLabel.replace(/\s+/g, '-').toLowerCase()}.jpg`;
    a.click();
  }

  function handleDelete(id: string) {
    deleteMut.mutate(id);
    if (preview?.id === id) setPreview(null);
  }

  return (
    <div className="min-h-screen bg-bg">
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="flex items-center justify-between mb-8">
          <h1
            style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: 28, fontWeight: 700, color: '#fff',
            }}
          >
            Your{' '}
            <em
              style={{
                fontStyle: 'italic',
                background: 'linear-gradient(135deg,#ff6b9d,#c084fc)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              gallery
            </em>
          </h1>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '8px 18px', borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.1)',
              background: '#1e1e24', color: '#888',
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            ← Back
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '5rem', color: '#888', fontSize: 14 }}>
            Loading your creations…
          </div>
        )}

        {/* Empty */}
        {!isLoading && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '5rem 1rem', color: '#888' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🪄</div>
            <p style={{ fontSize: 16, marginBottom: '1.5rem' }}>
              Your gallery is empty — go create something!
            </p>
            <button
              onClick={() => navigate('/')}
              style={{
                padding: '12px 28px', borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg,#ff6b9d,#c084fc)',
                color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                fontFamily: '"DM Sans", sans-serif',
              }}
            >
              Browse Templates ✦
            </button>
          </div>
        )}

        {/* Grid */}
        {!isLoading && items.length > 0 && (
          <>
            <p style={{ fontSize: 13, color: '#555', marginBottom: '1.5rem' }}>
              {items.length} creation{items.length !== 1 ? 's' : ''}
            </p>
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
          </>
        )}
      </main>

      {/* Preview lightbox */}
      {preview && (
        <div
          onClick={() => setPreview(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 700,
            background: 'rgba(0,0,0,0.93)', backdropFilter: 'blur(8px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '1.5rem', gap: 20,
          }}
        >
          <img
            src={preview.imageUrl}
            alt={preview.templateLabel}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '88vw', maxHeight: '72vh',
              borderRadius: 20, objectFit: 'contain',
              boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
            }}
          />
          <div
            style={{ display: 'flex', gap: 12 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => download(preview)}
              style={{
                padding: '11px 22px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg,#ff6b9d,#c084fc)',
                color: '#fff', fontSize: 14, fontWeight: 500,
                cursor: 'pointer', fontFamily: '"DM Sans", sans-serif',
              }}
            >
              ↓ Download
            </button>
            <button
              onClick={() => handleDelete(preview.id)}
              style={{
                padding: '11px 22px', borderRadius: 12,
                border: '1px solid rgba(239,68,68,0.3)',
                background: 'rgba(239,68,68,0.08)',
                color: '#ef4444', fontSize: 14, fontWeight: 500,
                cursor: 'pointer', fontFamily: '"DM Sans", sans-serif',
              }}
            >
              Delete
            </button>
            <button
              onClick={() => setPreview(null)}
              style={{
                padding: '11px 22px', borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.1)',
                background: '#1e1e24',
                color: '#888', fontSize: 14, fontWeight: 500,
                cursor: 'pointer', fontFamily: '"DM Sans", sans-serif',
              }}
            >
              Close
            </button>
          </div>
          <p style={{ fontSize: 12, color: '#444', marginTop: 4 }}>
            {preview.templateEmoji} {preview.templateLabel} ·{' '}
            {new Date(preview.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
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
  const [imgError, setImgError] = useState(false);
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
      }}
    >
      {/* Image */}
      <div
        onClick={!imgError ? onPreview : undefined}
        style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden', cursor: imgError ? 'default' : 'pointer' }}
      >
        {imgError ? (
          <div style={{
            width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: '#1e1e24', color: '#444', fontSize: 12, gap: 8,
          }}>
            <span style={{ fontSize: 28 }}>🖼️</span>
            <span>Image unavailable</span>
          </div>
        ) : (
          <img
            src={item.imageUrl}
            alt={item.templateLabel}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        )}
        {hovered && !imgError && (
          <div
            style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 50%)',
              display: 'flex', alignItems: 'flex-end', padding: 10,
            }}
          >
            <span style={{ color: '#fff', fontSize: 12 }}>🔍 Preview</span>
          </div>
        )}
      </div>

      {/* Meta */}
      <div style={{ padding: '8px 10px 4px' }}>
        <div
          style={{
            fontSize: 12, fontWeight: 500, color: '#f0f0f5',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}
        >
          {item.templateEmoji} {item.templateLabel}
        </div>
        <div style={{ fontSize: 11, color: '#444', marginTop: 2 }}>{date}</div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, padding: '6px 10px 10px' }}>
        <CardBtn onClick={onDownload} style={{ flex: 1 }}>↓ Save</CardBtn>
        <CardBtn onClick={onDelete} disabled={deleting} danger style={{ flex: '0 0 36px' }}>
          {deleting ? '…' : '✕'}
        </CardBtn>
      </div>
    </div>
  );
}

function CardBtn({
  children, onClick, style: extra = {}, danger, disabled,
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
        padding: '6px 8px', borderRadius: 9, cursor: disabled ? 'not-allowed' : 'pointer',
        border: '1px solid rgba(255,255,255,0.08)',
        background: hovered ? (danger ? 'rgba(239,68,68,0.12)' : '#252530') : '#1e1e24',
        color: hovered ? (danger ? '#ef4444' : '#f0f0f5') : '#666',
        fontSize: 12, fontWeight: 500,
        fontFamily: '"DM Sans", sans-serif',
        transition: 'all .15s', opacity: disabled ? 0.5 : 1,
        textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center',
        ...extra,
      }}
    >
      {children}
    </button>
  );
}
