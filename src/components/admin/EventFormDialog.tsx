import { useState, useEffect, useMemo } from 'react';
import { Event, TV } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar as IconCalendar, Clock, Tv, X, Plus, CheckSquare } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingEvent: Event | null;
  tvs: TV[];
  onSubmit: (eventData: Omit<Event, 'id' | 'createdAt'>) => void;
  /** Pre-fill date when creating from calendar click */
  defaultDate?: Date;
}

export function EventFormDialog({
  open,
  onOpenChange,
  editingEvent,
  tvs,
  onSubmit,
  defaultDate,
}: EventFormDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    tvIds: [] as string[],
  });

  // Reset/populate form when dialog opens
  useEffect(() => {
    if (!open) return;

    if (editingEvent) {
      const startDT = new Date(editingEvent.startDateTime);
      const endDT = new Date(editingEvent.endDateTime);
      setFormData({
        name: editingEvent.name,
        location: editingEvent.location,
        startDate: format(startDT, 'yyyy-MM-dd'),
        startTime: format(startDT, 'HH:mm'),
        endDate: format(endDT, 'yyyy-MM-dd'),
        endTime: format(endDT, 'HH:mm'),
        tvIds: editingEvent.tvIds,
      });
    } else {
      const dateStr = defaultDate ? format(defaultDate, 'yyyy-MM-dd') : '';
      setFormData({
        name: '',
        location: '',
        startDate: dateStr,
        startTime: '09:00',
        endDate: dateStr,
        endTime: '10:00',
        tvIds: [],
      });
    }
  }, [open, editingEvent, defaultDate]);

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

    onSubmit({
      name: formData.name,
      location: formData.location,
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
      tvIds: formData.tvIds,
    });

    onOpenChange(false);
  };

  const selectedTVs = useMemo(() => {
    return tvs.filter((tv) => formData.tvIds.includes(tv.id));
  }, [tvs, formData.tvIds]);

  const unselectedTVs = useMemo(() => {
    return tvs.filter((tv) => !formData.tvIds.includes(tv.id));
  }, [tvs, formData.tvIds]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card-strong border-border max-w-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {editingEvent ? 'Editar Evento' : 'Novo Evento'}
          </DialogTitle>
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

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <IconCalendar className="w-4 h-4 text-primary" />
                  Data Início
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      {formData.startDate
                        ? format(new Date(`${formData.startDate}T00:00:00`), 'dd/MM/yyyy')
                        : 'Selecione a data'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <Calendar
                      mode="single"
                      selected={formData.startDate ? new Date(`${formData.startDate}T00:00:00`) : undefined}
                      onSelect={(date: Date | undefined) => {
                        if (date) setFormData((prev) => ({ ...prev, startDate: format(date, 'yyyy-MM-dd') }));
                      }}
                    />
                  </PopoverContent>
                </Popover>
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
                  <IconCalendar className="w-4 h-4 text-secondary" />
                  Data Término
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      {formData.endDate
                        ? format(new Date(`${formData.endDate}T00:00:00`), 'dd/MM/yyyy')
                        : 'Selecione a data'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <Calendar
                      mode="single"
                      selected={formData.endDate ? new Date(`${formData.endDate}T00:00:00`) : undefined}
                      onSelect={(date: Date | undefined) => {
                        if (date) setFormData((prev) => ({ ...prev, endDate: format(date, 'yyyy-MM-dd') }));
                      }}
                    />
                  </PopoverContent>
                </Popover>
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
              {editingEvent ? 'Salvar Alterações' : 'Cadastrar Evento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
