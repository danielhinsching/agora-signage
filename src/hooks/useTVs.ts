import { useCallback, useEffect, useState } from 'react';
import { TV } from '@/types';
import {
  addTV as dbAddTV,
  updateTV as dbUpdateTV,
  deleteTV as dbDeleteTV,
  getTVBySlug as dbGetTVBySlug,
  subscribeTVs,
} from '@/lib/db';
import { toast } from 'sonner';

export function useTVs() {
  const [tvs, setTVs] = useState<TV[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to real-time updates from Firestore
  useEffect(() => {
    const unsubscribe = subscribeTVs((updatedTVs) => {
      setTVs(updatedTVs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addTV = useCallback(async (tv: Omit<TV, 'id' | 'createdAt'>) => {
    try {
      const id = await dbAddTV(tv);
      toast.success('TV criada com sucesso!');
      return { ...tv, id, createdAt: new Date().toISOString() };
    } catch (error) {
      console.error('Error adding TV:', error);
      toast.error('Erro ao criar TV');
      throw error;
    }
  }, []);

  const updateTV = useCallback(async (id: string, updates: Partial<TV>) => {
    try {
      await dbUpdateTV(id, updates);
      toast.success('TV atualizada!');
    } catch (error) {
      console.error('Error updating TV:', error);
      toast.error('Erro ao atualizar TV');
      throw error;
    }
  }, []);

  const deleteTV = useCallback(async (id: string) => {
    try {
      await dbDeleteTV(id);
      toast.success('TV removida!');
    } catch (error) {
      console.error('Error deleting TV:', error);
      toast.error('Erro ao remover TV');
      throw error;
    }
  }, []);

  const getTVBySlug = useCallback((slug: string) => {
    return tvs.find((tv) => tv.slug === slug);
  }, [tvs]);

  const setActiveImage = useCallback(async (id: string, image: string | undefined) => {
    try {
      await dbUpdateTV(id, { activeImage: image });
    } catch (error) {
      console.error('Error updating active image:', error);
      toast.error('Erro ao atualizar imagem');
      throw error;
    }
  }, []);

  const isSlugUnique = useCallback((slug: string, excludeId?: string) => {
    return !tvs.some((tv) => tv.slug === slug && tv.id !== excludeId);
  }, [tvs]);

  return {
    tvs,
    loading,
    addTV,
    updateTV,
    deleteTV,
    getTVBySlug,
    setActiveImage,
    isSlugUnique,
  };
}
