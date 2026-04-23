import { supabase } from '@/integrations/supabase/client';
import { Empresa } from '@/types';

const BUCKET = 'empresa-logos';

type EmpresaRow = {
  id: string;
  nome: string;
  descricao: string;
  site_url: string;
  logo_url: string | null;
  created_at: string;
};

const mapRow = (r: EmpresaRow): Empresa => ({
  id: r.id,
  nome: r.nome,
  descricao: r.descricao ?? '',
  siteUrl: r.site_url,
  logoUrl: r.logo_url ?? undefined,
  createdAt: r.created_at,
});

export async function listEmpresas(): Promise<Empresa[]> {
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .order('nome', { ascending: true });
  if (error) throw error;
  return (data as EmpresaRow[]).map(mapRow);
}

export async function addEmpresa(input: Omit<Empresa, 'id' | 'createdAt'>): Promise<Empresa> {
  const { data, error } = await supabase
    .from('empresas')
    .insert({
      nome: input.nome,
      descricao: input.descricao,
      site_url: input.siteUrl,
      logo_url: input.logoUrl ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapRow(data as EmpresaRow);
}

export async function updateEmpresa(id: string, updates: Partial<Omit<Empresa, 'id' | 'createdAt'>>): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (updates.nome !== undefined) payload.nome = updates.nome;
  if (updates.descricao !== undefined) payload.descricao = updates.descricao;
  if (updates.siteUrl !== undefined) payload.site_url = updates.siteUrl;
  if (updates.logoUrl !== undefined) payload.logo_url = updates.logoUrl;
  const { error } = await supabase.from('empresas').update(payload).eq('id', id);
  if (error) throw error;
}

export async function deleteEmpresa(id: string, logoPath?: string | null): Promise<void> {
  const { error } = await supabase.from('empresas').delete().eq('id', id);
  if (error) throw error;
  if (logoPath) {
    await supabase.storage.from(BUCKET).remove([logoPath]).catch(() => undefined);
  }
}

export async function uploadEmpresaLogo(empresaId: string, file: File): Promise<{ url: string; path: string }> {
  const ext = file.name.split('.').pop() || 'png';
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `${empresaId}/${safeName}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: pub.publicUrl, path };
}

export function extractPathFromPublicUrl(url?: string | null): string | null {
  if (!url) return null;
  const marker = `/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.substring(idx + marker.length);
}

export function subscribeEmpresas(callback: (empresas: Empresa[]) => void): () => void {
  let active = true;
  const fetchAndEmit = async () => {
    try {
      const list = await listEmpresas();
      if (active) callback(list);
    } catch (e) {
      console.error('Error loading empresas:', e);
      if (active) callback([]);
    }
  };
  fetchAndEmit();
  const channel = supabase
    .channel('empresas-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'empresas' }, () => {
      fetchAndEmit();
    })
    .subscribe();
  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}
