import { useState, useEffect, useMemo } from 'react';
import { Event, TV, PROFESSIONAL_TAGS } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tv, X, Plus, CheckSquare, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { DateTimePicker } from './DateTimePicker';

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
    startDateTime: undefined as Date | undefined,
    endDateTime: undefined as Date | undefined,
    tvIds: [] as string[],
    tags: [] as string[],
  });

  // Reset/populate form when dialog opens
  useEffect(() => {
    if (!open) return;

    if (editingEvent) {
      setFormData({
        name: editingEvent.name,
        location: editingEvent.location,
        startDateTime: new Date(editingEvent.startDateTime),
        endDateTime: new Date(editingEvent.endDateTime),
        tvIds: editingEvent.tvIds,
        tags: editingEvent.tags || [],
      });
    } else {
      const startDate = defaultDate ? new Date(defaultDate) : new Date();
      startDate.setHours(9, 0, 0, 0);
      
      const endDate = new Date(startDate);
      endDate.setHours(10, 0, 0, 0);
      
      setFormData({
        name: '',
        location: '',
        startDateTime: startDate,
        endDateTime: endDate,
        tvIds: [],
        tags: [],
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

  const handleTagToggle = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.startDateTime || !formData.endDateTime) {
      toast.error('Selecione a data e hora de início e término.');
      return;
    }

    if (formData.endDateTime <= formData.startDateTime) {
      toast.error('A data/hora de término deve ser posterior ao início.');
      return;
    }

    onSubmit({
      name: formData.name,
      location: formData.location,
      startDateTime: formData.startDateTime.toISOString(),
      endDateTime: formData.endDateTime.toISOString(),
      tvIds: formData.tvIds,
      tags: formData.tags,
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

          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" />
              Áreas Profissionais
            </Label>
            <div className="flex flex-wrap gap-2">
              {PROFESSIONAL_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    formData.tags.includes(tag)
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <DateTimePicker
              value={formData.startDateTime}
              onChange={(date) => setFormData((prev) => ({ ...prev, startDateTime: date }))}
              label="Início"
              showPast={!!editingEvent}
            />
            <DateTimePicker
              value={formData.endDateTime}
              onChange={(date) => setFormData((prev) => ({ ...prev, endDateTime: date }))}
              label="Término"
              showPast={!!editingEvent}
            />
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
