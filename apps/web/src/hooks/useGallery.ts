import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface GalleryItem {
  id: string;
  imageUrl: string;
  templateLabel: string;
  templateEmoji: string;
  createdAt: string;
}

export function useGallery(uid: string | undefined) {
  return useQuery({
    queryKey: ['gallery', uid],
    enabled: !!uid,
    queryFn: async () => {
      const q = query(
        collection(db, 'users', uid!, 'generations'),
        orderBy('createdAt', 'desc'),
        limit(50),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as GalleryItem));
    },
    staleTime: 30_000,
  });
}

export function useDeleteGeneration(uid: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (genId: string) => {
      if (!uid) throw new Error('Not authenticated');
      await deleteDoc(doc(db, 'users', uid, 'generations', genId));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gallery', uid] });
    },
  });
}
