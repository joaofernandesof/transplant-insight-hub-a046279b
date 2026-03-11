import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft, CheckCircle2, Clock, AlertTriangle, XCircle,
  Shield, Wifi, Monitor, DollarSign, Megaphone, ChevronDown, ChevronRight,
  History,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface Process {
  id: string;
  colaborador_nome: string;
  cargo: string | null;
  setor: string | null;
  tipo_desligamento: string;
  data_desligamento: string;
  responsavel_nome: string | null;
  status: string;
  observacoes: string | null;
  validated_by: string | null;
  validated_at: string | null;
  created_at: string;
}

interface ChecklistItem {
  id: string;
  categoria: string;
  tarefa: string;
  setor_responsavel: string;
  status: string;
  executado_por: string | null;
  executado_em: string | null;
  observacao: string | null;
  order_index: number;
}

interface HistoryEntry {
  id: string;
  action: string;
  details: string | null;
  user_name: string | null;
  created_at: string;
}

const TIPO_LABELS: Record<string, string> = {
  demissao: 'Demissão',
  pedido_demissao: 'Pedido de Demissão',
  fim_contrato: 'Fim de Contrato',
  acordo_mutuo: 'Acordo Mútuo',
  justa_causa: 'Justa Causa',
};

const STATUS_LABELS: Record<string, string> = {
  aberto: 'Aberto',
  em_execucao: 'Em Execução',
  aguardando_validacao: 'Aguardando Validação',
  concluido: 'Concluído',
};

const CATEGORY_ICONS: Record<string, any> = {
  'Sistemas e Acessos Digitais': Shield,
  'Redes Sociais e Marketing': Megaphone,
  'Ferramentas Operacionais': Wifi,
  'Equipamentos e Patrimônio': Monitor,
  'Financeiro e Benefícios': DollarSign,
};

export default function OffboardingProcessDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [process, setProcess] = useState<Process | null>(null);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [editingObs, setEditingObs] = useState<string | null>(null);
  const [obsText, setObsText] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const loadAll = async () => {
    if (!id) return;
    const [pRes, iRes, hRes] = await Promise.all([
      supabase.from('rh_offboarding_processes').select('*').eq('id', id).single(),
      supabase.from('rh_offboarding_checklist_items').select('*').eq('process_id', id).order('order_index'),
      supabase.from('rh_offboarding_history').select('*').eq('process_id', id).order('created_at', { ascending: false }),
    ]);
    setProcess(pRes.data as Process | null);
    setItems((iRes.data || []) as ChecklistItem[]);
    setHistory((hRes.data || []) as HistoryEntry[]);
    
    // Open all categories by default
    const cats = new Set((iRes.data || []).map((i: any) => i.categoria));
    const open: Record<string, boolean> = {};
    cats.forEach(c => { open[c] = true; });
    setOpenCategories(open);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, [id]);

  const grouped = useMemo(() => {
    const map = new Map<string, ChecklistItem[]>();
    items.forEach(item => {
      const list = map.get(item.categoria) || [];
      list.push(item);
      map.set(item.categoria, list);
    });
    return Array.from(map.entries());
  }, [items]);

  const progress = useMemo(() => {
    if (items.length === 0) return 0;
    const done = items.filter(i => i.status === 'concluido' || i.status === 'nao_aplicavel').length;
    return Math.round((done / items.length) * 100);
  }, [items]);

  const pendingCount = items.filter(i => i.status === 'pendente').length;
  const canValidate = pendingCount === 0 && items.length > 0 && process?.status !== 'concluido';

  const updateItemStatus = async (itemId: string, newStatus: string, tarefa: string) => {
    const updates: any = { status: newStatus };
    if (newStatus === 'concluido') {
      updates.executado_em = new Date().toISOString();
      updates.executado_por = 'Usuário atual';
    } else {
      updates.executado_em = null;
      updates.executado_por = null;
    }

    await supabase.from('rh_offboarding_checklist_items').update(updates).eq('id', itemId);
    
    // Log
    await supabase.from('rh_offboarding_history').insert({
      process_id: id!,
      action: `Item ${newStatus === 'concluido' ? 'concluído' : newStatus === 'nao_aplicavel' ? 'marcado como N/A' : 'reaberto'}`,
      details: tarefa,
      user_name: 'Usuário atual',
    });

    // Auto-update process status
    if (process?.status === 'aberto') {
      await supabase.from('rh_offboarding_processes').update({ status: 'em_execucao', updated_at: new Date().toISOString() }).eq('id', id!);
    }

    await loadAll();
    toast.success(`Item ${newStatus === 'concluido' ? 'concluído' : newStatus === 'nao_aplicavel' ? 'marcado N/A' : 'reaberto'}`);
  };

  const saveObservation = async (itemId: string) => {
    await supabase.from('rh_offboarding_checklist_items').update({ observacao: obsText || null }).eq('id', itemId);
    setEditingObs(null);
    setObsText('');
    await loadAll();
    toast.success('Observação salva');
  };

  const handleValidate = async () => {
    await supabase.from('rh_offboarding_processes').update({
      status: 'concluido',
      validated_by: 'Usuário atual',
      validated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', id!);

    await supabase.from('rh_offboarding_history').insert({
      process_id: id!,
      action: 'Processo validado e concluído',
      details: `Offboarding de ${process?.colaborador_nome} finalizado pelo RH`,
      user_name: 'Usuário atual',
    });

    await loadAll();
    toast.success('Processo de offboarding concluído!');
  };

  const handleRequestValidation = async () => {
    await supabase.from('rh_offboarding_processes').update({
      status: 'aguardando_validacao',
      updated_at: new Date().toISOString(),
    }).eq('id', id!);

    await supabase.from('rh_offboarding_history').insert({
      process_id: id!,
      action: 'Validação solicitada',
      details: 'Todos os itens foram concluídos. Aguardando validação final do RH.',
      user_name: 'Usuário atual',
    });

    await loadAll();
    toast.success('Solicitação de validação enviada');
  };

  if (loading) return <div className="p-6">Carregando...</div>;
  if (!process) return <div className="p-6">Processo não encontrado.</div>;

  const statusColor = {
    aberto: 'bg-amber-100 text-amber-800',
    em_execucao: 'bg-blue-100 text-blue-800',
    aguardando_validacao: 'bg-purple-100 text-purple-800',
    concluido: 'bg-emerald-100 text-emerald-800',
  }[process.status] || 'bg-muted text-muted-foreground';

  return (
    <div className="p-4 lg:p-6 pt-14 lg:pt-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="ghost" size="icon" onClick={() => navigate('/neoteam/rh/offboarding')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{process.colaborador_nome}</h1>
            <Badge className={statusColor}>{STATUS_LABELS[process.status] || process.status}</Badge>
          </div>
          <p className="text-muted-foreground">
            {process.cargo && `${process.cargo} • `}{process.setor && `${process.setor} • `}
            {TIPO_LABELS[process.tipo_desligamento] || process.tipo_desligamento} • 
            Desligamento: {format(new Date(process.data_desligamento), 'dd/MM/yyyy')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowHistory(!showHistory)}>
            <History className="h-4 w-4 mr-2" /> Histórico
          </Button>
          {canValidate && process.status === 'em_execucao' && (
            <Button variant="secondary" onClick={handleRequestValidation}>Solicitar Validação</Button>
          )}
          {canValidate && process.status === 'aguardando_validacao' && (
            <Button onClick={handleValidate} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <CheckCircle2 className="h-4 w-4 mr-2" /> Validar e Concluir
            </Button>
          )}
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progresso do Offboarding</span>
            <span className="text-sm text-muted-foreground">{progress}% concluído • {pendingCount} pendente(s)</span>
          </div>
          <Progress value={progress} className="h-3" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Checklist */}
        <div className={showHistory ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <div className="space-y-4">
            {grouped.map(([categoria, catItems]) => {
              const CatIcon = CATEGORY_ICONS[categoria] || Shield;
              const catDone = catItems.filter(i => i.status === 'concluido' || i.status === 'nao_aplicavel').length;
              const catTotal = catItems.length;
              const isOpen = openCategories[categoria] ?? true;

              return (
                <Card key={categoria}>
                  <Collapsible open={isOpen} onOpenChange={() => setOpenCategories(prev => ({ ...prev, [categoria]: !prev[categoria] }))}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CatIcon className="h-5 w-5 text-muted-foreground" />
                            <CardTitle className="text-base">{categoria}</CardTitle>
                            <Badge variant="outline" className="text-xs">{catDone}/{catTotal}</Badge>
                          </div>
                          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 space-y-2">
                        {catItems.map(item => (
                          <div key={item.id} className={`border rounded-lg p-3 transition-colors ${item.status === 'concluido' ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900' : item.status === 'nao_aplicavel' ? 'bg-muted/50 border-muted' : 'bg-background'}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  {item.status === 'concluido' ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                  ) : item.status === 'nao_aplicavel' ? (
                                    <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                                  ) : (
                                    <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                                  )}
                                  <span className={`text-sm font-medium ${item.status === 'nao_aplicavel' ? 'line-through text-muted-foreground' : ''}`}>
                                    {item.tarefa}
                                  </span>
                                </div>
                                <div className="ml-6 mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">{item.setor_responsavel}</Badge>
                                  {item.executado_por && <span>por {item.executado_por}</span>}
                                  {item.executado_em && <span>em {format(new Date(item.executado_em), 'dd/MM HH:mm')}</span>}
                                </div>
                                {item.observacao && (
                                  <p className="ml-6 mt-1 text-xs text-muted-foreground italic">📝 {item.observacao}</p>
                                )}
                                {editingObs === item.id && (
                                  <div className="ml-6 mt-2 flex gap-2">
                                    <Input
                                      value={obsText}
                                      onChange={e => setObsText(e.target.value)}
                                      placeholder="Adicionar observação..."
                                      className="text-xs h-8"
                                    />
                                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => saveObservation(item.id)}>Salvar</Button>
                                    <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setEditingObs(null)}>×</Button>
                                  </div>
                                )}
                              </div>
                              {process.status !== 'concluido' && (
                                <div className="flex gap-1 shrink-0">
                                  {item.status !== 'concluido' && (
                                    <Button size="sm" variant="ghost" className="h-7 text-xs text-emerald-600" onClick={() => updateItemStatus(item.id, 'concluido', item.tarefa)}>
                                      ✓
                                    </Button>
                                  )}
                                  {item.status === 'concluido' && (
                                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => updateItemStatus(item.id, 'pendente', item.tarefa)}>
                                      ↺
                                    </Button>
                                  )}
                                  {item.status !== 'nao_aplicavel' && (
                                    <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => updateItemStatus(item.id, 'nao_aplicavel', item.tarefa)}>
                                      N/A
                                    </Button>
                                  )}
                                  {item.status === 'nao_aplicavel' && (
                                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => updateItemStatus(item.id, 'pendente', item.tarefa)}>
                                      ↺
                                    </Button>
                                  )}
                                  {editingObs !== item.id && (
                                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setEditingObs(item.id); setObsText(item.observacao || ''); }}>
                                      📝
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </div>
        </div>

        {/* History Panel */}
        {showHistory && (
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4" /> Histórico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {history.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum registro</p>
                    ) : history.map(h => (
                      <div key={h.id} className="border-l-2 border-muted pl-3 pb-3">
                        <p className="text-sm font-medium">{h.action}</p>
                        {h.details && <p className="text-xs text-muted-foreground mt-0.5">{h.details}</p>}
                        <p className="text-xs text-muted-foreground mt-1">
                          {h.user_name && `${h.user_name} • `}
                          {format(new Date(h.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Validation block */}
      {process.status !== 'concluido' && pendingCount > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">Processo não pode ser concluído</p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Existem {pendingCount} item(ns) pendente(s) no checklist. Conclua ou marque como N/A todos os itens antes de validar.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {process.status === 'concluido' && (
        <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="font-medium text-emerald-800 dark:text-emerald-200">Processo concluído</p>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  Validado por {process.validated_by || '—'} em {process.validated_at ? format(new Date(process.validated_at), "dd/MM/yyyy HH:mm") : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
