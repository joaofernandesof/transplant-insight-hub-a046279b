/**
 * NeoTeamPortalLinks - Portal de Links organizado por setor
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { NeoTeamBreadcrumb } from '@/neohub/components/NeoTeamBreadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  ExternalLink, Plus, Pencil, Trash2, Link as LinkIcon,
  DollarSign, Megaphone, Users, Stethoscope, Scale, CircuitBoard,
  HeadphonesIcon, ClipboardList, GitCompare, Package, Settings, Globe,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const SECTORS = [
  { value: 'geral', label: 'Geral', icon: Globe, color: 'bg-slate-500' },
  { value: 'tecnico', label: 'Setor Técnico', icon: Stethoscope, color: 'bg-cyan-500' },
  { value: 'sucesso_paciente', label: 'Sucesso do Paciente', icon: HeadphonesIcon, color: 'bg-yellow-500' },
  { value: 'operacional', label: 'Setor Operacional', icon: ClipboardList, color: 'bg-blue-500' },
  { value: 'processos', label: 'Setor de Processos', icon: GitCompare, color: 'bg-indigo-500' },
  { value: 'financeiro', label: 'Setor Financeiro', icon: DollarSign, color: 'bg-emerald-500' },
  { value: 'juridico', label: 'Setor Jurídico', icon: Scale, color: 'bg-rose-500' },
  { value: 'marketing', label: 'Setor de Marketing', icon: Megaphone, color: 'bg-pink-500' },
  { value: 'ti', label: 'Setor de TI', icon: CircuitBoard, color: 'bg-purple-500' },
  { value: 'rh', label: 'Setor de RH', icon: Users, color: 'bg-amber-500' },
  { value: 'comercial', label: 'Setor Comercial', icon: Package, color: 'bg-teal-500' },
  { value: 'administrativo', label: 'Administrativo', icon: Settings, color: 'bg-gray-500' },
];

interface PortalLink {
  id: string;
  title: string;
  url: string;
  description: string | null;
  sector: string;
  icon: string | null;
  color: string | null;
  order_index: number | null;
  is_active: boolean;
}

const EMPTY_FORM = { title: '', url: '', description: '', sector: 'geral' };

export default function NeoTeamPortalLinks() {
  const { isAdmin } = useUnifiedAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<PortalLink | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: links = [], isLoading } = useQuery({
    queryKey: ['neoteam-portal-links'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neoteam_portal_links' as any)
        .select('*')
        .eq('is_active', true)
        .order('sector')
        .order('order_index');
      if (error) throw error;
      return (data || []) as unknown as PortalLink[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: typeof EMPTY_FORM & { id?: string }) => {
      if (values.id) {
        const { error } = await supabase
          .from('neoteam_portal_links' as any)
          .update({ title: values.title, url: values.url, description: values.description || null, sector: values.sector, updated_at: new Date().toISOString() } as any)
          .eq('id', values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('neoteam_portal_links' as any)
          .insert({ title: values.title, url: values.url, description: values.description || null, sector: values.sector } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neoteam-portal-links'] });
      toast.success(editingLink ? 'Link atualizado!' : 'Link adicionado!');
      closeDialog();
    },
    onError: () => toast.error('Erro ao salvar link'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('neoteam_portal_links' as any)
        .update({ is_active: false, updated_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neoteam-portal-links'] });
      toast.success('Link removido');
    },
  });

  const closeDialog = () => { setDialogOpen(false); setEditingLink(null); setForm(EMPTY_FORM); };

  const openEdit = (link: PortalLink) => {
    setEditingLink(link);
    setForm({ title: link.title, url: link.url, description: link.description || '', sector: link.sector });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.url) return toast.error('Preencha título e URL');
    saveMutation.mutate({ ...form, id: editingLink?.id });
  };

  const grouped = links.reduce<Record<string, PortalLink[]>>((acc, link) => {
    const key = link.sector || 'geral';
    if (!acc[key]) acc[key] = [];
    acc[key].push(link);
    return acc;
  }, {});

  const getSectorConfig = (code: string) => SECTORS.find(s => s.value === code) || SECTORS[0];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <NeoTeamBreadcrumb />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Portal de Links</h1>
          <p className="text-sm text-muted-foreground">Links úteis organizados por setor</p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) closeDialog(); else setDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Novo Link</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingLink ? 'Editar Link' : 'Novo Link'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Planilha de Comissões" />
                </div>
                <div className="space-y-2">
                  <Label>URL *</Label>
                  <Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrição opcional..." rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>Setor</Label>
                  <Select value={form.sector} onValueChange={v => setForm(f => ({ ...f, sector: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SECTORS.map(s => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={closeDialog}>Cancelar</Button>
                  <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Salvando...' : 'Salvar'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-12">Carregando...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <LinkIcon className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Nenhum link cadastrado ainda.</p>
            {isAdmin && <p className="text-sm mt-1">Clique em "Novo Link" para adicionar o primeiro.</p>}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {SECTORS.filter(s => grouped[s.value]).map(sector => {
            const SectorIcon = sector.icon;
            const sectorLinks = grouped[sector.value];
            return (
              <Card key={sector.value}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className={cn('p-1.5 rounded-md text-white', sector.color)}>
                      <SectorIcon className="h-4 w-4" />
                    </div>
                    {sector.label}
                    <Badge variant="secondary" className="ml-auto text-xs">{sectorLinks.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {sectorLinks.map(link => (
                      <div key={link.id} className="group relative border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3">
                          <div className={cn('p-2 rounded-md text-white shrink-0', sector.color)}>
                            <ExternalLink className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm text-foreground truncate">{link.title}</p>
                            {link.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{link.description}</p>}
                          </div>
                        </a>
                        {isAdmin && (
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(link)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(link.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
