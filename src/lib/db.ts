// Supabase Database Services
// Mantém a mesma API que era usada com Firestore para evitar mudanças nos hooks
import { supabase } from '@/integrations/supabase/client';
import { TV, Event, Local, TVOrientation } from '@/types';

const ALLOWED_TV_ORIENTATIONS: TVOrientation[] = [
  'horizontal',
  'vertical',
  'vertical-left',
  'vertical-right',
  'mobile',
];

function normalizeTVOrientation(value: unknown): TVOrientation {
  if (typeof value === 'string' && ALLOWED_TV_ORIENTATIONS.includes(value as TVOrientation)) {
    return value as TVOrientation;
  }
  return 'horizontal';
}

// ============== Row mappers ==============

interface TVRow {
  id: string;
  name: string;
  slug: string;
  orientation: string;
  created_at: string;
}

interface EventRow {
  id: string;
  name: string;
  location: string;
  start_date_time: string;
  end_date_time: string;
  tv_ids: string[] | null;
  tags: string[] | null;
  group_id: string | null;
  created_at: string;
}

interface LocalRow {
  id: string;
  nome: string;
  predio: string;
  descricao: string | null;
  created_at: string;
}

function mapTV(row: TVRow): TV {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    orientation: normalizeTVOrientation(row.orientation),
    createdAt: row.created_at,
  };
}

function mapEvent(row: EventRow): Event {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    startDateTime: row.start_date_time,
    endDateTime: row.end_date_time,
    tvIds: row.tv_ids ?? [],
    tags: row.tags ?? [],
    groupId: row.group_id ?? undefined,
    createdAt: row.created_at,
  };
}

function mapLocal(row: LocalRow): Local {
  return {
    id: row.id,
    nome: row.nome,
    predio: row.predio,
    descricao: row.descricao ?? '',
    createdAt: row.created_at,
  };
}

// ============== TV Operations ==============

export async function addTV(tvData: Omit<TV, 'id' | 'createdAt'>): Promise<string> {
  const { data, error } = await supabase
    .from('tvs')
    .insert({
      name: tvData.name,
      slug: tvData.slug,
      orientation: tvData.orientation as TVOrientation,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateTV(id: string, updates: Partial<TV>): Promise<void> {
  const payload: { name?: string; slug?: string; orientation?: TVOrientation } = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.slug !== undefined) payload.slug = updates.slug;
  if (updates.orientation !== undefined) payload.orientation = updates.orientation;
  const { error } = await supabase.from('tvs').update(payload).eq('id', id);
  if (error) throw error;
}

export async function deleteTV(id: string): Promise<void> {
  const { error } = await supabase.from('tvs').delete().eq('id', id);
  if (error) throw error;
}

export async function getTVBySlug(slug: string): Promise<TV | null> {
  const { data, error } = await supabase.from('tvs').select('*').eq('slug', slug).maybeSingle();
  if (error) throw error;
  return data ? mapTV(data as TVRow) : null;
}

export async function getAllTVs(): Promise<TV[]> {
  const { data, error } = await supabase.from('tvs').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data as TVRow[]).map(mapTV);
}

export function subscribeTVs(callback: (tvs: TV[]) => void) {
  let active = true;

  const fetchAll = async () => {
    const { data, error } = await supabase.from('tvs').select('*').order('created_at', { ascending: false });
    if (!active) return;
    if (error) {
      console.error('subscribeTVs error:', error);
      callback([]);
      return;
    }
    callback((data as TVRow[]).map(mapTV));
  };

  fetchAll();

  const channel = supabase
    .channel('tvs-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tvs' }, fetchAll)
    .subscribe();

  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}

// ============== Event Operations ==============

export async function addEvent(eventData: Omit<Event, 'id' | 'createdAt'>): Promise<string> {
  const { data, error } = await supabase
    .from('events')
    .insert({
      name: eventData.name,
      location: eventData.location,
      start_date_time: eventData.startDateTime,
      end_date_time: eventData.endDateTime,
      tv_ids: eventData.tvIds ?? [],
      tags: eventData.tags ?? [],
      group_id: eventData.groupId ?? null,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateEvent(id: string, updates: Partial<Event>): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.location !== undefined) payload.location = updates.location;
  if (updates.startDateTime !== undefined) payload.start_date_time = updates.startDateTime;
  if (updates.endDateTime !== undefined) payload.end_date_time = updates.endDateTime;
  if (updates.tvIds !== undefined) payload.tv_ids = updates.tvIds;
  if (updates.tags !== undefined) payload.tags = updates.tags;
  if (updates.groupId !== undefined) payload.group_id = updates.groupId ?? null;
  const { error } = await supabase.from('events').update(payload).eq('id', id);
  if (error) throw error;
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
}

export async function getAllEvents(): Promise<Event[]> {
  const { data, error } = await supabase.from('events').select('*').order('start_date_time', { ascending: true });
  if (error) throw error;
  return (data as EventRow[]).map(mapEvent);
}

export async function getEventsForTV(tvId: string): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .contains('tv_ids', [tvId])
    .order('start_date_time', { ascending: true });
  if (error) throw error;
  return (data as EventRow[]).map(mapEvent);
}

export function subscribeEvents(callback: (events: Event[]) => void) {
  let active = true;

  const fetchAll = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_date_time', { ascending: true });
    if (!active) return;
    if (error) {
      console.error('subscribeEvents error:', error);
      callback([]);
      return;
    }
    callback((data as EventRow[]).map(mapEvent));
  };

  fetchAll();

  const channel = supabase
    .channel('events-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, fetchAll)
    .subscribe();

  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}

export function subscribeEventsForTV(tvId: string, callback: (events: Event[]) => void) {
  let active = true;

  const fetchAll = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .contains('tv_ids', [tvId])
      .order('start_date_time', { ascending: true });
    if (!active) return;
    if (error) {
      console.error('subscribeEventsForTV error:', error);
      callback([]);
      return;
    }
    callback((data as EventRow[]).map(mapEvent));
  };

  fetchAll();

  const channel = supabase
    .channel(`events-tv-${tvId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, fetchAll)
    .subscribe();

  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}

// ============== Locais Operations ==============

export async function addLocal(localData: Omit<Local, 'id' | 'createdAt'>): Promise<string> {
  const { data, error } = await supabase
    .from('locais')
    .insert({
      nome: localData.nome,
      predio: localData.predio,
      descricao: localData.descricao ?? '',
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateLocal(id: string, updates: Partial<Local>): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (updates.nome !== undefined) payload.nome = updates.nome;
  if (updates.predio !== undefined) payload.predio = updates.predio;
  if (updates.descricao !== undefined) payload.descricao = updates.descricao;
  const { error } = await supabase.from('locais').update(payload).eq('id', id);
  if (error) throw error;
}

export async function deleteLocal(id: string): Promise<void> {
  const { error } = await supabase.from('locais').delete().eq('id', id);
  if (error) throw error;
}

export async function getAllLocais(): Promise<Local[]> {
  const { data, error } = await supabase.from('locais').select('*').order('nome', { ascending: true });
  if (error) throw error;
  return (data as LocalRow[]).map(mapLocal);
}

export function subscribeLocais(callback: (locais: Local[]) => void) {
  let active = true;

  const fetchAll = async () => {
    const { data, error } = await supabase.from('locais').select('*').order('nome', { ascending: true });
    if (!active) return;
    if (error) {
      console.error('subscribeLocais error:', error);
      callback([]);
      return;
    }
    callback((data as LocalRow[]).map(mapLocal));
  };

  fetchAll();

  const channel = supabase
    .channel('locais-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'locais' }, fetchAll)
    .subscribe();

  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}
