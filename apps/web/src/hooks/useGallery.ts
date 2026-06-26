import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../lib/firebase';

export interface GalleryItem {
  id: string;
  imageUrl: string;
  storagePath: string;
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

export function useSaveGeneration(uid: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Omit<GalleryItem, 'id' | 'imageUrl' | 'storagePath'> & { imageDataUri: string }) => {
      if (!uid) throw new Error('Not authenticated');

      // Convert base64 to blob — no compression, store full resolution
      const res = await fetch(item.imageDataUri);
      const blob = await res.blob();
      const mimeType = blob.type || 'image/jpeg';
      const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';

      // Upload to Firebase Storage
      const storagePath = `users/${uid}/gallery/${Date.now()}.${ext}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, blob, { contentType: mimeType });
      const imageUrl = await getDownloadURL(storageRef);

      // Save only URL + metadata to Firestore
      await addDoc(collection(db, 'users', uid, 'generations'), {
        imageUrl,
        storagePath,
        templateLabel: item.templateLabel,
        templateEmoji: item.templateEmoji,
        createdAt: item.createdAt,
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

export function useDeleteGeneration(uid: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (genId: string) => {
      if (!uid) throw new Error('Not authenticated');

      // Get storagePath before deleting Firestore doc
      const docRef = doc(db, 'users', uid, 'generations', genId);
      const snap = await getDoc(docRef);
      const storagePath = snap.data()?.['storagePath'] as string | undefined;

      // Delete from Storage
      if (storagePath) {
        try {
          await deleteObject(ref(storage, storagePath));
        } catch {
          // File may already be gone — don't block the Firestore delete
        }
      }

      await deleteDoc(docRef);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gallery', uid] });
    },
  });
}
