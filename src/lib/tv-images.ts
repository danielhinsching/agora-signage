import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'tv-images';

export interface TvImage {
  name: string;
  path: string;
  url: string;
}

export async function listTvImages(tvId: string): Promise<TvImage[]> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(tvId, { limit: 200, sortBy: { column: 'name', order: 'asc' } });
  if (error) throw error;
  if (!data) return [];
  return data
    .filter((f) => f.name && !f.name.startsWith('.'))
    .map((f) => {
      const path = `${tvId}/${f.name}`;
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      return { name: f.name, path, url: pub.publicUrl };
    });
}

export async function uploadTvImage(tvId: string, file: File): Promise<TvImage> {
  const ext = file.name.split('.').pop() || 'jpg';
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `${tvId}/${safeName}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { name: safeName, path, url: pub.publicUrl };
}

export async function deleteTvImage(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}

export async function deleteAllTvImages(tvId: string): Promise<void> {
  const imgs = await listTvImages(tvId);
  if (imgs.length === 0) return;
  await supabase.storage.from(BUCKET).remove(imgs.map((i) => i.path));
}
