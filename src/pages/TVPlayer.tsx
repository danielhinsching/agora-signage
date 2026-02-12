import { useEffect, useState, useCallback } from 'react';
import { isSameWeek } from 'date-fns';
import { useParams } from 'react-router-dom';
import { TV, Event } from '@/types';
import { TvHeader } from '@/components/tv/TvHeader.tsx';
import { TvFooter } from '@/components/tv/TvFooter.tsx';
import { AgendaGrid } from '@/components/tv/AgendaGrid.tsx';
import { useClock } from "@/hooks/use-clock.ts";
import { useScreenOrientation } from "@/hooks/use-screen-orientation.ts";
import { getTVBySlug, subscribeEventsForTV } from '@/lib/db';

export default function TvPlayer() {
  const { slug = 'default' } = useParams<{ slug: string }>();
  const { dayOfWeek } = useClock();
  const orientation = useScreenOrientation();
  const [tv, setTv] = useState<TV | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [fadeKey, setFadeKey] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadTV = useCallback(async () => {
    try {
      const foundTv = await getTVBySlug(slug);
      setTv(foundTv);
      setLoading(false);
    } catch (error) {
      console.error('Error loading TV:', error);
      setLoading(false);
    }
  }, [slug]);

  // Load TV data on mount
  useEffect(() => {
    loadTV();
  }, [loadTV]);

  // Subscribe to events for this TV in real-time
  useEffect(() => {
    if (!tv) return;

    const unsubscribe = subscribeEventsForTV(tv.id, (updatedEvents) => {
      const now = new Date();
      const filteredEvents = updatedEvents.filter((event) => {
        const end = new Date(event.endDateTime);
        const start = new Date(event.startDateTime);
        const inSameWeek = isSameWeek(start, now, { weekStartsOn: 0 });
        return end >= now || inSameWeek;
      });
      setEvents(filteredEvents);
      setFadeKey((k) => k + 1);
    });

    return () => unsubscribe();
  }, [tv]);

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

  const effectOrientation = tv?.orientation || orientation;

  if (loading) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-background flex items-center justify-center select-none">
        <div className="text-center space-y-4">
          <img src="/icon.png" alt="Ágora" className="w-20 h-20 mx-auto rounded-2xl opacity-60 animate-pulse" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

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
