import { useMemo, useRef, useState } from 'react';
import { useEmpresas } from '@/hooks/useEmpresas';
import { Empresa } from '@/types';
import { uploadEmpresaLogo, extractPathFromPublicUrl } from '@/lib/empresas';
import { supabase } from '@/integrations/supabase/client';
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
import { Briefcase, Plus, Trash2, Edit, Upload, X, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

const EmpresasManagement = () => {
  const { empresas, loading, addEmpresa, updateEmpresa, deleteEmpresa } = useEmpresas();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Empresa | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Empresa | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const initial = useMemo(
    () => ({
      nome: editing?.nome ?? '',
      descricao: editing?.descricao ?? '',
      siteUrl: editing?.siteUrl ?? '',
      logoUrl: editing?.logoUrl ?? '',
    }),
    [editing]
  );

  const [form, setForm] = useState(initial);

  const handleOpen = (empresa?: Empresa) => {
    setEditing(empresa ?? null);
    setForm({
      nome: empresa?.nome ?? '',
      descricao: empresa?.descricao ?? '',
      siteUrl: empresa?.siteUrl ?? '',
      logoUrl: empresa?.logoUrl ?? '',
    });
    setIsDialogOpen(true);
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setEditing(null);
  };

  const validateUrl = (url: string) => {
    try {
      const u = new URL(url);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleLogoSelect = async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Formato inválido. Use JPG, PNG, WEBP ou SVG.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande (máx 5MB).');
      return;
    }
    setUploading(true);
    try {
      // Use temp folder if creating new (no id yet)
      const folder = editing?.id ?? 'temp';
      const { url } = await uploadEmpresaLogo(folder, file);
      setForm((p) => ({ ...p, logoUrl: url }));
      toast.success('Logo enviado!');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao enviar logo');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    if (form.logoUrl) {
      const path = extractPathFromPublicUrl(form.logoUrl);
      if (path) {
        await supabase.storage.from('empresa-logos').remove([path]).catch(() => undefined);
      }
    }
    setForm((p) => ({ ...p, logoUrl: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) return toast.error('Informe o nome.');
    if (!form.siteUrl.trim() || !validateUrl(form.siteUrl.trim())) {
      return toast.error('URL inválida (use http:// ou https://).');
    }
    if (form.descricao.length > 300) return toast.error('Descrição até 300 caracteres.');

    setSaving(true);
    try {
      if (editing) {
        await updateEmpresa(editing.id, {
          nome: form.nome.trim(),
          descricao: form.descricao.trim(),
          siteUrl: form.siteUrl.trim(),
          logoUrl: form.logoUrl || undefined,
        });
      } else {
        await addEmpresa({
          nome: form.nome.trim(),
          descricao: form.descricao.trim(),
          siteUrl: form.siteUrl.trim(),
          logoUrl: form.logoUrl || undefined,
        });
      }
      handleClose();
    } catch {
      // toast handled in hook
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteEmpresa(deleteConfirm);
      setDeleteConfirm(null);
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando empresas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 pt-16 lg:pt-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
            <Briefcase className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            Gestão de Empresas
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Cadastre as empresas que aparecem no diretório público{' '}
            <a href="/empresas" target="_blank" className="text-primary hover:underline inline-flex items-center gap-1">
              /empresas <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(o) => (o ? setIsDialogOpen(true) : handleClose())}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpen()} className="bg-primary hover:bg-primary/90 glow-effect w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Empresa
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card-strong border-border mx-4 sm:mx-auto max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {editing ? 'Editar Empresa' : 'Nova Empresa'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Logo</Label>
                {form.logoUrl ? (
                  <div className="relative w-32 h-32 rounded-xl border border-border bg-muted/30 overflow-hidden">
                    <img src={form.logoUrl} alt="Logo preview" className="w-full h-full object-contain p-2" />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={handleRemoveLogo}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="w-32 h-32 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary disabled:opacity-50"
                  >
                    <Upload className="w-6 h-6" />
                    <span className="text-xs">{uploading ? 'Enviando...' : 'Enviar logo'}</span>
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept={ACCEPTED_TYPES.join(',')}
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleLogoSelect(f);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Nome *</Label>
                <Input
                  value={form.nome}
                  onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                  placeholder="Nome da empresa"
                  maxLength={100}
                  className="bg-input/50 border-border/50 focus:border-primary"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">URL do site *</Label>
                <Input
                  type="url"
                  value={form.siteUrl}
                  onChange={(e) => setForm((p) => ({ ...p, siteUrl: e.target.value }))}
                  placeholder="https://exemplo.com"
                  className="bg-input/50 border-border/50 focus:border-primary"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Descrição <span className="text-muted-foreground">({form.descricao.length}/300)</span>
                </Label>
                <Textarea
                  value={form.descricao}
                  onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))}
                  placeholder="Descrição curta da empresa"
                  maxLength={300}
                  rows={3}
                  className="bg-input/50 border-border/50 focus:border-primary"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving} className="flex-1 bg-primary hover:bg-primary/90">
                  {saving ? 'Salvando...' : editing ? 'Salvar Alterações' : 'Cadastrar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {empresas.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-12 md:py-20 px-4">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 md:mb-6">
              <Briefcase className="w-8 h-8 md:w-10 md:h-10 text-primary" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold mb-2">Nenhuma empresa cadastrada</h3>
            <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6 text-center max-w-md">
              Cadastre as empresas que aparecerão no diretório público.
            </p>
            <Button onClick={() => handleOpen()} className="bg-primary hover:bg-primary/90 glow-effect">
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Primeira Empresa
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="glass-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground font-semibold">Logo</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Nome</TableHead>
                <TableHead className="text-muted-foreground font-semibold hidden md:table-cell">Site</TableHead>
                <TableHead className="text-muted-foreground font-semibold hidden lg:table-cell">Descrição</TableHead>
                <TableHead className="text-muted-foreground font-semibold text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {empresas.map((empresa, index) => (
                <TableRow
                  key={empresa.id}
                  className="border-border/30 hover:bg-muted/30 fade-in-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <TableCell>
                    <div className="w-12 h-12 rounded-lg bg-muted/40 flex items-center justify-center overflow-hidden">
                      {empresa.logoUrl ? (
                        <img src={empresa.logoUrl} alt={empresa.nome} className="w-full h-full object-contain p-1" />
                      ) : (
                        <Briefcase className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{empresa.nome}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <a
                      href={empresa.siteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
                    >
                      {new URL(empresa.siteUrl).hostname}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground max-w-xs truncate">
                    {empresa.descricao || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                        onClick={() => handleOpen(empresa)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setDeleteConfirm(empresa)}
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
            <AlertDialogTitle>Excluir empresa?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteConfirm?.nome}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EmpresasManagement;
