import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { TV, Event, STORAGE_KEYS } from '@/types';
import { format, isWithinInterval, isFuture, parseISO, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Monitor, MapPin, Clock, Calendar } from 'lucide-react';

const TVPlayer = () => {
  const { slug } = useParams<{ slug: string }>();
  const [tvs] = useLocalStorage<TV[]>(STORAGE_KEYS.TVS, []);
  const [events] = useLocalStorage<Event[]>(STORAGE_KEYS.EVENTS, []);
  const [currentTime, setCurrentTime] = useState(new Date());

  const tv = tvs.find((t) => t.slug === slug);

  // Update time every minute for accurate event display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Get events for this TV
  const tvEvents = tv
    ? events
        .filter((event) => {
          const isAssignedToTV = event.tvIds.includes(tv.id);
          const endDate = parseISO(event.endDateTime);
          const isNotPast = endDate >= currentTime;
          return isAssignedToTV && isNotPast;
        })
        .sort((a, b) => parseISO(a.startDateTime).getTime() - parseISO(b.startDateTime).getTime())
    : [];

  // Categorize events
  const activeEvents = tvEvents.filter((event) => {
    const start = parseISO(event.startDateTime);
    const end = parseISO(event.endDateTime);
    return isWithinInterval(currentTime, { start, end });
  });

  const upcomingEvents = tvEvents.filter((event) => {
    const start = parseISO(event.startDateTime);
    return isFuture(start);
  });

  // TV not found
  if (!tv) {
    return (
      <div className="tv-player min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Monitor className="w-24 h-24 text-muted-foreground mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-2 gradient-text">TV não encontrada</h1>
          <p className="text-xl text-muted-foreground">
            Verifique o slug: <code className="text-primary">/{slug}</code>
          </p>
        </div>
      </div>
    );
  }

  // Priority 1: Display active image
  if (tv.activeImage) {
    return (
      <div className="tv-player min-h-screen bg-black flex items-center justify-center overflow-hidden">
        <img
          src={tv.activeImage}
          alt={tv.name}
          className="w-full h-screen object-contain"
        />
      </div>
    );
  }

  // Priority 2: Display agenda
  const isVertical = tv.orientation === 'vertical';

  return (
    <div className={`tv-player min-h-screen bg-background overflow-hidden ${isVertical ? 'flex flex-col' : ''}`}>
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-xl border-b border-border/50 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-pulse-glow">
              <Monitor className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text">Ágora LineUp</h1>
              <p className="text-muted-foreground">{tv.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold">
              {format(currentTime, 'HH:mm')}
            </p>
            <p className="text-muted-foreground">
              {format(currentTime, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className={`flex-1 p-8 ${isVertical ? '' : 'flex gap-8'}`}>
        {/* Active Events Section */}
        <section className={`${isVertical ? 'mb-8' : 'flex-1'}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 rounded-full bg-accent animate-pulse" />
            <h2 className="text-2xl font-semibold">Acontecendo Agora</h2>
          </div>

          {activeEvents.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-xl text-muted-foreground">Nenhum evento em andamento</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeEvents.map((event) => {
                const end = parseISO(event.endDateTime);
                const minutesLeft = differenceInMinutes(end, currentTime);

                return (
                  <div
                    key={event.id}
                    className="glass-card p-6 border-l-4 border-accent animate-pulse-glow"
                  >
                    <h3 className="text-2xl font-bold mb-3">{event.name}</h3>
                    <div className="flex flex-wrap gap-6 text-lg">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-5 h-5 text-primary" />
                        {event.location}
                      </span>
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-5 h-5 text-primary" />
                        Termina em {minutesLeft} min
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Upcoming Events Section */}
        <section className={`${isVertical ? '' : 'w-96'}`}>
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-5 h-5 text-secondary" />
            <h2 className="text-2xl font-semibold">Próximos Eventos</h2>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="glass-card p-6 text-center">
              <p className="text-muted-foreground">Sem eventos programados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.slice(0, isVertical ? 5 : 8).map((event) => {
                const start = parseISO(event.startDateTime);
                const isToday = format(start, 'yyyy-MM-dd') === format(currentTime, 'yyyy-MM-dd');

                return (
                  <div
                    key={event.id}
                    className="glass-card p-4 flex gap-4"
                  >
                    <div className="w-14 text-center">
                      {isToday ? (
                        <div className="bg-secondary/20 rounded-lg py-2">
                          <p className="text-2xl font-bold text-secondary">
                            {format(start, 'HH:mm')}
                          </p>
                        </div>
                      ) : (
                        <div className="bg-muted/50 rounded-lg py-2">
                          <p className="text-xl font-bold">{format(start, 'dd')}</p>
                          <p className="text-xs text-muted-foreground uppercase">
                            {format(start, 'MMM', { locale: ptBR })}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{event.name}</h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </p>
                      {isToday && (
                        <p className="text-xs text-secondary mt-1">Hoje</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-card/50 backdrop-blur-sm border-t border-border/30 px-8 py-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Ágora Tech Park</span>
          <span className="font-mono text-primary">/tv/{slug}</span>
        </div>
      </footer>
    </div>
  );
};

export default TVPlayer;
