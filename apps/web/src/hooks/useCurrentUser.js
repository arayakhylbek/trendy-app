import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { auth } from '../lib/firebase';
export function useCurrentUser() {
    const firebaseUser = auth.currentUser;
    return useQuery({
        queryKey: ['me'],
        queryFn: () => apiFetch('/api/users/me').then((r) => r.user),
        enabled: !!firebaseUser,
        staleTime: 60 * 1000,
    });
}
