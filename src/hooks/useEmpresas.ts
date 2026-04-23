import { useCallback, useEffect, useState } from 'react';
import { Empresa } from '@/types';
import {
  addEmpresa as dbAddEmpresa,
  updateEmpresa as dbUpdateEmpresa,
  deleteEmpresa as dbDeleteEmpresa,
  subscribeEmpresas,
  extractPathFromPublicUrl,
} from '@/lib/empresas';
import { toast } from 'sonner';

export function useEmpresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeEmpresas((list) => {
      setEmpresas(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const addEmpresa = useCallback(async (input: Omit<Empresa, 'id' | 'createdAt'>) => {
    try {
      const created = await dbAddEmpresa(input);
      toast.success('Empresa cadastrada!');
      return created;
    } catch (e) {
      console.error(e);
      toast.error('Erro ao cadastrar empresa');
      throw e;
    }
  }, []);

  const updateEmpresa = useCallback(async (id: string, updates: Partial<Empresa>) => {
    try {
      await dbUpdateEmpresa(id, updates);
      toast.success('Empresa atualizada!');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao atualizar empresa');
      throw e;
    }
  }, []);

  const deleteEmpresa = useCallback(async (empresa: Empresa) => {
    try {
      const path = extractPathFromPublicUrl(empresa.logoUrl);
      await dbDeleteEmpresa(empresa.id, path);
      toast.success('Empresa removida!');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao remover empresa');
      throw e;
    }
  }, []);

  return { empresas, loading, addEmpresa, updateEmpresa, deleteEmpresa };
}
