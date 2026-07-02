import { useEffect, useState } from 'react';
import { useSidebar } from '../../contexts/SidebarContext';
import type { Template } from '@trendy/shared';

interface FilterSidebarProps {
  templates: Template[];
  onSelectTemplate: (t: Template) => void;
  onClickFilter: (filter: { id: string; emoji: string; label: string; sub: string }) => void;
}

export function FilterSidebar({ templates, onSelectTemplate, onClickFilter }: FilterSidebarProps) {
  const { open, setOpen } = useSidebar();
  const [panel, setPanel] = useState<'templates' | 'filters' | null>(null);

  // Close panel when sidebar closes
  useEffect(() => { if (!open) setPanel(null); }, [open]);

  // Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') { setPanel(null); setOpen(false); } }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOpen]);

  const menuItems = [
    { key: 'templates' as const, icon: '🖼', label: 'Templates', sub: 'Browse AI templates' },
    { key: 'filters' as const, icon: '✨', label: 'Filters', sub: 'Apply photo filters' },
  ];

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        onClick={() => { setPanel(null); setOpen(false); }}
        style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'rgba(0,0,0,0.55)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
        }}
      />

      {/* ── Sidebar menu ── */}
      <div
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0,
          width: 260,
          zIndex: 50,
          background: '#0e0e12',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '22px 20px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: 18, fontWeight: 800, fontStyle: 'italic',
            background: 'linear-gradient(to right, #f472b6, #a78bfa, #93c5fd)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Trendy
          </span>
          <button
            onClick={() => setOpen(false)}
            style={{ background: 'none', border: 'none', color: '#555', fontSize: 18, cursor: 'pointer', padding: 4, lineHeight: 1 }}
          >✕</button>
        </div>

        {/* Menu items */}
        <div style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setPanel(item.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px', borderRadius: 14,
                border: `1px solid ${panel === item.key ? 'rgba(255,107,157,0.4)' : 'rgba(255,255,255,0.06)'}`,
                background: panel === item.key ? 'rgba(255,107,157,0.08)' : 'rgba(255,255,255,0.02)',
                cursor: 'pointer', textAlign: 'left', width: '100%',
                transition: 'border-color .2s, background .2s',
              }}
              onMouseEnter={(e) => { if (panel !== item.key) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}}
              onMouseLeave={(e) => { if (panel !== item.key) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}}
            >
              <span style={{ fontSize: 22, lineHeight: 1 }}>{item.icon}</span>
              <div>
                <div style={{ color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: '"DM Sans", sans-serif' }}>{item.label}</div>
                <div style={{ color: '#555', fontSize: 11, marginTop: 2, fontFamily: '"DM Sans", sans-serif' }}>{item.sub}</div>
              </div>
              <span style={{ marginLeft: 'auto', color: '#444', fontSize: 12 }}>›</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Templates full-screen overlay ── */}
      {panel === 'templates' && (
        <FullOverlay title="Templates" onClose={() => setPanel(null)}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 14,
            padding: '0 4px',
          }}>
            {templates.map((t) => (
              <div
                key={t.id}
                onClick={() => { onSelectTemplate(t); setPanel(null); setOpen(false); }}
                style={{
                  aspectRatio: '3/4', borderRadius: 16, overflow: 'hidden',
                  cursor: 'pointer', position: 'relative',
                  border: '1px solid rgba(255,255,255,0.06)',
                  transition: 'transform .18s, border-color .18s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
              >
                {t.image
                  ? <img src={t.image} alt={t.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                  : <div style={{ width: '100%', height: '100%', background: '#16161a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>{t.emoji}</div>
                }
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  padding: '24px 10px 10px',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)',
                }}>
                  <div style={{ color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: '"DM Sans", sans-serif' }}>{t.emoji} {t.label}</div>
                </div>
                {t.isTrending && (
                  <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(255,107,157,0.85)', borderRadius: 20, padding: '2px 8px', fontSize: 10, color: '#fff', fontWeight: 600 }}>🔥 Trend</div>
                )}
              </div>
            ))}
          </div>
        </FullOverlay>
      )}

      {/* ── Filters full-screen overlay ── */}
      {panel === 'filters' && (
        <FullOverlay title="Filters" onClose={() => setPanel(null)}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 14,
          }}>
            {FILTER_PLACEHOLDERS.map((f) => (
              <div
                key={f.id}
                onClick={() => { if (f.ready) { onClickFilter(f); } }}
                style={{
                  aspectRatio: '3/4', borderRadius: 16, overflow: 'hidden',
                  position: 'relative',
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: f.bg,
                  display: 'flex', alignItems: 'flex-end',
                  cursor: f.ready ? 'pointer' : 'not-allowed',
                  opacity: f.ready ? 1 : 0.55,
                  transition: 'transform .15s, opacity .15s',
                }}
                onMouseEnter={(e) => { if (f.ready) e.currentTarget.style.transform = 'scale(1.03)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <div style={{ padding: '28px 12px 12px', width: '100%', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                  <div style={{ color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: '"DM Sans", sans-serif' }}>{f.emoji} {f.label}</div>
                  <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, marginTop: 2 }}>{f.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </FullOverlay>
      )}
    </>
  );
}

function FullOverlay({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60,
      background: '#0a0a0e',
      display: 'flex', flexDirection: 'column',
      animation: 'slideUp 0.22s ease',
    }}>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }`}</style>

      {/* Overlay header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '18px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#666', fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: '4px 8px 4px 0' }}
        >
          ‹
        </button>
        <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, fontFamily: '"DM Sans", sans-serif', margin: 0 }}>{title}</h2>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 40px' }}>
        {children}
      </div>
    </div>
  );
}

const FILTER_PLACEHOLDERS = [
  { id: 'grdr',  emoji: '📷', label: 'GRD R',      sub: 'Dazz Cam · G7X vibe', bg: 'linear-gradient(160deg, #7c5230, #5c3d1e, #1a0f00)', ready: true  },
  { id: 'f2',   emoji: '🩵', label: 'Cool Tones',  sub: 'Coming soon', bg: 'linear-gradient(160deg, #0c4a6e, #1e3a5f, #0f172a)', ready: false },
  { id: 'f3',   emoji: '🖤', label: 'Noir',         sub: 'Coming soon', bg: 'linear-gradient(160deg, #1c1c1c, #0a0a0a, #111)',   ready: false },
  { id: 'f4',   emoji: '🌸', label: 'Soft Pink',    sub: 'Coming soon', bg: 'linear-gradient(160deg, #9d174d, #be185d, #1c1015)', ready: false },
  { id: 'f5',   emoji: '🌿', label: 'Nature',       sub: 'Coming soon', bg: 'linear-gradient(160deg, #14532d, #166534, #0a1a0f)', ready: false },
  { id: 'f6',   emoji: '📼', label: 'VHS',          sub: 'Coming soon', bg: 'linear-gradient(160deg, #3b0764, #4a1942, #0d0012)', ready: false },
  { id: 'f7',   emoji: '☁️', label: 'Dreamy',       sub: 'Coming soon', bg: 'linear-gradient(160deg, #1e1b4b, #312e81, #0c0a1e)', ready: false },
  { id: 'f8',   emoji: '🔥', label: 'Warm Dark',    sub: 'Coming soon', bg: 'linear-gradient(160deg, #7c2d12, #9a3412, #1c0a00)', ready: false },
];
