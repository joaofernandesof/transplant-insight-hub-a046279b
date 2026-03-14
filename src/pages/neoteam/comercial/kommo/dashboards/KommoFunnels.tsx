// KommoFunnels - Dashboard de Funis
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FunnelChart } from '../components/FunnelChart';
import { KPICard } from '../components/KPICard';
import { MOCK_PIPELINES } from '../types';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function KommoFunnels() {
  const [selectedPipeline, setSelectedPipeline] = useState<string>('all');

  const pipelines = selectedPipeline === 'all' 
    ? MOCK_PIPELINES 
    : MOCK_PIPELINES.filter(p => p.id === selectedPipeline);

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={selectedPipeline} onValueChange={setSelectedPipeline}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Todos os funis" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Funis</SelectItem>
            {MOCK_PIPELINES.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPIs dos funis */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Funis Ativos" value={MOCK_PIPELINES.length} />
        <KPICard label="Total de Leads" value={pipelines.reduce((a, p) => a + p.totalLeads, 0).toLocaleString()} />
        <KPICard label="Valor Total" value={`R$ ${(pipelines.reduce((a, p) => a + p.totalValue, 0) / 1000).toFixed(0)}k`} />
        <KPICard label="Conversão Média" value={`${(pipelines.reduce((a, p) => a + p.conversionRate, 0) / pipelines.length).toFixed(1)}%`} />
      </div>

      {/* Pipeline Cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        {pipelines.map(p => (
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
              <FunnelChart pipeline={p} />
              
              {/* Metrics summary */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Gargalo</p>
                  <p className="text-sm font-semibold">
                    {p.stages.reduce((max, s) => s.avgDays > max.avgDays ? s : max).name}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Tempo Total</p>
                  <p className="text-sm font-semibold">{p.stages.reduce((a, s) => a + s.avgDays, 0).toFixed(1)} dias</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Maior Etapa</p>
                  <p className="text-sm font-semibold">
                    {p.stages.reduce((max, s) => s.leads > max.leads ? s : max).name}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
