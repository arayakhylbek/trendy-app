import { useEffect } from 'react';

interface FilterSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function FilterSidebar({ open, onClose }: FilterSidebarProps) {
  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'rgba(0,0,0,0.45)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
        }}
      />

      {/* Sidebar panel */}
      <div
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0,
          width: 280,
          zIndex: 50,
          background: '#0e0e12',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <span style={{ color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: '"DM Sans", sans-serif' }}>
            Filters & Styles
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: '#555', fontSize: 20,
              cursor: 'pointer', lineHeight: 1, padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* Section: Filters */}
          <Section title="Filters">
            <Placeholder label="Coming soon..." />
          </Section>

          {/* Section: AI Styles */}
          <Section title="AI Styles">
            <Placeholder label="Coming soon..." />
          </Section>

        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
        color: '#555', textTransform: 'uppercase',
        marginBottom: 12, fontFamily: '"DM Sans", sans-serif',
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Placeholder({ label }: { label: string }) {
  return (
    <div style={{
      padding: '14px 16px',
      borderRadius: 12,
      border: '1px dashed rgba(255,255,255,0.08)',
      color: '#444',
      fontSize: 12,
      fontFamily: '"DM Sans", sans-serif',
      textAlign: 'center',
    }}>
      {label}
    </div>
  );
}
