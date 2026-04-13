import { useCallback, useMemo, useState, useEffect } from "react";
import { Event, TV, PROFESSIONAL_TAGS } from "@/types";
import { useLocais, formatLocalDisplay } from "@/hooks/useLocais";
import { usePersistentForm } from "@/hooks/usePersistentForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tv, X, Plus, CheckSquare, Tag, MapPin, Building2, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { DateTimePicker } from "./DateTimePicker";
import { format, addDays, startOfDay, isSameDay, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingEvent: Event | null;
  seriesEvents?: Event[];
  tvs: TV[];
  onSubmit: (eventData: Omit<Event, "id" | "createdAt"> | Omit<Event, "id" | "createdAt">[]) => void;
  defaultDate?: Date;
}

interface DaySchedule {
  key: string;
  date: Date;
  startDateTime: Date;
  endDateTime: Date;
  enabled: boolean;
}

export function EventFormDialog({
  open,
  onOpenChange,
  editingEvent,
  seriesEvents,
  tvs,
  onSubmit,
  defaultDate,
}: EventFormDialogProps) {
  const { locais, addLocal, isLocalUnique } = useLocais();
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);

  const [showNewLocalForm, setShowNewLocalForm] = useState(false);
  const [newLocalData, setNewLocalData] = useState({
    nome: "",
    predio: "",
    descricao: "",
  });

  const [daySchedules, setDaySchedules] = useState<DaySchedule[]>([]);
  const [applySameTime, setApplySameTime] = useState(true);

  const initialFormData = useMemo(() => {
    if (seriesEvents && seriesEvents.length > 0) {
      const sortedByStart = [...seriesEvents].sort((a,b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
      const first = sortedByStart[0];
      const sortedByEnd = [...seriesEvents].sort((a,b) => new Date(b.endDateTime).getTime() - new Date(a.endDateTime).getTime());
      const last = sortedByEnd[0];
      
      return {
        name: first.name || "",
        location: first.location || "",
        startDateTime: new Date(first.startDateTime),
        endDateTime: new Date(last.endDateTime),
        tvIds: Array.isArray(first.tvIds) ? first.tvIds : [],
        tags: Array.isArray(first.tags) ? first.tags : [],
      };
    }

    if (editingEvent) {
      return {
        name: editingEvent.name || "",
        location: editingEvent.location || "",
        startDateTime: new Date(editingEvent.startDateTime),
        endDateTime: new Date(editingEvent.endDateTime),
        tvIds: Array.isArray(editingEvent.tvIds) ? editingEvent.tvIds : [],
        tags: Array.isArray(editingEvent.tags) ? editingEvent.tags : [],
      };
    }

    const startDate = defaultDate && isValid(new Date(defaultDate)) ? new Date(defaultDate) : new Date();
    startDate.setHours(9, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setHours(10, 0, 0, 0);

    return {
      name: "",
      location: "",
      startDateTime: startDate,
      endDateTime: endDate,
      tvIds: [],
      tags: [],
    };
  }, [editingEvent, seriesEvents, defaultDate]);

  const draftKey = editingEvent
    ? `form_evento_draft_edit_${editingEvent.id}`
    : seriesEvents 
      ? `form_evento_draft_edit_series_${seriesEvents[0]?.groupId}` 
      : "form_evento_draft_new";

  const serializeEventDraft = useCallback((value: any) => ({
    ...value,
    startDateTime: value?.startDateTime && isValid(value.startDateTime) ? value.startDateTime.toISOString() : null,
    endDateTime: value?.endDateTime && isValid(value.endDateTime) ? value.endDateTime.toISOString() : null,
  }), []);

  const deserializeEventDraft = useCallback((value: any) => {
    if (!value) return initialFormData;
    
    const sDate = value.startDateTime ? new Date(value.startDateTime) : undefined;
    const eDate = value.endDateTime ? new Date(value.endDateTime) : undefined;

    return {
      name: value.name || "",
      location: value.location || "",
      startDateTime: sDate && isValid(sDate) ? sDate : undefined,
      endDateTime: eDate && isValid(eDate) ? eDate : undefined,
      tvIds: Array.isArray(value.tvIds) ? value.tvIds : [],
      tags: Array.isArray(value.tags) ? value.tags : [],
    };
  }, [initialFormData]);

  const { formData, setFormData, hasUnsavedChanges, clearDraft, discardChanges } = usePersistentForm({
    storageKey: draftKey,
    initialValue: initialFormData,
    isOpen: open,
    serialize: serializeEventDraft,
    deserialize: deserializeEventDraft,
  });

  const validStart = formData?.startDateTime && isValid(formData.startDateTime);
  const validEnd = formData?.endDateTime && isValid(formData.endDateTime);

  const isMultiDayDetected = validStart && validEnd && 
    !isSameDay(formData.startDateTime, formData.endDateTime) && !editingEvent;

  const isEditingSeries = !!(seriesEvents && seriesEvents.length > 0);
  const showMultiDayPanel = isMultiDayDetected || isEditingSeries;

  useEffect(() => {
    if (!showMultiDayPanel || !validStart || !validEnd) return;
    
    // Safety break against too long loops
    if (!isEditingSeries && Math.abs(formData.endDateTime.getTime() - formData.startDateTime.getTime()) > 1000 * 60 * 60 * 24 * 365) {
        return; // Prevent huge loops
    }

    if (isEditingSeries && seriesEvents && daySchedules.length === 0) {
      const mapping = seriesEvents.map((evt, i) => ({
        key: `series-${i}`,
        date: startOfDay(new Date(evt.startDateTime)),
        startDateTime: new Date(evt.startDateTime),
        endDateTime: new Date(evt.endDateTime),
        enabled: true,
      }));
      setDaySchedules(mapping);
      return;
    }

    if (!isEditingSeries) {
      const days = [];
      let current = startOfDay(formData.startDateTime);
      const end = startOfDay(formData.endDateTime);
      let dayIndex = 0;

      while (current <= end) {
        const start = new Date(current);
        start.setHours(formData.startDateTime.getHours(), formData.startDateTime.getMinutes());
        
        const endDay = new Date(current);
        endDay.setHours(formData.endDateTime.getHours(), formData.endDateTime.getMinutes());
        if (endDay < start) {
            endDay.setDate(endDay.getDate() + 1);
        }

        const existing = daySchedules.find(ds => isSameDay(ds.date, current));
        if (existing) {
          if (applySameTime) {
              existing.startDateTime = start;
              existing.endDateTime = endDay;
          }
          days.push(existing);
        } else {
          days.push({
            key: `auto-${dayIndex}`,
            date: current,
            startDateTime: start,
            endDateTime: endDay,
            enabled: true,
          });
        }
        current = addDays(current, 1);
        dayIndex++;
      }
      
      let structureDiff = days.length !== daySchedules.length;
      if (!structureDiff && days.length > 0 && daySchedules.length > 0) {
          if (!isSameDay(days[0].date, daySchedules[0].date) || !isSameDay(days[days.length-1].date, daySchedules[daySchedules.length-1].date)) {
              structureDiff = true;
          }
      }

      if (structureDiff) {
        setDaySchedules(days);
      } else if (applySameTime) {
        // Find if time actually changed to avoid loop
        let timesChanged = false;
        for (let i = 0; i < days.length; i++) {
           if (days[i].startDateTime.getTime() !== daySchedules[i]?.startDateTime.getTime() ||
               days[i].endDateTime.getTime() !== daySchedules[i]?.endDateTime.getTime()) {
               timesChanged = true;
               break;
           }
        }
        if (timesChanged) {
           setDaySchedules(days);
        }
      }
    }
  }, [formData.startDateTime, formData.endDateTime, isEditingSeries, showMultiDayPanel, applySameTime]);

  const closeDialog = () => {
    onOpenChange(false);
    setShowNewLocalForm(false);
    setNewLocalData({ nome: "", predio: "", descricao: "" });
    setDaySchedules([]);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }

    if (hasUnsavedChanges) {
      setConfirmDiscardOpen(true);
      return;
    }

    closeDialog();
  };

  const handleAddLocal = async () => {
    const nome = newLocalData.nome.trim();
    const predio = newLocalData.predio.trim();
    const descricao = newLocalData.descricao.trim();

    if (!nome || !predio) {
      toast.error("Preencha nome da sala e prédio.");
      return;
    }

    if (!isLocalUnique(nome, predio)) {
      toast.error("Esse local já existe.");
      return;
    }

    try {
      const created = await addLocal({ nome, predio, descricao });
      setFormData((prev: any) => ({ ...prev, location: formatLocalDisplay(created) }));
      setShowNewLocalForm(false);
      setNewLocalData({ nome: "", predio: "", descricao: "" });
    } catch (error) {
      console.error("Error adding local:", error);
    }
  };

  const handleTVToggle = (tvId: string) => {
    setFormData((prev: any) => ({
      ...prev,
      tvIds: Array.isArray(prev?.tvIds) ? (prev.tvIds.includes(tvId)
        ? prev.tvIds.filter((id: string) => id !== tvId)
        : [...prev.tvIds, tvId]) : [tvId],
    }));
  };

  const handleSelectAllTVs = () => {
    const allSelected = Array.isArray(formData?.tvIds) && formData.tvIds.length === tvs.length;
    setFormData((prev: any) => ({
      ...prev,
      tvIds: allSelected ? [] : tvs.map((tv) => tv.id),
    }));
  };

  const handleRemoveTV = (tvId: string) => {
    setFormData((prev: any) => ({
      ...prev,
      tvIds: Array.isArray(prev?.tvIds) ? prev.tvIds.filter((id: string) => id !== tvId) : [],
    }));
  };

  const handleTagToggle = (tag: string) => {
    setFormData((prev: any) => {
      const prevTags = Array.isArray(prev?.tags) ? prev.tags : [];
      if (!prevTags.includes(tag) && prevTags.length >= 3) return prev;
      return {
        ...prev,
        tags: prevTags.includes(tag)
          ? prevTags.filter((t: string) => t !== tag)
          : [...prevTags, tag],
      };
    });
  };

  const handleDayTimeChange = (index: number, type: 'start' | 'end', timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    setDaySchedules(prev => {
      const next = [...prev];
      const targetDate = new Date(next[index][type === 'start' ? 'startDateTime' : 'endDateTime']);
      targetDate.setHours(hours, minutes);
      next[index] = { ...next[index], [type === 'start' ? 'startDateTime' : 'endDateTime']: targetDate };
      
      if (applySameTime) {
         return next.map(schedule => {
            const scDate = new Date(schedule[type === 'start' ? 'startDateTime' : 'endDateTime']);
            scDate.setHours(hours, minutes);
            return {
                ...schedule,
                [type === 'start' ? 'startDateTime' : 'endDateTime']: scDate
            }
         });
      }
      return next;
    });
  };

  const handleDayToggle = (index: number) => {
    setDaySchedules(prev => {
        const next = [...prev];
        next[index] = { ...next[index], enabled: !next[index].enabled };
        return next;
    });
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validStart || !validEnd) {
      toast.error("Selecione a data e hora de início e término.");
      return;
    }

    if (!formData.location) {
      toast.error("Selecione um local.");
      return;
    }

    const baseEvent = {
        name: formData.name || "",
        location: formData.location || "",
        tvIds: formData.tvIds || [],
        tags: formData.tags || [],
    };

    if (showMultiDayPanel) {
        const enabledDays = daySchedules.filter(d => d.enabled);
        if (enabledDays.length === 0) {
            toast.error("Selecione pelo menos um dia ativo para o evento multidias.");
            return;
        }

        const minEndDateTime = new Date(enabledDays[0].startDateTime.getTime() + 60 * 60 * 1000);
        if (enabledDays[0].endDateTime < minEndDateTime) {
            toast.error("O término no primeiro dia ativo deve ser pelo menos 1 hora após o início.");
            return;
        }

        const eventsToCreate = enabledDays.map(d => ({
            ...baseEvent,
            startDateTime: d.startDateTime.toISOString(),
            endDateTime: d.endDateTime.toISOString(),
        }));
        onSubmit(eventsToCreate);

    } else {
        const minEndDateTime = new Date(formData.startDateTime.getTime() + 60 * 60 * 1000);

        if (formData.endDateTime < minEndDateTime) {
        toast.error("O término deve ser pelo menos 1 hora após o início.");
        return;
        }

        onSubmit({
            ...baseEvent,
            startDateTime: formData.startDateTime.toISOString(),
            endDateTime: formData.endDateTime.toISOString(),
        });
    }

    clearDraft();
    discardChanges();
    closeDialog();
  };

  const selectedTVs = useMemo(() => Array.isArray(formData?.tvIds) ? tvs.filter((tv) => formData.tvIds.includes(tv.id)) : [], [tvs, formData?.tvIds]);
  const unselectedTVs = useMemo(() => Array.isArray(formData?.tvIds) ? tvs.filter((tv) => !formData.tvIds.includes(tv.id)) : tvs, [tvs, formData?.tvIds]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="glass-card-strong border-border max-w-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-xl flex gap-2 items-center">
            {isEditingSeries ? "Editar Evento Multidias" : editingEvent ? "Editar Evento" : "Novo Evento"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Nome do Evento</Label>
            <Input
              value={formData?.name || ""}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Workshop de Inovação"
              className="bg-input/50 border-border/50 focus:border-primary"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Local / Sala
            </Label>
            <Select
              value={formData?.location || ""}
              onValueChange={(val) => {
                if (val === "__new__") {
                  setShowNewLocalForm(true);
                } else {
                  setFormData((prev: any) => ({ ...prev, location: val }));
                  setShowNewLocalForm(false);
                }
              }}
            >
              <SelectTrigger className="bg-input/50 border-border/50">
                <SelectValue placeholder="Selecione um local" />
              </SelectTrigger>
              <SelectContent>
                {locais.map((local) => {
                  const display = formatLocalDisplay(local);
                  return (
                    <SelectItem key={local.id} value={display}>
                      {display}
                    </SelectItem>
                  );
                })}
                {formData?.location &&
                  !locais.some((local) => formatLocalDisplay(local) === formData.location) && (
                  <SelectItem value={formData.location}>
                    {formData.location}
                  </SelectItem>
                )}
                <SelectItem value="__new__">
                  <span className="flex items-center gap-2 text-primary font-medium">
                    <Plus className="w-3 h-3" />
                    + Adicionar novo local
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

            {showNewLocalForm && (
              <div className="space-y-2 mt-2 p-3 rounded-lg border border-border/50 bg-muted/20">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Building2 className="w-4 h-4 text-primary" />
                  Novo Local
                </div>
                <Input
                  value={newLocalData.nome}
                  onChange={(e) =>
                    setNewLocalData((prev) => ({ ...prev, nome: e.target.value }))
                  }
                  placeholder="Nome da sala (ex: Sala 101)"
                  className="bg-input/50 border-border/50"
                />
                <Input
                  value={newLocalData.predio}
                  onChange={(e) =>
                    setNewLocalData((prev) => ({ ...prev, predio: e.target.value }))
                  }
                  placeholder="Prédio (ex: Prédio A)"
                  className="bg-input/50 border-border/50"
                />
                <Textarea
                  value={newLocalData.descricao}
                  onChange={(e) =>
                    setNewLocalData((prev) => ({ ...prev, descricao: e.target.value }))
                  }
                  placeholder="Descrição (opcional)"
                  className="bg-input/50 border-border/50"
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={handleAddLocal} className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-1" />
                    Salvar Local
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowNewLocalForm(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" />
              Áreas Profissionais
              <span className={`text-xs font-normal ml-auto ${(formData?.tags?.length || 0) >= 3 ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                {formData?.tags?.length || 0}/3 selecionadas
              </span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {PROFESSIONAL_TAGS.map((tag) => {
                const isSelected = Array.isArray(formData?.tags) && formData.tags.includes(tag);
                const isDisabled = !isSelected && Array.isArray(formData?.tags) && formData.tags.length >= 3;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    disabled={isDisabled}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-md"
                        : isDisabled
                          ? "bg-muted/40 text-muted-foreground/40 cursor-not-allowed opacity-40"
                          : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <DateTimePicker
                        value={formData?.startDateTime}
                        onChange={(date) =>
                            setFormData((prev: any) => ({
                            ...prev,
                            startDateTime: date,
                            endDateTime: date && (!prev.endDateTime || date > prev.endDateTime) ? new Date(date.getTime() + 60 * 60 * 1000) : prev.endDateTime,
                            }))
                        }
                        label="Data Inicial do Evento"
                        showPast={!!editingEvent || isEditingSeries}
                    />
                </div>
                <div className="flex-1">
                    <DateTimePicker
                        value={formData?.endDateTime}
                        onChange={(date) => setFormData((prev: any) => ({ ...prev, endDateTime: date }))}
                        label="Data Final do Evento"
                        showPast={!!editingEvent || isEditingSeries}
                    />
                </div>
            </div>
            
            {showMultiDayPanel && (
              <div className="p-4 bg-muted/20 border border-border/50 rounded-lg space-y-3 animate-in fade-in slide-in-from-top-4">
                 <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-2 items-center text-primary font-medium">
                        <CalendarDays className="w-5 h-5"/>
                        Eventos Diários Múltiplos
                    </div>
                </div>
                {!isEditingSeries && (
                    <div className="flex items-center space-x-2 pb-2">
                        <Checkbox 
                            id="apply-same" 
                            checked={applySameTime} 
                            onCheckedChange={(checked) => setApplySameTime(!!checked)} 
                        />
                        <label
                            htmlFor="apply-same"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Manter o mesmo horário de início e fim em todos os dias
                        </label>
                    </div>
                )}
                
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                   {daySchedules.map((schedule, i) => (
                      <div key={schedule.key} className={`flex items-center gap-3 p-2 rounded-md transition-colors ${schedule.enabled ? 'bg-background shadow-sm border border-border/50' : 'opacity-50 grayscale'}`}>
                         <Checkbox 
                           checked={schedule.enabled}
                           onCheckedChange={() => handleDayToggle(i)}
                         />
                         <div className="w-24 text-sm font-medium capitalize truncate">
                            {isValid(schedule.date) ? format(schedule.date, 'EEEE, dd', { locale: ptBR }) : 'Inválido'}
                         </div>
                         <div className="flex gap-2 items-center flex-1">
                            <Input 
                                type="time" 
                                value={isValid(schedule.startDateTime) ? format(schedule.startDateTime, 'HH:mm') : ''} 
                                onChange={(e) => handleDayTimeChange(i, 'start', e.target.value)}
                                className="h-8 text-sm px-2 w-full"
                                disabled={!schedule.enabled || (applySameTime && i > 0 && !isEditingSeries)} 
                            />
                            <span className="text-muted-foreground text-xs">até</span>
                            <Input 
                                type="time" 
                                value={isValid(schedule.endDateTime) ? format(schedule.endDateTime, 'HH:mm') : ''} 
                                onChange={(e) => handleDayTimeChange(i, 'end', e.target.value)}
                                className="h-8 text-sm px-2 w-full"
                                disabled={!schedule.enabled || (applySameTime && i > 0 && !isEditingSeries)} 
                            />
                         </div>
                      </div>
                   ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Tv className="w-4 h-4 text-accent" />
                Exibir nas TVs
              </Label>
              {tvs.length > 0 && (
                <Button type="button" variant="ghost" size="sm" onClick={handleSelectAllTVs} className="text-xs text-primary hover:text-primary/80">
                  <CheckSquare className="w-3 h-3 mr-1" />
                  {Array.isArray(formData?.tvIds) && formData.tvIds.length === tvs.length ? "Desmarcar Todas" : "Selecionar Todas"}
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
                      <span key={tv.id} className="chip chip-primary group cursor-pointer" onClick={() => handleRemoveTV(tv.id)}>
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
                      <span key={tv.id} className="chip chip-muted cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all" onClick={() => handleTVToggle(tv.id)}>
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
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
              {isEditingSeries ? "Salvar Série" : editingEvent ? "Salvar Alterações" : "Cadastrar Evento"}
            </Button>
          </div>
        </form>
      </DialogContent>

      <AlertDialog open={confirmDiscardOpen} onOpenChange={setConfirmDiscardOpen}>
        <AlertDialogContent className="glass-card-strong border-border mx-4 sm:mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              Existem alterações não salvas neste formulário. Deseja descartar e fechar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                clearDraft();
                discardChanges();
                setConfirmDiscardOpen(false);
                closeDialog();
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
