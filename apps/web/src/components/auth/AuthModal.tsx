import { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../../lib/firebase';

type View = 'login' | 'register' | 'reset';

interface Props {
  onClose: () => void;
}

export function AuthModal({ onClose }: Props) {
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (view === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else if (view === 'register') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await sendPasswordResetEmail(auth, email);
        setResetSent(true);
        setLoading(false);
        return;
      }
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-surface rounded-2xl border border-surface-border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl text-white">
            {view === 'login' ? 'Sign in' : view === 'register' ? 'Create account' : 'Reset password'}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-white transition-colors">
            ✕
          </button>
        </div>

        {resetSent ? (
          <div className="text-center py-4">
            <p className="text-plan-free mb-4">✓ Password reset email sent</p>
            <button onClick={() => setView('login')} className="text-accent text-sm hover:underline">
              Back to sign in
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-surface2 border border-surface-border text-white placeholder-text-muted focus:border-accent focus:outline-none transition-colors"
              />
              {view !== 'reset' && (
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl bg-surface2 border border-surface-border text-white placeholder-text-muted focus:border-accent focus:outline-none transition-colors"
                />
              )}
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-accent text-black font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading
                  ? 'Loading...'
                  : view === 'login'
                    ? 'Sign in'
                    : view === 'register'
                      ? 'Create account'
                      : 'Send reset email'}
              </button>
            </form>

            {view !== 'reset' && (
              <>
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-surface-border" />
                  <span className="text-text-dim text-xs">or</span>
                  <div className="flex-1 h-px bg-surface-border" />
                </div>
                <button
                  onClick={handleGoogle}
                  className="w-full py-3 rounded-xl border border-surface-border text-white text-sm font-medium hover:border-white/20 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </button>
              </>
            )}

            <div className="flex justify-between mt-4 text-sm">
              {view === 'login' ? (
                <>
                  <button onClick={() => setView('register')} className="text-accent hover:underline">
                    Create account
                  </button>
                  <button onClick={() => setView('reset')} className="text-text-muted hover:text-white">
                    Forgot password?
                  </button>
                </>
              ) : (
                <button onClick={() => setView('login')} className="text-accent hover:underline">
                  Already have an account?
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
