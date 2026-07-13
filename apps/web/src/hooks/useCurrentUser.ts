import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import type { UserDoc } from '@trendy/shared';
import { auth } from '../lib/firebase';

export function useCurrentUser() {
  const firebaseUser = auth.currentUser;
  return useQuery({
    queryKey: ['me'],
    queryFn: () => apiFetch<{ user: UserDoc }>('/api/users/me').then((r) => r.user),
    enabled: !!firebaseUser,
    staleTime: 60 * 1000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
  });
}
