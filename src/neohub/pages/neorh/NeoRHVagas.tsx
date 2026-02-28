import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Plus, Pencil, Trash2, Eye, KanbanSquare, List, GripVertical, Briefcase, DollarSign, MapPin, GraduationCap, Target, Users2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { cn } from '@/lib/utils';

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
  empresa: string | null;
  modalidade: string | null;
  salario_fixo: number | null;
  tem_comissao: boolean | null;
  modelo_contratacao: string | null;
  objetivo: string | null;
  responsabilidades: string | null;
  competencias: string | null;
  formacao: string | null;
  etapa_kanban: string | null;
  candidatos_count: number | null;
  responsavel: string | null;
  data_limite: string | null;
  prioridade: string | null;
  observacoes: string | null;
}

interface Cargo { id: string; nome: string; nivel: string; }
interface RefData { id: string; nome: string; }

const KANBAN_ETAPAS = [
  { id: 'pendente_abertura', label: 'Pendente Abertura', color: 'from-slate-500 to-slate-600', dot: 'bg-slate-500' },
  { id: 'vaga_aberta', label: 'Vaga Aberta', color: 'from-blue-500 to-blue-600', dot: 'bg-blue-500' },
  { id: 'triagem', label: 'Triagem de CVs', color: 'from-indigo-500 to-indigo-600', dot: 'bg-indigo-500' },
  { id: 'entrevista_rh', label: 'Entrevista RH', color: 'from-purple-500 to-purple-600', dot: 'bg-purple-500' },
  { id: 'entrevista_gestor', label: 'Entrevista Gestor', color: 'from-violet-500 to-violet-600', dot: 'bg-violet-500' },
  { id: 'teste_pratico', label: 'Teste Prático', color: 'from-amber-500 to-amber-600', dot: 'bg-amber-500' },
  { id: 'proposta', label: 'Proposta', color: 'from-teal-500 to-teal-600', dot: 'bg-teal-500' },
  { id: 'contratado', label: 'Contratado', color: 'from-emerald-500 to-emerald-600', dot: 'bg-emerald-500' },
  { id: 'cancelada', label: 'Cancelada', color: 'from-red-500 to-red-600', dot: 'bg-red-500' },
];

const MODALIDADES = [
  { value: 'presencial', label: 'Presencial' },
  { value: 'hibrido', label: 'Híbrido' },
  { value: 'home_office', label: 'Home Office' },
];

const MODELOS_CONTRATACAO = [
  { value: 'clt', label: 'CLT' },
  { value: 'cnpj', label: 'CNPJ' },
  { value: 'estagio', label: 'Estágio' },
  { value: 'clt_cnpj', label: 'CLT ou CNPJ' },
];

const MOTIVOS = [
  { value: 'expansao', label: 'Expansão' },
  { value: 'reposicao', label: 'Reposição' },
  { value: 'urgente', label: 'Urgente' },
];

const PRIORIDADES = [
  { value: 'baixa', label: 'Baixa', color: 'bg-muted text-muted-foreground' },
  { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-800' },
  { value: 'alta', label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgente', label: 'Urgente', color: 'bg-red-100 text-red-800' },
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
  empresa: 'TODAS',
  modalidade: 'presencial',
  salario_fixo: 0,
  tem_comissao: false,
  modelo_contratacao: 'cnpj',
  objetivo: '',
  responsabilidades: '',
  competencias: '',
  formacao: '',
  etapa_kanban: 'pendente_abertura',
  responsavel: '',
  data_limite: '',
  prioridade: 'normal',
  observacoes: '',
};

export default function NeoRHVagas() {
  const { isAdmin } = useUnifiedAuth();
  const [items, setItems] = useState<Vaga[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [unidades, setUnidades] = useState<RefData[]>([]);
  const [areas, setAreas] = useState<RefData[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Vaga | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [detailVaga, setDetailVaga] = useState<Vaga | null>(null);
  const [activeTab, setActiveTab] = useState('kanban');

  const load = useCallback(async () => {
    const [v, c, u, a] = await Promise.all([
      supabase.from('rh_vagas').select('*').order('data_abertura', { ascending: false }),
      supabase.from('rh_cargos').select('id,nome,nivel').order('nome'),
      supabase.from('rh_unidades').select('id,nome').eq('status', 'ativa').order('nome'),
      supabase.from('rh_areas').select('id,nome').eq('status', 'ativa').order('nome'),
    ]);
    setItems((v.data ?? []) as Vaga[]);
    setCargos((c.data ?? []) as Cargo[]);
    setUnidades(u.data ?? []);
    setAreas(a.data ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const getName = (list: RefData[], id: string | null) => list.find(i => i.id === id)?.nome ?? '—';

  const openNew = (etapa?: string) => {
    setEditing(null);
    setForm({ ...emptyForm, etapa_kanban: etapa || 'pendente_abertura' });
    setDialogOpen(true);
  };

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
      empresa: item.empresa ?? 'TODAS',
      modalidade: item.modalidade ?? 'presencial',
      salario_fixo: item.salario_fixo ?? 0,
      tem_comissao: item.tem_comissao ?? false,
      modelo_contratacao: item.modelo_contratacao ?? 'cnpj',
      objetivo: item.objetivo ?? '',
      responsabilidades: item.responsabilidades ?? '',
      competencias: item.competencias ?? '',
      formacao: item.formacao ?? '',
      etapa_kanban: item.etapa_kanban ?? 'pendente_abertura',
      responsavel: item.responsavel ?? '',
      data_limite: item.data_limite ?? '',
      prioridade: item.prioridade ?? 'normal',
      observacoes: item.observacoes ?? '',
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.descricao_curta?.trim()) { toast.error('Título da vaga é obrigatório'); return; }
    const payload: Record<string, unknown> = {
      cargo_id: form.cargo_id || null,
      unidade_id: form.unidade_id || null,
      area_id: form.area_id || null,
      status: form.status,
      motivo_abertura: form.motivo_abertura,
      descricao_curta: form.descricao_curta || null,
      requisitos: form.requisitos || null,
      data_abertura: form.data_abertura,
      empresa: form.empresa || null,
      modalidade: form.modalidade || null,
      salario_fixo: form.salario_fixo || 0,
      tem_comissao: form.tem_comissao,
      modelo_contratacao: form.modelo_contratacao || null,
      objetivo: form.objetivo || null,
      responsabilidades: form.responsabilidades || null,
      competencias: form.competencias || null,
      formacao: form.formacao || null,
      etapa_kanban: form.etapa_kanban || 'pendente_abertura',
      responsavel: form.responsavel || null,
      data_limite: form.data_limite || null,
      prioridade: form.prioridade || 'normal',
      observacoes: form.observacoes || null,
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

  const moveToEtapa = async (vagaId: string, newEtapa: string) => {
    await supabase.from('rh_vagas').update({ etapa_kanban: newEtapa }).eq('id', vagaId);
    toast.success('Etapa atualizada');
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir esta vaga?')) return;
    await supabase.from('rh_vagas').delete().eq('id', id);
    toast.success('Excluída');
    load();
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const prioridadeColor = (p: string | null) => PRIORIDADES.find(x => x.value === p)?.color ?? '';

  const etapaLabel = (e: string | null) => KANBAN_ETAPAS.find(x => x.id === e)?.label ?? e ?? '—';

  return (
    <div className="p-4 lg:p-6 pt-14 lg:pt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Controle de Vagas & Contratações</h1>
        {isAdmin && <Button onClick={() => openNew()}><Plus className="h-4 w-4 mr-2" />Nova Vaga</Button>}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="kanban" className="gap-2"><KanbanSquare className="h-4 w-4" />Pipeline</TabsTrigger>
          <TabsTrigger value="lista" className="gap-2"><List className="h-4 w-4" />Lista</TabsTrigger>
        </TabsList>

        {/* ========== KANBAN VIEW ========== */}
        <TabsContent value="kanban" className="mt-4">
          {/* Summary */}
          <div className="flex flex-wrap gap-2 mb-4">
            {KANBAN_ETAPAS.map(etapa => {
              const count = items.filter(v => (v.etapa_kanban || 'pendente_abertura') === etapa.id).length;
              return (
                <div key={etapa.id} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                  <div className={cn("w-2 h-2 rounded-full", etapa.dot)} />
                  <span className="text-xs font-medium">{etapa.label}</span>
                  <Badge variant="secondary" className="text-xs">{count}</Badge>
                </div>
              );
            })}
          </div>

          {/* Kanban Board */}
          <ScrollArea className="w-full">
            <div className="flex gap-3 pb-4">
              {KANBAN_ETAPAS.map(etapa => {
                const etapaVagas = items.filter(v => (v.etapa_kanban || 'pendente_abertura') === etapa.id);
                return (
                  <div key={etapa.id} className="flex-shrink-0 w-[260px]">
                    <Card className="border-none shadow-sm overflow-hidden">
                      {/* Column Header */}
                      <div className={cn("px-3 py-2.5 bg-gradient-to-r text-white flex items-center justify-between", etapa.color)}>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-xs">{etapa.label}</h3>
                          <Badge variant="secondary" className="bg-white/20 text-white text-[10px] h-5">{etapaVagas.length}</Badge>
                        </div>
                        {isAdmin && (
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20" onClick={() => openNew(etapa.id)}>
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>

                      {/* Cards */}
                      <CardContent className="p-2 bg-muted/20 min-h-[calc(100vh-280px)]">
                        {etapaVagas.length === 0 ? (
                          <div className="flex items-center justify-center h-[200px] text-muted-foreground text-xs">
                            Nenhuma vaga
                          </div>
                        ) : (
                          <ScrollArea className="h-[calc(100vh-320px)]">
                            <div className="space-y-2 pr-1">
                              {etapaVagas.map(vaga => (
                                <VagaKanbanCard
                                  key={vaga.id}
                                  vaga={vaga}
                                  cargos={cargos}
                                  getName={getName}
                                  formatCurrency={formatCurrency}
                                  prioridadeColor={prioridadeColor}
                                  onClick={() => setDetailVaga(vaga)}
                                  onEdit={() => openEdit(vaga)}
                                  isAdmin={isAdmin}
                                />
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </TabsContent>

        {/* ========== LIST VIEW ========== */}
        <TabsContent value="lista" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vaga</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Modalidade</TableHead>
                    <TableHead>Salário</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead className="w-[100px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(v => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.descricao_curta || getName(cargos, v.cargo_id)}</TableCell>
                      <TableCell className="text-sm">{v.empresa || '—'}</TableCell>
                      <TableCell className="text-sm capitalize">{v.modalidade?.replace('_', ' ') || '—'}</TableCell>
                      <TableCell className="text-sm">{formatCurrency(v.salario_fixo || 0)}{v.tem_comissao ? ' + Comissão' : ''}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs uppercase">{v.modelo_contratacao || '—'}</Badge></TableCell>
                      <TableCell><Badge className="text-xs">{etapaLabel(v.etapa_kanban)}</Badge></TableCell>
                      <TableCell><Badge className={cn("text-xs", prioridadeColor(v.prioridade))}>{v.prioridade || 'normal'}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDetailVaga(v)}><Eye className="h-3.5 w-3.5" /></Button>
                          {isAdmin && (
                            <>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(v)}><Pencil className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(v.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {items.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma vaga encontrada</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ========== DETAIL SHEET ========== */}
      <Sheet open={!!detailVaga} onOpenChange={() => setDetailVaga(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="text-lg">{detailVaga?.descricao_curta || 'Detalhes da Vaga'}</SheetTitle>
          </SheetHeader>
          {detailVaga && (
            <div className="mt-4 space-y-4">
              {/* Quick actions */}
              {isAdmin && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setDetailVaga(null); openEdit(detailVaga); }}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                  </Button>
                  <Select value={detailVaga.etapa_kanban || 'pendente_abertura'} onValueChange={val => { moveToEtapa(detailVaga.id, val); setDetailVaga({ ...detailVaga, etapa_kanban: val }); }}>
                    <SelectTrigger className="h-8 w-[180px] text-xs">
                      <SelectValue placeholder="Mover para..." />
                    </SelectTrigger>
                    <SelectContent>
                      {KANBAN_ETAPAS.map(e => <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <InfoBlock icon={<Briefcase className="h-4 w-4" />} label="Empresa" value={detailVaga.empresa || '—'} />
                <InfoBlock icon={<MapPin className="h-4 w-4" />} label="Modalidade" value={detailVaga.modalidade?.replace('_', ' ') || '—'} />
                <InfoBlock icon={<DollarSign className="h-4 w-4" />} label="Salário" value={`${formatCurrency(detailVaga.salario_fixo || 0)}${detailVaga.tem_comissao ? ' + Comissão' : ''}`} />
                <InfoBlock icon={<Briefcase className="h-4 w-4" />} label="Modelo" value={detailVaga.modelo_contratacao?.toUpperCase().replace('_', ' / ') || '—'} />
              </div>

              {detailVaga.objetivo && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-semibold">Objetivo</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{detailVaga.objetivo}</p>
                  </div>
                </>
              )}

              {detailVaga.responsabilidades && (
                <div>
                  <p className="text-sm font-semibold mb-1">Responsabilidades</p>
                  <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
                    {detailVaga.responsabilidades.split(';').map((r, i) => r.trim() && <li key={i}>{r.trim()}</li>)}
                  </ul>
                </div>
              )}

              {detailVaga.competencias && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Users2 className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-semibold">Competências</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{detailVaga.competencias}</p>
                </div>
              )}

              {detailVaga.formacao && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-semibold">Formação</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{detailVaga.formacao}</p>
                </div>
              )}

              {detailVaga.observacoes && (
                <div>
                  <p className="text-sm font-semibold mb-1">Observações</p>
                  <p className="text-sm text-muted-foreground">{detailVaga.observacoes}</p>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ========== CREATE/EDIT DIALOG ========== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Vaga' : 'Nova Vaga'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {/* Title & Basics */}
            <div className="grid gap-2">
              <Label>Título da Vaga *</Label>
              <Input value={form.descricao_curta} onChange={e => setForm(f => ({ ...f, descricao_curta: e.target.value }))} placeholder="Ex: Coordenação Comercial" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Empresa</Label>
                <Input value={form.empresa} onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))} placeholder="TODAS" />
              </div>
              <div className="grid gap-2">
                <Label>Cargo (vínculo)</Label>
                <Select value={form.cargo_id ?? '__none'} onValueChange={v => setForm(f => ({ ...f, cargo_id: v === '__none' ? null : v }))}>
                  <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Nenhum</SelectItem>
                    {cargos.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Modalidade</Label>
                <Select value={form.modalidade} onValueChange={v => setForm(f => ({ ...f, modalidade: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MODALIDADES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Modelo de Contratação</Label>
                <Select value={form.modelo_contratacao || 'cnpj'} onValueChange={v => setForm(f => ({ ...f, modelo_contratacao: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MODELOS_CONTRATACAO.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Motivo</Label>
                <Select value={form.motivo_abertura} onValueChange={v => setForm(f => ({ ...f, motivo_abertura: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MOTIVOS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Salário Fixo (R$)</Label>
                <Input type="number" value={form.salario_fixo} onChange={e => setForm(f => ({ ...f, salario_fixo: Number(e.target.value) }))} />
              </div>
              <div className="flex items-end gap-2 pb-1">
                <Switch checked={form.tem_comissao} onCheckedChange={v => setForm(f => ({ ...f, tem_comissao: v }))} />
                <Label>Tem Comissão</Label>
              </div>
              <div className="grid gap-2">
                <Label>Prioridade</Label>
                <Select value={form.prioridade} onValueChange={v => setForm(f => ({ ...f, prioridade: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORIDADES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Unidade</Label>
                <Select value={form.unidade_id ?? '__none'} onValueChange={v => setForm(f => ({ ...f, unidade_id: v === '__none' ? null : v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Todas</SelectItem>
                    {unidades.map(u => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Área</Label>
                <Select value={form.area_id ?? '__none'} onValueChange={v => setForm(f => ({ ...f, area_id: v === '__none' ? null : v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Nenhuma</SelectItem>
                    {areas.map(a => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />
            <h3 className="font-bold text-sm flex items-center gap-2"><Target className="h-4 w-4" /> Job Description</h3>

            <div className="grid gap-2">
              <Label>Objetivo do Cargo</Label>
              <Textarea value={form.objetivo} onChange={e => setForm(f => ({ ...f, objetivo: e.target.value }))} rows={2} placeholder="Qual o objetivo principal desta posição?" />
            </div>
            <div className="grid gap-2">
              <Label>Responsabilidades (separe por ;)</Label>
              <Textarea value={form.responsabilidades} onChange={e => setForm(f => ({ ...f, responsabilidades: e.target.value }))} rows={4} placeholder="Responsabilidade 1; Responsabilidade 2; ..." />
            </div>
            <div className="grid gap-2">
              <Label>Competências</Label>
              <Textarea value={form.competencias} onChange={e => setForm(f => ({ ...f, competencias: e.target.value }))} rows={2} placeholder="Competências necessárias" />
            </div>
            <div className="grid gap-2">
              <Label>Formação</Label>
              <Input value={form.formacao} onChange={e => setForm(f => ({ ...f, formacao: e.target.value }))} placeholder="Formação requerida" />
            </div>

            <Separator />

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Etapa Pipeline</Label>
                <Select value={form.etapa_kanban} onValueChange={v => setForm(f => ({ ...f, etapa_kanban: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {KANBAN_ETAPAS.map(e => <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Data Abertura</Label>
                <Input type="date" value={form.data_abertura} onChange={e => setForm(f => ({ ...f, data_abertura: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Responsável</Label>
                <Input value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))} placeholder="Nome do responsável" />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Observações</Label>
              <Textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={2} />
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

/* ========== Sub-components ========== */

function InfoBlock({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium capitalize">{value}</p>
      </div>
    </div>
  );
}

function VagaKanbanCard({
  vaga, cargos, getName, formatCurrency, prioridadeColor, onClick, onEdit, isAdmin
}: {
  vaga: Vaga;
  cargos: Cargo[];
  getName: (list: RefData[], id: string | null) => string;
  formatCurrency: (v: number) => string;
  prioridadeColor: (p: string | null) => string;
  onClick: () => void;
  onEdit: () => void;
  isAdmin: boolean;
}) {
  return (
    <div
      className="bg-background rounded-lg p-3 shadow-sm border border-border/50 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer space-y-2"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="text-sm font-semibold line-clamp-2">{vaga.descricao_curta || getName(cargos, vaga.cargo_id)}</p>
        <Badge className={cn("text-[9px] h-4 shrink-0", prioridadeColor(vaga.prioridade))}>
          {vaga.prioridade}
        </Badge>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <Badge variant="outline" className="text-[10px] h-5 uppercase">{vaga.modelo_contratacao || '—'}</Badge>
        <Badge variant="outline" className="text-[10px] h-5 capitalize">{vaga.modalidade?.replace('_', ' ') || '—'}</Badge>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatCurrency(vaga.salario_fixo || 0)}{vaga.tem_comissao ? ' +C' : ''}</span>
        <span>{vaga.empresa || '—'}</span>
      </div>

      {isAdmin && (
        <div className="flex justify-end">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => { e.stopPropagation(); onEdit(); }}>
            <Pencil className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
