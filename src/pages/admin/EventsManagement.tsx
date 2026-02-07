import { useState } from 'react';
import { useEvents } from '@/hooks/useEvents';
import { useTVs } from '@/hooks/useTVs';
import { Event } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Plus, Trash2, Edit, MapPin, Clock, Tv } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const EventsManagement = () => {
  const { events, addEvent, updateEvent, deleteEvent } = useEvents();
  const { tvs } = useTVs();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    startDateTime: '',
    endDateTime: '',
    tvIds: [] as string[],
  });

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      startDateTime: '',
      endDateTime: '',
      tvIds: [],
    });
    setEditingEvent(null);
  };

  const handleOpenDialog = (event?: Event) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        name: event.name,
        location: event.location,
        startDateTime: event.startDateTime.slice(0, 16),
        endDateTime: event.endDateTime.slice(0, 16),
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (new Date(formData.endDateTime) <= new Date(formData.startDateTime)) {
      toast.error('A data de término deve ser posterior à data de início.');
      return;
    }

    const eventData = {
      name: formData.name,
      location: formData.location,
      startDateTime: new Date(formData.startDateTime).toISOString(),
      endDateTime: new Date(formData.endDateTime).toISOString(),
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

    if (now < start) return { label: 'Próximo', class: 'bg-secondary/10 text-secondary' };
    if (now >= start && now <= end) return { label: 'Ativo', class: 'bg-accent/10 text-accent' };
    return { label: 'Encerrado', class: 'bg-muted text-muted-foreground' };
  };

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
            <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Novo Evento
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingEvent ? 'Editar Evento' : 'Cadastrar Novo Evento'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Evento</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Workshop de Inovação"
                  className="bg-muted/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Local</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="Ex: Auditório Principal"
                  className="bg-muted/50"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Início</Label>
                  <Input
                    type="datetime-local"
                    value={formData.startDateTime}
                    onChange={(e) => setFormData((prev) => ({ ...prev, startDateTime: e.target.value }))}
                    className="bg-muted/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Término</Label>
                  <Input
                    type="datetime-local"
                    value={formData.endDateTime}
                    onChange={(e) => setFormData((prev) => ({ ...prev, endDateTime: e.target.value }))}
                    className="bg-muted/50"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Exibir nas TVs</Label>
                {tvs.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    Nenhuma TV cadastrada. Cadastre uma TV primeiro.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-muted/30 rounded-lg">
                    {tvs.map((tv) => (
                      <label
                        key={tv.id}
                        className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer"
                      >
                        <Checkbox
                          checked={formData.tvIds.includes(tv.id)}
                          onCheckedChange={() => handleTVToggle(tv.id)}
                        />
                        <span className="text-sm">{tv.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
                  {editingEvent ? 'Salvar' : 'Cadastrar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {events.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum evento cadastrado</h3>
            <p className="text-muted-foreground mb-4">
              Comece cadastrando um evento para a agenda
            </p>
            <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Primeiro Evento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {events
            .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
            .map((event, index) => {
              const status = getEventStatus(event);
              const eventTVs = tvs.filter((tv) => event.tvIds.includes(tv.id));

              return (
                <Card
                  key={event.id}
                  className="glass-card fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-4 flex-1">
                        <div className="w-14 h-14 rounded-xl bg-secondary/10 flex flex-col items-center justify-center">
                          <span className="text-lg font-bold text-secondary">
                            {format(new Date(event.startDateTime), 'dd')}
                          </span>
                          <span className="text-xs text-muted-foreground uppercase">
                            {format(new Date(event.startDateTime), 'MMM', { locale: ptBR })}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold">{event.name}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${status.class}`}>
                              {status.label}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {event.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {format(new Date(event.startDateTime), 'HH:mm')} -{' '}
                              {format(new Date(event.endDateTime), 'HH:mm')}
                            </span>
                          </div>
                          {eventTVs.length > 0 && (
                            <div className="flex items-center gap-2 mt-2">
                              <Tv className="w-4 h-4 text-primary" />
                              <div className="flex flex-wrap gap-1">
                                {eventTVs.map((tv) => (
                                  <span
                                    key={tv.id}
                                    className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary"
                                  >
                                    {tv.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="icon" variant="outline" onClick={() => handleOpenDialog(event)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
                          onClick={() => setDeleteConfirm(event.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-card border-border">
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
