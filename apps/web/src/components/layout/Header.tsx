import { Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { PLANS } from '@trendy/shared';

const PLAN_COLORS = {
  free: 'text-plan-free',
  pro: 'text-plan-pro',
  studio: 'text-plan-studio',
};

export function Header() {
  const { user } = useAuth();
  const { data: currentUser } = useCurrentUser();
  const tier = currentUser?.tier ?? 'free';
  const plan = PLANS[tier];
  const used = currentUser?.generationsUsed ?? 0;
  const limit = plan.monthlyLimit === Infinity ? '∞' : plan.monthlyLimit;

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-bg/90 backdrop-blur border-b border-surface-border">
      <Link to="/" className="font-display text-2xl font-bold bg-gradient-accent bg-clip-text text-transparent">
        Trendy
      </Link>

      <nav className="flex items-center gap-4 text-sm">
        <Link to="/pricing" className="text-text-muted hover:text-white transition-colors">
          Pricing
        </Link>

        {user && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-surface-border">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
            <span className="text-text-muted">
              {used} / {limit} gen
            </span>
          </div>
        )}

        {user && (
          <span className={`text-xs font-medium uppercase tracking-wider ${PLAN_COLORS[tier]}`}>
            {plan.label}
          </span>
        )}

        {user ? (
          <button
            onClick={() => signOut(auth)}
            className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent hover:bg-accent/30 transition-colors"
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
