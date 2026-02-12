import { useState, useMemo, useCallback } from 'react';
import { Event, TV } from '@/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  MapPin,
  Clock,
  Tv,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  parseISO,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Event color palette for visual distinction
const eventColors = [
  { bg: 'bg-primary/20', border: 'border-l-primary', text: 'text-primary', dot: 'bg-primary' },
  { bg: 'bg-secondary/20', border: 'border-l-secondary', text: 'text-secondary', dot: 'bg-secondary' },
  { bg: 'bg-accent/20', border: 'border-l-accent', text: 'text-accent', dot: 'bg-accent' },
  { bg: 'bg-purple-500/20', border: 'border-l-purple-500', text: 'text-purple-400', dot: 'bg-purple-500' },
  { bg: 'bg-amber-500/20', border: 'border-l-amber-500', text: 'text-amber-400', dot: 'bg-amber-500' },
  { bg: 'bg-rose-500/20', border: 'border-l-rose-500', text: 'text-rose-400', dot: 'bg-rose-500' },
  { bg: 'bg-emerald-500/20', border: 'border-l-emerald-500', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  { bg: 'bg-sky-500/20', border: 'border-l-sky-500', text: 'text-sky-400', dot: 'bg-sky-500' },
];

function getEventColor(eventId: string) {
  let hash = 0;
  for (let i = 0; i < eventId.length; i++) {
    hash = eventId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return eventColors[Math.abs(hash) % eventColors.length];
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface EventCalendarProps {
  events: Event[];
  tvs: TV[];
  onCreateEvent: (date: Date) => void;
  onEditEvent: (event: Event) => void;
  onDeleteEvent: (eventId: string) => void;
}

export function EventCalendar({
  events,
  tvs,
  onCreateEvent,
  onEditEvent,
  onDeleteEvent,
}: EventCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Build calendar grid days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  // Map events by date for quick lookup
  const eventsByDate = useMemo(() => {
    const map = new Map<string, Event[]>();
    events.forEach((event) => {
      const start = parseISO(event.startDateTime);
      const key = format(start, 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    });
    // Sort events within each day by start time
    map.forEach((dayEvents) => {
      dayEvents.sort(
        (a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
      );
    });
    return map;
  }, [events]);

  // Events for selected date (sidebar)
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, 'yyyy-MM-dd');
    return eventsByDate.get(key) || [];
  }, [selectedDate, eventsByDate]);

  const goToPrevMonth = useCallback(() => setCurrentMonth((m) => subMonths(m, 1)), []);
  const goToNextMonth = useCallback(() => setCurrentMonth((m) => addMonths(m, 1)), []);
  const goToToday = useCallback(() => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  }, []);

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
  };

  const handleDayDoubleClick = (day: Date) => {
    onCreateEvent(day);
  };

  const getEventStatus = (event: Event) => {
    const now = new Date();
    const start = new Date(event.startDateTime);
    const end = new Date(event.endDateTime);
    if (now < start) return 'upcoming';
    if (now >= start && now <= end) return 'active';
    return 'past';
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Calendar Grid */}
      <div className="flex-1 glass-card p-6">
        {/* Header with navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="text-xs"
            >
              Hoje
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevMonth}
              className="h-8 w-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextMonth}
              className="h-8 w-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-muted-foreground py-2 uppercase tracking-wider"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 border border-border/30 rounded-lg overflow-hidden">
          {calendarDays.map((day, index) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayEvents = eventsByDate.get(dateKey) || [];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isDayToday = isToday(day);
            const maxVisible = 3;
            const hiddenCount = dayEvents.length - maxVisible;

            return (
              <div
                key={index}
                onClick={() => handleDayClick(day)}
                onDoubleClick={() => handleDayDoubleClick(day)}
                className={`
                  min-h-[100px] p-1.5 border-b border-r border-border/20 cursor-pointer
                  transition-all duration-150 group relative
                  ${!isCurrentMonth ? 'bg-muted/10' : 'hover:bg-muted/20'}
                  ${isSelected ? 'bg-primary/10 ring-1 ring-primary/30 ring-inset' : ''}
                `}
              >
                {/* Day number */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`
                      text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                      ${isDayToday ? 'bg-primary text-primary-foreground font-bold' : ''}
                      ${!isCurrentMonth ? 'text-muted-foreground/40' : 'text-foreground'}
                      ${isSelected && !isDayToday ? 'bg-primary/20 text-primary' : ''}
                    `}
                  >
                    {format(day, 'd')}
                  </span>
                  {/* Quick add button on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreateEvent(day);
                    }}
                    className="w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-primary/20 hover:bg-primary/40 text-primary"
                    title="Criar evento"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Events */}
                <div className="space-y-0.5">
                  <TooltipProvider delayDuration={200}>
                    {dayEvents.slice(0, maxVisible).map((event) => {
                      const color = getEventColor(event.id);
                      const status = getEventStatus(event);
                      return (
                        <Tooltip key={event.id}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditEvent(event);
                              }}
                              className={`
                                w-full text-left px-1.5 py-0.5 rounded-sm text-[11px] font-medium
                                border-l-2 truncate block transition-all
                                hover:brightness-125
                                ${color.bg} ${color.border} ${color.text}
                                ${status === 'past' ? 'opacity-50' : ''}
                                ${status === 'active' ? 'ring-1 ring-accent/30' : ''}
                              `}
                            >
                              <span className="flex items-center gap-1">
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${color.dot} ${status === 'active' ? 'animate-pulse' : ''}`} />
                                <span className="truncate">
                                  {format(parseISO(event.startDateTime), 'HH:mm')} {event.name}
                                </span>
                              </span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="right"
                            className="glass-card-strong border-border p-3 max-w-[250px]"
                          >
                            <div className="space-y-1.5">
                              <p className="font-semibold text-sm">{event.name}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(parseISO(event.startDateTime), 'HH:mm')} -{' '}
                                {format(parseISO(event.endDateTime), 'HH:mm')}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {event.location}
                              </p>
                              {event.tvIds.length > 0 && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Tv className="w-3 h-3" />
                                  {event.tvIds.length} TV(s)
                                </p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </TooltipProvider>
                  {hiddenCount > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDate(day);
                      }}
                      className="w-full text-left px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      + {hiddenCount} mais
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Clique para selecionar
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            Duplo clique para criar
          </span>
          <span className="flex items-center gap-1.5">
            <Plus className="w-3 h-3" />
            Passe o mouse no dia
          </span>
        </div>
      </div>

      {/* Sidebar - Day Detail */}
      <div className="lg:w-[340px] glass-card p-5 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            {selectedDate ? (
              <>
                <h3 className="text-lg font-bold">
                  {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                </h3>
                <p className="text-sm text-muted-foreground capitalize">
                  {format(selectedDate, 'EEEE', { locale: ptBR })}
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold">Detalhes do Dia</h3>
                <p className="text-sm text-muted-foreground">
                  Selecione um dia no calendário
                </p>
              </>
            )}
          </div>
          {selectedDate && (
            <Button
              size="sm"
              onClick={() => onCreateEvent(selectedDate)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-1" />
              Novo
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1 -mx-2 px-2">
          {!selectedDate ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Clique em um dia para ver os eventos
              </p>
            </div>
          ) : selectedDateEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mb-4">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Nenhum evento neste dia
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCreateEvent(selectedDate)}
                className="text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Criar Evento
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDateEvents.map((event) => {
                const color = getEventColor(event.id);
                const status = getEventStatus(event);
                const eventTVs = tvs.filter((tv) => event.tvIds.includes(tv.id));

                return (
                  <div
                    key={event.id}
                    className={`
                      rounded-lg p-3 border-l-[3px] cursor-pointer 
                      transition-all hover:brightness-110 group
                      ${color.bg} ${color.border}
                      ${status === 'past' ? 'opacity-60' : ''}
                    `}
                    onClick={() => onEditEvent(event)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-semibold text-sm ${color.text} truncate`}>
                          {event.name}
                        </h4>
                        <div className="space-y-1 mt-1.5">
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Clock className="w-3 h-3 flex-shrink-0" />
                            {format(parseISO(event.startDateTime), 'HH:mm')} -{' '}
                            {format(parseISO(event.endDateTime), 'HH:mm')}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            {event.location}
                          </p>
                          {eventTVs.length > 0 && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Tv className="w-3 h-3 flex-shrink-0" />
                              <div className="flex flex-wrap gap-1">
                                {eventTVs.length <= 2 ? (
                                  eventTVs.map((tv) => (
                                    <span key={tv.id} className="chip chip-primary text-[10px] py-0 px-1.5">
                                      {tv.name}
                                    </span>
                                  ))
                                ) : (
                                  <span className="chip chip-primary text-[10px] py-0 px-1.5">
                                    {eventTVs.length} TVs
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Status badge */}
                      <div className="flex flex-col items-end gap-1">
                        {status === 'active' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30 font-medium">
                            Ativo
                          </span>
                        )}
                        {status === 'upcoming' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary/20 text-secondary border border-secondary/30 font-medium">
                            Próximo
                          </span>
                        )}
                        {status === 'past' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border font-medium">
                            Encerrado
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteEvent(event.id);
                          }}
                          className="text-[10px] text-destructive/60 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Day stats */}
        {selectedDate && selectedDateEvents.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/30">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{selectedDateEvents.length} evento(s)</span>
              <span>
                {selectedDateEvents.filter((e) => getEventStatus(e) === 'active').length} ativo(s)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
