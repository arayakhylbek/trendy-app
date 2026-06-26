import { useState } from 'react';
import { PLANS } from '@trendy/shared';
import { useAuth } from '../hooks/useAuth';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { apiFetch } from '../lib/api';
import { AuthModal } from '../components/auth/AuthModal';

const PLAN_STYLES = {
  free: { border: 'border-white/10', badge: 'bg-plan-free/20 text-plan-free' },
  lite: { border: 'border-plan-lite/50', badge: 'bg-plan-lite/20 text-plan-lite' },
  pro: {
    border: 'border-plan-pro/50',
    badge: 'bg-plan-pro/20 text-plan-pro',
    highlight: true,
  },
  studio: { border: 'border-plan-studio/50', badge: 'bg-plan-studio/20 text-plan-studio' },
};

export function Pricing() {
  const { user } = useAuth();
  const { data: currentUser } = useCurrentUser();
  const [loading, setLoading] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  const currentTier = currentUser?.tier ?? 'free';

  async function handleUpgrade(planId: 'lite' | 'pro' | 'studio') {
    if (!user) {
      setShowAuth(true);
      return;
    }
    setLoading(planId);
    try {
      const { checkoutUrl } = await apiFetch<{ checkoutUrl: string }>('/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ planId }),
      });
      window.location.href = checkoutUrl;
    } catch (e) {
      alert((e as Error).message);
      setLoading(null);
    }
  }

  async function handlePortal() {
    setLoading('portal');
    try {
      const { portalUrl } = await apiFetch<{ portalUrl: string }>('/api/billing/portal', {
        method: 'POST',
      });
      window.location.href = portalUrl;
    } catch (e) {
      alert((e as Error).message);
      setLoading(null);
    }
  }

  return (
    <>
      <main className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl font-bold text-white mb-3">Simple pricing</h1>
          <p className="text-text-muted">Start free. Upgrade when you need more.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(['free', 'lite', 'pro', 'studio'] as const).map((planId) => {
            const plan = PLANS[planId];
            const styles = PLAN_STYLES[planId];
            const isCurrent = currentTier === planId;

            return (
              <div
                key={planId}
                className={`rounded-2xl p-6 bg-surface border ${styles.border} ${
                  'highlight' in styles && styles.highlight ? 'ring-1 ring-plan-pro/50' : ''
                }`}
              >
                {'highlight' in styles && styles.highlight && (
                  <div className="text-center mb-3">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-plan-pro text-black">
                      Most popular
                    </span>
                  </div>
                )}

                <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 ${styles.badge}`}>
                  {plan.label}
                </div>

                <div className="text-3xl font-bold text-white mb-4">
                  {plan.price === 0 ? 'Free' : `$${plan.price}`}
                  {plan.price > 0 && <span className="text-text-muted text-base font-normal">/mo</span>}
                </div>

                <ul className="space-y-2 mb-6 text-sm text-text-muted">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-plan-free flex-shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="w-full py-2.5 rounded-xl border border-white/10 text-text-muted text-sm text-center">
                    Current plan
                  </div>
                ) : planId === 'free' ? (
                  <div className="w-full py-2.5 rounded-xl border border-white/10 text-text-muted text-sm text-center">
                    Free forever
                  </div>
                ) : (
                  <button
                    onClick={() => handleUpgrade(planId)}
                    disabled={!!loading}
                    className={`w-full py-2.5 rounded-xl font-medium text-sm transition-opacity disabled:opacity-50 ${
                      planId === 'lite' ? 'bg-plan-lite text-black' :
                      planId === 'pro' ? 'bg-plan-pro text-black' : 'bg-plan-studio text-black'
                    } hover:opacity-90`}
                  >
                    {loading === planId ? 'Redirecting...' : `Get ${plan.label}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {user && currentTier !== 'free' && (
          <div className="text-center mt-8">
            <button
              onClick={handlePortal}
              disabled={loading === 'portal'}
              className="text-text-muted text-sm hover:text-white transition-colors underline"
            >
              {loading === 'portal' ? 'Loading...' : 'Manage billing / cancel subscription'}
            </button>
          </div>
        )}
      </main>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
