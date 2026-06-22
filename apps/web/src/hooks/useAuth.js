import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { apiFetch } from '../lib/api';
export function useAuth() {
    const [user, setUser] = useState(undefined);
    useEffect(() => {
        return onAuthStateChanged(auth, async (u) => {
            setUser(u);
            if (u) {
                await apiFetch('/api/users/me', { method: 'POST' }).catch(() => { });
            }
        });
    }, []);
    return { user, loading: user === undefined };
}
