import { useCallback, useEffect, useMemo, useState } from 'react';
import { Local } from '@/types';
import {
  addLocal as dbAddLocal,
  updateLocal as dbUpdateLocal,
  deleteLocal as dbDeleteLocal,
  subscribeLocais,
} from '@/lib/db';
import { toast } from 'sonner';

export function formatLocalDisplay(local: Pick<Local, 'nome' | 'predio'>) {
  return `${local.nome} - ${local.predio}`;
}

export function useLocais() {
  const [locais, setLocais] = useState<Local[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeLocais((updatedLocais) => {
      setLocais(updatedLocais);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addLocal = useCallback(async (local: Omit<Local, 'id' | 'createdAt'>) => {
    try {
      const id = await dbAddLocal(local);
      toast.success('Local criado com sucesso!');
      return { ...local, id, createdAt: new Date().toISOString() };
    } catch (error) {
      console.error('Error adding local:', error);
      toast.error('Erro ao criar local');
      throw error;
    }
  }, []);

  const updateLocal = useCallback(async (id: string, updates: Partial<Local>) => {
    try {
      await dbUpdateLocal(id, updates);
      toast.success('Local atualizado!');
    } catch (error) {
      console.error('Error updating local:', error);
      toast.error('Erro ao atualizar local');
      throw error;
    }
  }, []);

  const deleteLocal = useCallback(async (id: string) => {
    try {
      await dbDeleteLocal(id);
      toast.success('Local removido!');
    } catch (error) {
      console.error('Error deleting local:', error);
      toast.error('Erro ao remover local');
      throw error;
    }
  }, []);

  const isLocalUnique = useCallback((nome: string, predio: string, excludeId?: string) => {
    const normalizedNome = nome.trim().toLowerCase();
    const normalizedPredio = predio.trim().toLowerCase();

    return !locais.some(
      (local) =>
        local.id !== excludeId &&
        local.nome.trim().toLowerCase() === normalizedNome &&
        local.predio.trim().toLowerCase() === normalizedPredio
    );
  }, [locais]);

  const locaisOrdenados = useMemo(
    () => [...locais].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [locais]
  );

  return {
    locais: locaisOrdenados,
    loading,
    addLocal,
    updateLocal,
    deleteLocal,
    isLocalUnique,
  };
}
