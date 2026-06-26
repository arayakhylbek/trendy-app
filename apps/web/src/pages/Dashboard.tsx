import { Link } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useAuth } from '../hooks/useAuth';
import { PLANS } from '@trendy/shared';
import { apiFetch } from '../lib/api';
import { useState } from 'react';

export function Dashboard() {
  const { user } = useAuth();
  const { data: currentUser } = useCurrentUser();
  const [portalLoading, setPortalLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const ADMIN_EMAILS = ['araiakhylbek78@gmail.com', 'potizhmoti@gmail.com'];
  const isAdmin = ADMIN_EMAILS.includes(user?.email ?? '');

  const tier = currentUser?.tier ?? 'free';
  const plan = PLANS[tier];
  const used = currentUser?.generationsUsed ?? 0;
  const bonus = currentUser?.bonusGenerations ?? 0;
  const effectiveLimit = plan.monthlyLimit === Infinity ? Infinity : plan.monthlyLimit + bonus;
  const limit = effectiveLimit === Infinity ? '∞' : effectiveLimit;
  const pct = effectiveLimit === Infinity ? 0 : Math.round((used / effectiveLimit) * 100);

  async function handleAutoGenerate() {
    setGenerating(true);
    setLastGenerated(null);
    try {
      const { template } = await apiFetch<{ template: { label: string } }>('/api/generate-template', {
        method: 'POST',
      });
      setLastGenerated(template.label);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const { portalUrl } = await apiFetch<{ portalUrl: string }>('/api/billing/portal', {
        method: 'POST',
      });
      window.location.href = portalUrl;
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="font-display text-3xl text-white mb-8">Dashboard</h1>

      <div className="bg-surface rounded-2xl border border-surface-border p-6 mb-6">
        <p className="text-text-muted text-sm mb-1">Account</p>
        <p className="text-white font-medium">{user?.email}</p>
      </div>

      <div className="bg-surface rounded-2xl border border-surface-border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-text-muted text-sm">Current plan</p>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-accent2/20 text-accent2">
            {plan.label}
          </span>
        </div>

        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-text-muted">Generations used</span>
            <span className="text-white">
              {used} / {limit}
            </span>
          </div>
          {plan.monthlyLimit !== Infinity && (
            <div className="h-1.5 bg-surface2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-accent rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-4">
          {tier === 'free' ? (
            <Link
              to="/pricing"
              className="flex-1 py-2.5 rounded-xl bg-gradient-accent text-black font-medium text-sm text-center hover:opacity-90 transition-opacity"
            >
              Upgrade
            </Link>
          ) : (
            <button
              onClick={handlePortal}
              disabled={portalLoading}
              className="flex-1 py-2.5 rounded-xl border border-surface-border text-text-muted text-sm hover:text-white transition-colors disabled:opacity-50"
            >
              {portalLoading ? 'Loading...' : 'Manage billing'}
            </button>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="bg-surface rounded-2xl border border-surface-border p-6 mb-6">
          <p className="text-text-muted text-sm mb-3">Admin</p>
          <button
            onClick={handleAutoGenerate}
            disabled={generating}
            className="w-full py-2.5 rounded-xl bg-gradient-accent text-black font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Auto-generate template'}
          </button>
          {lastGenerated && (
            <p className="text-text-muted text-xs mt-2 text-center">Added: &quot;{lastGenerated}&quot;</p>
          )}
        </div>
      )}

      <Link to="/" className="text-accent text-sm hover:underline">
        ← Back to gallery
      </Link>
    </main>
  );
}
