import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { PLANS } from '@trendy/shared';

export function Header() {
  const { user } = useAuth();
  const { data: currentUser } = useCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();

  function scrollToPricing() {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }), 100);
    } else {
      document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  const tier = currentUser?.tier ?? 'free';
  const plan = PLANS[tier];
  const used = currentUser?.generationsUsed ?? 0;
  const limit = plan.monthlyLimit === Infinity ? null : plan.monthlyLimit;
  const remaining = limit !== null ? Math.max(0, limit - used) : null;
  const atLimit = remaining === 0;

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-bg/90 backdrop-blur border-b border-surface-border">
      <Link
        to="/"
        className="font-display text-2xl font-bold bg-gradient-accent bg-clip-text text-transparent"
      >
        Trendy
      </Link>

      <nav className="flex items-center gap-3 text-sm">
        <button
          onClick={scrollToPricing}
          className="text-text-muted hover:text-white transition-colors bg-transparent border-none cursor-pointer text-sm font-sans"
        >
          Pricing
        </button>

        {user && (
          <Link to="/gallery" className="text-text-muted hover:text-white transition-colors text-sm">
            Gallery
          </Link>
        )}

        {user && <GenBadge remaining={remaining} limit={limit} tier={tier} atLimit={atLimit} onUpgrade={scrollToPricing} />}

        {user ? (
          <button
            onClick={() => signOut(auth)}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ff6b9d, #c084fc)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              flexShrink: 0,
            }}
            title={user.email ?? 'Account'}
          >
            {(user.email?.[0] ?? 'U').toUpperCase()}
          </button>
        ) : (
          <Link
            to="/auth"
            className="px-4 py-2 rounded-lg bg-gradient-accent text-black font-medium text-xs hover:opacity-90 transition-opacity"
          >
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}

/* ── Generation badge ── */

interface GenBadgeProps {
  remaining: number | null;
  limit: number | null;
  tier: string;
  atLimit: boolean;
  onUpgrade: () => void;
}

function GenBadge({ remaining, limit, tier, atLimit, onUpgrade }: GenBadgeProps) {
  const isUnlimited = limit === null;

  if (isUnlimited) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 12px',
          borderRadius: 20,
          background: 'rgba(192,132,252,0.1)',
          border: '1px solid rgba(192,132,252,0.25)',
          fontSize: 12,
          fontWeight: 500,
          color: '#c084fc',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: 10 }}>✦</span>
        Unlimited
      </div>
    );
  }

  if (atLimit) {
    return (
      <button
        onClick={onUpgrade}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 12px',
          borderRadius: 20,
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          fontSize: 12,
          fontWeight: 500,
          color: '#ef4444',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'background .2s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
      >
        <span style={{ fontSize: 14 }}>⚡</span>
        0 left · Upgrade
      </button>
    );
  }

  const dots = Array.from({ length: limit! }, (_, i) => i < (limit! - remaining!));

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '5px 12px 5px 10px',
        borderRadius: 20,
        background: '#16161a',
        border: '1px solid rgba(255,255,255,0.08)',
        fontSize: 12,
        fontWeight: 500,
        color: '#f0f0f5',
        whiteSpace: 'nowrap',
      }}
    >
      {/* Dots */}
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {dots.map((used, i) => (
          <span
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: used ? '#ef4444' : '#4ade80',
              boxShadow: used ? '0 0 5px #ef4444' : '0 0 5px #4ade80',
              display: 'inline-block',
              flexShrink: 0,
              transition: 'background .3s',
            }}
          />
        ))}
      </span>

      {/* Count */}
      <span style={{ color: remaining === 1 ? '#f59e0b' : '#f0f0f5' }}>
        {remaining} left
      </span>

      {/* Plan label */}
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '.06em',
          color: tier === 'free' ? '#4ade80' : '#f59e0b',
          borderLeft: '1px solid rgba(255,255,255,0.1)',
          paddingLeft: 8,
          marginLeft: 2,
        }}
      >
        {tier}
      </span>
    </div>
  );
}
