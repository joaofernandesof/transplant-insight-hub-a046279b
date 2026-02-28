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
import { Progress } from '@/components/ui/progress';
import {
  Plus, Pencil, Trash2, Eye, KanbanSquare, List, Briefcase, DollarSign, MapPin,
  GraduationCap, Target, Users2, Zap, Crown, BarChart3, Clock, TrendingUp,
  Copy, XCircle, CheckCircle2, ChevronRight, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { cn } from '@/lib/utils';

// ── Types ──

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
  tipo_fluxo: string;
  perguntas_eliminatorias: any[];
  checklist_onboarding: any[];
  motivos_reprovacao: any[];
  etapa_updated_at: string | null;
  etapa_history: any[];
  created_at: string;
}

interface Cargo { id: string; nome: string; nivel: string; }
interface RefData { id: string; nome: string; }

// ── Flow Definitions ──

interface EtapaDef {
  id: string;
  label: string;
  shortLabel: string;
  color: string;
  dot: string;
  icon: React.ElementType;
}

const EXPRESS_ETAPAS: EtapaDef[] = [
  { id: 'solicitacao', label: 'Solicitação', shortLabel: 'Solic.', color: 'from-slate-500 to-slate-600', dot: 'bg-slate-500', icon: Briefcase },
  { id: 'captacao', label: 'Captação', shortLabel: 'Capt.', color: 'from-blue-500 to-blue-600', dot: 'bg-blue-500', icon: Users2 },
  { id: 'triagem', label: 'Triagem Técnica', shortLabel: 'Triag.', color: 'from-indigo-500 to-indigo-600', dot: 'bg-indigo-500', icon: Target },
  { id: 'entrevista_unica', label: 'Entrevista RH+Gestor', shortLabel: 'Entrev.', color: 'from-purple-500 to-purple-600', dot: 'bg-purple-500', icon: Users2 },
  { id: 'teste_rapido', label: 'Teste Prático', shortLabel: 'Teste', color: 'from-amber-500 to-amber-600', dot: 'bg-amber-500', icon: Target },
  { id: 'proposta', label: 'Proposta', shortLabel: 'Prop.', color: 'from-teal-500 to-teal-600', dot: 'bg-teal-500', icon: DollarSign },
  { id: 'contratado', label: 'Contratado', shortLabel: 'Contr.', color: 'from-emerald-500 to-emerald-600', dot: 'bg-emerald-500', icon: CheckCircle2 },
];

const EXECUTIVO_ETAPAS: EtapaDef[] = [
  { id: 'solicitacao', label: 'Solicitação', shortLabel: 'Solic.', color: 'from-slate-500 to-slate-600', dot: 'bg-slate-500', icon: Briefcase },
  { id: 'captacao', label: 'Captação', shortLabel: 'Capt.', color: 'from-blue-500 to-blue-600', dot: 'bg-blue-500', icon: Users2 },
  { id: 'triagem', label: 'Triagem Técnica', shortLabel: 'Triag.', color: 'from-indigo-500 to-indigo-600', dot: 'bg-indigo-500', icon: Target },
  { id: 'entrevista_tecnica', label: 'Entrevista Técnica', shortLabel: 'E. Téc.', color: 'from-purple-500 to-purple-600', dot: 'bg-purple-500', icon: Users2 },
  { id: 'case_pratico', label: 'Case Prático', shortLabel: 'Case', color: 'from-violet-500 to-violet-600', dot: 'bg-violet-500', icon: Target },
  { id: 'entrevista_diretor', label: 'Entrevista Diretor', shortLabel: 'E. Dir.', color: 'from-rose-500 to-rose-600', dot: 'bg-rose-500', icon: Crown },
  { id: 'proposta', label: 'Proposta', shortLabel: 'Prop.', color: 'from-teal-500 to-teal-600', dot: 'bg-teal-500', icon: DollarSign },
  { id: 'contratado', label: 'Contratado', shortLabel: 'Contr.', color: 'from-emerald-500 to-emerald-600', dot: 'bg-emerald-500', icon: CheckCircle2 },
];

const CANCELADA_ETAPA: EtapaDef = { id: 'cancelada', label: 'Cancelada', shortLabel: 'Canc.', color: 'from-red-500 to-red-600', dot: 'bg-red-500', icon: XCircle };

const getEtapas = (fluxo: string): EtapaDef[] => {
  const base = fluxo === 'executivo' ? EXECUTIVO_ETAPAS : EXPRESS_ETAPAS;
  return [...base, CANCELADA_ETAPA];
};

const ALL_ETAPAS_IDS = [...new Set([
  ...EXPRESS_ETAPAS.map(e => e.id),
  ...EXECUTIVO_ETAPAS.map(e => e.id),
  'cancelada',
])];

const MOTIVOS_REPROVACAO_PADRAO = [
  'Não atende requisitos técnicos',
  'Pretensão salarial incompatível',
  'Sem experiência necessária',
  'Falta de fit cultural',
  'Desistência do candidato',
  'Documentação incompleta',
  'Reprovado no teste prático',
  'Sem disponibilidade de horário',
  'Outro',
];

const CHECKLIST_ONBOARDING_PADRAO = [
  { id: '1', label: 'Documentação completa entregue', done: false },
  { id: '2', label: 'Contrato assinado', done: false },
  { id: '3', label: 'Exame admissional realizado', done: false },
  { id: '4', label: 'Acesso ao sistema liberado', done: false },
  { id: '5', label: 'Kit de boas-vindas entregue', done: false },
  { id: '6', label: 'Treinamento inicial agendado', done: false },
  { id: '7', label: 'Apresentação à equipe realizada', done: false },
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
  etapa_kanban: 'solicitacao',
  responsavel: '',
  data_limite: '',
  prioridade: 'normal',
  observacoes: '',
  tipo_fluxo: 'express',
  perguntas_eliminatorias: [] as any[],
  checklist_onboarding: CHECKLIST_ONBOARDING_PADRAO,
};

// ── Main ──

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
  const [fluxoFilter, setFluxoFilter] = useState<'all' | 'express' | 'executivo'>('all');
  const [showFluxoSelector, setShowFluxoSelector] = useState(false);
  const [eliminateDialog, setEliminateDialog] = useState<Vaga | null>(null);
  const [eliminateReason, setEliminateReason] = useState('');

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

  // ── Computed ──

  const filteredItems = useMemo(() => {
    if (fluxoFilter === 'all') return items;
    return items.filter(v => (v.tipo_fluxo || 'express') === fluxoFilter);
  }, [items, fluxoFilter]);

  const indicators = useMemo(() => {
    const active = items.filter(v => v.etapa_kanban !== 'cancelada' && v.etapa_kanban !== 'contratado');
    const contratados = items.filter(v => v.etapa_kanban === 'contratado');
    const cancelados = items.filter(v => v.etapa_kanban === 'cancelada');

    // Tempo médio até contratação (dias)
    const temposMedio = contratados
      .filter(v => v.data_abertura && v.etapa_updated_at)
      .map(v => {
        const start = new Date(v.data_abertura).getTime();
        const end = new Date(v.etapa_updated_at!).getTime();
        return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
      });
    const avgDays = temposMedio.length > 0 ? Math.round(temposMedio.reduce((a, b) => a + b, 0) / temposMedio.length) : 0;

    // Tempo parado na etapa atual
    const tempoParado = active.map(v => {
      if (!v.etapa_updated_at) return 0;
      return Math.round((Date.now() - new Date(v.etapa_updated_at).getTime()) / (1000 * 60 * 60 * 24));
    });
    const avgParado = tempoParado.length > 0 ? Math.round(tempoParado.reduce((a, b) => a + b, 0) / tempoParado.length) : 0;

    // Motivos de reprovação
    const motivosCount: Record<string, number> = {};
    cancelados.forEach(v => {
      const motivos = Array.isArray(v.motivos_reprovacao) ? v.motivos_reprovacao : [];
      motivos.forEach((m: string) => { motivosCount[m] = (motivosCount[m] || 0) + 1; });
    });
    const topMotivos = Object.entries(motivosCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Conversão por etapa (Express como referência)
    const allEtapas = EXPRESS_ETAPAS;
    const conversionRates = allEtapas.map((etapa, i) => {
      const inThisOrAfter = items.filter(v => {
        const flow = getEtapas(v.tipo_fluxo || 'express');
        const etapaIdx = flow.findIndex(e => e.id === v.etapa_kanban);
        const thisIdx = flow.findIndex(e => e.id === etapa.id);
        return etapaIdx >= thisIdx && v.etapa_kanban !== 'cancelada';
      }).length;
      return { etapa: etapa.shortLabel, count: inThisOrAfter, total: items.length };
    });

    return {
      total: items.length,
      active: active.length,
      contratados: contratados.length,
      cancelados: cancelados.length,
      avgDays,
      avgParado,
      topMotivos,
      conversionRates,
      express: items.filter(v => (v.tipo_fluxo || 'express') === 'express').length,
      executivo: items.filter(v => v.tipo_fluxo === 'executivo').length,
    };
  }, [items]);

  // ── Handlers ──

  const getName = (list: RefData[], id: string | null) => list.find(i => i.id === id)?.nome ?? '—';
  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const prioridadeColor = (p: string | null) => PRIORIDADES.find(x => x.value === p)?.color ?? '';

  const openNew = (etapa?: string) => {
    setShowFluxoSelector(true);
  };

  const startCreateWithFluxo = (fluxo: string) => {
    setEditing(null);
    setForm({ ...emptyForm, tipo_fluxo: fluxo, etapa_kanban: 'solicitacao' });
    setShowFluxoSelector(false);
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
      etapa_kanban: item.etapa_kanban ?? 'solicitacao',
      responsavel: item.responsavel ?? '',
      data_limite: item.data_limite ?? '',
      prioridade: item.prioridade ?? 'normal',
      observacoes: item.observacoes ?? '',
      tipo_fluxo: item.tipo_fluxo || 'express',
      perguntas_eliminatorias: Array.isArray(item.perguntas_eliminatorias) ? item.perguntas_eliminatorias : [],
      checklist_onboarding: Array.isArray(item.checklist_onboarding) && item.checklist_onboarding.length > 0
        ? item.checklist_onboarding
        : CHECKLIST_ONBOARDING_PADRAO,
    });
    setDialogOpen(true);
  };

  const duplicateVaga = (item: Vaga) => {
    setEditing(null);
    setForm({
      cargo_id: item.cargo_id,
      unidade_id: item.unidade_id,
      area_id: item.area_id,
      status: 'aberta',
      motivo_abertura: item.motivo_abertura,
      descricao_curta: `${item.descricao_curta || ''} (Cópia)`,
      requisitos: item.requisitos ?? '',
      data_abertura: new Date().toISOString().split('T')[0],
      empresa: item.empresa ?? 'TODAS',
      modalidade: item.modalidade ?? 'presencial',
      salario_fixo: item.salario_fixo ?? 0,
      tem_comissao: item.tem_comissao ?? false,
      modelo_contratacao: item.modelo_contratacao ?? 'cnpj',
      objetivo: item.objetivo ?? '',
      responsabilidades: item.responsabilidades ?? '',
      competencias: item.competencias ?? '',
      formacao: item.formacao ?? '',
      etapa_kanban: 'solicitacao',
      responsavel: item.responsavel ?? '',
      data_limite: '',
      prioridade: item.prioridade ?? 'normal',
      observacoes: '',
      tipo_fluxo: item.tipo_fluxo || 'express',
      perguntas_eliminatorias: Array.isArray(item.perguntas_eliminatorias) ? item.perguntas_eliminatorias : [],
      checklist_onboarding: Array.isArray(item.checklist_onboarding) && item.checklist_onboarding.length > 0
        ? item.checklist_onboarding
        : CHECKLIST_ONBOARDING_PADRAO,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.descricao_curta?.trim()) { toast.error('Título da vaga é obrigatório'); return; }
    const now = new Date().toISOString();
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
      etapa_kanban: form.etapa_kanban || 'solicitacao',
      responsavel: form.responsavel || null,
      data_limite: form.data_limite || null,
      prioridade: form.prioridade || 'normal',
      observacoes: form.observacoes || null,
      tipo_fluxo: form.tipo_fluxo || 'express',
      perguntas_eliminatorias: form.perguntas_eliminatorias,
      checklist_onboarding: form.checklist_onboarding,
      etapa_updated_at: now,
    };

    if (editing) {
      const { error } = await supabase.from('rh_vagas').update(payload).eq('id', editing.id);
      if (error) { toast.error('Erro ao atualizar'); return; }
      toast.success('Vaga atualizada');
    } else {
      (payload as any).etapa_history = [{ etapa: form.etapa_kanban, at: now }];
      const { error } = await supabase.from('rh_vagas').insert(payload);
      if (error) { toast.error('Erro ao criar'); return; }
      toast.success('Vaga criada');
    }
    setDialogOpen(false);
    load();
  };

  const moveToEtapa = async (vaga: Vaga, newEtapa: string) => {
    const now = new Date().toISOString();
    const history = Array.isArray(vaga.etapa_history) ? vaga.etapa_history : [];
    history.push({ etapa: newEtapa, at: now });
    await supabase.from('rh_vagas').update({
      etapa_kanban: newEtapa,
      etapa_updated_at: now,
      etapa_history: history,
    }).eq('id', vaga.id);
    toast.success('Etapa atualizada');
    load();
  };

  const eliminateVaga = async () => {
    if (!eliminateDialog || !eliminateReason) return;
    const motivos = Array.isArray(eliminateDialog.motivos_reprovacao) ? eliminateDialog.motivos_reprovacao : [];
    motivos.push(eliminateReason);
    const now = new Date().toISOString();
    const history = Array.isArray(eliminateDialog.etapa_history) ? eliminateDialog.etapa_history : [];
    history.push({ etapa: 'cancelada', at: now, motivo: eliminateReason });
    await supabase.from('rh_vagas').update({
      etapa_kanban: 'cancelada',
      etapa_updated_at: now,
      motivos_reprovacao: motivos,
      etapa_history: history,
    }).eq('id', eliminateDialog.id);
    toast.success('Vaga cancelada');
    setEliminateDialog(null);
    setEliminateReason('');
    setDetailVaga(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir esta vaga permanentemente?')) return;
    await supabase.from('rh_vagas').delete().eq('id', id);
    toast.success('Excluída');
    load();
  };

  const getDaysInEtapa = (vaga: Vaga) => {
    if (!vaga.etapa_updated_at) return 0;
    return Math.max(0, Math.round((Date.now() - new Date(vaga.etapa_updated_at).getTime()) / (1000 * 60 * 60 * 24)));
  };

  const etapaLabel = (v: Vaga) => {
    const etapas = getEtapas(v.tipo_fluxo || 'express');
    return etapas.find(e => e.id === v.etapa_kanban)?.label ?? v.etapa_kanban ?? '—';
  };

  // ── Render ──

  return (
    <div className="p-4 lg:p-6 pt-14 lg:pt-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Pipeline de Contratações</h1>
          <p className="text-sm text-muted-foreground">Fluxo Express & Executivo • Menos etapas, mais decisão</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Fluxo filter */}
          <div className="flex rounded-lg border overflow-hidden text-xs">
            {(['all', 'express', 'executivo'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFluxoFilter(f)}
                className={cn(
                  'px-3 py-1.5 font-medium transition-colors',
                  fluxoFilter === f ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                )}
              >
                {f === 'all' ? `Todos (${items.length})` : f === 'express' ? `⚡ Express (${indicators.express})` : `👔 Executivo (${indicators.executivo})`}
              </button>
            ))}
          </div>
          {isAdmin && <Button onClick={() => openNew()}><Plus className="h-4 w-4 mr-2" />Nova Vaga</Button>}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="kanban" className="gap-2"><KanbanSquare className="h-4 w-4" />Pipeline</TabsTrigger>
          <TabsTrigger value="lista" className="gap-2"><List className="h-4 w-4" />Lista</TabsTrigger>
          <TabsTrigger value="indicadores" className="gap-2"><BarChart3 className="h-4 w-4" />Indicadores</TabsTrigger>
        </TabsList>

        {/* ═══════ KANBAN ═══════ */}
        <TabsContent value="kanban" className="mt-4">
          {/* Render separate boards per flow when filter=all, or single board */}
          {(fluxoFilter === 'all' ? ['express', 'executivo'] : [fluxoFilter]).map(fluxo => {
            const etapas = getEtapas(fluxo);
            const fluxoVagas = filteredItems.filter(v => (v.tipo_fluxo || 'express') === fluxo);
            if (fluxoFilter === 'all' && fluxoVagas.length === 0) return null;

            return (
              <div key={fluxo} className="mb-6">
                {fluxoFilter === 'all' && (
                  <div className="flex items-center gap-2 mb-3">
                    {fluxo === 'express' ? <Zap className="h-5 w-5 text-amber-500" /> : <Crown className="h-5 w-5 text-violet-500" />}
                    <h2 className="font-bold text-lg">{fluxo === 'express' ? 'Fluxo Express' : 'Fluxo Executivo'}</h2>
                    <Badge variant="outline" className="text-xs">{fluxoVagas.length} vagas</Badge>
                  </div>
                )}

                {/* Funil summary */}
                <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1">
                  {etapas.map((etapa, i) => {
                    const count = fluxoVagas.filter(v => (v.etapa_kanban || 'solicitacao') === etapa.id).length;
                    return (
                      <div key={etapa.id} className="flex items-center">
                        <div className="flex items-center gap-1.5 bg-muted/50 rounded-md px-2.5 py-1.5 whitespace-nowrap">
                          <div className={cn('w-2 h-2 rounded-full', etapa.dot)} />
                          <span className="text-[11px] font-medium">{etapa.shortLabel}</span>
                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{count}</Badge>
                        </div>
                        {i < etapas.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground/50 mx-0.5 shrink-0" />}
                      </div>
                    );
                  })}
                </div>

                {/* Board */}
                <ScrollArea className="w-full">
                  <div className="flex gap-3 pb-4">
                    {etapas.map(etapa => {
                      const etapaVagas = fluxoVagas.filter(v => (v.etapa_kanban || 'solicitacao') === etapa.id);
                      const EtapaIcon = etapa.icon;
                      return (
                        <div key={etapa.id} className="flex-shrink-0 w-[250px]">
                          <Card className="border-none shadow-sm overflow-hidden">
                            <div className={cn('px-3 py-2 bg-gradient-to-r text-white flex items-center justify-between', etapa.color)}>
                              <div className="flex items-center gap-2">
                                <EtapaIcon className="h-3.5 w-3.5" />
                                <h3 className="font-semibold text-xs">{etapa.label}</h3>
                                <Badge variant="secondary" className="bg-white/20 text-white text-[10px] h-5">{etapaVagas.length}</Badge>
                              </div>
                            </div>
                            <CardContent className="p-2 bg-muted/20 min-h-[calc(100vh-340px)]">
                              {etapaVagas.length === 0 ? (
                                <div className="flex items-center justify-center h-24 text-muted-foreground text-xs">Nenhuma vaga</div>
                              ) : (
                                <ScrollArea className="h-[calc(100vh-380px)]">
                                  <div className="space-y-2 pr-1">
                                    {etapaVagas.map(vaga => (
                                      <VagaCard
                                        key={vaga.id}
                                        vaga={vaga}
                                        cargos={cargos}
                                        getName={getName}
                                        formatCurrency={formatCurrency}
                                        prioridadeColor={prioridadeColor}
                                        daysInEtapa={getDaysInEtapa(vaga)}
                                        onClick={() => setDetailVaga(vaga)}
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
              </div>
            );
          })}
        </TabsContent>

        {/* ═══════ LISTA ═══════ */}
        <TabsContent value="lista" className="mt-4">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Vaga</TableHead>
                <TableHead>Fluxo</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Salário</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Dias na etapa</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead className="w-[120px]" />
              </TableRow></TableHeader>
              <TableBody>
                {filteredItems.map(v => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.descricao_curta || getName(cargos, v.cargo_id)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-[10px]', v.tipo_fluxo === 'executivo' ? 'border-violet-300 text-violet-700' : 'border-amber-300 text-amber-700')}>
                        {v.tipo_fluxo === 'executivo' ? '👔 Executivo' : '⚡ Express'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{v.empresa || '—'}</TableCell>
                    <TableCell className="text-sm">{formatCurrency(v.salario_fixo || 0)}{v.tem_comissao ? ' +C' : ''}</TableCell>
                    <TableCell><Badge className="text-xs">{etapaLabel(v)}</Badge></TableCell>
                    <TableCell>
                      <span className={cn('text-xs font-medium', getDaysInEtapa(v) > 7 ? 'text-red-600' : getDaysInEtapa(v) > 3 ? 'text-amber-600' : 'text-muted-foreground')}>
                        {getDaysInEtapa(v)}d
                      </span>
                    </TableCell>
                    <TableCell><Badge className={cn('text-xs', prioridadeColor(v.prioridade))}>{v.prioridade || 'normal'}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDetailVaga(v)}><Eye className="h-3.5 w-3.5" /></Button>
                        {isAdmin && (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(v)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicateVaga(v)} title="Duplicar"><Copy className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(v.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredItems.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma vaga</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        {/* ═══════ INDICADORES ═══════ */}
        <TabsContent value="indicadores" className="mt-4 space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <KPICard icon={<Briefcase className="h-5 w-5" />} label="Vagas Ativas" value={indicators.active} color="text-blue-600" />
            <KPICard icon={<CheckCircle2 className="h-5 w-5" />} label="Contratados" value={indicators.contratados} color="text-emerald-600" />
            <KPICard icon={<Clock className="h-5 w-5" />} label="Tempo Médio (dias)" value={indicators.avgDays || '—'} color="text-amber-600" />
            <KPICard icon={<AlertTriangle className="h-5 w-5" />} label="Parado (média dias)" value={indicators.avgParado || '—'} color="text-red-600" />
            <KPICard icon={<XCircle className="h-5 w-5" />} label="Canceladas" value={indicators.cancelados} color="text-red-600" />
          </div>

          {/* Funil de conversão */}
          <Card>
            <CardContent className="p-5">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Taxa de Conversão por Etapa</h3>
              <div className="space-y-3">
                {indicators.conversionRates.map((cr, i) => {
                  const pct = cr.total > 0 ? Math.round((cr.count / cr.total) * 100) : 0;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs font-medium w-16 text-right">{cr.etapa}</span>
                      <Progress value={pct} className="flex-1 h-3" />
                      <span className="text-xs font-bold w-16">{cr.count} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Motivos de reprovação */}
          {indicators.topMotivos.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><XCircle className="h-4 w-4" /> Motivos mais Comuns de Reprovação</h3>
                <div className="space-y-2">
                  {indicators.topMotivos.map(([motivo, count], i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{motivo}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ═══════ DETAIL SHEET ═══════ */}
      <Sheet open={!!detailVaga} onOpenChange={() => setDetailVaga(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="text-lg flex items-center gap-2">
              {detailVaga?.tipo_fluxo === 'executivo' ? <Crown className="h-5 w-5 text-violet-500" /> : <Zap className="h-5 w-5 text-amber-500" />}
              {detailVaga?.descricao_curta || 'Detalhes'}
            </SheetTitle>
          </SheetHeader>
          {detailVaga && (
            <div className="mt-4 space-y-4">
              {/* Flow badge + Days */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={cn('text-xs', detailVaga.tipo_fluxo === 'executivo' ? 'border-violet-300 text-violet-700' : 'border-amber-300 text-amber-700')}>
                  {detailVaga.tipo_fluxo === 'executivo' ? '👔 Executivo' : '⚡ Express'}
                </Badge>
                <Badge className="text-xs">{etapaLabel(detailVaga)}</Badge>
                <Badge variant="outline" className={cn('text-xs', getDaysInEtapa(detailVaga) > 7 ? 'border-red-300 text-red-700' : '')}>
                  {getDaysInEtapa(detailVaga)}d nesta etapa
                </Badge>
              </div>

              {/* Quick actions */}
              {isAdmin && (
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => { setDetailVaga(null); openEdit(detailVaga); }}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setDetailVaga(null); duplicateVaga(detailVaga); }}>
                    <Copy className="h-3.5 w-3.5 mr-1" /> Duplicar
                  </Button>
                  <Select
                    value={detailVaga.etapa_kanban || 'solicitacao'}
                    onValueChange={val => {
                      moveToEtapa(detailVaga, val);
                      setDetailVaga({ ...detailVaga, etapa_kanban: val, etapa_updated_at: new Date().toISOString() });
                    }}
                  >
                    <SelectTrigger className="h-8 w-[180px] text-xs"><SelectValue placeholder="Mover para..." /></SelectTrigger>
                    <SelectContent>
                      {getEtapas(detailVaga.tipo_fluxo || 'express').map(e => (
                        <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {detailVaga.etapa_kanban !== 'cancelada' && (
                    <Button size="sm" variant="destructive" onClick={() => setEliminateDialog(detailVaga)}>
                      <XCircle className="h-3.5 w-3.5 mr-1" /> Cancelar Vaga
                    </Button>
                  )}
                </div>
              )}

              {/* Progress bar */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Progresso no Pipeline</p>
                {(() => {
                  const etapas = getEtapas(detailVaga.tipo_fluxo || 'express').filter(e => e.id !== 'cancelada');
                  const currentIdx = etapas.findIndex(e => e.id === detailVaga.etapa_kanban);
                  const pct = detailVaga.etapa_kanban === 'cancelada' ? 0 : currentIdx >= 0 ? Math.round(((currentIdx + 1) / etapas.length) * 100) : 0;
                  return <Progress value={pct} className="h-2" />;
                })()}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3">
                <InfoBlock icon={<Briefcase className="h-4 w-4" />} label="Empresa" value={detailVaga.empresa || '—'} />
                <InfoBlock icon={<MapPin className="h-4 w-4" />} label="Modalidade" value={detailVaga.modalidade?.replace('_', ' ') || '—'} />
                <InfoBlock icon={<DollarSign className="h-4 w-4" />} label="Salário" value={`${formatCurrency(detailVaga.salario_fixo || 0)}${detailVaga.tem_comissao ? ' + Comissão' : ''}`} />
                <InfoBlock icon={<Briefcase className="h-4 w-4" />} label="Modelo" value={detailVaga.modelo_contratacao?.toUpperCase().replace('_', ' / ') || '—'} />
              </div>

              {detailVaga.objetivo && (<><Separator /><div><div className="flex items-center gap-2 mb-1"><Target className="h-4 w-4 text-muted-foreground" /><p className="text-sm font-semibold">Objetivo</p></div><p className="text-sm text-muted-foreground">{detailVaga.objetivo}</p></div></>)}
              {detailVaga.responsabilidades && (<div><p className="text-sm font-semibold mb-1">Responsabilidades</p><ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">{detailVaga.responsabilidades.split(';').map((r, i) => r.trim() && <li key={i}>{r.trim()}</li>)}</ul></div>)}
              {detailVaga.competencias && (<div><div className="flex items-center gap-2 mb-1"><Users2 className="h-4 w-4 text-muted-foreground" /><p className="text-sm font-semibold">Competências</p></div><p className="text-sm text-muted-foreground">{detailVaga.competencias}</p></div>)}
              {detailVaga.formacao && (<div><div className="flex items-center gap-2 mb-1"><GraduationCap className="h-4 w-4 text-muted-foreground" /><p className="text-sm font-semibold">Formação</p></div><p className="text-sm text-muted-foreground">{detailVaga.formacao}</p></div>)}

              {/* Perguntas Eliminatórias */}
              {Array.isArray(detailVaga.perguntas_eliminatorias) && detailVaga.perguntas_eliminatorias.length > 0 && (
                <><Separator /><div><p className="text-sm font-semibold mb-2">Perguntas Eliminatórias (Triagem)</p><ul className="space-y-1">{detailVaga.perguntas_eliminatorias.map((p: any, i: number) => (<li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><span className="font-bold text-xs mt-0.5">{i+1}.</span>{p.pergunta}</li>))}</ul></div></>
              )}

              {/* Checklist Onboarding */}
              {detailVaga.etapa_kanban === 'contratado' && Array.isArray(detailVaga.checklist_onboarding) && detailVaga.checklist_onboarding.length > 0 && (
                <><Separator /><div><p className="text-sm font-semibold mb-2 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" />Checklist de Onboarding</p><ul className="space-y-2">{detailVaga.checklist_onboarding.map((item: any, i: number) => (<li key={i} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={item.done} className="rounded" readOnly /><span className={item.done ? 'line-through text-muted-foreground' : ''}>{item.label}</span></li>))}</ul></div></>
              )}

              {/* Histórico */}
              {Array.isArray(detailVaga.etapa_history) && detailVaga.etapa_history.length > 0 && (
                <><Separator /><div><p className="text-sm font-semibold mb-2">Histórico de Etapas</p><div className="space-y-1">{detailVaga.etapa_history.map((h: any, i: number) => (<div key={i} className="flex items-center justify-between text-xs text-muted-foreground"><span>{h.etapa}</span><span>{new Date(h.at).toLocaleDateString('pt-BR')}</span></div>))}</div></div></>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ═══════ FLUXO SELECTOR ═══════ */}
      <Dialog open={showFluxoSelector} onOpenChange={setShowFluxoSelector}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Qual tipo de fluxo?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">Escolha o pipeline ideal para esta vaga.</p>
          <div className="grid gap-3">
            <button onClick={() => startCreateWithFluxo('express')} className="p-4 rounded-lg border hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition text-left">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30"><Zap className="h-5 w-5 text-amber-600" /></div>
                <div><h3 className="font-bold text-sm">⚡ Fluxo Express</h3><p className="text-[10px] text-muted-foreground">7 etapas • Decisão rápida</p></div>
              </div>
              <p className="text-xs text-muted-foreground">Para vagas comerciais, SDR, operacional e funções técnicas de execução. Entrevista única RH+Gestor, teste prático rápido.</p>
            </button>
            <button onClick={() => startCreateWithFluxo('executivo')} className="p-4 rounded-lg border hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition text-left">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30"><Crown className="h-5 w-5 text-violet-600" /></div>
                <div><h3 className="font-bold text-sm">👔 Fluxo Executivo</h3><p className="text-[10px] text-muted-foreground">8 etapas • Análise completa</p></div>
              </div>
              <p className="text-xs text-muted-foreground">Para coordenadores, gerentes e cargos estratégicos. Inclui case prático e entrevista final com diretor.</p>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════ ELIMINATE DIALOG ═══════ */}
      <Dialog open={!!eliminateDialog} onOpenChange={() => setEliminateDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><XCircle className="h-5 w-5 text-destructive" />Cancelar Vaga</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Selecione o motivo do cancelamento:</p>
          <div className="space-y-2 mt-2">
            {MOTIVOS_REPROVACAO_PADRAO.map(m => (
              <button
                key={m}
                onClick={() => setEliminateReason(m)}
                className={cn('w-full text-left px-3 py-2 rounded-md text-sm border transition', eliminateReason === m ? 'border-destructive bg-destructive/10 font-medium' : 'hover:bg-muted')}
              >
                {m}
              </button>
            ))}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEliminateDialog(null)}>Voltar</Button>
            <Button variant="destructive" onClick={eliminateVaga} disabled={!eliminateReason}>Confirmar Cancelamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════ CREATE/EDIT DIALOG ═══════ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {form.tipo_fluxo === 'executivo' ? <Crown className="h-5 w-5 text-violet-500" /> : <Zap className="h-5 w-5 text-amber-500" />}
              {editing ? 'Editar Vaga' : 'Nova Vaga'} — {form.tipo_fluxo === 'executivo' ? 'Executivo' : 'Express'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
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
                  <SelectContent><SelectItem value="__none">Nenhum</SelectItem>{cargos.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Modalidade</Label>
                <Select value={form.modalidade} onValueChange={v => setForm(f => ({ ...f, modalidade: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{MODALIDADES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Modelo</Label>
                <Select value={form.modelo_contratacao || 'cnpj'} onValueChange={v => setForm(f => ({ ...f, modelo_contratacao: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{MODELOS_CONTRATACAO.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Motivo</Label>
                <Select value={form.motivo_abertura} onValueChange={v => setForm(f => ({ ...f, motivo_abertura: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{MOTIVOS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
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
                  <SelectContent>{PRIORIDADES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Unidade</Label>
                <Select value={form.unidade_id ?? '__none'} onValueChange={v => setForm(f => ({ ...f, unidade_id: v === '__none' ? null : v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent><SelectItem value="__none">Todas</SelectItem>{unidades.map(u => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Área</Label>
                <Select value={form.area_id ?? '__none'} onValueChange={v => setForm(f => ({ ...f, area_id: v === '__none' ? null : v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent><SelectItem value="__none">Nenhuma</SelectItem>{areas.map(a => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <Separator />
            <h3 className="font-bold text-sm flex items-center gap-2"><Target className="h-4 w-4" /> Job Description</h3>

            <div className="grid gap-2">
              <Label>Objetivo do Cargo</Label>
              <Textarea value={form.objetivo} onChange={e => setForm(f => ({ ...f, objetivo: e.target.value }))} rows={2} placeholder="Qual o objetivo principal?" />
            </div>
            <div className="grid gap-2">
              <Label>Responsabilidades (separe por ;)</Label>
              <Textarea value={form.responsabilidades} onChange={e => setForm(f => ({ ...f, responsabilidades: e.target.value }))} rows={3} />
            </div>
            <div className="grid gap-2">
              <Label>Competências</Label>
              <Textarea value={form.competencias} onChange={e => setForm(f => ({ ...f, competencias: e.target.value }))} rows={2} />
            </div>
            <div className="grid gap-2">
              <Label>Formação</Label>
              <Input value={form.formacao} onChange={e => setForm(f => ({ ...f, formacao: e.target.value }))} />
            </div>

            {/* Perguntas eliminatórias */}
            <Separator />
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Perguntas Eliminatórias (Triagem)</h3>
                <Button variant="outline" size="sm" onClick={() => setForm(f => ({
                  ...f,
                  perguntas_eliminatorias: [...f.perguntas_eliminatorias, { pergunta: '', resposta_esperada: '' }]
                }))}>
                  <Plus className="h-3 w-3 mr-1" />Adicionar
                </Button>
              </div>
              {form.perguntas_eliminatorias.map((p: any, i: number) => (
                <div key={i} className="flex gap-2 mb-2">
                  <Input
                    className="flex-1"
                    placeholder={`Pergunta ${i + 1}`}
                    value={p.pergunta}
                    onChange={e => {
                      const arr = [...form.perguntas_eliminatorias];
                      arr[i] = { ...arr[i], pergunta: e.target.value };
                      setForm(f => ({ ...f, perguntas_eliminatorias: arr }));
                    }}
                  />
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => {
                    setForm(f => ({ ...f, perguntas_eliminatorias: f.perguntas_eliminatorias.filter((_: any, j: number) => j !== i) }));
                  }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </div>
              ))}
            </div>

            <Separator />
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Etapa Pipeline</Label>
                <Select value={form.etapa_kanban} onValueChange={v => setForm(f => ({ ...f, etapa_kanban: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{getEtapas(form.tipo_fluxo).map(e => <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Data Abertura</Label>
                <Input type="date" value={form.data_abertura} onChange={e => setForm(f => ({ ...f, data_abertura: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Responsável</Label>
                <Input value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))} />
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

// ── Sub-components ──

function KPICard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn('p-2 rounded-lg bg-muted', color)}>{icon}</div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-[11px] text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

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

function VagaCard({
  vaga, cargos, getName, formatCurrency, prioridadeColor, daysInEtapa, onClick,
}: {
  vaga: Vaga; cargos: Cargo[]; getName: (list: RefData[], id: string | null) => string;
  formatCurrency: (v: number) => string; prioridadeColor: (p: string | null) => string;
  daysInEtapa: number; onClick: () => void;
}) {
  return (
    <div onClick={onClick} className="bg-background rounded-lg p-3 shadow-sm border border-border/50 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer space-y-2">
      <div className="flex items-start justify-between gap-1">
        <p className="text-sm font-semibold line-clamp-2">{vaga.descricao_curta || getName(cargos, vaga.cargo_id)}</p>
        <Badge className={cn('text-[9px] h-4 shrink-0', prioridadeColor(vaga.prioridade))}>{vaga.prioridade}</Badge>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <Badge variant="outline" className={cn('text-[9px] h-4', vaga.tipo_fluxo === 'executivo' ? 'border-violet-300 text-violet-600' : 'border-amber-300 text-amber-600')}>
          {vaga.tipo_fluxo === 'executivo' ? '👔' : '⚡'}
        </Badge>
        <Badge variant="outline" className="text-[10px] h-5 uppercase">{vaga.modelo_contratacao || '—'}</Badge>
        <Badge variant="outline" className="text-[10px] h-5 capitalize">{vaga.modalidade?.replace('_', ' ') || '—'}</Badge>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatCurrency(vaga.salario_fixo || 0)}{vaga.tem_comissao ? ' +C' : ''}</span>
        <span className={cn('font-medium', daysInEtapa > 7 ? 'text-red-500' : daysInEtapa > 3 ? 'text-amber-500' : '')}>
          {daysInEtapa > 0 ? `${daysInEtapa}d` : 'Hoje'}
        </span>
      </div>
    </div>
  );
}
