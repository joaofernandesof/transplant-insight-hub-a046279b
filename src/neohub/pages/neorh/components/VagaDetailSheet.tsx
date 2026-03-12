import { useState, useEffect, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Pencil, Copy, XCircle, CheckCircle2, Briefcase, DollarSign, MapPin,
  Target, Users2, GraduationCap, Clock, FileText, Plus, Trash2, Link2,
  History, ClipboardList, FolderOpen, AlertTriangle, ArrowRight, Settings2,
  ExternalLink,
} from 'lucide-react';

// ── Types ──

interface EtapaDef {
  id: string;
  label: string;
  shortLabel: string;
  color: string;
  dot: string;
  icon: React.ElementType;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Vaga = any;

interface VagaDetailSheetProps {
  vaga: Vaga | null;
  onClose: () => void;
  allEtapas: EtapaDef[];
  etapas: EtapaDef[];
  isAdmin: boolean;
  onEdit: (vaga: Vaga) => void;
  onDuplicate: (vaga: Vaga) => void;
  onMoveToEtapa: (vaga: Vaga, newEtapa: string) => void;
  onEliminate: (vaga: Vaga) => void;
  formatCurrency: (v: number) => string;
  getDaysInEtapa: (v: Vaga) => number;
}

// ── Default Checklists per Etapa ──

const DEFAULT_ETAPA_CHECKLISTS: Record<string, { id: string; label: string }[]> = {
  solicitacao: [
    { id: 's1', label: 'Justificativa da vaga preenchida' },
    { id: 's2', label: 'Aprovação do gestor obtida' },
    { id: 's3', label: 'Orçamento validado pelo financeiro' },
  ],
  vaga_aprovada: [
    { id: 'va1', label: 'Job Description finalizada' },
    { id: 'va2', label: 'Canais de divulgação definidos' },
    { id: 'va3', label: 'Critérios de seleção estabelecidos' },
  ],
  vaga_aberta: [
    { id: 'vo1', label: 'Link do Indeed preenchido (obrigatório)' },
    { id: 'vo2', label: 'Anúncio publicado nas plataformas' },
    { id: 'vo3', label: 'Divulgação interna realizada' },
    { id: 'vo4', label: 'Prazo de inscrição definido' },
  ],
  selecao_curriculos: [
    { id: 'sc1', label: 'Currículos triados pelo RH' },
    { id: 'sc2', label: 'Pré-seleção enviada ao gestor' },
    { id: 'sc3', label: 'Candidatos contatados' },
  ],
  teste_tecnico: [
    { id: 'tt1', label: 'Teste técnico elaborado' },
    { id: 'tt2', label: 'Teste enviado aos candidatos' },
    { id: 'tt3', label: 'Resultados avaliados' },
  ],
  selecao_testes: [
    { id: 'st1', label: 'Notas dos testes compiladas' },
    { id: 'st2', label: 'Ranking de candidatos definido' },
    { id: 'st3', label: 'Candidatos aprovados selecionados' },
  ],
  entrevista_rh_gestor: [
    { id: 'erg1', label: 'Entrevista com RH agendada' },
    { id: 'erg2', label: 'Entrevista com gestor agendada' },
    { id: 'erg3', label: 'Feedback das entrevistas registrado' },
    { id: 'erg4', label: 'Parecer consolidado' },
  ],
  entrevista_diretor: [
    { id: 'ed1', label: 'Entrevista com diretor agendada' },
    { id: 'ed2', label: 'Parecer final registrado' },
    { id: 'ed3', label: 'Decisão de contratação tomada' },
  ],
  onboarding: [
    { id: 'ob1', label: 'Documentação completa entregue' },
    { id: 'ob2', label: 'Contrato assinado' },
    { id: 'ob3', label: 'Exame admissional realizado' },
    { id: 'ob4', label: 'Acesso ao sistema liberado' },
    { id: 'ob5', label: 'Kit de boas-vindas entregue' },
    { id: 'ob6', label: 'Treinamento inicial agendado' },
    { id: 'ob7', label: 'Apresentação à equipe realizada' },
  ],
};

// ── LocalStorage helpers ──

function getChecklistState(vagaId: string): Record<string, Record<string, boolean>> {
  try {
    const raw = localStorage.getItem(`vaga-checklist-${vagaId}`);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveChecklistState(vagaId: string, state: Record<string, Record<string, boolean>>) {
  localStorage.setItem(`vaga-checklist-${vagaId}`, JSON.stringify(state));
}

function getCustomChecklistItems(vagaId: string): Record<string, { id: string; label: string }[]> {
  try {
    const raw = localStorage.getItem(`vaga-checklist-custom-${vagaId}`);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveCustomChecklistItems(vagaId: string, items: Record<string, { id: string; label: string }[]>) {
  localStorage.setItem(`vaga-checklist-custom-${vagaId}`, JSON.stringify(items));
}

interface DocEntry {
  id: string;
  name: string;
  url: string;
  addedAt: string;
}

function getDocuments(vagaId: string): DocEntry[] {
  try {
    const raw = localStorage.getItem(`vaga-docs-${vagaId}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveDocuments(vagaId: string, docs: DocEntry[]) {
  localStorage.setItem(`vaga-docs-${vagaId}`, JSON.stringify(docs));
}

// ── Component ──

export function VagaDetailSheet({
  vaga,
  onClose,
  allEtapas,
  etapas,
  isAdmin,
  onEdit,
  onDuplicate,
  onMoveToEtapa,
  onEliminate,
  formatCurrency,
  getDaysInEtapa,
}: VagaDetailSheetProps) {
  const [activeTab, setActiveTab] = useState('resumo');
  const [checklistState, setChecklistState] = useState<Record<string, Record<string, boolean>>>({});
  const [customItems, setCustomItems] = useState<Record<string, { id: string; label: string }[]>>({});
  const [documents, setDocuments] = useState<DocEntry[]>([]);
  const [newDocName, setNewDocName] = useState('');
  const [newDocUrl, setNewDocUrl] = useState('');
  const [newItemLabel, setNewItemLabel] = useState('');
  const [editingEtapaChecklist, setEditingEtapaChecklist] = useState<string | null>(null);

  // Load state when vaga changes
  useEffect(() => {
    if (vaga) {
      setChecklistState(getChecklistState(vaga.id));
      setCustomItems(getCustomChecklistItems(vaga.id));
      setDocuments(getDocuments(vaga.id));
      setActiveTab('resumo');
    }
  }, [vaga?.id]);

  const currentEtapa = allEtapas.find(e => e.id === vaga?.etapa_kanban);
  const daysInEtapa = vaga ? getDaysInEtapa(vaga) : 0;

  const etapaLabel = (etapaId: string) => allEtapas.find(e => e.id === etapaId)?.label ?? etapaId;

  // Pipeline progress
  const pipelineProgress = useMemo(() => {
    if (!vaga) return 0;
    if (vaga.etapa_kanban === 'cancelada') return 0;
    const idx = etapas.findIndex(e => e.id === vaga.etapa_kanban);
    return idx >= 0 ? Math.round(((idx + 1) / etapas.length) * 100) : 0;
  }, [vaga, etapas]);

  // Get merged checklist items (defaults + custom) for an etapa
  const getChecklistItems = (etapaId: string) => {
    const defaults = DEFAULT_ETAPA_CHECKLISTS[etapaId] || [];
    const custom = customItems[etapaId] || [];
    return [...defaults, ...custom];
  };

  // Toggle checklist item
  const toggleChecklistItem = (etapaId: string, itemId: string) => {
    if (!vaga) return;
    const newState = { ...checklistState };
    if (!newState[etapaId]) newState[etapaId] = {};
    newState[etapaId][itemId] = !newState[etapaId][itemId];
    setChecklistState(newState);
    saveChecklistState(vaga.id, newState);
  };

  // Add custom checklist item
  const addCustomItem = (etapaId: string) => {
    if (!vaga || !newItemLabel.trim()) return;
    const newItem = { id: `custom_${Date.now()}`, label: newItemLabel.trim() };
    const newCustom = { ...customItems };
    if (!newCustom[etapaId]) newCustom[etapaId] = [];
    newCustom[etapaId] = [...newCustom[etapaId], newItem];
    setCustomItems(newCustom);
    saveCustomChecklistItems(vaga.id, newCustom);
    setNewItemLabel('');
  };

  // Remove custom checklist item
  const removeCustomItem = (etapaId: string, itemId: string) => {
    if (!vaga) return;
    const newCustom = { ...customItems };
    newCustom[etapaId] = (newCustom[etapaId] || []).filter(i => i.id !== itemId);
    setCustomItems(newCustom);
    saveCustomChecklistItems(vaga.id, newCustom);
  };

  // Add document
  const addDocument = () => {
    if (!vaga || !newDocName.trim()) return;
    const doc: DocEntry = {
      id: `doc_${Date.now()}`,
      name: newDocName.trim(),
      url: newDocUrl.trim(),
      addedAt: new Date().toISOString(),
    };
    const newDocs = [...documents, doc];
    setDocuments(newDocs);
    saveDocuments(vaga.id, newDocs);
    setNewDocName('');
    setNewDocUrl('');
  };

  // Remove document
  const removeDocument = (docId: string) => {
    if (!vaga) return;
    const newDocs = documents.filter(d => d.id !== docId);
    setDocuments(newDocs);
    saveDocuments(vaga.id, newDocs);
  };

  // Checklist stats for current etapa
  const currentEtapaChecklistStats = useMemo(() => {
    if (!vaga?.etapa_kanban) return { total: 0, done: 0 };
    const items = getChecklistItems(vaga.etapa_kanban);
    const done = items.filter(i => checklistState[vaga.etapa_kanban!]?.[i.id]).length;
    return { total: items.length, done };
  }, [vaga?.etapa_kanban, checklistState, customItems]);

  // History entries
  const historyEntries = useMemo(() => {
    if (!vaga) return [];
    const history = Array.isArray(vaga.etapa_history) ? [...vaga.etapa_history] : [];
    return history.sort((a: any, b: any) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [vaga]);

  if (!vaga) return null;

  return (
    <Sheet open={!!vaga} onOpenChange={() => onClose()}>
      <SheetContent className="overflow-hidden sm:max-w-xl p-0 flex flex-col">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b space-y-3 shrink-0">
          <SheetHeader>
            <SheetTitle className="text-lg pr-8">
              {vaga.descricao_curta || 'Detalhes da Vaga'}
            </SheetTitle>
          </SheetHeader>

          {/* Status badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {currentEtapa && (
              <Badge className={cn('text-xs text-white bg-gradient-to-r', currentEtapa.color)}>
                {currentEtapa.label}
              </Badge>
            )}
            <Badge variant="outline" className={cn('text-xs', daysInEtapa > 7 ? 'border-destructive text-destructive' : daysInEtapa > 3 ? 'border-amber-500 text-amber-600' : '')}>
              <Clock className="h-3 w-3 mr-1" />
              {daysInEtapa}d nesta etapa
            </Badge>
            {currentEtapaChecklistStats.total > 0 && (
              <Badge variant="outline" className="text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {currentEtapaChecklistStats.done}/{currentEtapaChecklistStats.total}
              </Badge>
            )}
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] text-muted-foreground">Progresso no Pipeline</p>
              <span className="text-[10px] font-medium">{pipelineProgress}%</span>
            </div>
            <Progress value={pipelineProgress} className="h-1.5" />
          </div>

          {/* Quick actions */}
          {isAdmin && (
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { onClose(); onEdit(vaga); }}>
                <Pencil className="h-3 w-3 mr-1" /> Editar
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { onClose(); onDuplicate(vaga); }}>
                <Copy className="h-3 w-3 mr-1" /> Duplicar
              </Button>
              <Select
                value={vaga.etapa_kanban || 'solicitacao'}
                onValueChange={val => onMoveToEtapa(vaga, val)}
              >
                <SelectTrigger className="h-7 w-[160px] text-xs">
                  <ArrowRight className="h-3 w-3 mr-1" />
                  <SelectValue placeholder="Mover..." />
                </SelectTrigger>
                <SelectContent>
                  {allEtapas.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {vaga.etapa_kanban !== 'cancelada' && (
                <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => onEliminate(vaga)}>
                  <XCircle className="h-3 w-3 mr-1" /> Cancelar
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pt-2 shrink-0">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="resumo" className="text-xs gap-1.5">
                <Briefcase className="h-3.5 w-3.5" /> Resumo
              </TabsTrigger>
              <TabsTrigger value="checklist" className="text-xs gap-1.5">
                <ClipboardList className="h-3.5 w-3.5" /> Checklist
                {currentEtapaChecklistStats.total > 0 && (
                  <Badge variant="secondary" className="text-[9px] h-4 px-1">{currentEtapaChecklistStats.done}/{currentEtapaChecklistStats.total}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="documentos" className="text-xs gap-1.5">
                <FolderOpen className="h-3.5 w-3.5" /> Docs
                {documents.length > 0 && (
                  <Badge variant="secondary" className="text-[9px] h-4 px-1">{documents.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="historico" className="text-xs gap-1.5">
                <History className="h-3.5 w-3.5" /> Log
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 px-6 pb-6">
            {/* ═══ RESUMO ═══ */}
            <TabsContent value="resumo" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <InfoBlock icon={<Briefcase className="h-4 w-4" />} label="Empresa" value={vaga.empresa || '—'} />
                <InfoBlock icon={<MapPin className="h-4 w-4" />} label="Modalidade" value={vaga.modalidade?.replace('_', ' ') || '—'} />
                <InfoBlock icon={<DollarSign className="h-4 w-4" />} label="Salário" value={`${formatCurrency(vaga.salario_fixo || 0)}${vaga.tem_comissao ? ' + Comissão' : ''}`} />
                <InfoBlock icon={<Briefcase className="h-4 w-4" />} label="Modelo" value={vaga.modelo_contratacao?.toUpperCase().replace('_', ' / ') || '—'} />
              </div>

              {vaga.objetivo && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-semibold">Objetivo</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{vaga.objetivo}</p>
                  </div>
                </>
              )}

              {vaga.responsabilidades && (
                <div>
                  <p className="text-sm font-semibold mb-1">Responsabilidades</p>
                  <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
                    {vaga.responsabilidades.split(';').map((r: string, i: number) => r.trim() && <li key={i}>{r.trim()}</li>)}
                  </ul>
                </div>
              )}

              {vaga.competencias && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Users2 className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-semibold">Competências</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{vaga.competencias}</p>
                </div>
              )}

              {vaga.formacao && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-semibold">Formação</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{vaga.formacao}</p>
                </div>
              )}

              {Array.isArray(vaga.perguntas_eliminatorias) && vaga.perguntas_eliminatorias.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" /> Perguntas Eliminatórias
                    </p>
                    <ul className="space-y-1">
                      {vaga.perguntas_eliminatorias.map((p: any, i: number) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="font-bold text-xs mt-0.5">{i + 1}.</span>
                          {p.pergunta}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {vaga.observacoes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-1">Observações</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{vaga.observacoes}</p>
                  </div>
                </>
              )}
            </TabsContent>

            {/* ═══ CHECKLIST ═══ */}
            <TabsContent value="checklist" className="mt-4 space-y-5">
              {etapas.map(etapa => {
                const items = getChecklistItems(etapa.id);
                const customItemsForEtapa = customItems[etapa.id] || [];
                const doneCount = items.filter(i => checklistState[etapa.id]?.[i.id]).length;
                const isCurrent = vaga.etapa_kanban === etapa.id;
                const EtapaIcon = etapa.icon;

                if (items.length === 0 && !isAdmin) return null;

                return (
                  <div key={etapa.id} className={cn(
                    'rounded-lg border p-3 space-y-2',
                    isCurrent ? 'border-primary bg-primary/5' : 'border-border/50'
                  )}>
                    {/* Etapa header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn('h-6 w-6 rounded-full flex items-center justify-center bg-gradient-to-r text-white', etapa.color)}>
                          <EtapaIcon className="h-3 w-3" />
                        </div>
                        <span className="text-xs font-semibold">{etapa.label}</span>
                        {isCurrent && <Badge className="text-[9px] h-4">Atual</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        {items.length > 0 && (
                          <span className={cn('text-[10px] font-medium',
                            doneCount === items.length ? 'text-emerald-600' : 'text-muted-foreground'
                          )}>
                            {doneCount}/{items.length}
                          </span>
                        )}
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setEditingEtapaChecklist(editingEtapaChecklist === etapa.id ? null : etapa.id)}
                          >
                            <Settings2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Checklist items */}
                    {items.length > 0 && (
                      <div className="space-y-1.5 pl-1">
                        {items.map(item => {
                          const isCustom = customItemsForEtapa.some(c => c.id === item.id);
                          const checked = !!checklistState[etapa.id]?.[item.id];
                          return (
                            <div key={item.id} className="flex items-center gap-2 group">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={() => toggleChecklistItem(etapa.id, item.id)}
                                className="h-4 w-4"
                              />
                              <span className={cn('text-sm flex-1', checked && 'line-through text-muted-foreground')}>
                                {item.label}
                              </span>
                              {isCustom && editingEtapaChecklist === etapa.id && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 opacity-0 group-hover:opacity-100"
                                  onClick={() => removeCustomItem(etapa.id, item.id)}
                                >
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add custom item */}
                    {isAdmin && editingEtapaChecklist === etapa.id && (
                      <div className="flex gap-2 pt-1">
                        <Input
                          placeholder="Novo item..."
                          value={newItemLabel}
                          onChange={e => setNewItemLabel(e.target.value)}
                          className="h-7 text-xs flex-1"
                          onKeyDown={e => e.key === 'Enter' && addCustomItem(etapa.id)}
                        />
                        <Button size="sm" className="h-7 text-xs" onClick={() => addCustomItem(etapa.id)}>
                          <Plus className="h-3 w-3 mr-1" /> Adicionar
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </TabsContent>

            {/* ═══ DOCUMENTOS ═══ */}
            <TabsContent value="documentos" className="mt-4 space-y-4">
              <div className="space-y-2">
                {documents.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-muted-foreground">
                    <FolderOpen className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">Nenhum documento vinculado</p>
                  </div>
                ) : (
                  documents.map(doc => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 group">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.name}</p>
                        {doc.url && (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            <Link2 className="h-3 w-3" /> {doc.url.length > 40 ? doc.url.slice(0, 40) + '...' : doc.url}
                          </a>
                        )}
                        <p className="text-[10px] text-muted-foreground">
                          Adicionado em {new Date(doc.addedAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100"
                        onClick={() => removeDocument(doc.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Adicionar Documento</p>
                <Input
                  placeholder="Nome do documento"
                  value={newDocName}
                  onChange={e => setNewDocName(e.target.value)}
                  className="h-8 text-sm"
                />
                <Input
                  placeholder="URL / Link (opcional)"
                  value={newDocUrl}
                  onChange={e => setNewDocUrl(e.target.value)}
                  className="h-8 text-sm"
                />
                <Button size="sm" className="w-full h-8 text-xs" onClick={addDocument} disabled={!newDocName.trim()}>
                  <Plus className="h-3 w-3 mr-1" /> Adicionar Documento
                </Button>
              </div>
            </TabsContent>

            {/* ═══ HISTÓRICO / LOG ═══ */}
            <TabsContent value="historico" className="mt-4 space-y-1">
              {historyEntries.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-muted-foreground">
                  <History className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">Nenhum registro de atividade</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />

                  <div className="space-y-0">
                    {historyEntries.map((entry: any, i: number) => {
                      const etapaDef = allEtapas.find(e => e.id === entry.etapa);
                      const EIcon = etapaDef?.icon || Clock;
                      const date = new Date(entry.at);
                      const prevEntry = historyEntries[i + 1];
                      const daysDiff = prevEntry
                        ? Math.round((date.getTime() - new Date(prevEntry.at).getTime()) / (1000 * 60 * 60 * 24))
                        : null;

                      return (
                        <div key={i} className="relative pl-8 pb-4">
                          {/* Timeline dot */}
                          <div className={cn(
                            'absolute left-1.5 top-1 h-3.5 w-3.5 rounded-full border-2 border-background flex items-center justify-center',
                            etapaDef ? `bg-gradient-to-r ${etapaDef.color}` : 'bg-muted'
                          )}>
                            <EIcon className="h-2 w-2 text-white" />
                          </div>

                          <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{etapaDef?.label || entry.etapa}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {date.toLocaleDateString('pt-BR')} às {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {entry.motivo && (
                              <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" /> {entry.motivo}
                              </p>
                            )}
                            {daysDiff !== null && daysDiff > 0 && (
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {daysDiff} dia{daysDiff > 1 ? 's' : ''} após etapa anterior
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

// ── Helpers ──

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
