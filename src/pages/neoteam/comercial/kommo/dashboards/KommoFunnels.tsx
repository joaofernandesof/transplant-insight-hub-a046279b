// KommoFunnels - Dashboard de Funis com dados filtrados
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KPICard } from '../components/KPICard';
import { useKommoPipelines, useKommoStages } from '../hooks/useKommoData';
import { useFilteredLeads } from '../hooks/useFilteredKommoData';
import { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

export default function KommoFunnels() {
  const [selectedPipeline, setSelectedPipeline] = useState<string>('all');
  const { data: pipelines = [], isLoading: loadingPipelines } = useKommoPipelines();
  const { data: allStages = [] } = useKommoStages();
  const { data: leads = [] } = useFilteredLeads();

  const hasData = pipelines.length > 0;

  // Build funnel data from real data
  const funnelData = useMemo(() => {
    if (!hasData) return [];

    return pipelines
      .filter(p => selectedPipeline === 'all' || String(p.kommo_id) === selectedPipeline)
      .map(pipeline => {
        const pipelineStages = allStages
          .filter(s => s.pipeline_kommo_id === pipeline.kommo_id && !s.is_closed)
          .sort((a, b) => a.sort - b.sort);

        const pipelineLeads = leads.filter(l => l.pipeline_kommo_id === pipeline.kommo_id);
        const wonLeads = pipelineLeads.filter(l => l.is_won);
        const totalValue = pipelineLeads.reduce((sum, l) => sum + (l.price || 0), 0);
        const convRate = pipelineLeads.length > 0 ? (wonLeads.length / pipelineLeads.length) * 100 : 0;

        const stagesWithData = pipelineStages.map(stage => {
          const stageLeads = pipelineLeads.filter(l => l.stage_kommo_id === stage.kommo_id);
          return {
            id: stage.id,
            name: stage.name,
            leads: stageLeads.length,
            value: stageLeads.reduce((sum, l) => sum + (l.price || 0), 0),
            color: stage.color || '#6366f1',
          };
        });

        return {
          id: String(pipeline.kommo_id),
          name: pipeline.name,
          stages: stagesWithData,
          totalLeads: pipelineLeads.length,
          totalValue,
          conversionRate: Number(convRate.toFixed(1)),
        };
      });
  }, [pipelines, allStages, leads, selectedPipeline, hasData]);

  if (loadingPipelines) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!hasData) {
    return <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">Sincronize com o Kommo na aba Configurações para ver dados reais dos funis.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Select value={selectedPipeline} onValueChange={setSelectedPipeline}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Todos os funis" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Funis</SelectItem>
            {pipelines.map(p => (
              <SelectItem key={p.kommo_id} value={String(p.kommo_id)}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Funis Ativos" value={pipelines.length} />
        <KPICard label="Total de Leads" value={funnelData.reduce((a, p) => a + p.totalLeads, 0).toLocaleString()} />
        <KPICard label="Valor Total" value={`R$ ${(funnelData.reduce((a, p) => a + p.totalValue, 0) / 1000).toFixed(0)}k`} />
        <KPICard label="Conversão Média" value={`${funnelData.length > 0 ? (funnelData.reduce((a, p) => a + p.conversionRate, 0) / funnelData.length).toFixed(1) : 0}%`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {funnelData.map(p => {
          const maxLeads = Math.max(...p.stages.map(s => s.leads), 1);
          return (
            <Card key={p.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">{p.name}</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline">{p.totalLeads} leads</Badge>
                    <Badge variant="secondary">{p.conversionRate}% conv</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  R$ {(p.totalValue / 1000).toFixed(0)}k em pipeline · {p.stages.length} etapas
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {p.stages.map((stage, idx) => {
                    const width = maxLeads > 0 ? (stage.leads / maxLeads) * 100 : 0;
                    const prevLeads = idx > 0 ? p.stages[idx - 1].leads : null;
                    const advanceRate = prevLeads ? ((stage.leads / prevLeads) * 100).toFixed(1) : null;
                    return (
                      <div key={stage.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium truncate">{stage.name}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            {advanceRate && <span className="text-muted-foreground">{advanceRate}%</span>}
                            <span className="font-semibold">{stage.leads}</span>
                          </div>
                        </div>
                        <div className="h-6 bg-muted/50 rounded overflow-hidden">
                          <div
                            className="h-full rounded transition-all duration-500 flex items-center px-2"
                            style={{ width: `${Math.max(width, 4)}%`, backgroundColor: stage.color }}
                          >
                            <span className="text-[10px] text-white font-medium truncate">
                              R$ {(stage.value / 1000).toFixed(0)}k
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
