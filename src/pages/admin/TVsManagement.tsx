import { useState } from 'react';
import { useTVs } from '@/hooks/useTVs';
import { TV, TVOrientation } from '@/types';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Tv, Plus, Trash2, Edit, ExternalLink, Image, X, Monitor, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

const TVsManagement = () => {
  const { tvs, addTV, updateTV, deleteTV, setActiveImage, isSlugUnique } = useTVs();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTV, setEditingTV] = useState<TV | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    orientation: 'horizontal' as TVOrientation,
  });

  const resetForm = () => {
    setFormData({ name: '', slug: '', orientation: 'horizontal' });
    setEditingTV(null);
  };

  const handleOpenDialog = (tv?: TV) => {
    if (tv) {
      setEditingTV(tv);
      setFormData({
        name: tv.name,
        slug: tv.slug,
        orientation: tv.orientation,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: editingTV ? prev.slug : generateSlug(name),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSlugUnique(formData.slug, editingTV?.id)) {
      toast.error('Este slug já está em uso. Escolha outro.');
      return;
    }

    if (editingTV) {
      updateTV(editingTV.id, formData);
      toast.success('TV atualizada com sucesso!');
    } else {
      addTV(formData);
      toast.success('TV cadastrada com sucesso!');
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    deleteTV(id);
    setDeleteConfirm(null);
    toast.success('TV removida com sucesso!');
  };

  const handleImageUpload = (tvId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setActiveImage(tvId, base64);
      toast.success('Imagem atualizada!');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (tvId: string) => {
    setActiveImage(tvId, undefined);
    toast.success('Imagem removida!');
  };

  return (
    <div className="p-8 custom-scrollbar">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Tv className="w-8 h-8 text-primary" />
            Gestão de TVs
          </h1>
          <p className="text-muted-foreground">
            Cadastre e gerencie as TVs do parque tecnológico
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-primary/90 glow-effect">
              <Plus className="w-4 h-4 mr-2" />
              Nova TV
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card-strong border-border">
            <DialogHeader>
              <DialogTitle className="text-xl">{editingTV ? 'Editar TV' : 'Nova TV'}</DialogTitle>
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
                  <span className="text-muted-foreground text-sm font-mono">/tv/</span>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    placeholder="bloco-a-recepcao"
                    className="bg-input/50 border-border/50 focus:border-primary font-mono"
                    required
                  />
                </div>
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
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
                  {editingTV ? 'Salvar Alterações' : 'Cadastrar TV'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {tvs.length === 0 ? (
        <Card className="glass-card-strong">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <Tv className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Nenhuma TV cadastrada</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Comece cadastrando uma TV para exibir conteúdo nas telas do parque
            </p>
            <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-primary/90 glow-effect">
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Primeira TV
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tvs.map((tv, index) => (
            <Card
              key={tv.id}
              className="glass-card-strong fade-in-up overflow-hidden group"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Status indicator bar */}
              <div className="h-1 bg-gradient-to-r from-accent to-primary" />
              
              <CardContent className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <Tv className="w-6 h-6 text-primary" />
                      </div>
                      {/* Online status dot */}
                      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-accent border-2 border-card animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{tv.name}</h3>
                      <p className="text-xs text-muted-foreground font-mono">/tv/{tv.slug}</p>
                    </div>
                  </div>
                  <span className="chip chip-secondary text-xs py-0.5">
                    {tv.orientation === 'horizontal' ? '16:9' : '9:16'}
                  </span>
                </div>

                {/* Image Preview/Upload */}
                <div className={`rounded-xl overflow-hidden relative group/image ${
                  tv.orientation === 'vertical' ? 'aspect-[9/16] max-h-48' : 'aspect-video'
                } bg-gradient-to-br from-muted/50 to-muted/30`}>
                  {tv.activeImage ? (
                    <>
                      <img
                        src={tv.activeImage}
                        alt={tv.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover/image:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-sm">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveImage(tv.id)}
                          className="scale-90 group-hover/image:scale-100 transition-transform"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Remover Imagem
                        </Button>
                      </div>
                      {/* Active image badge */}
                      <div className="absolute top-2 left-2">
                        <span className="chip chip-accent text-xs py-0.5 shadow-lg">
                          Imagem Ativa
                        </span>
                      </div>
                    </>
                  ) : (
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                      <Image className="w-10 h-10 text-muted-foreground/50 mb-3" />
                      <span className="text-sm text-muted-foreground">Fazer upload de imagem</span>
                      <span className="text-xs text-muted-foreground/60 mt-1">PNG, JPG até 5MB</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(tv.id, file);
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                    onClick={() => handleOpenDialog(tv)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 hover:bg-secondary/10 hover:text-secondary hover:border-secondary/30"
                    asChild
                  >
                    <a href={`/tv/${tv.slug}`} target="_blank" rel="noopener noreferrer">
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
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="glass-card-strong border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta TV? Esta ação não pode ser desfeita.
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

export default TVsManagement;
