import type { SalesCall, CallAnalysisRecord } from '@/hooks/useCallIntelligence';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, CheckCircle2, Clock, XCircle, BarChart3, Flame, Target, TrendingUp } from 'lucide-react';

interface Props {
  stats: {
    totalCalls: number;
    fechou: number;
    followup: number;
    perdido: number;
    taxaFechamento: number;
    analyzed: number;
    leadsQuentes: number;
    bantMedio: number;
    probMediaFechamento: number;
  };
  analyses: CallAnalysisRecord[];
  calls: SalesCall[];
}

export function CallDashboardTab({ stats, analyses, calls }: Props) {
  // Most common objections
  const objecoes = analyses
    .filter(a => a.objecoes)
    .map(a => a.objecoes!)
    .join('; ')
    .split(';')
    .map(o => o.trim())
    .filter(Boolean);
  
  const objecaoCount: Record<string, number> = {};
  objecoes.forEach(o => { objecaoCount[o] = (objecaoCount[o] || 0) + 1; });
  const topObjecoes = Object.entries(objecaoCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Closer ranking by avg BANT
  const closerScores: Record<string, { total: number; count: number; name: string }> = {};
  calls.forEach(c => {
    const analysis = analyses.find(a => a.call_id === c.id);
    if (analysis && c.closer_name) {
      if (!closerScores[c.closer_id]) {
        closerScores[c.closer_id] = { total: 0, count: 0, name: c.closer_name };
      }
      closerScores[c.closer_id].total += analysis.bant_total || 0;
      closerScores[c.closer_id].count += 1;
    }
  });
  const closerRanking = Object.entries(closerScores)
    .map(([id, data]) => ({
      id,
      name: data.name,
      avg: Math.round(data.total / data.count),
      count: data.count,
    }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5);

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Phone className="h-5 w-5 text-primary" /></div>
              <div>
                <div className="text-2xl font-bold">{stats.totalCalls}</div>
                <div className="text-xs text-muted-foreground">Calls Registradas</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100"><CheckCircle2 className="h-5 w-5 text-emerald-600" /></div>
              <div>
                <div className="text-2xl font-bold text-emerald-600">{stats.taxaFechamento}%</div>
                <div className="text-xs text-muted-foreground">Taxa de Fechamento</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100"><Flame className="h-5 w-5 text-red-500" /></div>
              <div>
                <div className="text-2xl font-bold">{stats.leadsQuentes}</div>
                <div className="text-xs text-muted-foreground">Leads Quentes</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100"><Target className="h-5 w-5 text-amber-600" /></div>
              <div>
                <div className="text-2xl font-bold">{stats.bantMedio}<span className="text-sm text-muted-foreground">/40</span></div>
                <div className="text-xs text-muted-foreground">BANT Médio</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second row */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xl font-bold text-emerald-600">{stats.fechou}</div>
            <div className="text-xs text-muted-foreground">Fechou ✅</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xl font-bold text-amber-600">{stats.followup}</div>
            <div className="text-xs text-muted-foreground">Follow-up 📋</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xl font-bold text-red-600">{stats.perdido}</div>
            <div className="text-xs text-muted-foreground">Perdido ❌</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xl font-bold">{stats.probMediaFechamento}%</div>
            <div className="text-xs text-muted-foreground">Prob. Média Fechamento</div>
          </CardContent>
        </Card>
      </div>

      {/* Rankings and insights */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Closer Ranking */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Ranking de Closers (BANT Médio)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {closerRanking.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados suficientes</p>
            ) : (
              <div className="space-y-3">
                {closerRanking.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? 'bg-amber-100 text-amber-700' :
                      i === 1 ? 'bg-slate-100 text-slate-600' :
                      'bg-orange-50 text-orange-600'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.count} calls</div>
                    </div>
                    <span className={`font-bold text-sm ${
                      c.avg >= 30 ? 'text-emerald-600' :
                      c.avg >= 20 ? 'text-amber-600' : 'text-red-600'
                    }`}>{c.avg}/40</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Objections */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Objeções Mais Comuns
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topObjecoes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados suficientes</p>
            ) : (
              <div className="space-y-2">
                {topObjecoes.map(([obj, count], i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{count}x</span>
                    <span className="flex-1 truncate">{obj}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
