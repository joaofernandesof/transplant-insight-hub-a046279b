import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, BarChart3, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { NeoTeamBreadcrumb } from '@/neohub/components/NeoTeamBreadcrumb';
import { useAllSectorTickets } from '@/neohub/hooks/useAllSectorTickets';
import { SECTOR_LABELS, PRIORITY_CONFIG, STATUS_CONFIG } from '@/neohub/hooks/useSectorTickets';
import { useSectorDashboardData } from '@/neohub/hooks/useSectorDashboardData';

function SectorSummaryCard({ code, label }: { code: string; label: string }) {
  const { kpis, isLoading } = useSectorDashboardData(code);
  if (isLoading) return (
    <Card><CardContent className="p-4 flex items-center justify-center h-24"><Loader2 className="h-4 w-4 animate-spin" /></CardContent></Card>
  );
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {kpis.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sem dados</p>
        ) : (
          kpis.slice(0, 3).map((kpi, i) => (
            <div key={i} className="flex justify-between text-xs">
              <span className="text-muted-foreground">{kpi.label}</span>
              <span className="font-medium">{kpi.value}</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default function GestaoDashboardPage() {
  const { tickets, isLoading } = useAllSectorTickets();

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  const stats = {
    total: tickets.length,
    aberto: tickets.filter(t => t.status === 'aberto').length,
    em_andamento: tickets.filter(t => t.status === 'em_andamento').length,
    resolvido: tickets.filter(t => t.status === 'resolvido').length,
    sla_breached: tickets.filter(t => t.sla_breached).length,
  };

  // Tickets by sector
  const bySector: Record<string, { total: number; aberto: number; breached: number }> = {};
  tickets.forEach(t => {
    if (!bySector[t.sector_code]) bySector[t.sector_code] = { total: 0, aberto: 0, breached: 0 };
    bySector[t.sector_code].total++;
    if (t.status === 'aberto' || t.status === 'em_andamento') bySector[t.sector_code].aberto++;
    if (t.sla_breached) bySector[t.sector_code].breached++;
  });

  // By priority
  const byPriority: Record<string, number> = {};
  tickets.forEach(t => {
    byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
  });

  const resolvedRate = stats.total > 0 ? Math.round((stats.resolvido / stats.total) * 100) : 0;

  const sectorCodes = Object.keys(SECTOR_LABELS);

  return (
    <div className="space-y-6 p-6">
      <NeoTeamBreadcrumb />

      <div>
        <h1 className="text-2xl font-bold">Dashboard de Gestão</h1>
        <p className="text-muted-foreground">Visão consolidada da operação de todos os setores</p>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted"><BarChart3 className="h-5 w-5 text-muted-foreground" /></div>
            <div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Chamados Totais</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100"><Clock className="h-5 w-5 text-blue-600" /></div>
            <div><p className="text-2xl font-bold">{stats.aberto}</p><p className="text-xs text-muted-foreground">Abertos</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100"><Loader2 className="h-5 w-5 text-amber-600" /></div>
            <div><p className="text-2xl font-bold">{stats.em_andamento}</p><p className="text-xs text-muted-foreground">Em Andamento</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100"><TrendingUp className="h-5 w-5 text-green-600" /></div>
            <div><p className="text-2xl font-bold">{resolvedRate}%</p><p className="text-xs text-muted-foreground">Taxa Resolução</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100"><AlertCircle className="h-5 w-5 text-red-600" /></div>
            <div><p className="text-2xl font-bold">{stats.sla_breached}</p><p className="text-xs text-muted-foreground">SLA Estourado</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets by Sector */}
      <Card>
        <CardHeader><CardTitle className="text-base">Chamados por Setor</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(SECTOR_LABELS).map(([code, label]) => {
              const s = bySector[code] || { total: 0, aberto: 0, breached: 0 };
              return (
                <div key={code} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{s.total} chamados</p>
                  </div>
                  <div className="flex gap-1">
                    {s.aberto > 0 && <Badge variant="secondary" className="text-xs">{s.aberto} ativos</Badge>}
                    {s.breached > 0 && <Badge variant="destructive" className="text-xs">{s.breached} SLA</Badge>}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Priority distribution */}
      <Card>
        <CardHeader><CardTitle className="text-base">Distribuição por Prioridade</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2">
                <Badge className={`text-xs ${v.color}`}>{v.label}</Badge>
                <span className="text-sm font-bold">{byPriority[k] || 0}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sector KPI summaries */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Resumo Operacional por Setor</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sectorCodes.map(code => (
            <SectorSummaryCard key={code} code={code} label={SECTOR_LABELS[code]} />
          ))}
        </div>
      </div>
    </div>
  );
}
