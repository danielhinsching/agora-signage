import { useState } from 'react';
import { useTVs } from '@/hooks/useTVs';
import { TV, TVOrientation } from '@/types';
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
import { Tv, Plus, Trash2, Edit, ExternalLink, Image, X } from 'lucide-react';
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
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestão de TVs</h1>
          <p className="text-muted-foreground">
            Cadastre e gerencie as TVs do parque tecnológico
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Nova TV
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>{editingTV ? 'Editar TV' : 'Cadastrar Nova TV'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da TV</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex: Bloco A - Recepção"
                  className="bg-muted/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Slug (URL)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">/tv/</span>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    placeholder="bloco-a-recepcao"
                    className="bg-muted/50 font-mono"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Orientação</Label>
                <Select
                  value={formData.orientation}
                  onValueChange={(value: TVOrientation) =>
                    setFormData((prev) => ({ ...prev, orientation: value }))
                  }
                >
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="horizontal">Horizontal (16:9)</SelectItem>
                    <SelectItem value="vertical">Vertical (9:16)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
                  {editingTV ? 'Salvar' : 'Cadastrar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {tvs.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Tv className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma TV cadastrada</h3>
            <p className="text-muted-foreground mb-4">
              Comece cadastrando uma TV para exibir conteúdo
            </p>
            <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-primary/90">
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
              className="glass-card fade-in overflow-hidden"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Tv className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{tv.name}</CardTitle>
                      <p className="text-xs text-muted-foreground font-mono">/tv/{tv.slug}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-secondary/10 text-secondary capitalize">
                    {tv.orientation === 'horizontal' ? 'Horizontal' : 'Vertical'}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Image Preview/Upload */}
                <div className="aspect-video bg-muted/30 rounded-lg overflow-hidden relative group">
                  {tv.activeImage ? (
                    <>
                      <img
                        src={tv.activeImage}
                        alt={tv.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveImage(tv.id)}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Remover
                        </Button>
                      </div>
                    </>
                  ) : (
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                      <Image className="w-8 h-8 text-muted-foreground mb-2" />
                      <span className="text-xs text-muted-foreground">Upload de imagem</span>
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
                    className="flex-1"
                    onClick={() => handleOpenDialog(tv)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    asChild
                  >
                    <a href={`/tv/${tv.slug}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Abrir
                    </a>
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
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
        <AlertDialogContent className="bg-card border-border">
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
