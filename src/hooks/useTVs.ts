import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { TV, STORAGE_KEYS } from '@/types';

export function useTVs() {
  const [tvs, setTVs] = useLocalStorage<TV[]>(STORAGE_KEYS.TVS, []);

  const addTV = useCallback((tv: Omit<TV, 'id' | 'createdAt'>) => {
    const newTV: TV = {
      ...tv,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setTVs((prev) => [...prev, newTV]);
    return newTV;
  }, [setTVs]);

  const updateTV = useCallback((id: string, updates: Partial<TV>) => {
    setTVs((prev) => prev.map((tv) => 
      tv.id === id ? { ...tv, ...updates } : tv
    ));
  }, [setTVs]);

  const deleteTV = useCallback((id: string) => {
    setTVs((prev) => prev.filter((tv) => tv.id !== id));
  }, [setTVs]);

  const getTVBySlug = useCallback((slug: string) => {
    return tvs.find((tv) => tv.slug === slug);
  }, [tvs]);

  const setActiveImage = useCallback((id: string, image: string | undefined) => {
    setTVs((prev) => prev.map((tv) => 
      tv.id === id ? { ...tv, activeImage: image } : tv
    ));
  }, [setTVs]);

  const isSlugUnique = useCallback((slug: string, excludeId?: string) => {
    return !tvs.some((tv) => tv.slug === slug && tv.id !== excludeId);
  }, [tvs]);

  return {
    tvs,
    addTV,
    updateTV,
    deleteTV,
    getTVBySlug,
    setActiveImage,
    isSlugUnique,
  };
}
