import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { TV, Event, STORAGE_KEYS } from '@/types';
import { TvHeader } from '@/components/tv/TvHeader.tsx';
import { TvFooter } from '@/components/tv/TvFooter.tsx';
import { AgendaGrid } from '@/components/tv/AgendaGrid.tsx';
import { useClock } from "@/hooks/use-clock.ts";
import { useScreenOrientation } from "@/hooks/use-screen-orientation.ts";

function getTVBySlug(slug: string): TV | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TVS);
    const tvs: TV[] = raw ? JSON.parse(raw) : [];
    return tvs.find((tv) => tv.slug === slug) || null;
  } catch {
    return null;
  }
}

function getEventsForTV(tvId: string): Event[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EVENTS);
    const events: Event[] = raw ? JSON.parse(raw) : [];
    const now = new Date();
    return events
      .filter((event) => {
        const isAssigned = event.tvIds.includes(tvId);
        const end = new Date(event.endDateTime);
        return isAssigned && end >= now;
      })
      .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
  } catch {
    return [];
  }
}

export default function TvPlayer() {
  const { slug = 'default' } = useParams<{ slug: string }>();
  const { dayOfWeek } = useClock();
  const orientation = useScreenOrientation();
  const [tv, setTv] = useState<TV | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [fadeKey, setFadeKey] = useState(0);

  const loadData = useCallback(() => {
    const foundTv = getTVBySlug(slug);
    setTv(foundTv);
    if (foundTv) {
      setEvents(getEventsForTV(foundTv.id));
    } else {
      setEvents([]);
    }
    setFadeKey((k) => k + 1);
  }, [slug]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Force light theme (white) on TV pages and restore previous theme on unmount
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');
    const hadLight = root.classList.contains('light');
    const prevTheme = hadDark ? 'dark' : hadLight ? 'light' : null;

    root.classList.remove('dark');
    root.classList.add('light');

    return () => {
      root.classList.remove('light');
      if (prevTheme === 'dark') root.classList.add('dark');
      else if (prevTheme === 'light') root.classList.add('light');
    };
  }, []);

  // Listen to localStorage changes (from admin panel in another tab)
  useEffect(() => {
    const handler = () => loadData();
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [loadData]);

  // Poll for changes every 10s (same-tab updates)
  useEffect(() => {
    const interval = setInterval(loadData, 10_000);
    return () => clearInterval(interval);
  }, [loadData]);

  const effectOrientation = tv?.orientation || orientation;

  if (!tv) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-background flex items-center justify-center select-none">
        <div className="text-center space-y-4">
          <img src="/icon.png" alt="Ágora" className="w-20 h-20 mx-auto rounded-2xl opacity-60" />
          <p className="text-muted-foreground text-lg">
            TV não encontrada: <span className="font-mono text-foreground">{slug}</span>
          </p>
          <p className="text-muted-foreground text-sm">Cadastre esta TV no painel administrativo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden cursor-none bg-background flex flex-col select-none">
      <div key={fadeKey} className="flex flex-col h-full animate-fade-in">
        <TvHeader orientation={effectOrientation} />
        <AgendaGrid
          events={events}
          orientation={effectOrientation}
          currentDayOfWeek={dayOfWeek}
        />
        <TvFooter />
      </div>
    </div>
  );
}
