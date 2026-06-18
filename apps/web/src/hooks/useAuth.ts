import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { apiFetch } from '../lib/api';

export function useAuth() {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await apiFetch('/api/users/me', { method: 'POST' }).catch(() => {});
      }
    });
  }, []);

  return { user, loading: user === undefined };
}
