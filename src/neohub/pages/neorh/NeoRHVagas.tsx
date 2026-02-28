import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

interface Vaga {
  id: string;
  cargo_id: string | null;
  unidade_id: string | null;
  area_id: string | null;
  status: string;
  motivo_abertura: string;
  descricao_curta: string | null;
  requisitos: string | null;
  data_abertura: string;
}

interface Cargo {
  id: string; nome: string; nivel: string; responsabilidades: string | null;
  competencias: string | null; formacao: string | null; modelo_contratacao: string;
}

interface RefData { id: string; nome: string; }

const STATUSES = ['aberta', 'triagem', 'entrevistas', 'proposta', 'contratada', 'cancelada'];
const MOTIVOS = [
  { value: 'expansao', label: 'Expansão' },
  { value: 'reposicao', label: 'Reposição' },
  { value: 'urgente', label: 'Urgente' },
];

const emptyForm = {
  cargo_id: null as string | null,
  unidade_id: null as string | null,
  area_id: null as string | null,
  status: 'aberta',
  motivo_abertura: 'expansao',
  descricao_curta: '',
  requisitos: '',
  data_abertura: new Date().toISOString().split('T')[0],
};

export default function NeoRHVagas() {
  const { isAdmin } = useUnifiedAuth();
  const [items, setItems] = useState<Vaga[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [unidades, setUnidades] = useState<RefData[]>([]);
  const [areas, setAreas] = useState<RefData[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Vaga | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [detailVaga, setDetailVaga] = useState<Vaga | null>(null);

  const load = async () => {
    const [v, c, u, a] = await Promise.all([
      supabase.from('rh_vagas').select('*').order('data_abertura', { ascending: false }),
      supabase.from('rh_cargos').select('id,nome,nivel,responsabilidades,competencias,formacao,modelo_contratacao').order('nome'),
      supabase.from('rh_unidades').select('id,nome').eq('status', 'ativa').order('nome'),
      supabase.from('rh_areas').select('id,nome').eq('status', 'ativa').order('nome'),
    ]);
    setItems((v.data ?? []) as Vaga[]);
    setCargos((c.data ?? []) as Cargo[]);
    setUnidades(u.data ?? []);
    setAreas(a.data ?? []);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return items.filter(i => filterStatus === 'all' || i.status === filterStatus);
  }, [items, filterStatus]);

  const openNew = () => { setEditing(null); setForm({...emptyForm}); setDialogOpen(true); };
  const openEdit = (item: Vaga) => {
    setEditing(item);
    setForm({
      cargo_id: item.cargo_id,
      unidade_id: item.unidade_id,
      area_id: item.area_id,
      status: item.status,
      motivo_abertura: item.motivo_abertura,
      descricao_curta: item.descricao_curta ?? '',
      requisitos: item.requisitos ?? '',
      data_abertura: item.data_abertura,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.cargo_id) { toast.error('Cargo é obrigatório'); return; }
    const payload = {
      cargo_id: form.cargo_id,
      unidade_id: form.unidade_id || null,
      area_id: form.area_id || null,
      status: form.status,
      motivo_abertura: form.motivo_abertura,
      descricao_curta: form.descricao_curta || null,
      requisitos: form.requisitos || null,
      data_abertura: form.data_abertura,
    };

    if (editing) {
      const { error } = await supabase.from('rh_vagas').update(payload).eq('id', editing.id);
      if (error) { toast.error('Erro ao atualizar'); return; }
      toast.success('Vaga atualizada');
    } else {
      const { error } = await supabase.from('rh_vagas').insert(payload);
      if (error) { toast.error('Erro ao criar'); return; }
      toast.success('Vaga criada');
    }
    setDialogOpen(false);
    load();
  };

  const updateStatus = async (id: string, newStatus: string) => {
    await supabase.from('rh_vagas').update({ status: newStatus }).eq('id', id);
    toast.success('Status atualizado');
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir esta vaga?')) return;
    await supabase.from('rh_vagas').delete().eq('id', id);
    toast.success('Excluída');
    load();
  };

  const getName = (list: RefData[], id: string | null) => list.find(i => i.id === id)?.nome ?? '—';
  const getCargo = (id: string | null) => cargos.find(c => c.id === id);

  const statusColors: Record<string, string> = {
    aberta: 'bg-emerald-100 text-emerald-800',
    triagem: 'bg-blue-100 text-blue-800',
    entrevistas: 'bg-purple-100 text-purple-800',
    proposta: 'bg-amber-100 text-amber-800',
    contratada: 'bg-green-100 text-green-800',
    cancelada: 'bg-red-100 text-red-800',
  };

  const motivoColors: Record<string, string> = {
    expansao: 'bg-blue-100 text-blue-800',
    reposicao: 'bg-amber-100 text-amber-800',
    urgente: 'bg-red-100 text-red-800',
  };

  const selectedCargo = detailVaga ? getCargo(detailVaga.cargo_id) : null;

  return (
    <div className="p-4 lg:p-6 pt-14 lg:pt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Vagas</h1>
        {isAdmin && <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Nova Vaga</Button>}
      </div>

      <div className="flex gap-2">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cargo</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Abertura</TableHead>
                <TableHead className="w-[120px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(v => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{getName(cargos, v.cargo_id)}</TableCell>
                  <TableCell>{getName(unidades, v.unidade_id)}</TableCell>
                  <TableCell>{getName(areas, v.area_id)}</TableCell>
                  <TableCell>
                    {isAdmin ? (
                      <Select value={v.status} onValueChange={val => updateStatus(v.id, val)}>
                        <SelectTrigger className="h-7 w-[130px]">
                          <Badge className={statusColors[v.status] || ''}>{v.status}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={statusColors[v.status] || ''}>{v.status}</Badge>
                    )}
                  </TableCell>
                  <TableCell><Badge className={motivoColors[v.motivo_abertura] || ''}>{v.motivo_abertura}</Badge></TableCell>
                  <TableCell className="text-sm">{new Date(v.data_abertura).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setDetailVaga(v)}><Eye className="h-4 w-4" /></Button>
                      {isAdmin && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(v)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => remove(v.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma vaga encontrada</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Sheet with Job Description */}
      <Sheet open={!!detailVaga} onOpenChange={() => setDetailVaga(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalhes da Vaga</SheetTitle>
          </SheetHeader>
          {detailVaga && (
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Cargo</p>
                <p className="font-semibold text-lg">{getName(cargos, detailVaga.cargo_id)}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Unidade</p>
                  <p className="font-medium">{getName(unidades, detailVaga.unidade_id)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Área</p>
                  <p className="font-medium">{getName(areas, detailVaga.area_id)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={statusColors[detailVaga.status] || ''}>{detailVaga.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Motivo</p>
                  <Badge className={motivoColors[detailVaga.motivo_abertura] || ''}>{detailVaga.motivo_abertura}</Badge>
                </div>
              </div>
              {detailVaga.descricao_curta && (
                <div>
                  <p className="text-sm text-muted-foreground">Descrição</p>
                  <p>{detailVaga.descricao_curta}</p>
                </div>
              )}
              {detailVaga.requisitos && (
                <div>
                  <p className="text-sm text-muted-foreground">Requisitos</p>
                  <p>{detailVaga.requisitos}</p>
                </div>
              )}

              {selectedCargo && (
                <>
                  <Separator />
                  <h3 className="font-bold text-lg">Job Description</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Nível</p>
                      <Badge className="capitalize">{selectedCargo.nivel}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Modelo de Contratação</p>
                      <p className="uppercase text-sm">{selectedCargo.modelo_contratacao.replace('_', ' / ')}</p>
                    </div>
                    {selectedCargo.responsabilidades && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Responsabilidades</p>
                        <ul className="list-disc pl-4 space-y-1 text-sm">
                          {selectedCargo.responsabilidades.split(';').map((r, i) => r.trim() && <li key={i}>{r.trim()}</li>)}
                        </ul>
                      </div>
                    )}
                    {selectedCargo.competencias && (
                      <div>
                        <p className="text-sm text-muted-foreground">Competências</p>
                        <p className="text-sm">{selectedCargo.competencias}</p>
                      </div>
                    )}
                    {selectedCargo.formacao && (
                      <div>
                        <p className="text-sm text-muted-foreground">Formação</p>
                        <p className="text-sm">{selectedCargo.formacao}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Vaga' : 'Nova Vaga'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Cargo *</Label>
              <Select value={form.cargo_id ?? 'none'} onValueChange={v => setForm(f => ({...f, cargo_id: v === 'none' ? null : v}))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecione</SelectItem>
                  {cargos.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
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
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({...f, status: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Motivo</Label>
                <Select value={form.motivo_abertura} onValueChange={v => setForm(f => ({...f, motivo_abertura: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MOTIVOS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Data de Abertura</Label>
              <Input type="date" value={form.data_abertura} onChange={e => setForm(f => ({...f, data_abertura: e.target.value}))} />
            </div>
            <div className="grid gap-2">
              <Label>Descrição Curta</Label>
              <Textarea value={form.descricao_curta} onChange={e => setForm(f => ({...f, descricao_curta: e.target.value}))} rows={2} />
            </div>
            <div className="grid gap-2">
              <Label>Requisitos</Label>
              <Textarea value={form.requisitos} onChange={e => setForm(f => ({...f, requisitos: e.target.value}))} rows={3} />
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
