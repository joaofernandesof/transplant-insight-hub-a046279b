import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Medal, Award } from 'lucide-react';

const GRADE_BADGE: Record<string, string> = { A: 'bg-emerald-500 text-white', B: 'bg-blue-500 text-white', C: 'bg-amber-500 text-white', D: 'bg-red-500 text-white' };

interface RankedColab {
  colaborador_id: string;
  nome: string;
  area_nome: string;
  cargo_nome: string;
  final_score: number;
  grade: string;
}

export default function PerformanceRanking() {
  const [cycles, setCycles] = useState<any[]>([]);
  const [selectedCycle, setSelectedCycle] = useState('');
  const [ranked, setRanked] = useState<RankedColab[]>([]);
  const [filterArea, setFilterArea] = useState('all');
  const [filterCargo, setFilterCargo] = useState('all');
  const [areas, setAreas] = useState<{ id: string; nome: string }[]>([]);
  const [cargos, setCargos] = useState<{ id: string; nome: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('rh_performance_cycles').select('id, name').order('start_date', { ascending: false }),
      supabase.from('rh_areas').select('id, nome').order('nome'),
      supabase.from('rh_cargos').select('id, nome').order('nome'),
    ]).then(([c, a, ca]) => {
      setCycles(c.data || []);
      setAreas(a.data || []);
      setCargos(ca.data || []);
      if (c.data?.[0]) setSelectedCycle(c.data[0].id);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedCycle) loadRanking();
  }, [selectedCycle]);

  const loadRanking = async () => {
    const { data: evals } = await supabase
      .from('rh_performance_evaluations')
      .select('colaborador_id, final_score, grade')
      .eq('cycle_id', selectedCycle)
      .eq('status', 'completed')
      .not('final_score', 'is', null);

    if (!evals || evals.length === 0) { setRanked([]); return; }

    // Aggregate per colaborador (weighted average across evaluator types)
    const byColab = new Map<string, { scores: number[]; grades: string[] }>();
    evals.forEach(e => {
      const entry = byColab.get(e.colaborador_id) || { scores: [], grades: [] };
      entry.scores.push(e.final_score!);
      entry.grades.push(e.grade!);
      byColab.set(e.colaborador_id, entry);
    });

    const ids = Array.from(byColab.keys());
    const { data: colabs } = await supabase.from('rh_colaboradores').select('id, nome, area_id, cargo_id').in('id', ids);

    const areaMap = new Map(areas.map(a => [a.id, a.nome]));
    const cargoMap = new Map(cargos.map(c => [c.id, c.nome]));

    const ranked: RankedColab[] = (colabs || []).map(c => {
      const entry = byColab.get(c.id)!;
      const avg = entry.scores.reduce((a, b) => a + b, 0) / entry.scores.length;
      const grade = avg >= 90 ? 'A' : avg >= 75 ? 'B' : avg >= 60 ? 'C' : 'D';
      return {
        colaborador_id: c.id,
        nome: c.nome,
        area_nome: c.area_id ? areaMap.get(c.area_id) || '—' : '—',
        cargo_nome: c.cargo_id ? cargoMap.get(c.cargo_id) || '—' : '—',
        final_score: avg,
        grade,
        area_id: c.area_id,
        cargo_id: c.cargo_id,
      } as any;
    }).sort((a, b) => b.final_score - a.final_score);

    setRanked(ranked);
  };

  const filtered = useMemo(() => {
    return ranked.filter(r => {
      if (filterArea !== 'all' && (r as any).area_id !== filterArea) return false;
      if (filterCargo !== 'all' && (r as any).cargo_id !== filterCargo) return false;
      return true;
    });
  }, [ranked, filterArea, filterCargo]);

  const getPodiumIcon = (i: number) => {
    if (i === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (i === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (i === 2) return <Award className="h-5 w-5 text-amber-700" />;
    return <span className="w-5 text-center text-muted-foreground">#{i + 1}</span>;
  };

  if (loading) return <div className="p-6">Carregando...</div>;

  return (
    <div className="p-4 lg:p-6 pt-14 lg:pt-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ranking de Performance</h1>
        <p className="text-muted-foreground">Classificação dos colaboradores por desempenho</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={selectedCycle} onValueChange={setSelectedCycle}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Ciclo" /></SelectTrigger>
          <SelectContent>{cycles.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterArea} onValueChange={setFilterArea}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Área" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Áreas</SelectItem>
            {areas.map(a => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCargo} onValueChange={setFilterCargo}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Cargo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Cargos</SelectItem>
            {cargos.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Colaborador</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Nota</TableHead>
                <TableHead>Nível</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum dado disponível</TableCell></TableRow>
              ) : filtered.map((r, i) => (
                <TableRow key={r.colaborador_id} className={i < 3 ? 'bg-muted/30' : ''}>
                  <TableCell>{getPodiumIcon(i)}</TableCell>
                  <TableCell className="font-medium">{r.nome}</TableCell>
                  <TableCell>{r.area_nome}</TableCell>
                  <TableCell>{r.cargo_nome}</TableCell>
                  <TableCell className="font-bold">{r.final_score.toFixed(1)}</TableCell>
                  <TableCell><Badge className={GRADE_BADGE[r.grade]}>{r.grade}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
