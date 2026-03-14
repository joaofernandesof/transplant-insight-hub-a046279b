// KommoPostSales - Dashboard de Pós-Vendas com dados filtrados
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '../components/KPICard';
import { Badge } from '@/components/ui/badge';
import { useKommoPipelines, useKommoStages } from '../hooks/useKommoData';
import { useFilteredLeads } from '../hooks/useFilteredKommoData';
import { HeartPulse, UserCheck, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';
import { useMemo } from 'react';

export default function KommoPostSales() {
  const { data: leads = [], isLoading } = useFilteredLeads();
  const { data: pipelines = [] } = useKommoPipelines();
  const { data: allStages = [] } = useKommoStages();

  const hasData = leads.length > 0;

  // Identify post-sales pipelines (heuristic: name contains pós, retenção, onboarding, sucesso)
  const postSalesPipelines = useMemo(() => {
    const keywords = ['pós', 'pos', 'retenção', 'retencao', 'onboarding', 'sucesso', 'suporte', 'acompanhamento'];
    return pipelines.filter(p => keywords.some(k => p.name.toLowerCase().includes(k)));
  }, [pipelines]);

  // If no post-sales identified, show all pipelines after the main sales ones
  const displayPipelines = postSalesPipelines.length > 0 ? postSalesPipelines : pipelines.slice(-2);

  const postSalesData = useMemo(() => {
    return displayPipelines.map(p => {
      const pLeads = leads.filter(l => l.pipeline_kommo_id === p.kommo_id);
      const stages = allStages
        .filter(s => s.pipeline_kommo_id === p.kommo_id && !s.is_closed)
        .sort((a, b) => a.sort - b.sort)
        .map(s => ({
          name: s.name,
          count: pLeads.filter(l => l.stage_kommo_id === s.kommo_id).length,
          color: s.color || '#10b981',
        }));
      return { name: p.name, total: pLeads.length, stages };
    });
  }, [displayPipelines, leads, allStages]);

  const totalPostSales = postSalesData.reduce((a, p) => a + p.total, 0);

  // Stale clients in post-sales
  const staleClients = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const postSaleIds = new Set(displayPipelines.map(p => p.kommo_id));
    return leads
      .filter(l => postSaleIds.has(l.pipeline_kommo_id!) && !l.is_won && !l.is_lost && l.updated_at_kommo && new Date(l.updated_at_kommo) < thirtyDaysAgo)
      .slice(0, 5);
  }, [leads, displayPipelines]);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!hasData) {
    return <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">Sincronize com o Kommo para ver dados de pós-vendas.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Total Pós-Vendas" value={totalPostSales} icon={<UserCheck className="h-4 w-4" />} />
        <KPICard label="Funis de Pós-Venda" value={displayPipelines.length} />
        <KPICard label="Inativos (30d+)" value={staleClients.length} icon={<AlertTriangle className="h-4 w-4" />} />
        <KPICard label="Retenção" value={totalPostSales > 0 ? `${((totalPostSales - staleClients.length) / totalPostSales * 100).toFixed(1)}%` : '-'} icon={<HeartPulse className="h-4 w-4" />} />
      </div>

      {/* Post-sales funnels */}
      {postSalesData.map(p => (
        <Card key={p.name}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <HeartPulse className="h-4 w-4" />
              {p.name}
              <Badge variant="outline" className="text-xs">{p.total} leads</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {p.stages.map((stage, idx) => {
                const maxCount = Math.max(...p.stages.map(s => s.count), 1);
                const width = (stage.count / maxCount) * 100;
                return (
                  <div key={stage.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium truncate">{stage.name}</span>
                      <span className="font-semibold">{stage.count}</span>
                    </div>
                    <div className="h-6 bg-muted/50 rounded overflow-hidden">
                      <div className="h-full rounded transition-all" style={{ width: `${Math.max(width, 4)}%`, backgroundColor: stage.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* At-risk clients */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Clientes em Risco</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {staleClients.length > 0 ? staleClients.map(l => (
              <div key={l.id} className="flex items-center gap-3 p-3 rounded-lg border">
                <div className="w-2 h-2 rounded-full shrink-0 bg-destructive" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{l.name || 'Lead sem nome'}</p>
                  <p className="text-xs text-muted-foreground">
                    Última atividade: {l.updated_at_kommo ? new Date(l.updated_at_kommo).toLocaleDateString('pt-BR') : 'N/A'}
                  </p>
                </div>
                <Badge variant="destructive" className="text-xs shrink-0">Inativo</Badge>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">Nenhum cliente em risco 🎉</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
