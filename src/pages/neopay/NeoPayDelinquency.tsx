import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Search, MoreHorizontal, AlertTriangle, Clock, Ban, CheckCircle2,
  Plus, Eye, DollarSign, ArrowRight, Scale, ShieldAlert, FileWarning,
  Loader2, Gavel,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

// Stage configuration
const STAGES = [
  { key: 'late', label: 'Atrasado', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', border: 'border-l-amber-500', order: 0 },
  { key: 'serasa', label: 'Serasa', icon: ShieldAlert, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30', border: 'border-l-orange-500', order: 1 },
  { key: 'spc', label: 'SPC', icon: FileWarning, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', border: 'border-l-red-500', order: 2 },
  { key: 'protesto', label: 'Protesto', icon: Gavel, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30', border: 'border-l-purple-500', order: 3 },
  { key: 'processo', label: 'Processo Jurídico', icon: Scale, color: 'text-rose-700', bg: 'bg-rose-100 dark:bg-rose-900/30', border: 'border-l-rose-700', order: 4 },
  { key: 'recovered', label: 'Recuperado', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-l-green-500', order: 5 },
] as const;

type StageKey = typeof STAGES[number]['key'];

const getStageConfig = (key: string) => STAGES.find(s => s.key === key) || STAGES[0];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

interface DelinquencyRecord {
  id: string;
  customer_name?: string;
  customer_email?: string;
  overdue_amount: number;
  days_overdue: number;
  status: string;
  collection_stage: string;
  access_blocked: boolean;
  retry_count: number;
  last_notification_at: string | null;
  serasa_at: string | null;
  serasa_notes: string | null;
  spc_at: string | null;
  spc_notes: string | null;
  protesto_at: string | null;
  protesto_notes: string | null;
  processo_at: string | null;
  processo_notes: string | null;
  processo_number: string | null;
  created_at: string;
  updated_at: string;
}

export default function NeoPayDelinquency() {
  const { user } = useAuth();
  const [records, setRecords] = useState<DelinquencyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState<string>('all');

  // Dialog states
  const [selectedRecord, setSelectedRecord] = useState<DelinquencyRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAdvanceOpen, setIsAdvanceOpen] = useState(false);
  const [advanceNotes, setAdvanceNotes] = useState('');
  const [processoNumber, setProcessoNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newRecord, setNewRecord] = useState({ customer_name: '', customer_email: '', overdue_amount: '', days_overdue: '0' });

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('neopay_delinquency')
      .select('*')
      .order('collection_stage', { ascending: true })
      .order('days_overdue', { ascending: false });

    if (error) {
      console.error(error);
      toast.error('Erro ao carregar dados');
    } else {
      setRecords((data as any[]) || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const filtered = records.filter(r => {
    const name = (r as any).customer_name || '';
    const matchSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStage = filterStage === 'all' || r.collection_stage === filterStage;
    return matchSearch && matchStage;
  });

  // Stats
  const totalOverdue = records.reduce((s, r) => s + Number(r.overdue_amount), 0);
  const stageCount = (stage: string) => records.filter(r => r.collection_stage === stage).length;

  // Next stage logic
  const getNextStage = (current: string): StageKey | null => {
    const idx = STAGES.findIndex(s => s.key === current);
    if (idx < 0 || idx >= STAGES.length - 1) return null;
    return STAGES[idx + 1].key;
  };

  const handleAdvanceStage = async () => {
    if (!selectedRecord) return;
    const nextStage = getNextStage(selectedRecord.collection_stage);
    if (!nextStage) return;

    setIsSubmitting(true);
    const updates: Record<string, any> = {
      collection_stage: nextStage,
      [`${nextStage}_at`]: new Date().toISOString(),
      [`${nextStage}_notes`]: advanceNotes || null,
    };
    if (nextStage === 'processo' && processoNumber) {
      updates.processo_number = processoNumber;
    }

    const { error } = await supabase
      .from('neopay_delinquency')
      .update(updates)
      .eq('id', selectedRecord.id);

    if (error) {
      toast.error('Erro ao avançar etapa');
    } else {
      toast.success(`Avançado para ${getStageConfig(nextStage).label}`);
      setIsAdvanceOpen(false);
      setAdvanceNotes('');
      setProcessoNumber('');
      fetchRecords();
    }
    setIsSubmitting(false);
  };

  const handleAddRecord = async () => {
    if (!newRecord.customer_name || !newRecord.overdue_amount) {
      toast.error('Preencha nome e valor');
      return;
    }
    setIsSubmitting(true);
    const { error } = await supabase
      .from('neopay_delinquency')
      .insert({
        customer_id: user?.id || '00000000-0000-0000-0000-000000000000',
        overdue_amount: parseFloat(newRecord.overdue_amount.replace(',', '.')),
        days_overdue: parseInt(newRecord.days_overdue) || 0,
        status: 'late',
        collection_stage: 'late',
      } as any);

    if (error) {
      toast.error('Erro ao criar registro');
      console.error(error);
    } else {
      toast.success('Registro criado');
      setIsAddOpen(false);
      setNewRecord({ customer_name: '', customer_email: '', overdue_amount: '', days_overdue: '0' });
      fetchRecords();
    }
    setIsSubmitting(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Inadimplência</h1>
          <p className="text-muted-foreground">Rastreie etapas de cobrança: Serasa → SPC → Protesto → Processo</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Novo Registro
        </Button>
      </div>

      {/* Stage Pipeline */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {STAGES.map((stage) => {
          const count = stageCount(stage.key);
          const StageIcon = stage.icon;
          return (
            <Card
              key={stage.key}
              className={`border-l-4 ${stage.border} cursor-pointer transition-all hover:shadow-md ${filterStage === stage.key ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setFilterStage(filterStage === stage.key ? 'all' : stage.key)}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-md ${stage.bg}`}>
                    <StageIcon className={`h-4 w-4 ${stage.color}`} />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{count}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">{stage.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalOverdue)}</p>
                <p className="text-xs text-muted-foreground">Total em Atraso</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{records.filter(r => r.collection_stage !== 'recovered').length}</p>
                <p className="text-xs text-muted-foreground">Casos Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stageCount('recovered')}</p>
                <p className="text-xs text-muted-foreground">Recuperados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por cliente..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <Select value={filterStage} onValueChange={setFilterStage}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Todas as etapas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as etapas</SelectItem>
                {STAGES.map(s => (
                  <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum registro encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Dias Atraso</TableHead>
                  <TableHead>Etapa Atual</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => {
                  const stage = getStageConfig(item.collection_stage);
                  const StageIcon = stage.icon;
                  const progressPercent = (stage.order / (STAGES.length - 1)) * 100;

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{(item as any).customer_name || 'Sem nome'}</p>
                          {(item as any).customer_email && (
                            <p className="text-xs text-muted-foreground">{(item as any).customer_email}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-red-600">
                        {formatCurrency(Number(item.overdue_amount))}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{item.days_overdue} dias</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${stage.bg} ${stage.color} border-0`}>
                          <StageIcon className="h-3 w-3 mr-1" />
                          {stage.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="w-24">
                          <Progress value={progressPercent} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setSelectedRecord(item); setIsDetailOpen(true); }}>
                              <Eye className="h-4 w-4 mr-2" /> Ver Detalhes
                            </DropdownMenuItem>
                            {getNextStage(item.collection_stage) && (
                              <DropdownMenuItem onClick={() => {
                                setSelectedRecord(item);
                                setAdvanceNotes('');
                                setProcessoNumber('');
                                setIsAdvanceOpen(true);
                              }}>
                                <ArrowRight className="h-4 w-4 mr-2" />
                                Avançar para {getStageConfig(getNextStage(item.collection_stage)!).label}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {item.collection_stage !== 'recovered' && (
                              <DropdownMenuItem onClick={() => {
                                setSelectedRecord(item);
                                setAdvanceNotes('');
                                // Jump to recovered
                                const updates: Record<string, any> = { collection_stage: 'recovered' };
                                supabase.from('neopay_delinquency').update(updates).eq('id', item.id).then(({ error }) => {
                                  if (error) toast.error('Erro'); else { toast.success('Marcado como Recuperado'); fetchRecords(); }
                                });
                              }} className="text-green-600">
                                <CheckCircle2 className="h-4 w-4 mr-2" /> Marcar como Recuperado
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Histórico de Cobrança</DialogTitle>
            <DialogDescription>{(selectedRecord as any)?.customer_name}</DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Valor</span>
                <span className="font-bold text-red-600">{formatCurrency(Number(selectedRecord.overdue_amount))}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Dias em atraso</span>
                <span className="font-bold">{selectedRecord.days_overdue}</span>
              </div>

              {/* Timeline */}
              <div className="space-y-3 pt-2">
                <p className="text-sm font-semibold">Linha do Tempo</p>
                {STAGES.slice(0, -1).map((stage) => {
                  const dateField = `${stage.key}_at` as keyof DelinquencyRecord;
                  const notesField = `${stage.key}_notes` as keyof DelinquencyRecord;
                  const date = selectedRecord[dateField] as string | null;
                  const notes = selectedRecord[notesField] as string | null;
                  const isCurrentOrPast = stage.order <= getStageConfig(selectedRecord.collection_stage).order;
                  const isCurrent = stage.key === selectedRecord.collection_stage;
                  const StageIcon = stage.icon;

                  return (
                    <div key={stage.key} className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${isCurrent ? stage.bg : ''} ${!isCurrentOrPast ? 'opacity-40' : ''}`}>
                      <div className={`p-1.5 rounded-full ${isCurrentOrPast ? stage.bg : 'bg-muted'}`}>
                        <StageIcon className={`h-4 w-4 ${isCurrentOrPast ? stage.color : 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isCurrent ? stage.color : ''}`}>{stage.label}</p>
                        {date && <p className="text-xs text-muted-foreground">{format(new Date(date), 'dd/MM/yyyy HH:mm')}</p>}
                        {notes && <p className="text-xs mt-1 text-muted-foreground italic">{notes}</p>}
                        {stage.key === 'processo' && selectedRecord.processo_number && (
                          <p className="text-xs mt-1 font-mono">Processo: {selectedRecord.processo_number}</p>
                        )}
                        {!date && isCurrentOrPast && stage.key !== 'late' && (
                          <p className="text-xs text-muted-foreground">Sem registro</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Advance Stage Dialog */}
      <Dialog open={isAdvanceOpen} onOpenChange={setIsAdvanceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avançar Etapa de Cobrança</DialogTitle>
            <DialogDescription>
              {selectedRecord && getNextStage(selectedRecord.collection_stage) && (
                <>
                  De <strong>{getStageConfig(selectedRecord.collection_stage).label}</strong> para{' '}
                  <strong>{getStageConfig(getNextStage(selectedRecord.collection_stage)!).label}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRecord && getNextStage(selectedRecord.collection_stage) === 'processo' && (
              <div className="space-y-2">
                <Label>Número do Processo</Label>
                <Input value={processoNumber} onChange={(e) => setProcessoNumber(e.target.value)} placeholder="0000000-00.0000.0.00.0000" />
              </div>
            )}
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={advanceNotes} onChange={(e) => setAdvanceNotes(e.target.value)} placeholder="Notas sobre esta etapa..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdvanceOpen(false)}>Cancelar</Button>
            <Button onClick={handleAdvanceStage} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
              Avançar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Record Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Registro de Inadimplência</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Cliente *</Label>
              <Input value={newRecord.customer_name} onChange={(e) => setNewRecord(p => ({ ...p, customer_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={newRecord.customer_email} onChange={(e) => setNewRecord(p => ({ ...p, customer_email: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor em Atraso (R$) *</Label>
                <Input value={newRecord.overdue_amount} onChange={(e) => setNewRecord(p => ({ ...p, overdue_amount: e.target.value }))} placeholder="0,00" />
              </div>
              <div className="space-y-2">
                <Label>Dias em Atraso</Label>
                <Input type="number" value={newRecord.days_overdue} onChange={(e) => setNewRecord(p => ({ ...p, days_overdue: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddRecord} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
