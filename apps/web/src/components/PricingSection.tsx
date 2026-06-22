import { useState } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

interface Props {
  onUpgrade: () => void;
  onNeedAuth?: () => void;
}

const FEATURES = {
  free: ['2 AI photo generations', 'All 8 templates', 'Standard quality', 'No watermark removal', 'Priority processing'],
  lite: ['10 generations / month', 'All templates + new drops', 'HD quality output', 'No watermark', 'Priority processing'],
  pro:  ['30 generations / month', 'All templates + early access', '4K quality output', 'No watermark', 'Priority processing'],
};

const DISABLED = {
  free: ['No watermark removal', 'Priority processing'],
  lite: ['Priority processing'],
  pro: [],
};

export function PricingSection({ onNeedAuth }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState<'lite' | 'pro' | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  async function handleCheckout(uiPlan: 'lite' | 'pro') {
    if (!user) {
      onNeedAuth?.();
      return;
    }
    // UI "Lite" → backend planId 'pro'; UI "Pro" → backend planId 'studio'
    const planId = uiPlan === 'lite' ? 'pro' : 'studio';
    setLoading(uiPlan);
    setCheckoutError(null);
    try {
      const { checkoutUrl } = await apiFetch<{ checkoutUrl: string }>('/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ planId }),
      });
      window.location.href = checkoutUrl;
    } catch (e) {
      setCheckoutError((e as Error).message);
      setLoading(null);
    }
  }

  return (
    <section id="pricing" className="px-4 sm:px-6 py-14 text-center">
      <h2
        className="mb-2"
        style={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontSize: 'clamp(1.7rem, 4vw, 2.4rem)',
          fontWeight: 700,
          color: '#fff',
        }}
      >
        Choose your{' '}
        <em
          style={{
            fontStyle: 'italic',
            background: 'linear-gradient(135deg, #ff6b9d, #c084fc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          vibe
        </em>
      </h2>
      <p style={{ color: '#888', fontSize: 14, marginBottom: '2.5rem' }}>
        Start free — no credit card needed
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 20,
          maxWidth: 900,
          margin: '0 auto',
        }}
      >
        {/* FREE */}
        <Card>
          <PlanName>Free</PlanName>
          <PriceRow>
            <BigPrice>$0</BigPrice>
          </PriceRow>
          <Per>/ forever</Per>
          <AlwaysFreeBadge />
          <Desc>Perfect for trying it out. 2 generations on us.</Desc>
          <FeatureList features={FEATURES.free} disabled={DISABLED.free} />
          <DarkButton
            onClick={() =>
              document.getElementById('section-all')?.scrollIntoView({ behavior: 'smooth' })
            }
          >
            Get started free
          </DarkButton>
        </Card>

        {/* LITE — featured */}
        <Card featured>
          <PopularBadge />
          <PlanName>Lite</PlanName>
          <PriceRow>
            <OldPrice>$3.99</OldPrice>
            <BigPrice>$2.99</BigPrice>
          </PriceRow>
          <Per>/ mo</Per>
          <PromoBadge>Limited time — 25% off</PromoBadge>
          <Desc>For the casual creator who posts regularly.</Desc>
          <FeatureList features={FEATURES.lite} disabled={DISABLED.lite} />
          <GradientButton onClick={() => handleCheckout('lite')} disabled={loading === 'lite'}>
            {loading === 'lite' ? 'Redirecting…' : 'Upgrade to Lite ✦'}
          </GradientButton>
        </Card>

        {/* PRO */}
        <Card>
          <PlanName>Pro</PlanName>
          <PriceRow>
            <OldPrice>$6.99</OldPrice>
            <BigPrice>$4.99</BigPrice>
          </PriceRow>
          <Per>/ mo</Per>
          <PromoBadge>Limited time — 30% off</PromoBadge>
          <Desc>For the serious creator who posts every day.</Desc>
          <FeatureList features={FEATURES.pro} disabled={DISABLED.pro} />
          <DarkButton onClick={() => handleCheckout('pro')} disabled={loading === 'pro'}>
            {loading === 'pro' ? 'Redirecting…' : 'Upgrade to Pro ✦'}
          </DarkButton>
        </Card>
      </div>

      {checkoutError && (
        <p style={{ marginTop: '1rem', fontSize: 13, color: '#ef4444' }}>{checkoutError}</p>
      )}
      <p style={{ marginTop: '1.5rem', fontSize: 12, color: '#555' }}>
        Cancel anytime. No questions asked.
      </p>
    </section>
  );
}

/* ── Sub-components ── */

function Card({ children, featured }: { children: React.ReactNode; featured?: boolean }) {
  return (
    <div
      style={{
        background: featured
          ? 'linear-gradient(135deg, rgba(255,107,157,0.08), rgba(192,132,252,0.08))'
          : '#16161a',
        border: featured
          ? '1px solid rgba(255,107,157,0.5)'
          : '1px solid rgba(255,255,255,0.08)',
        boxShadow: featured
          ? '0 0 0 1px rgba(255,107,157,0.2), 0 12px 40px rgba(255,107,157,0.12)'
          : undefined,
        borderRadius: 24,
        padding: '2.75rem 2rem 2.25rem',
        textAlign: 'left',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform .2s, box-shadow .2s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
      }}
    >
      {children}
    </div>
  );
}

function PopularBadge() {
  return (
    <div
      style={{
        position: 'absolute',
        top: -12,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'linear-gradient(135deg, #ff6b9d, #c084fc)',
        color: '#fff',
        fontSize: 11,
        fontWeight: 700,
        padding: '5px 16px',
        borderRadius: 20,
        whiteSpace: 'nowrap',
        letterSpacing: '.04em',
        boxShadow: '0 4px 14px rgba(255,107,157,0.4)',
      }}
    >
      MOST POPULAR
    </div>
  );
}

function PlanName({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 13,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '.08em',
        color: '#888',
        marginBottom: '1.25rem',
      }}
    >
      {children}
    </div>
  );
}

function PriceRow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 10,
        flexWrap: 'nowrap',
        whiteSpace: 'nowrap',
        marginBottom: 2,
      }}
    >
      {children}
    </div>
  );
}

function BigPrice({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontFamily: '"DM Sans", system-ui, sans-serif',
        fontSize: 42,
        fontWeight: 800,
        color: '#fff',
        lineHeight: 1,
        letterSpacing: '-0.5px',
      }}
    >
      {children}
    </span>
  );
}

function OldPrice({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: 26,
        fontWeight: 600,
        color: '#ff5c7a',
        textDecoration: 'line-through',
        textDecorationColor: '#ff5c7a',
        textDecorationThickness: 3,
        fontFamily: '"DM Sans", system-ui, sans-serif',
      }}
    >
      {children}
    </span>
  );
}

function Per({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 14, color: '#888', marginBottom: '1.5rem' }}>{children}</div>
  );
}

function AlwaysFreeBadge() {
  return (
    <div
      style={{
        display: 'inline-block',
        alignSelf: 'flex-start',
        background: '#1e1e24',
        color: '#888',
        fontSize: 11,
        fontWeight: 600,
        padding: '6px 14px',
        borderRadius: 20,
        marginBottom: '1.5rem',
        border: '1px solid rgba(255,255,255,0.12)',
        letterSpacing: '.05em',
      }}
    >
      ALWAYS FREE
    </div>
  );
}

function PromoBadge({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'inline-block',
        alignSelf: 'flex-start',
        background: 'linear-gradient(135deg, #ff6b9d, #c084fc)',
        color: '#fff',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '.05em',
        textTransform: 'uppercase',
        padding: '7px 14px',
        borderRadius: 20,
        marginBottom: '1.5rem',
        boxShadow: '0 6px 18px rgba(255,107,157,0.45)',
      }}
    >
      {children}
    </div>
  );
}

function Desc({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 13, color: '#888', marginBottom: '1.5rem', lineHeight: 1.5 }}>
      {children}
    </div>
  );
}

function FeatureList({ features, disabled }: { features: string[]; disabled: string[] }) {
  return (
    <ul
      style={{
        listStyle: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        marginBottom: '1.5rem',
        flex: 1,
      }}
    >
      {features.map((f) => {
        const muted = disabled.includes(f);
        return (
          <li
            key={f}
            style={{
              fontSize: 13,
              color: '#888',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              opacity: muted ? 0.45 : 1,
            }}
          >
            <span style={{ color: muted ? 'rgba(255,255,255,0.12)' : '#ff6b9d', fontSize: 10, flexShrink: 0 }}>
              ✦
            </span>
            {f}
          </li>
        );
      })}
    </ul>
  );
}

function DarkButton({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        marginTop: 'auto',
        padding: '14px',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.08)',
        background: '#1e1e24',
        color: '#f0f0f5',
        fontSize: 14,
        fontWeight: 500,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        fontFamily: '"DM Sans", system-ui, sans-serif',
        transition: 'border-color .2s, color .2s',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = '#ff6b9d';
        el.style.color = '#ff6b9d';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = 'rgba(255,255,255,0.08)';
        el.style.color = '#f0f0f5';
      }}
    >
      {children}
    </button>
  );
}

function GradientButton({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        marginTop: 'auto',
        padding: '14px',
        borderRadius: 12,
        border: 'none',
        background: 'linear-gradient(135deg, #ff6b9d, #c084fc)',
        color: '#fff',
        fontSize: 14,
        fontWeight: 500,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        fontFamily: '"DM Sans", system-ui, sans-serif',
        transition: 'opacity .2s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
    >
      {children}
    </button>
  );
}
