import { useEffect, useMemo, useState } from "react";
import { useTVs } from "@/hooks/useTVs";
import { TV, TVOrientation, TVType } from "@/types";
import { listTvImages, uploadTvImage, deleteTvImage, deleteAllTvImages, TvImage } from "@/lib/tv-images";
import { usePersistentForm } from "@/hooks/usePersistentForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Tv,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  Monitor,
  Smartphone,
  Calendar,
  Image as ImageIcon,
  Upload,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

const TVsManagement = () => {
  const { tvs, loading, addTV, updateTV, deleteTV, isSlugUnique } = useTVs();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTV, setEditingTV] = useState<TV | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);

  const initialFormData = useMemo(
    () => ({
      name: editingTV?.name ?? "",
      slug: editingTV?.slug ?? "",
      orientation: editingTV?.orientation ?? ("horizontal" as TVOrientation),
      type: editingTV?.type ?? ("events" as TVType),
    }),
    [editingTV]
  );

  const draftKey = editingTV ? `form_tv_draft_edit_${editingTV.id}` : "form_tv_draft_new";

  const { formData, setFormData, hasUnsavedChanges, clearDraft, discardChanges } = usePersistentForm({
    storageKey: draftKey,
    initialValue: initialFormData,
    isOpen: isDialogOpen,
  });

  // ---- Image gallery management (only when editing an existing image-type TV) ----
  const [images, setImages] = useState<TvImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isDialogOpen || !editingTV || formData.type !== "images") {
      setImages([]);
      return;
    }
    setImagesLoading(true);
    listTvImages(editingTV.id)
      .then(setImages)
      .catch((err) => {
        console.error(err);
        toast.error("Erro ao carregar imagens");
      })
      .finally(() => setImagesLoading(false));
  }, [isDialogOpen, editingTV, formData.type]);

  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !editingTV) return;
    setUploading(true);
    try {
      const uploaded: TvImage[] = [];
      for (const file of Array.from(files)) {
        if (!/^image\/(jpe?g|png|webp)$/i.test(file.type)) {
          toast.error(`Formato não suportado: ${file.name}`);
          continue;
        }
        const img = await uploadTvImage(editingTV.id, file);
        uploaded.push(img);
      }
      if (uploaded.length > 0) {
        setImages((prev) => [...prev, ...uploaded]);
        toast.success(`${uploaded.length} imagem(ns) enviada(s)`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao enviar imagem");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async (img: TvImage) => {
    try {
      await deleteTvImage(img.path);
      setImages((prev) => prev.filter((i) => i.path !== img.path));
      toast.success("Imagem removida");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao remover imagem");
    }
  };

  const resetForm = () => {
    discardChanges();
    setEditingTV(null);
  };

  const handleOpenDialog = (tv?: TV) => {
    setEditingTV(tv ?? null);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setIsDialogOpen(true);
      return;
    }

    if (hasUnsavedChanges) {
      setConfirmDiscardOpen(true);
      return;
    }

    closeDialog();
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: editingTV ? prev.slug : generateSlug(name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSlugUnique(formData.slug, editingTV?.id)) {
      toast.error("Este slug já está em uso. Escolha outro.");
      return;
    }

    try {
      if (editingTV) {
        await updateTV(editingTV.id, formData);
      } else {
        await addTV(formData);
      }
      clearDraft();
      closeDialog();
    } catch (error) {
      console.error("Error saving TV:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Best-effort cleanup of any images attached to this TV
      try {
        await deleteAllTvImages(id);
      } catch (e) {
        console.warn("Could not clean up images for TV", id, e);
      }
      await deleteTV(id);
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting TV:", error);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando TVs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 pt-16 lg:pt-8 custom-scrollbar">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
            <Tv className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            Gestão de TVs
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Cadastre e gerencie as TVs do parque tecnológico
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-primary hover:bg-primary/90 glow-effect w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova TV
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card-strong border-border mx-4 sm:mx-auto max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {editingTV ? "Editar TV" : "Nova TV"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Nome da TV</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex: Bloco A - Recepção"
                  className="bg-input/50 border-border/50 focus:border-primary"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Slug (URL)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm font-mono">
                    /tv/
                  </span>
                  <Input
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, slug: e.target.value }))
                    }
                    placeholder="bloco-a-recepcao"
                    className="bg-input/50 border-border/50 focus:border-primary font-mono"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tipo de TV</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: TVType) =>
                    setFormData((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger className="bg-input/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="events">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Agenda de Eventos
                      </div>
                    </SelectItem>
                    <SelectItem value="images">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        Galeria de Imagens
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Orientação</Label>
                <Select
                  value={formData.orientation}
                  onValueChange={(value: TVOrientation) =>
                    setFormData((prev) => ({ ...prev, orientation: value }))
                  }
                >
                  <SelectTrigger className="bg-input/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="horizontal">
                      <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4" />
                        Horizontal (16:9)
                      </div>
                    </SelectItem>
                    <SelectItem value="vertical">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4" />
                        Vertical (9:16)
                      </div>
                    </SelectItem>
                    <SelectItem value="vertical-left">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 rotate-90" />
                        Vertical — Girada Esquerda
                      </div>
                    </SelectItem>
                    <SelectItem value="vertical-right">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 -rotate-90" />
                        Vertical — Girada Direita
                      </div>
                    </SelectItem>
                    <SelectItem value="mobile">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4" />
                        Mobile (Seg-Dom)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Image gallery management — only for existing image-type TVs */}
              {formData.type === "images" && (
                <div className="space-y-3 pt-2 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Galeria de Imagens</Label>
                    {editingTV && (
                      <span className="text-xs text-muted-foreground">
                        {images.length} imagem(ns)
                      </span>
                    )}
                  </div>

                  {!editingTV ? (
                    <p className="text-xs text-muted-foreground italic">
                      Salve a TV primeiro para enviar imagens.
                    </p>
                  ) : (
                    <>
                      <label className="flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-lg border-2 border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-colors">
                        {uploading ? (
                          <Loader2 className="w-6 h-6 text-primary animate-spin" />
                        ) : (
                          <Upload className="w-6 h-6 text-muted-foreground" />
                        )}
                        <span className="text-sm text-muted-foreground">
                          {uploading ? "Enviando..." : "Clique para enviar (JPG, PNG, WEBP)"}
                        </span>
                        <input
                          type="file"
                          multiple
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          disabled={uploading}
                          onChange={(e) => {
                            handleUploadFiles(e.target.files);
                            e.target.value = "";
                          }}
                        />
                      </label>

                      {imagesLoading ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : images.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto custom-scrollbar">
                          {images.map((img) => (
                            <div
                              key={img.path}
                              className="relative group aspect-square rounded-md overflow-hidden border border-border/50 bg-muted"
                            >
                              <img
                                src={img.url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(img)}
                                className="absolute top-1 right-1 p-1 rounded-md bg-destructive/90 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Remover imagem"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDialogOpenChange(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {editingTV ? "Salvar Alterações" : "Cadastrar TV"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {tvs.length === 0 ? (
        <Card className="glass-card-strong">
          <CardContent className="flex flex-col items-center justify-center py-12 md:py-20 px-4">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 md:mb-6">
              <Tv className="w-8 h-8 md:w-10 md:h-10 text-primary" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold mb-2">
              Nenhuma TV cadastrada
            </h3>
            <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6 text-center max-w-md">
              Comece cadastrando uma TV para exibir conteúdo nas telas do parque
            </p>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-primary hover:bg-primary/90 glow-effect"
            >
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Primeira TV
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {tvs.map((tv, index) => (
            <Card
              key={tv.id}
              className="glass-card-strong fade-in-up overflow-hidden group"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Status indicator bar */}
              <div className="h-1 bg-gradient-to-r from-accent to-primary" />

              <CardContent className="p-4 md:p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <Tv className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                      </div>
                      {/* Online status dot */}
                      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-accent border-2 border-card animate-pulse" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-base md:text-lg truncate">
                        {tv.name}
                      </h3>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        /tv/{tv.slug}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span
                      className={`chip text-xs py-0.5 inline-flex items-center gap-1 ${
                        tv.type === "images" ? "chip-primary" : "chip-secondary"
                      }`}
                    >
                      {tv.type === "images" ? (
                        <>
                          <ImageIcon className="w-3 h-3" />
                          Imagens
                        </>
                      ) : (
                        <>
                          <Calendar className="w-3 h-3" />
                          Eventos
                        </>
                      )}
                    </span>
                    <span className="chip chip-secondary text-xs py-0.5">
                      {
                        {
                          horizontal: "16:9",
                          vertical: "9:16",
                          "vertical-left": "9:16 ↺",
                          "vertical-right": "9:16 ↻",
                          mobile: "MOBILE",
                        }[tv.orientation]
                      }
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 hover:bg-primary/10 hover:text-primary hover:border-primary/30 text-xs sm:text-sm"
                    onClick={() => handleOpenDialog(tv)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 hover:bg-secondary/10 hover:text-secondary hover:border-secondary/30 text-xs sm:text-sm"
                    asChild
                  >
                    <a
                      href={`/tv/${tv.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Visualizar
                    </a>
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                    onClick={() => setDeleteConfirm(tv.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <AlertDialogContent className="glass-card-strong border-border mx-4 sm:mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta TV? Esta ação não pode ser
              desfeita.
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
    </div>
  );
};

export default TVsManagement;