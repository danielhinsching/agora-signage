import { useCallback, useMemo, useState } from "react";
import { Event, TV, PROFESSIONAL_TAGS } from "@/types";
import { useLocais, formatLocalDisplay } from "@/hooks/useLocais";
import { usePersistentForm } from "@/hooks/usePersistentForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Tv, X, Plus, CheckSquare, Tag, MapPin, Building2 } from "lucide-react";
import { toast } from "sonner";
import { DateTimePicker } from "./DateTimePicker";

interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingEvent: Event | null;
  tvs: TV[];
  onSubmit: (eventData: Omit<Event, "id" | "createdAt">) => void;
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
  const { locais, addLocal, isLocalUnique } = useLocais();
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);

  const [showNewLocalForm, setShowNewLocalForm] = useState(false);
  const [newLocalData, setNewLocalData] = useState({
    nome: "",
    predio: "",
    descricao: "",
  });

  const initialFormData = useMemo(() => {
    if (editingEvent) {
      return {
        name: editingEvent.name,
        location: editingEvent.location,
        startDateTime: new Date(editingEvent.startDateTime),
        endDateTime: new Date(editingEvent.endDateTime),
        tvIds: editingEvent.tvIds,
        tags: editingEvent.tags || [],
      };
    }

    const startDate = defaultDate ? new Date(defaultDate) : new Date();
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
  }, [editingEvent, defaultDate]);

  const draftKey = editingEvent
    ? `form_evento_draft_edit_${editingEvent.id}`
    : "form_evento_draft_new";

  const serializeEventDraft = useCallback((value: {
    name: string;
    location: string;
    startDateTime: Date | undefined;
    endDateTime: Date | undefined;
    tvIds: string[];
    tags: string[];
  }) => ({
    ...value,
    startDateTime: value.startDateTime ? value.startDateTime.toISOString() : null,
    endDateTime: value.endDateTime ? value.endDateTime.toISOString() : null,
  }), []);

  const deserializeEventDraft = useCallback((value: {
    name: string;
    location: string;
    startDateTime: string | null;
    endDateTime: string | null;
    tvIds: string[];
    tags: string[];
  }) => ({
    ...value,
    startDateTime: value.startDateTime ? new Date(value.startDateTime) : undefined,
    endDateTime: value.endDateTime ? new Date(value.endDateTime) : undefined,
  }), []);

  const { formData, setFormData, hasUnsavedChanges, clearDraft, discardChanges } = usePersistentForm({
    storageKey: draftKey,
    initialValue: initialFormData,
    isOpen: open,
    serialize: serializeEventDraft,
    deserialize: deserializeEventDraft,
  });

  const closeDialog = () => {
    onOpenChange(false);
    setShowNewLocalForm(false);
    setNewLocalData({ nome: "", predio: "", descricao: "" });
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
      setFormData((prev) => ({ ...prev, location: formatLocalDisplay(created) }));
      setShowNewLocalForm(false);
      setNewLocalData({ nome: "", predio: "", descricao: "" });
    } catch (error) {
      console.error("Error adding local:", error);
    }
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

  const handleTagToggle = (tag: string) => {
    setFormData((prev) => {
      if (!prev.tags.includes(tag) && prev.tags.length >= 3) return prev;
      return {
        ...prev,
        tags: prev.tags.includes(tag)
          ? prev.tags.filter((t) => t !== tag)
          : [...prev.tags, tag],
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.startDateTime || !formData.endDateTime) {
      toast.error("Selecione a data e hora de início e término.");
      return;
    }

    const minEndDateTime = new Date(formData.startDateTime.getTime() + 60 * 60 * 1000);

    if (formData.endDateTime < minEndDateTime) {
      toast.error("O término deve ser pelo menos 1 hora após o início.");
      return;
    }

    if (!formData.location) {
      toast.error("Selecione um local.");
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

    clearDraft();
    discardChanges();
    closeDialog();
  };

  const selectedTVs = useMemo(() => tvs.filter((tv) => formData.tvIds.includes(tv.id)), [tvs, formData.tvIds]);
  const unselectedTVs = useMemo(() => tvs.filter((tv) => !formData.tvIds.includes(tv.id)), [tvs, formData.tvIds]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="glass-card-strong border-border max-w-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {editingEvent ? "Editar Evento" : "Novo Evento"}
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

          {/* Location Select */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Local / Sala
            </Label>
            <Select
              value={formData.location}
              onValueChange={(val) => {
                if (val === "__new__") {
                  setShowNewLocalForm(true);
                } else {
                  setFormData((prev) => ({ ...prev, location: val }));
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
                {formData.location &&
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
              <span className={`text-xs font-normal ml-auto ${formData.tags.length >= 3 ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                {formData.tags.length}/3 selecionadas
              </span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {PROFESSIONAL_TAGS.map((tag) => {
                const isSelected = formData.tags.includes(tag);
                const isDisabled = !isSelected && formData.tags.length >= 3;
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
            {formData.tags.length >= 3 && (
              <p className="text-xs text-destructive">
                Limite de 3 tags atingido. Remova uma para selecionar outra.
              </p>
            )}
          </div>

          <div className="space-y-4">
            <DateTimePicker
              value={formData.startDateTime}
              onChange={(date) =>
                setFormData((prev) => ({
                  ...prev,
                  startDateTime: date,
                  endDateTime: date ? new Date(date.getTime() + 60 * 60 * 1000) : prev.endDateTime,
                }))
              }
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

          {/* TV Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Tv className="w-4 h-4 text-accent" />
                Exibir nas TVs
              </Label>
              {tvs.length > 0 && (
                <Button type="button" variant="ghost" size="sm" onClick={handleSelectAllTVs} className="text-xs text-primary hover:text-primary/80">
                  <CheckSquare className="w-3 h-3 mr-1" />
                  {formData.tvIds.length === tvs.length ? "Desmarcar Todas" : "Selecionar Todas"}
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
              {editingEvent ? "Salvar Alterações" : "Cadastrar Evento"}
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
