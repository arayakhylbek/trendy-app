import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useQueryClient } from '@tanstack/react-query';
import { auth } from '../lib/firebase';
import { apiFetch } from '../lib/api';

export function useAuth() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const queryClient = useQueryClient();

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Create the user doc, THEN refetch ['me'] so the quota badge shows the
        // real grant (1 free) instead of a stale/failed fetch that raced the create.
        await apiFetch('/api/users/me', { method: 'POST' }).catch(() => {});
        await queryClient.invalidateQueries({ queryKey: ['me'] });
      } else {
        queryClient.removeQueries({ queryKey: ['me'] });
      }
    });
  }, [queryClient]);

  return { user, loading: user === undefined };
}
