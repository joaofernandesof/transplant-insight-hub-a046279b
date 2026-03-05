import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Slider } from '@/components/ui/slider';
import { Star, Calculator, Pencil } from 'lucide-react';
import { toast } from 'sonner';

interface TalentScore {
  id: string; colaborador_id: string; score: number;
  performance_score: number; tenure_score: number;
  financial_impact_score: number; leadership_score: number;
  performance_weight: number; tenure_weight: number;
  financial_impact_weight: number; leadership_weight: number;
}

export default function PerformanceTalentScore() {
  const [scores, setScores] = useState<TalentScore[]>([]);
  const [colaboradores, setColaboradores] = useState<Map<string, string>>(new Map());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedColab, setSelectedColab] = useState('');
  const [form, setForm] = useState({
    performance_score: 50, tenure_score: 50, financial_impact_score: 50, leadership_score: 50,
    performance_weight: 50, tenure_weight: 10, financial_impact_weight: 20, leadership_weight: 20,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const [s, c] = await Promise.all([
      supabase.from('rh_talent_scores').select('*').order('score', { ascending: false }),
      supabase.from('rh_colaboradores').select('id, nome').eq('status', 'ativo'),
    ]);
    setScores((s.data || []) as TalentScore[]);
    setColaboradores(new Map((c.data || []).map(x => [x.id, x.nome])));
    setLoading(false);
  };

  const calcScore = () => {
    const { performance_score, tenure_score, financial_impact_score, leadership_score,
      performance_weight, tenure_weight, financial_impact_weight, leadership_weight } = form;
    const total = performance_weight + tenure_weight + financial_impact_weight + leadership_weight;
    if (total === 0) return 0;
    return (performance_score * performance_weight + tenure_score * tenure_weight +
      financial_impact_score * financial_impact_weight + leadership_score * leadership_weight) / total;
  };

  const handleSave = async () => {
    if (!selectedColab) { toast.error('Selecione um colaborador'); return; }
    const totalWeight = form.performance_weight + form.tenure_weight + form.financial_impact_weight + form.leadership_weight;
    if (totalWeight !== 100) { toast.error(`Pesos devem somar 100% (atual: ${totalWeight}%)`); return; }

    const score = calcScore();
    const payload = { ...form, score, colaborador_id: selectedColab, calculated_at: new Date().toISOString() };

    if (editingId) {
      await supabase.from('rh_talent_scores').update(payload).eq('id', editingId);
    } else {
      // Remove existing score for this colaborador
      await supabase.from('rh_talent_scores').delete().eq('colaborador_id', selectedColab);
      await supabase.from('rh_talent_scores').insert(payload);
    }

    toast.success(`Talent Score: ${score.toFixed(1)}`);
    setDialogOpen(false);
    load();
  };

  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-emerald-600';
    if (s >= 60) return 'text-blue-600';
    if (s >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  if (loading) return <div className="p-6">Carregando...</div>;

  const allColabs = Array.from(colaboradores.entries());

  return (
    <div className="p-4 lg:p-6 pt-14 lg:pt-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Star className="h-6 w-6 text-yellow-500" /> Talent Score</h1>
          <p className="text-muted-foreground">Indicador composto de potencial e desempenho (0-100)</p>
        </div>
        <Button onClick={() => {
          setEditingId(null);
          setSelectedColab('');
          setForm({ performance_score: 50, tenure_score: 50, financial_impact_score: 50, leadership_score: 50, performance_weight: 50, tenure_weight: 10, financial_impact_weight: 20, leadership_weight: 20 });
          setDialogOpen(true);
        }}>
          <Calculator className="h-4 w-4 mr-2" /> Calcular Score
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Colaborador</TableHead>
                <TableHead>Performance (50%)</TableHead>
                <TableHead>Tempo de Empresa (10%)</TableHead>
                <TableHead>Impacto Financeiro (20%)</TableHead>
                <TableHead>Liderança (20%)</TableHead>
                <TableHead>Talent Score</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scores.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhum Talent Score calculado</TableCell></TableRow>
              ) : scores.map((s, i) => (
                <TableRow key={s.id}>
                  <TableCell className="font-bold text-muted-foreground">#{i + 1}</TableCell>
                  <TableCell className="font-medium">{colaboradores.get(s.colaborador_id) || '—'}</TableCell>
                  <TableCell>{s.performance_score}</TableCell>
                  <TableCell>{s.tenure_score}</TableCell>
                  <TableCell>{s.financial_impact_score}</TableCell>
                  <TableCell>{s.leadership_score}</TableCell>
                  <TableCell><span className={`text-lg font-bold ${getScoreColor(s.score)}`}>{s.score.toFixed(1)}</span></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => {
                      setEditingId(s.id);
                      setSelectedColab(s.colaborador_id);
                      setForm({
                        performance_score: s.performance_score, tenure_score: s.tenure_score,
                        financial_impact_score: s.financial_impact_score, leadership_score: s.leadership_score,
                        performance_weight: s.performance_weight, tenure_weight: s.tenure_weight,
                        financial_impact_weight: s.financial_impact_weight, leadership_weight: s.leadership_weight,
                      });
                      setDialogOpen(true);
                    }}><Pencil className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? 'Editar' : 'Calcular'} Talent Score</DialogTitle></DialogHeader>
          <div className="space-y-5">
            <div>
              <Label>Colaborador</Label>
              <select className="w-full border rounded-md p-2 bg-background" value={selectedColab} onChange={e => setSelectedColab(e.target.value)}>
                <option value="">Selecione</option>
                {allColabs.map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
              </select>
            </div>

            {[
              { key: 'performance_score', wKey: 'performance_weight', label: 'Performance (últimos 4 trimestres)' },
              { key: 'tenure_score', wKey: 'tenure_weight', label: 'Tempo de Empresa' },
              { key: 'financial_impact_score', wKey: 'financial_impact_weight', label: 'Impacto Financeiro' },
              { key: 'leadership_score', wKey: 'leadership_weight', label: 'Liderança' },
            ].map(item => (
              <div key={item.key} className="space-y-1">
                <div className="flex justify-between">
                  <Label>{item.label}</Label>
                  <span className="text-sm"><strong>{form[item.key as keyof typeof form]}</strong> (peso: {form[item.wKey as keyof typeof form]}%)</span>
                </div>
                <Slider
                  value={[form[item.key as keyof typeof form]]}
                  onValueChange={v => setForm({ ...form, [item.key]: v[0] })}
                  min={0} max={100} step={1}
                />
              </div>
            ))}

            <Card className="bg-muted/50">
              <CardContent className="p-3 text-center">
                <p className="text-sm text-muted-foreground">Talent Score</p>
                <p className={`text-3xl font-bold ${getScoreColor(calcScore())}`}>{calcScore().toFixed(1)}</p>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
