import { useTVs } from '@/hooks/useTVs';
import { useEvents } from '@/hooks/useEvents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tv, Calendar, Clock, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AdminDashboard = () => {
  const { tvs } = useTVs();
  const { events, activeEvents, upcomingEvents } = useEvents();

  const stats = [
    {
      label: 'TVs Cadastradas',
      value: tvs.length,
      icon: Tv,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Eventos Totais',
      value: events.length,
      icon: Calendar,
      color: 'text-secondary',
      bg: 'bg-secondary/10',
    },
    {
      label: 'Eventos Ativos',
      value: activeEvents.length,
      icon: Activity,
      color: 'text-accent',
      bg: 'bg-accent/10',
    },
    {
      label: 'Próximos Eventos',
      value: upcomingEvents.length,
      icon: Clock,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do sistema de Digital Signage
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={stat.label} className="glass-card fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TVs List */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tv className="w-5 h-5 text-primary" />
              TVs Cadastradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tvs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma TV cadastrada ainda.
              </p>
            ) : (
              <div className="space-y-3">
                {tvs.slice(0, 5).map((tv) => (
                  <div
                    key={tv.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${tv.activeImage ? 'bg-accent' : 'bg-muted-foreground'}`} />
                      <div>
                        <p className="font-medium">{tv.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">/tv/{tv.slug}</p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary capitalize">
                      {tv.orientation === 'horizontal' ? 'Horizontal' : 'Vertical'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-secondary" />
              Próximos Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum evento programado.
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.slice(0, 5).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div>
                      <p className="font-medium">{event.name}</p>
                      <p className="text-xs text-muted-foreground">{event.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-primary">
                        {format(new Date(event.startDateTime), "dd MMM", { locale: ptBR })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(event.startDateTime), "HH:mm")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
