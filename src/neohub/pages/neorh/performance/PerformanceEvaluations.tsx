import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, FileText, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Slider } from '@/components/ui/slider';

interface Colaborador { id: string; nome: string; cargo_id: string | null; }
interface Cycle { id: string; name: string; status: string; auto_eval_weight: number; manager_eval_weight: number; rh_eval_weight: number; }
interface Evaluation {
  id: string; cycle_id: string; colaborador_id: string; evaluator_type: string;
  kpi_score: number; processos_score: number; cultura_score: number; autonomia_score: number;
  final_score: number | null; grade: string | null; notes: string | null; status: string;
}

const PILLAR_WEIGHTS = { kpi: 40, processos: 20, cultura: 20, autonomia: 20 };

function calculateFinalScore(kpi: number, proc: number, cult: number, auto: number): number {
  return (kpi * PILLAR_WEIGHTS.kpi + proc * PILLAR_WEIGHTS.processos + cult * PILLAR_WEIGHTS.cultura + auto * PILLAR_WEIGHTS.autonomia) / 100;
}

function getGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  return 'D';
}

const GRADE_BADGE: Record<string, string> = { A: 'bg-emerald-500 text-white', B: 'bg-blue-500 text-white', C: 'bg-amber-500 text-white', D: 'bg-red-500 text-white' };

export default function PerformanceEvaluations() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<string>('');
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [evalForm, setEvalForm] = useState({ colaborador_id: '', evaluator_type: 'rh', kpi_score: 50, processos_score: 50, cultura_score: 50, autonomia_score: 50, notes: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('rh_performance_cycles').select('*').order('start_date', { ascending: false }),
      supabase.from('rh_colaboradores').select('id, nome, cargo_id').eq('status', 'ativo').order('nome'),
    ]).then(([c, col]) => {
      setCycles((c.data || []) as Cycle[]);
      setColaboradores((col.data || []) as Colaborador[]);
      if (c.data?.[0]) setSelectedCycle(c.data[0].id);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedCycle) loadEvaluations();
  }, [selectedCycle]);

  const loadEvaluations = async () => {
    const { data } = await supabase.from('rh_performance_evaluations').select('*').eq('cycle_id', selectedCycle);
    setEvaluations((data || []) as Evaluation[]);
  };

  const colabMap = useMemo(() => new Map(colaboradores.map(c => [c.id, c])), [colaboradores]);

  const filtered = useMemo(() => {
    if (!search) return evaluations;
    return evaluations.filter(e => {
      const name = colabMap.get(e.colaborador_id)?.nome || '';
      return name.toLowerCase().includes(search.toLowerCase());
    });
  }, [evaluations, search, colabMap]);

  const openNew = () => {
    setEditingId(null);
    setEvalForm({ colaborador_id: '', evaluator_type: 'rh', kpi_score: 50, processos_score: 50, cultura_score: 50, autonomia_score: 50, notes: '' });
    setDialogOpen(true);
  };

  const openEdit = (ev: Evaluation) => {
    setEditingId(ev.id);
    setEvalForm({
      colaborador_id: ev.colaborador_id,
      evaluator_type: ev.evaluator_type,
      kpi_score: ev.kpi_score || 50,
      processos_score: ev.processos_score || 50,
      cultura_score: ev.cultura_score || 50,
      autonomia_score: ev.autonomia_score || 50,
      notes: ev.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!evalForm.colaborador_id || !selectedCycle) {
      toast.error('Selecione o colaborador');
      return;
    }
    const finalScore = calculateFinalScore(evalForm.kpi_score, evalForm.processos_score, evalForm.cultura_score, evalForm.autonomia_score);
    const grade = getGrade(finalScore);

    const payload = {
      cycle_id: selectedCycle,
      colaborador_id: evalForm.colaborador_id,
      evaluator_type: evalForm.evaluator_type,
      kpi_score: evalForm.kpi_score,
      processos_score: evalForm.processos_score,
      cultura_score: evalForm.cultura_score,
      autonomia_score: evalForm.autonomia_score,
      final_score: finalScore,
      grade,
      notes: evalForm.notes || null,
      status: 'completed',
      updated_at: new Date().toISOString(),
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from('rh_performance_evaluations').update(payload).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('rh_performance_evaluations').insert(payload));
    }

    if (error) { toast.error('Erro ao salvar avaliação'); return; }

    // Auto-create PDI for C/D grades
    if (grade === 'C' || grade === 'D') {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + (grade === 'C' ? 30 : 14));
      const colabName = colabMap.get(evalForm.colaborador_id)?.nome || 'Colaborador';

      await supabase.from('rh_performance_pdis').insert({
        colaborador_id: evalForm.colaborador_id,
        cycle_id: selectedCycle,
        grade,
        objective: `Plano de melhoria para ${colabName} — Nível ${grade}`,
        deadline: deadline.toISOString().split('T')[0],
        status: 'open',
        actions: JSON.stringify([
          { text: 'Reunião de alinhamento com gestor', done: false },
          { text: 'Definir metas SMART para o próximo período', done: false },
          { text: 'Acompanhamento semanal de progresso', done: false },
          ...(grade === 'D' ? [
            { text: 'Avaliação intermediária em 7 dias', done: false },
            { text: 'Decisão de continuidade com RH', done: false },
          ] : []),
        ]),
      });

      // Create alert
      await supabase.from('rh_performance_alerts').insert({
        colaborador_id: evalForm.colaborador_id,
        cycle_id: selectedCycle,
        alert_type: grade === 'D' ? 'critical_performance' : 'low_performance',
        grade,
        message: `${colabName} classificado como Nível ${grade} (${finalScore.toFixed(1)} pts) — ${grade === 'D' ? 'PDI urgente criado (14 dias)' : 'PDI criado (30 dias)'}`,
      });
    }

    // Auto-suggest for grade A
    if (grade === 'A') {
      const colabName = colabMap.get(evalForm.colaborador_id)?.nome || 'Colaborador';
      await supabase.from('rh_performance_alerts').insert({
        colaborador_id: evalForm.colaborador_id,
        cycle_id: selectedCycle,
        alert_type: 'high_performance',
        grade: 'A',
        message: `${colabName} classificado como Nível A (${finalScore.toFixed(1)} pts) — Considerar promoção ou bônus`,
      });
    }

    toast.success(`Avaliação salva — Nível ${grade} (${finalScore.toFixed(1)} pts)`);
    setDialogOpen(false);
    loadEvaluations();
  };

  const previewScore = calculateFinalScore(evalForm.kpi_score, evalForm.processos_score, evalForm.cultura_score, evalForm.autonomia_score);
  const previewGrade = getGrade(previewScore);

  if (loading) return <div className="p-6">Carregando...</div>;

  return (
    <div className="p-4 lg:p-6 pt-14 lg:pt-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Avaliações de Performance</h1>
          <p className="text-muted-foreground">Registre e visualize avaliações por ciclo</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedCycle} onValueChange={setSelectedCycle}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Ciclo" /></SelectTrigger>
            <SelectContent>
              {cycles.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Nova Avaliação</Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar colaborador..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>KPI (40%)</TableHead>
                <TableHead>Processos (20%)</TableHead>
                <TableHead>Cultura (20%)</TableHead>
                <TableHead>Autonomia (20%)</TableHead>
                <TableHead>Nota Final</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Nenhuma avaliação neste ciclo</TableCell></TableRow>
              ) : filtered.map(ev => (
                <TableRow key={ev.id}>
                  <TableCell className="font-medium">{colabMap.get(ev.colaborador_id)?.nome || '—'}</TableCell>
                  <TableCell><Badge variant="outline">{ev.evaluator_type === 'auto' ? 'Auto' : ev.evaluator_type === 'gestor' ? 'Gestor' : 'RH'}</Badge></TableCell>
                  <TableCell>{ev.kpi_score}</TableCell>
                  <TableCell>{ev.processos_score}</TableCell>
                  <TableCell>{ev.cultura_score}</TableCell>
                  <TableCell>{ev.autonomia_score}</TableCell>
                  <TableCell className="font-bold">{ev.final_score?.toFixed(1) || '—'}</TableCell>
                  <TableCell>
                    {ev.grade && <Badge className={GRADE_BADGE[ev.grade]}>{ev.grade}</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(ev)}><FileText className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Evaluation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? 'Editar Avaliação' : 'Nova Avaliação'}</DialogTitle></DialogHeader>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Colaborador</Label>
                <Select value={evalForm.colaborador_id} onValueChange={v => setEvalForm({ ...evalForm, colaborador_id: v })} disabled={!!editingId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {colaboradores.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo de Avaliação</Label>
                <Select value={evalForm.evaluator_type} onValueChange={v => setEvalForm({ ...evalForm, evaluator_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Autoavaliação</SelectItem>
                    <SelectItem value="gestor">Gestor</SelectItem>
                    <SelectItem value="rh">RH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {[
              { key: 'kpi_score', label: 'KPI da Função', weight: '40%' },
              { key: 'processos_score', label: 'Processos e Organização', weight: '20%' },
              { key: 'cultura_score', label: 'Cultura e Postura', weight: '20%' },
              { key: 'autonomia_score', label: 'Autonomia e Solução', weight: '20%' },
            ].map(pillar => (
              <div key={pillar.key} className="space-y-1">
                <div className="flex justify-between">
                  <Label>{pillar.label} ({pillar.weight})</Label>
                  <span className="text-sm font-bold">{evalForm[pillar.key as keyof typeof evalForm]}</span>
                </div>
                <Slider
                  value={[evalForm[pillar.key as keyof typeof evalForm] as number]}
                  onValueChange={v => setEvalForm({ ...evalForm, [pillar.key]: v[0] })}
                  min={0} max={100} step={1}
                />
              </div>
            ))}

            <div>
              <Label>Observações</Label>
              <Textarea value={evalForm.notes} onChange={e => setEvalForm({ ...evalForm, notes: e.target.value })} placeholder="Observações sobre o desempenho..." />
            </div>

            {/* Preview */}
            <Card className="bg-muted/50">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Nota Final Ponderada</p>
                  <p className="text-2xl font-bold">{previewScore.toFixed(1)}</p>
                </div>
                <Badge className={`text-lg px-4 py-1 ${GRADE_BADGE[previewGrade]}`}>{previewGrade}</Badge>
              </CardContent>
            </Card>

            {(previewGrade === 'C' || previewGrade === 'D') && (
              <div className="flex items-center gap-2 text-amber-600 text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>Um PDI será criado automaticamente ({previewGrade === 'D' ? '14' : '30'} dias)</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar Avaliação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
