import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Building2, RefreshCw, ArrowLeft, Phone, Mail, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EMPRESAS = [
  'Neo Folic Fortaleza',
  'Neo Folic Juazeiro',
  'Neo Folic São Paulo',
  'IBRAMEC',
  'Avivar',
  'Neo Folic SPA',
  'Licença ByNeoFolic',
];

const AREAS = [
  'Comercial',
  'Pós-vendas',
  'Financeiro',
  'Jurídico',
  'Agendamento de Transplante',
  'Suporte',
  'Administrativo',
];

interface GroupContact {
  id: string;
  empresa: string;
  area: string;
  unidade: string;
  setor: string | null;
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  observacao: string | null;
  responsavel: string | null;
  is_active: boolean;
  order_index: number;
}

const emptyForm = {
  empresa: '',
  area: '',
  unidade: 'Geral',
  setor: '',
  telefone: '',
  whatsapp: '',
  email: '',
  observacao: '',
  responsavel: '',
};

export default function ContatosAdmin() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<GroupContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterEmpresa, setFilterEmpresa] = useState<string>('all');

  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('group_contacts')
      .select('*')
      .order('empresa')
      .order('order_index');

    if (error) {
      toast.error('Erro ao carregar contatos');
      console.error(error);
    } else {
      setContacts((data as unknown as GroupContact[]) || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (c: GroupContact) => {
    setEditingId(c.id);
    setForm({
      empresa: c.empresa,
      area: c.area,
      unidade: c.unidade,
      setor: c.setor || '',
      telefone: c.telefone || '',
      whatsapp: c.whatsapp || '',
      email: c.email || '',
      observacao: c.observacao || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.empresa || !form.area) {
      toast.error('Empresa e Área são obrigatórios');
      return;
    }

    const payload = {
      empresa: form.empresa,
      area: form.area,
      unidade: form.unidade || 'Geral',
      setor: form.setor || null,
      telefone: form.telefone || null,
      whatsapp: form.whatsapp || null,
      email: form.email || null,
      observacao: form.observacao || null,
    };

    if (editingId) {
      const { error } = await supabase
        .from('group_contacts')
        .update(payload)
        .eq('id', editingId);
      if (error) { toast.error('Erro ao atualizar'); return; }
      toast.success('Contato atualizado!');
    } else {
      const { error } = await supabase
        .from('group_contacts')
        .insert(payload as any);
      if (error) { toast.error('Erro ao criar'); return; }
      toast.success('Contato criado!');
    }

    setDialogOpen(false);
    fetchContacts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este contato?')) return;
    const { error } = await supabase.from('group_contacts').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success('Contato excluído');
    fetchContacts();
  };

  const filtered = filterEmpresa === 'all'
    ? contacts
    : contacts.filter(c => c.empresa === filterEmpresa);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/contatos')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <Building2 className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Administrar Contatos</h1>
          </div>
          <Button variant="outline" size="icon" onClick={fetchContacts} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Contato
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Filter */}
        <div className="flex items-center gap-3">
          <Select value={filterEmpresa} onValueChange={setFilterEmpresa}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Filtrar por empresa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as empresas</SelectItem>
              {EMPRESAS.map(e => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            {filtered.length} contato{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      Nenhum contato encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.empresa}</TableCell>
                      <TableCell>{c.area}</TableCell>
                      <TableCell>{c.unidade}</TableCell>
                      <TableCell>
                        {c.whatsapp ? (
                          <span className="flex items-center gap-1 text-green-600 text-sm">
                            <MessageCircle className="h-3.5 w-3.5" />
                            {c.whatsapp}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {c.telefone ? (
                          <span className="flex items-center gap-1 text-sm">
                            <Phone className="h-3.5 w-3.5" />
                            {c.telefone}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {c.email ? (
                          <span className="flex items-center gap-1 text-sm">
                            <Mail className="h-3.5 w-3.5" />
                            {c.email}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(c.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Contato' : 'Novo Contato'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Empresa *</Label>
                <Select value={form.empresa} onValueChange={v => setForm(p => ({ ...p, empresa: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {EMPRESAS.map(e => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Área *</Label>
                <Select value={form.area} onValueChange={v => setForm(p => ({ ...p, area: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {AREAS.map(a => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unidade</Label>
                <Input value={form.unidade} onChange={e => setForm(p => ({ ...p, unidade: e.target.value }))} placeholder="Geral" />
              </div>
              <div className="space-y-2">
                <Label>Setor</Label>
                <Input value={form.setor} onChange={e => setForm(p => ({ ...p, setor: e.target.value }))} placeholder="Opcional" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>WhatsApp</Label>
              <Input value={form.whatsapp} onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))} placeholder="5585999999999" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={form.telefone} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))} placeholder="(85) 3333-3333" />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="contato@empresa.com" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observação</Label>
              <Input value={form.observacao} onChange={e => setForm(p => ({ ...p, observacao: e.target.value }))} placeholder="Opcional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingId ? 'Salvar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
