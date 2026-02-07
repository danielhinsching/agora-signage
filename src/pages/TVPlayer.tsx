import { useParams } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { TV, Event, STORAGE_KEYS } from '@/types';
import { format, isWithinInterval, isFuture, parseISO, differenceInMinutes, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Monitor, MapPin, Clock, Calendar, Wifi } from 'lucide-react';

const TVPlayer = () => {
  const { slug } = useParams<{ slug: string }>();
  const [tvs] = useLocalStorage<TV[]>(STORAGE_KEYS.TVS, []);
  const [events] = useLocalStorage<Event[]>(STORAGE_KEYS.EVENTS, []);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const tv = tvs.find((t) => t.slug === slug);

  // Update time every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Reset image loaded state when image changes
  useEffect(() => {
    if (tv?.activeImage) {
      setIsImageLoaded(false);
    }
  }, [tv?.activeImage]);

  // Get events for this TV
  const tvEvents = useMemo(() => {
    if (!tv) return [];
    return events
      .filter((event) => {
        const isAssignedToTV = event.tvIds.includes(tv.id);
        const endDate = parseISO(event.endDateTime);
        return isAssignedToTV && endDate >= currentTime;
      })
      .sort((a, b) => parseISO(a.startDateTime).getTime() - parseISO(b.startDateTime).getTime());
  }, [tv, events, currentTime]);

  // Categorize events
  const { activeEvents, upcomingEvents } = useMemo(() => {
    const active = tvEvents.filter((event) => {
      const start = parseISO(event.startDateTime);
      const end = parseISO(event.endDateTime);
      return isWithinInterval(currentTime, { start, end });
    });

    const upcoming = tvEvents.filter((event) => {
      const start = parseISO(event.startDateTime);
      return isFuture(start);
    });

    return { activeEvents: active, upcomingEvents: upcoming };
  }, [tvEvents, currentTime]);

  // TV not found
  if (!tv) {
    return (
      <div className="tv-player min-h-screen bg-background flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-destructive/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="text-center relative z-10 fade-in">
          <div className="w-28 h-28 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto mb-8">
            <Monitor className="w-14 h-14 text-muted-foreground" />
          </div>
          <h1 className="tv-title gradient-text mb-4">TV não encontrada</h1>
          <p className="tv-body text-muted-foreground">
            Verifique o slug: <code className="text-primary font-mono">/{slug}</code>
          </p>
        </div>
      </div>
    );
  }

  const isVertical = tv.orientation === 'vertical';

  // Priority 1: Display active image (fullscreen, no UI)
  if (tv.activeImage) {
    return (
      <div className="tv-player min-h-screen bg-black flex items-center justify-center">
        <img
          src={tv.activeImage}
          alt={tv.name}
          className={`w-full h-screen object-cover transition-opacity duration-700 ${
            isImageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setIsImageLoaded(true)}
        />
      </div>
    );
  }

  // Priority 2: Display agenda
  return (
    <div className={`tv-player min-h-screen bg-background flex flex-col overflow-hidden ${isVertical ? '' : ''}`}>
      {/* Ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-[400px] h-[400px] bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 glass-card-strong mx-6 mt-6 px-8 py-6 rounded-2xl slide-in-left">
        <div className={`flex items-center ${isVertical ? 'flex-col gap-6 text-center' : 'justify-between'}`}>
          {/* Branding */}
          <div className={`flex items-center gap-5 ${isVertical ? 'flex-col' : ''}`}>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-pulse-glow shadow-lg">
              <Monitor className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text tracking-tight">Ágora LineUp</h1>
              <p className="text-muted-foreground text-lg flex items-center gap-2 justify-center">
                <span className="status-online pl-4">{tv.name}</span>
              </p>
            </div>
          </div>

          {/* Clock */}
          <div className={`${isVertical ? 'text-center' : 'text-right'}`}>
            <p className="text-6xl font-bold tracking-tight gradient-text-accent">
              {format(currentTime, 'HH:mm')}
            </p>
            <p className="text-xl text-muted-foreground capitalize">
              {format(currentTime, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className={`flex-1 relative z-10 p-6 ${isVertical ? 'flex flex-col gap-6' : 'flex gap-6'}`}>
        {/* Active Events Section */}
        <section className={`${isVertical ? '' : 'flex-1'} slide-in-left`} style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-3 h-3 rounded-full bg-accent animate-pulse shadow-lg shadow-accent/50" />
            <h2 className="tv-subtitle text-foreground">Acontecendo Agora</h2>
          </div>

          {activeEvents.length === 0 ? (
            <div className="glass-card p-10 text-center rounded-2xl">
              <Calendar className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="tv-body text-muted-foreground">Nenhum evento em andamento</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeEvents.map((event, idx) => {
                const end = parseISO(event.endDateTime);
                const minutesLeft = differenceInMinutes(end, currentTime);

                return (
                  <div
                    key={event.id}
                    className="glass-card-strong p-6 rounded-2xl border-l-4 border-accent animate-pulse-glow fade-in-up"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <h3 className="tv-subtitle mb-4 text-foreground">{event.name}</h3>
                    <div className={`flex gap-8 ${isVertical ? 'flex-col' : 'flex-wrap'}`}>
                      <span className="flex items-center gap-3 tv-caption text-muted-foreground">
                        <MapPin className="w-6 h-6 text-primary" />
                        {event.location}
                      </span>
                      <span className="flex items-center gap-3 tv-caption text-accent">
                        <Clock className="w-6 h-6" />
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
        <section 
          className={`${isVertical ? 'flex-1' : 'w-[420px]'} slide-in-right`} 
          style={{ animationDelay: '0.2s' }}
        >
          <div className="flex items-center gap-3 mb-5">
            <Calendar className="w-6 h-6 text-secondary" />
            <h2 className="tv-subtitle text-foreground">Próximos Eventos</h2>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="glass-card p-8 text-center rounded-2xl">
              <p className="tv-caption text-muted-foreground">Sem eventos programados</p>
            </div>
          ) : (
            <div className={`space-y-3 ${isVertical ? '' : 'max-h-[calc(100vh-320px)] overflow-hidden'}`}>
              {upcomingEvents.slice(0, isVertical ? 6 : 8).map((event, idx) => {
                const start = parseISO(event.startDateTime);
                const isToday = isSameDay(start, currentTime);

                return (
                  <div
                    key={event.id}
                    className="glass-card p-4 rounded-xl flex gap-4 items-center fade-in-up hover:bg-card/60 transition-all"
                    style={{ animationDelay: `${0.3 + idx * 0.05}s` }}
                  >
                    <div className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center ${
                      isToday 
                        ? 'bg-gradient-to-br from-secondary to-primary text-primary-foreground' 
                        : 'bg-muted/50'
                    }`}>
                      {isToday ? (
                        <p className="text-2xl font-bold">{format(start, 'HH:mm')}</p>
                      ) : (
                        <>
                          <p className="text-xl font-bold">{format(start, 'dd')}</p>
                          <p className="text-xs uppercase opacity-80">
                            {format(start, 'MMM', { locale: ptBR })}
                          </p>
                        </>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-lg truncate">{event.name}</h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </p>
                      {isToday && (
                        <span className="inline-block mt-1 text-xs font-semibold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
                          Hoje
                        </span>
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
      <footer className="relative z-10 glass-card mx-6 mb-6 px-6 py-4 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <Wifi className="w-4 h-4 text-primary" />
            </div>
            <span className="text-muted-foreground font-medium">Ágora Tech Park</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{format(currentTime, "dd/MM/yyyy")}</span>
            <span className="font-mono text-primary">/tv/{slug}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TVPlayer;
