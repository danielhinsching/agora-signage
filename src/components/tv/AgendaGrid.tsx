import { useMemo } from 'react';
import { Event } from '@/types';
import { EventCard } from '@/components/tv/EventCard.tsx';
import { cn } from '@/lib/utils';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AgendaGridProps {
  events: Event[];
  orientation: 'horizontal' | 'vertical';
  currentDayOfWeek: number; // 0=Sun, 1=Mon...
}

export function AgendaGrid({
  events,
  orientation,
  currentDayOfWeek,
}: AgendaGridProps) {
  // Build the current week's days (Mon–Fri)
  const weekDays = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    return Array.from({ length: 5 }, (_, i) => {
      const day = addDays(weekStart, i);
      return {
        date: day,
        label: format(day, 'EEEE', { locale: ptBR }), // "segunda-feira"
        shortLabel: format(day, "EEE", { locale: ptBR }).replace('.', ''), // "seg"
        dateLabel: format(day, "dd/MM"),
        dayIndex: (i + 1), // 1=Mon, 2=Tue...
      };
    });
  }, []);

  // Group events by day
  const grouped = useMemo(() => {
    const map = new Map<string, Event[]>();
    weekDays.forEach((wd) => {
      const key = format(wd.date, 'yyyy-MM-dd');
      map.set(key, []);
    });
    events.forEach((event) => {
      const eventDate = new Date(event.startDateTime);
      const key = format(eventDate, 'yyyy-MM-dd');
      if (map.has(key)) {
        map.get(key)!.push(event);
      }
    });
    return map;
  }, [events, weekDays]);

  if (events.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <img src="/icon.png" alt="Ágora" className="w-16 h-16 mx-auto rounded-xl opacity-40" />
          <p className="text-muted-foreground text-xl">Nenhum evento programado</p>
        </div>
      </div>
    );
  }

  if (orientation === 'horizontal') {
    return (
      <div className="flex-1 grid grid-cols-5 gap-3 p-4 overflow-hidden">
        {weekDays.map((wd) => {
          const key = format(wd.date, 'yyyy-MM-dd');
          const dayEvents = grouped.get(key) || [];
          const isToday = wd.dayIndex === currentDayOfWeek;

          return (
            <div
              key={key}
              className={cn(
                "flex flex-col rounded-xl p-2 gap-2 overflow-hidden",
                isToday
                  ? "bg-primary/15 ring-2 ring-primary"
                  : "bg-card/60"
              )}
            >
              <div
                className={cn(
                  "text-center font-bold text-lg pb-2 border-b capitalize",
                  isToday
                    ? "text-primary border-primary/40"
                    : "text-foreground border-border/50"
                )}
              >
                {wd.label}
                <span
                  className={cn(
                    "block text-xs font-normal",
                    isToday ? "text-primary/80" : "text-muted-foreground"
                  )}
                >
                  {wd.dateLabel}
                </span>
              </div>
              <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar">
                {dayEvents.length > 0 ? (
                  dayEvents.map((e) => (
                    <EventCard key={e.id} event={e} isToday={isToday} />
                  ))
                ) : (
                  <div className="text-center text-muted-foreground text-sm py-4">
                    Sem eventos
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Vertical layout: rows per day
  return (
    <div className="flex-1 flex flex-col gap-3 p-4 overflow-hidden">
      {weekDays.map((wd) => {
        const key = format(wd.date, 'yyyy-MM-dd');
        const dayEvents = grouped.get(key) || [];
        const isToday = wd.dayIndex === currentDayOfWeek;

        return (
          <div
            key={key}
            className={cn(
              "rounded-xl p-3 overflow-hidden",
              isToday
                ? "bg-primary/15 ring-2 ring-primary"
                : "bg-card/60"
            )}
          >
            <div
              className={cn(
                "font-bold text-lg mb-2 capitalize",
                isToday ? "text-primary" : "text-foreground"
              )}
            >
              {wd.label}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                {wd.dateLabel}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {dayEvents.length > 0 ? (
                dayEvents.map((e) => (
                  <div key={e.id} className="flex-1 min-w-[200px]">
                    <EventCard event={e} compact isToday={isToday} />
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground text-sm">Sem eventos</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}