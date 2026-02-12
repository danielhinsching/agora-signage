import { useState, useMemo } from 'react';
import { useEvents } from '@/hooks/useEvents';
import { useTVs } from '@/hooks/useTVs';
import { Event } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Plus, Trash2, Edit, MapPin, Clock, Tv, List, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { EventCalendar } from '@/components/admin/EventCalendar';
import { EventFormDialog } from '@/components/admin/EventFormDialog';

// Location color mapping for badges
const locationColors: Record<string, string> = {
  'auditório': 'bg-secondary/20 text-secondary border-secondary/30',
  'recepção': 'bg-primary/20 text-primary border-primary/30',
  'sala': 'bg-accent/20 text-accent border-accent/30',
  'bloco': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'coworking': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'default': 'bg-muted text-muted-foreground border-border',
};

const getLocationColor = (location: string): string => {
  const lowerLocation = location.toLowerCase();
  for (const [key, value] of Object.entries(locationColors)) {
    if (lowerLocation.includes(key)) return value;
  }
  return locationColors.default;
};

const EventsManagement = () => {
  const { events, loading, addEvent, updateEvent, deleteEvent } = useEvents();
  const { tvs } = useTVs();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [defaultDate, setDefaultDate] = useState<Date | undefined>(undefined);

  const handleOpenCreate = (date?: Date) => {
    setEditingEvent(null);
    setDefaultDate(date);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (event: Event) => {
    setEditingEvent(event);
    setDefaultDate(undefined);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (eventData: Omit<Event, 'id' | 'createdAt'>) => {
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, eventData);
      } else {
        await addEvent(eventData);
      }
      setEditingEvent(null);
      setDefaultDate(undefined);
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEvent(id);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const handleDeleteRequest = (eventId: string) => {
    setDeleteConfirm(eventId);
  };

  const getEventStatus = (event: Event) => {
    const now = new Date();
    const start = new Date(event.startDateTime);
    const end = new Date(event.endDateTime);

    if (now < start) return { label: 'Próximo', class: 'bg-secondary/15 text-secondary border border-secondary/25' };
    if (now >= start && now <= end) return { label: 'Ativo', class: 'bg-accent/15 text-accent border border-accent/25' };
    return { label: 'Encerrado', class: 'bg-muted text-muted-foreground border border-border' };
  };

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => 
      new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
    );
  }, [events]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando eventos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestão de Eventos</h1>
          <p className="text-muted-foreground">
            Cadastre e gerencie os eventos da agenda
          </p>
        </div>
        <Button onClick={() => handleOpenCreate()} className="bg-primary hover:bg-primary/90 glow-effect">
          <Plus className="w-4 h-4 mr-2" />
          Novo Evento
        </Button>
      </div>

      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList className="bg-muted/50 border border-border/30">
          <TabsTrigger value="calendar" className="flex items-center gap-2 data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
            <CalendarDays className="w-4 h-4" />
            Agenda
          </TabsTrigger>
          <TabsTrigger value="table" className="flex items-center gap-2 data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
            <List className="w-4 h-4" />
            Lista
          </TabsTrigger>
        </TabsList>

        {/* Calendar View */}
        <TabsContent value="calendar" className="mt-0">
          <EventCalendar
            events={events}
            tvs={tvs}
            onCreateEvent={handleOpenCreate}
            onEditEvent={handleOpenEdit}
            onDeleteEvent={handleDeleteRequest}
          />
        </TabsContent>

        {/* Table View */}
        <TabsContent value="table" className="mt-0">
          {events.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 rounded-2xl bg-secondary/10 flex items-center justify-center mb-6">
                  <Calendar className="w-10 h-10 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Nenhum evento cadastrado</h3>
                <p className="text-muted-foreground mb-6 text-center max-w-md">
                  Comece cadastrando um evento para exibir na agenda das TVs do parque
                </p>
                <Button onClick={() => handleOpenCreate()} className="bg-primary hover:bg-primary/90 glow-effect">
                  <Plus className="w-4 h-4 mr-2" />
                  Cadastrar Primeiro Evento
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="glass-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-semibold">Evento</TableHead>
                    <TableHead className="text-muted-foreground font-semibold">Local</TableHead>
                    <TableHead className="text-muted-foreground font-semibold">Data</TableHead>
                    <TableHead className="text-muted-foreground font-semibold">Horário</TableHead>
                    <TableHead className="text-muted-foreground font-semibold">TVs</TableHead>
                    <TableHead className="text-muted-foreground font-semibold">Status</TableHead>
                    <TableHead className="text-muted-foreground font-semibold text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedEvents.map((event, index) => {
                    const status = getEventStatus(event);
                    const eventTVs = tvs.filter((tv) => event.tvIds.includes(tv.id));
                    const startDT = new Date(event.startDateTime);
                    const endDT = new Date(event.endDateTime);

                    return (
                      <TableRow
                        key={event.id}
                        className="border-border/30 hover:bg-muted/30 fade-in-up"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <TableCell className="font-medium">{event.name}</TableCell>
                        <TableCell>
                          <span className={`badge-location border ${getLocationColor(event.location)}`}>
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(startDT, "dd MMM yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-sm">
                          {format(startDT, 'HH:mm')} - {format(endDT, 'HH:mm')}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[150px]">
                            {eventTVs.length === 0 ? (
                              <span className="text-xs text-muted-foreground">Nenhuma</span>
                            ) : eventTVs.length <= 2 ? (
                              eventTVs.map((tv) => (
                                <span key={tv.id} className="chip chip-primary text-xs py-0.5 px-2">
                                  {tv.name}
                                </span>
                              ))
                            ) : (
                              <span className="chip chip-primary text-xs py-0.5 px-2">
                                {eventTVs.length} TVs
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${status.class}`}>
                            {status.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                              onClick={() => handleOpenEdit(event)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => setDeleteConfirm(event.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Event Form Dialog (shared by both views) */}
      <EventFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingEvent={editingEvent}
        tvs={tvs}
        onSubmit={handleSubmit}
        defaultDate={defaultDate}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="glass-card-strong border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EventsManagement;
