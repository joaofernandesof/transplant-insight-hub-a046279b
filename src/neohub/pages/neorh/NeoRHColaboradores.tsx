import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

interface Colaborador {
  id: string;
  nome: string;
  cpf: string | null;
  email: string | null;
  telefone: string | null;
  status: string;
  unidade_id: string | null;
  area_id: string | null;
  cargo_id: string | null;
  gestor_nome: string | null;
  modelo_contratacao: string;
  salario_fixo: number | null;
  tem_comissao: boolean;
  observacoes: string | null;
}

interface RefData { id: string; nome: string; }

const emptyForm: Omit<Colaborador, 'id'> = {
  nome: '', cpf: null, email: null, telefone: null, status: 'ativo',
  unidade_id: null, area_id: null, cargo_id: null, gestor_nome: null,
  modelo_contratacao: 'clt', salario_fixo: null, tem_comissao: false, observacoes: null,
};

export default function NeoRHColaboradores() {
  const { isAdmin } = useUnifiedAuth();
  const [items, setItems] = useState<Colaborador[]>([]);
  const [unidades, setUnidades] = useState<RefData[]>([]);
  const [areas, setAreas] = useState<RefData[]>([]);
  const [cargos, setCargos] = useState<RefData[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterUnidade, setFilterUnidade] = useState('all');
  const [filterArea, setFilterArea] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Colaborador | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    const [c, u, a, ca] = await Promise.all([
      supabase.from('rh_colaboradores').select('*').order('nome'),
      supabase.from('rh_unidades').select('id,nome').eq('status', 'ativa').order('nome'),
      supabase.from('rh_areas').select('id,nome').eq('status', 'ativa').order('nome'),
      supabase.from('rh_cargos').select('id,nome').order('nome'),
    ]);
    setItems((c.data ?? []) as Colaborador[]);
    setUnidades(u.data ?? []);
    setAreas(a.data ?? []);
    setCargos(ca.data ?? []);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return items.filter(i => {
      if (filterStatus !== 'all' && i.status !== filterStatus) return false;
      if (filterUnidade !== 'all' && i.unidade_id !== filterUnidade) return false;
      if (filterArea !== 'all' && i.area_id !== filterArea) return false;
      if (search && !i.nome.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [items, search, filterStatus, filterUnidade, filterArea]);

  const openNew = () => { setEditing(null); setForm({...emptyForm}); setDialogOpen(true); };
  const openEdit = (item: Colaborador) => {
    setEditing(item);
    setForm({ ...item });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.nome.trim()) { toast.error('Nome é obrigatório'); return; }
    const payload = {
      nome: form.nome,
      cpf: form.cpf || null,
      email: form.email || null,
      telefone: form.telefone || null,
      status: form.status,
      unidade_id: form.unidade_id || null,
      area_id: form.area_id || null,
      cargo_id: form.cargo_id || null,
      gestor_nome: form.gestor_nome || null,
      modelo_contratacao: form.modelo_contratacao,
      salario_fixo: form.salario_fixo,
      tem_comissao: form.tem_comissao,
      observacoes: form.observacoes || null,
    };

    if (editing) {
      const { error } = await supabase.from('rh_colaboradores').update(payload).eq('id', editing.id);
      if (error) { toast.error('Erro ao atualizar'); return; }
      toast.success('Colaborador atualizado');
    } else {
      const { error } = await supabase.from('rh_colaboradores').insert(payload);
      if (error) { toast.error('Erro ao criar'); return; }
      toast.success('Colaborador criado');
    }
    setDialogOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir este colaborador?')) return;
    await supabase.from('rh_colaboradores').delete().eq('id', id);
    toast.success('Excluído');
    load();
  };

  const getName = (list: RefData[], id: string | null) => list.find(i => i.id === id)?.nome ?? '—';

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { ativo: 'bg-emerald-100 text-emerald-800', afastado: 'bg-amber-100 text-amber-800', desligado: 'bg-red-100 text-red-800' };
    return <Badge className={map[s] || ''}>{s}</Badge>;
  };

  return (
    <div className="p-4 lg:p-6 pt-14 lg:pt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Colaboradores</h1>
        {isAdmin && <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Novo</Button>}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="afastado">Afastado</SelectItem>
                <SelectItem value="desligado">Desligado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterUnidade} onValueChange={setFilterUnidade}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Unidade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Unidades</SelectItem>
                {unidades.map(u => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterArea} onValueChange={setFilterArea}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Área" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Áreas</SelectItem>
                {areas.map(a => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contrato</TableHead>
                {isAdmin && <TableHead className="w-[80px]" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell>{getName(cargos, c.cargo_id)}</TableCell>
                  <TableCell>{getName(unidades, c.unidade_id)}</TableCell>
                  <TableCell>{getName(areas, c.area_id)}</TableCell>
                  <TableCell>{statusBadge(c.status)}</TableCell>
                  <TableCell className="uppercase text-xs">{c.modelo_contratacao}</TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum colaborador encontrado</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Colaborador' : 'Novo Colaborador'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={e => setForm(f => ({...f, nome: e.target.value}))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>CPF</Label>
                <Input value={form.cpf ?? ''} onChange={e => setForm(f => ({...f, cpf: e.target.value}))} />
              </div>
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input type="email" value={form.email ?? ''} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Telefone</Label>
                <Input value={form.telefone ?? ''} onChange={e => setForm(f => ({...f, telefone: e.target.value}))} />
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({...f, status: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="afastado">Afastado</SelectItem>
                    <SelectItem value="desligado">Desligado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Unidade</Label>
                <Select value={form.unidade_id ?? 'none'} onValueChange={v => setForm(f => ({...f, unidade_id: v === 'none' ? null : v}))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {unidades.map(u => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Área</Label>
                <Select value={form.area_id ?? 'none'} onValueChange={v => setForm(f => ({...f, area_id: v === 'none' ? null : v}))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {areas.map(a => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Cargo</Label>
                <Select value={form.cargo_id ?? 'none'} onValueChange={v => setForm(f => ({...f, cargo_id: v === 'none' ? null : v}))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {cargos.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Gestor</Label>
                <Input value={form.gestor_nome ?? ''} onChange={e => setForm(f => ({...f, gestor_nome: e.target.value}))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Contratação</Label>
                <Select value={form.modelo_contratacao} onValueChange={v => setForm(f => ({...f, modelo_contratacao: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clt">CLT</SelectItem>
                    <SelectItem value="cnpj">CNPJ</SelectItem>
                    <SelectItem value="estagio">Estágio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Salário Fixo</Label>
                <Input type="number" value={form.salario_fixo ?? ''} onChange={e => setForm(f => ({...f, salario_fixo: e.target.value ? Number(e.target.value) : null}))} />
              </div>
              <div className="grid gap-2">
                <Label>Comissão?</Label>
                <Select value={form.tem_comissao ? 'sim' : 'nao'} onValueChange={v => setForm(f => ({...f, tem_comissao: v === 'sim'}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sim">Sim</SelectItem>
                    <SelectItem value="nao">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Observações</Label>
              <Textarea value={form.observacoes ?? ''} onChange={e => setForm(f => ({...f, observacoes: e.target.value}))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
