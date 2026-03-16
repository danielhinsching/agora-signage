import { useTVs } from '@/hooks/useTVs';
import { useEvents } from '@/hooks/useEvents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tv, Calendar, Clock, Activity, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { tvs } = useTVs();
  const { events, activeEvents, upcomingEvents } = useEvents();

  const stats = [
    {
      label: 'TVs Cadastradas',
      value: tvs.length,
      icon: Tv,
      gradient: 'from-primary to-amber-400',
      bg: 'bg-primary/10',
    },
    {
      label: 'Eventos Totais',
      value: events.length,
      icon: Calendar,
      gradient: 'from-secondary to-orange-400',
      bg: 'bg-secondary/10',
    },
    {
      label: 'Eventos Ativos',
      value: activeEvents.length,
      icon: Activity,
      gradient: 'from-emerald-500 to-green-400',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Próximos Eventos',
      value: upcomingEvents.length,
      icon: Clock,
      gradient: 'from-sky-500 to-blue-400',
      bg: 'bg-sky-500/10',
    },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 pt-16 lg:pt-8 custom-scrollbar">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-2 sm:gap-3">
          <img src="/icon.png" alt="Ágora" className="w-7 h-7 sm:w-8 sm:h-8" />
          Dashboard
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Visão geral do sistema de Digital Signage
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
        {stats.map((stat, index) => (
          <Card 
            key={stat.label} 
            className="glass-card-strong fade-in-up overflow-hidden group hover:scale-[1.02] transition-transform" 
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardContent className="p-4 md:p-6 relative">
              {/* Background gradient accent */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${stat.gradient} opacity-10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:opacity-20 transition-opacity`} />
              
              <div className="flex items-center justify-between relative">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium">{stat.label}</p>
                  <p className="text-2xl sm:text-4xl font-bold mt-1 sm:mt-2 gradient-text">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 sm:w-7 sm:h-7 bg-gradient-to-br ${stat.gradient} bg-clip-text`} style={{ color: 'transparent', background: `linear-gradient(135deg, var(--tw-gradient-stops))`, WebkitBackgroundClip: 'text' }} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* TVs List */}
        <Card className="glass-card-strong">
          <CardHeader className="border-b border-border/30 p-4 md:p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-2xl">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center">
                  <Tv className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <span>TVs Cadastradas</span>
              </CardTitle>
              <Link 
                to="/admin/tvs" 
                className="text-xs sm:text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Ver todas →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-4 p-4 md:p-6 md:pt-4">
            {tvs.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <Tv className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Nenhuma TV cadastrada ainda.</p>
                <Link 
                  to="/admin/tvs" 
                  className="text-sm text-primary hover:underline mt-2 inline-block"
                >
                  Cadastrar TV
                </Link>
              </div>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {tvs.slice(0, 5).map((tv, idx) => (
                  <div
                    key={tv.id}
                    className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors fade-in-up"
                    style={{ animationDelay: `${0.2 + idx * 0.05}s` }}
                  >
                    <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                      {/* Status indicator */}
                      <div className="relative flex-shrink-0">
                        <div className="w-3 h-3 rounded-full bg-accent animate-pulse" />
                        <div className="absolute inset-0 w-3 h-3 rounded-full bg-accent animate-ping opacity-75" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm md:text-base truncate">{tv.name}</p>
                        <p className="text-xs text-muted-foreground font-mono truncate">/tv/{tv.slug}</p>
                      </div>
                    </div>
                    <span className="chip chip-muted text-xs py-0.5 capitalize flex-shrink-0 ml-2">
                      {tv.orientation === 'horizontal' ? '16:9' : '9:16'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="glass-card-strong">
          <CardHeader className="border-b border-border/30 p-4 md:p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-2xl">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-secondary/10 flex items-center justify-center">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
                </div>
                <span>Próximos Eventos</span>
              </CardTitle>
              <Link 
                to="/admin/events" 
                className="text-xs sm:text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Ver todos →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-4 p-4 md:p-6 md:pt-4">
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <Calendar className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum evento programado.</p>
                <Link 
                  to="/admin/events" 
                  className="text-sm text-primary hover:underline mt-2 inline-block"
                >
                  Cadastrar Evento
                </Link>
              </div>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {upcomingEvents.slice(0, 5).map((event, idx) => {
                  const eventDate = new Date(event.startDateTime);
                  const isToday = new Date().toDateString() === eventDate.toDateString();
                  
                  return (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors fade-in-up"
                      style={{ animationDelay: `${0.2 + idx * 0.05}s` }}
                    >
                      {/* Date badge */}
                      <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${
                        isToday 
                          ? 'bg-gradient-to-br from-secondary to-primary text-primary-foreground' 
                          : 'bg-muted/50'
                      }`}>
                        <span className="text-base sm:text-lg font-bold">
                          {format(eventDate, 'dd')}
                        </span>
                        <span className="text-[10px] sm:text-xs uppercase opacity-80">
                          {format(eventDate, 'MMM', { locale: ptBR })}
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm md:text-base truncate">{event.name}</p>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{event.location}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(eventDate, 'HH:mm')}
                          </span>
                        </div>
                      </div>

                      {isToday && (
                        <span className="chip chip-secondary text-[10px] sm:text-xs py-0.5 flex-shrink-0">
                          Hoje
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;