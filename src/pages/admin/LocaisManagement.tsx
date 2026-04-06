import { useMemo, useState } from 'react';
import { useLocais } from '@/hooks/useLocais';
import { Local } from '@/types';
import { usePersistentForm } from '@/hooks/usePersistentForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Building2, Plus, Trash2, Edit, MapPin } from 'lucide-react';
import { toast } from 'sonner';

const LocaisManagement = () => {
  const { locais, loading, addLocal, updateLocal, deleteLocal, isLocalUnique } = useLocais();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocal, setEditingLocal] = useState<Local | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);

  const initialFormData = useMemo(
    () => ({
      nome: editingLocal?.nome ?? '',
      predio: editingLocal?.predio ?? '',
      descricao: editingLocal?.descricao ?? '',
    }),
    [editingLocal]
  );

  const draftKey = editingLocal ? `form_local_draft_edit_${editingLocal.id}` : 'form_local_draft_new';

  const { formData, setFormData, hasUnsavedChanges, clearDraft, discardChanges } = usePersistentForm({
    storageKey: draftKey,
    initialValue: initialFormData,
    isOpen: isDialogOpen,
  });

  const resetForm = () => {
    discardChanges();
    setEditingLocal(null);
  };

  const handleOpenDialog = (local?: Local) => {
    setEditingLocal(local ?? null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLocalUnique(formData.nome, formData.predio, editingLocal?.id)) {
      toast.error('Já existe um local com esse nome neste prédio.');
      return;
    }

    try {
      if (editingLocal) {
        await updateLocal(editingLocal.id, {
          nome: formData.nome.trim(),
          predio: formData.predio.trim(),
          descricao: formData.descricao.trim(),
        });
      } else {
        await addLocal({
          nome: formData.nome.trim(),
          predio: formData.predio.trim(),
          descricao: formData.descricao.trim(),
        });
      }
      clearDraft();
      closeDialog();
    } catch (error) {
      console.error('Error saving local:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLocal(id);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting local:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando locais...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 pt-16 lg:pt-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
            <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            Gestão de Locais
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Cadastre e gerencie os locais utilizados nos eventos
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-primary hover:bg-primary/90 glow-effect w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Local
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card-strong border-border mx-4 sm:mx-auto max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {editingLocal ? 'Editar Local' : 'Novo Local'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Nome da Sala</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Sala 101"
                  className="bg-input/50 border-border/50 focus:border-primary"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Prédio</Label>
                <Input
                  value={formData.predio}
                  onChange={(e) => setFormData((prev) => ({ ...prev, predio: e.target.value }))}
                  placeholder="Ex: Prédio A"
                  className="bg-input/50 border-border/50 focus:border-primary"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Descrição (opcional)</Label>
                <Textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Informações adicionais sobre este local"
                  className="bg-input/50 border-border/50 focus:border-primary"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDialogOpenChange(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
                  {editingLocal ? 'Salvar Alterações' : 'Salvar Local'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {locais.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-12 md:py-20 px-4">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 md:mb-6">
              <MapPin className="w-8 h-8 md:w-10 md:h-10 text-primary" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold mb-2">Nenhum local cadastrado</h3>
            <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6 text-center max-w-md">
              Adicione locais para utilizá-los no cadastro de eventos.
            </p>
            <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-primary/90 glow-effect">
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Primeiro Local
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="glass-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground font-semibold">Nome</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Prédio</TableHead>
                <TableHead className="text-muted-foreground font-semibold hidden md:table-cell">Descrição</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locais.map((local, index) => (
                <TableRow
                  key={local.id}
                  className="border-border/30 hover:bg-muted/30 fade-in-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <TableCell className="font-medium">{local.nome}</TableCell>
                  <TableCell>{local.predio}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {local.descricao || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                        onClick={() => handleOpenDialog(local)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setDeleteConfirm(local.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="glass-card-strong border-border mx-4 sm:mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este local? Esta ação não pode ser desfeita.
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

export default LocaisManagement;
