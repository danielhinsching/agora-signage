// Ágora LineUp Types

export type TVOrientation = 'horizontal' | 'vertical';

export interface TV {
  id: string;
  name: string;
  slug: string;
  orientation: TVOrientation;
  activeImage?: string; // Base64 encoded image
  createdAt: string;
}

export interface Event {
  id: string;
  name: string;
  location: string;
  startDateTime: string;
  endDateTime: string;
  tvIds: string[]; // Array of TV IDs where this event should be displayed
  tags: string[]; // Professional areas/categories
  createdAt: string;
}

export interface User {
  username: string;
  isAuthenticated: boolean;
}

export interface AppState {
  tvs: TV[];
  events: Event[];
  user: User | null;
}

// Professional areas/tags for events
export const PROFESSIONAL_TAGS = [
  'Medicina',
  'Tecnologia',
  'Educação',
  'Psicologia',
  'Direito',
  'Engenharia',
  'Arquitetura',
  'Design',
  'Marketing',
  'Negócios',
  'Hackathon',
  'Workshop',
  'Palestra',
  'Networking',
  'Inovação',
  'Startups',
  'Pesquisa',
  'Saúde',
  'Meio Ambiente',
  'Sustentabilidade',
] as const;

// Storage keys
export const STORAGE_KEYS = {
  TVS: 'agora_lineup_tvs',
  EVENTS: 'agora_lineup_events',
  USER: 'agora_lineup_user',
} as const;
