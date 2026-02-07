import { useState, useMemo } from 'react';
import { useEvents } from '@/hooks/useEvents';
import { useTVs } from '@/hooks/useTVs';
import { Event } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Calendar, Plus, Trash2, Edit, MapPin, Clock, Tv, X, CheckSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

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
  const { events, addEvent, updateEvent, deleteEvent } = useEvents();
  const { tvs } = useTVs();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    tvIds: [] as string[],
  });

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      tvIds: [],
    });
    setEditingEvent(null);
  };

  const handleOpenDialog = (event?: Event) => {
    if (event) {
      setEditingEvent(event);
      const startDT = new Date(event.startDateTime);
      const endDT = new Date(event.endDateTime);
      setFormData({
        name: event.name,
        location: event.location,
        startDate: format(startDT, 'yyyy-MM-dd'),
        startTime: format(startDT, 'HH:mm'),
        endDate: format(endDT, 'yyyy-MM-dd'),
        endTime: format(endDT, 'HH:mm'),
        tvIds: event.tvIds,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleTVToggle = (tvId: string) => {
    setFormData((prev) => ({
      ...prev,
      tvIds: prev.tvIds.includes(tvId)
        ? prev.tvIds.filter((id) => id !== tvId)
        : [...prev.tvIds, tvId],
    }));
  };

  const handleSelectAllTVs = () => {
    const allSelected = formData.tvIds.length === tvs.length;
    setFormData((prev) => ({
      ...prev,
      tvIds: allSelected ? [] : tvs.map((tv) => tv.id),
    }));
  };

  const handleRemoveTV = (tvId: string) => {
    setFormData((prev) => ({
      ...prev,
      tvIds: prev.tvIds.filter((id) => id !== tvId),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

    if (endDateTime <= startDateTime) {
      toast.error('A data/hora de término deve ser posterior ao início.');
      return;
    }

    const eventData = {
      name: formData.name,
      location: formData.location,
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
      tvIds: formData.tvIds,
    };

    if (editingEvent) {
      updateEvent(editingEvent.id, eventData);
      toast.success('Evento atualizado com sucesso!');
    } else {
      addEvent(eventData);
      toast.success('Evento cadastrado com sucesso!');
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    deleteEvent(id);
    setDeleteConfirm(null);
    toast.success('Evento removido com sucesso!');
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

  const selectedTVs = useMemo(() => {
    return tvs.filter((tv) => formData.tvIds.includes(tv.id));
  }, [tvs, formData.tvIds]);

  const unselectedTVs = useMemo(() => {
    return tvs.filter((tv) => !formData.tvIds.includes(tv.id));
  }, [tvs, formData.tvIds]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestão de Eventos</h1>
          <p className="text-muted-foreground">
            Cadastre e gerencie os eventos da agenda
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-primary/90 glow-effect">
              <Plus className="w-4 h-4 mr-2" />
              Novo Evento
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card-strong border-border max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-xl">{editingEvent ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Nome do Evento</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Workshop de Inovação"
                  className="bg-input/50 border-border/50 focus:border-primary"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Local</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="Ex: Auditório Principal"
                  className="bg-input/50 border-border/50 focus:border-primary"
                  required
                />
              </div>

              {/* Date and Time Fields - Split into 4 fields */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      Data Início
                    </Label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                      className="bg-input/50 border-border/50 focus:border-primary"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      Horário Início
                    </Label>
                    <Input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                      className="bg-input/50 border-border/50 focus:border-primary"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-secondary" />
                      Data Término
                    </Label>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                      className="bg-input/50 border-border/50 focus:border-primary"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4 text-secondary" />
                      Horário Término
                    </Label>
                    <Input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
                      className="bg-input/50 border-border/50 focus:border-primary"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* TV Selection with Chips */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Tv className="w-4 h-4 text-accent" />
                    Exibir nas TVs
                  </Label>
                  {tvs.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAllTVs}
                      className="text-xs text-primary hover:text-primary/80"
                    >
                      <CheckSquare className="w-3 h-3 mr-1" />
                      {formData.tvIds.length === tvs.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
                    </Button>
                  )}
                </div>

                {tvs.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-3 text-center bg-muted/30 rounded-lg">
                    Nenhuma TV cadastrada. Cadastre uma TV primeiro.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {/* Selected TVs as chips */}
                    {selectedTVs.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedTVs.map((tv) => (
                          <span
                            key={tv.id}
                            className="chip chip-primary group cursor-pointer"
                            onClick={() => handleRemoveTV(tv.id)}
                          >
                            <Tv className="w-3 h-3" />
                            {tv.name}
                            <X className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Available TVs to select */}
                    {unselectedTVs.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-3 bg-muted/20 rounded-lg border border-border/30">
                        <span className="text-xs text-muted-foreground w-full mb-1">Clique para adicionar:</span>
                        {unselectedTVs.map((tv) => (
                          <span
                            key={tv.id}
                            className="chip chip-muted cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
                            onClick={() => handleTVToggle(tv.id)}
                          >
                            <Plus className="w-3 h-3" />
                            {tv.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
                  {editingEvent ? 'Salvar Alterações' : 'Cadastrar Evento'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
            <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-primary/90 glow-effect">
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
                          onClick={() => handleOpenDialog(event)}
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
