import { useState } from 'react';
import { PLANS } from '@trendy/shared';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

interface Props {
  onClose: () => void;
}

export function UpgradeModal({ onClose }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade(planId: 'pro' | 'studio') {
    if (!user) return;
    setLoading(planId);
    setError(null);
    try {
      const { checkoutUrl } = await apiFetch<{ checkoutUrl: string }>('/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ planId }),
      });
      window.location.href = checkoutUrl;
    } catch (e) {
      setError((e as Error).message);
      setLoading(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-surface rounded-2xl border border-surface-border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl text-white">Upgrade your plan</h2>
          <button onClick={onClose} className="text-text-muted hover:text-white transition-colors">
            ✕
          </button>
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <div className="grid grid-cols-2 gap-4">
          {(['pro', 'studio'] as const).map((planId) => {
            const plan = PLANS[planId];
            const isPro = planId === 'pro';
            return (
              <div
                key={planId}
                className={`rounded-xl p-4 border ${isPro ? 'border-plan-pro/50 bg-plan-pro/5' : 'border-plan-studio/50 bg-plan-studio/5'}`}
              >
                <div className={`text-sm font-medium mb-1 ${isPro ? 'text-plan-pro' : 'text-plan-studio'}`}>
                  {plan.label}
                </div>
                <div className="text-2xl font-bold text-white mb-3">
                  ${plan.price}
                  <span className="text-text-muted text-sm font-normal">/mo</span>
                </div>
                <ul className="text-text-muted text-xs space-y-1 mb-4">
                  {plan.features.map((f) => (
                    <li key={f}>✓ {f}</li>
                  ))}
                </ul>
                <button
                  onClick={() => handleUpgrade(planId)}
                  disabled={!!loading}
                  className={`w-full py-2.5 rounded-lg font-medium text-sm transition-opacity disabled:opacity-50 ${
                    isPro ? 'bg-plan-pro text-black' : 'bg-plan-studio text-black'
                  } hover:opacity-90`}
                >
                  {loading === planId ? 'Redirecting...' : `Get ${plan.label}`}
                </button>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 text-text-muted text-sm hover:text-white transition-colors"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
