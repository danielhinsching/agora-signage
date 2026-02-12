import { useMemo } from 'react';
import { useEvents } from '@/hooks/useEvents';
import { useTVs } from '@/hooks/useTVs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO, getDay, getHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tag, MapPin, Clock, TrendingUp, Calendar, Zap } from 'lucide-react';

const COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#06B6D4', '#6366F1', '#EF4444'];

export default function AnalyticsDashboard() {
  const { events } = useEvents();
  const { tvs } = useTVs();

  // Análise de Tags
  const tagStats = useMemo(() => {
    const stats: Record<string, number> = {};
    events.forEach((event) => {
      event.tags?.forEach((tag) => {
        stats[tag] = (stats[tag] || 0) + 1;
      });
    });
    return Object.entries(stats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [events]);

  // Análise de Locais
  const locationStats = useMemo(() => {
    const stats: Record<string, number> = {};
    events.forEach((event) => {
      stats[event.location] = (stats[event.location] || 0) + 1;
    });
    return Object.entries(stats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [events]);

  // Horários de Pico
  const peakHours = useMemo(() => {
    const hours: Record<number, number> = {};
    for (let i = 0; i < 24; i++) hours[i] = 0;

    events.forEach((event) => {
      const start = new Date(event.startDateTime);
      const end = new Date(event.endDateTime);
      for (let d = new Date(start); d < end; d.setHours(d.getHours() + 1)) {
        hours[d.getHours()]++;
      }
    });

    return Object.entries(hours)
      .map(([hour, count]) => ({
        hour: `${hour}h`,
        eventos: count,
      }))
      .filter((h) => h.eventos > 0);
  }, [events]);

  // Ocupação de TVs
  const tvOccupancy = useMemo(() => {
    return tvs.map((tv) => {
      const tvEvents = events.filter((e) => e.tvIds.includes(tv.id));
      return {
        name: tv.name,
        events: tvEvents.length,
        hours: tvEvents.reduce(
          (sum, e) =>
            sum +
            (new Date(e.endDateTime).getTime() - new Date(e.startDateTime).getTime()) / (1000 * 60 * 60),
          0
        ),
      };
    });
  }, [events, tvs]);

  // Dias com mais eventos
  const dayStats = useMemo(() => {
    const days: Record<number, number> = {};
    for (let i = 0; i < 7; i++) days[i] = 0;

    events.forEach((event) => {
      const day = getDay(new Date(event.startDateTime));
      days[day]++;
    });

    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    return Object.entries(days)
      .map(([day, count]) => ({
        day: dayNames[Number(day)],
        eventos: count,
      }))
      .filter((d) => d.eventos > 0);
  }, [events]);

  // Duração média de eventos
  const avgDuration = useMemo(() => {
    if (events.length === 0) return 0;
    const totalMs = events.reduce(
      (sum, e) => sum + (new Date(e.endDateTime).getTime() - new Date(e.startDateTime).getTime()),
      0
    );
    return Math.round((totalMs / events.length / (1000 * 60)) * 10) / 10; // em minutos
  }, [events]);

  // Eventos simultâneos máximo
  const maxSimultaneous = useMemo(() => {
    let max = 0;
    events.forEach((event) => {
      const start = new Date(event.startDateTime);
      const count = events.filter(
        (e) =>
          new Date(e.startDateTime) <= start &&
          new Date(e.endDateTime) > start
      ).length;
      max = Math.max(max, count);
    });
    return max;
  }, [events]);

  const stats = [
    {
      label: 'Total de Eventos',
      value: events.length,
      icon: Calendar,
      bg: 'bg-blue-500/10',
      color: 'text-blue-600',
    },
    {
      label: 'Duração Média',
      value: `${avgDuration}min`,
      icon: Clock,
      bg: 'bg-purple-500/10',
      color: 'text-purple-600',
    },
    {
      label: 'Eventos Simultâneos',
      value: maxSimultaneous,
      icon: Zap,
      bg: 'bg-orange-500/10',
      color: 'text-orange-600',
    },
    {
      label: 'Áreas Profissionais',
      value: tagStats.length,
      icon: Tag,
      bg: 'bg-emerald-500/10',
      color: 'text-emerald-600',
    },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 custom-scrollbar pt-16 lg:pt-8 space-y-6">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-2 sm:gap-3">
          <TrendingUp className="w-8 h-8" />
          Analytics
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Inteligência de dados sobre os eventos
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="glass-card-strong">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                  <p className="text-4xl font-bold mt-2 gradient-text">{stat.value}</p>
                </div>
                <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-7 h-7 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Tags Distribution */}
        {tagStats.length > 0 && (
          <Card className="glass-card-strong">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Áreas Profissionais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={tagStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {tagStats.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Locations */}
        {locationStats.length > 0 && (
          <Card className="glass-card-strong">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Principais Locais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={locationStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Peak Hours */}
        {peakHours.length > 0 && (
          <Card className="glass-card-strong">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Horários de Pico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={peakHours}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="eventos" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Day Distribution */}
        {dayStats.length > 0 && (
          <Card className="glass-card-strong">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Distribuição por Dia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dayStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="eventos" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* TV Occupancy */}
      {tvOccupancy.length > 0 && (
        <Card className="glass-card-strong">
          <CardHeader>
            <CardTitle>Ocupação de TVs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tvOccupancy.map((tv) => (
                <div key={tv.name}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">{tv.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {tv.events} eventos • {tv.hours.toFixed(1)}h
                    </span>
                  </div>
                  <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, (tv.hours / 24) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
