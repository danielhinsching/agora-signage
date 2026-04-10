import type { TVOrientation } from "@/types";

export interface TvEvent {
  id: string;
  name: string;
  location: string;
  dayOfWeek: string;
  date: string; // DD/MM
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

export interface TvConfig {
  slug: string;
  orientation: TVOrientation;
}

export interface TvData {
  config: TvConfig;
  events: TvEvent[];
  image?: string; // base64
}
