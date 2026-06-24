import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, orderBy, limit, getDocs, deleteDoc, doc, } from 'firebase/firestore';
import { db } from '../lib/firebase';
export function useGallery(uid) {
    return useQuery({
        queryKey: ['gallery', uid],
        enabled: !!uid,
        queryFn: async () => {
            const q = query(collection(db, 'users', uid, 'generations'), orderBy('createdAt', 'desc'), limit(50));
            const snap = await getDocs(q);
            return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        },
        staleTime: 30_000,
    });
}
export function useDeleteGeneration(uid) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (genId) => {
            if (!uid)
                throw new Error('Not authenticated');
            await deleteDoc(doc(db, 'users', uid, 'generations', genId));
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['gallery', uid] });
        },
    });
}
