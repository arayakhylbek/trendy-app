import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, orderBy, limit, getDocs, addDoc, deleteDoc, doc, } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { compressImage } from '../lib/compressImage';
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
export function useSaveGeneration(uid) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (item) => {
            if (!uid)
                throw new Error('Not authenticated');
            // Compress before saving to stay under Firestore's 1 MB document limit
            const compressed = await compressImage(item.imageBase64, 800, 0.82);
            await addDoc(collection(db, 'users', uid, 'generations'), {
                ...item,
                imageBase64: compressed,
            });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['gallery', uid] });
        },
        onError: (err) => {
            console.error('[gallery] save failed:', err);
        },
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
