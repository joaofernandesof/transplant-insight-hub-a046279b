// KommoPostSales - Dashboard de Pós-Vendas
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '../components/KPICard';
import { FunnelChart } from '../components/FunnelChart';
import { Badge } from '@/components/ui/badge';
import { MOCK_PIPELINES } from '../types';
import { HeartPulse, UserCheck, RefreshCw, AlertTriangle } from 'lucide-react';

const POST_SALES_KPIS = {
  onboarding: 28,
  activeClients: 245,
  atRisk: 8,
  reactivated: 12,
  churnRate: 3.2,
  nps: 72,
  retentionRate: 96.8,
  avgLifetime: '14.2 meses',
};

export default function KommoPostSales() {
  const postSalesPipeline = MOCK_PIPELINES.find(p => p.name.includes('Pós-Venda'));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Em Onboarding" value={POST_SALES_KPIS.onboarding} icon={<UserCheck className="h-4 w-4" />} />
        <KPICard label="Clientes Ativos" value={POST_SALES_KPIS.activeClients} change={4.2} />
        <KPICard label="Risco de Churn" value={POST_SALES_KPIS.atRisk} icon={<AlertTriangle className="h-4 w-4" />} />
        <KPICard label="Reativados" value={POST_SALES_KPIS.reactivated} change={18} icon={<RefreshCw className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Taxa Retenção" value={`${POST_SALES_KPIS.retentionRate}%`} change={0.5} />
        <KPICard label="Churn Rate" value={`${POST_SALES_KPIS.churnRate}%`} change={-0.8} changeLabel="melhorou" />
        <KPICard label="NPS" value={POST_SALES_KPIS.nps} change={3} />
        <KPICard label="Lifetime Médio" value={POST_SALES_KPIS.avgLifetime} />
      </div>

      {/* Funil Pós-Venda */}
      {postSalesPipeline && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <HeartPulse className="h-4 w-4" />
              Funil de Pós-Venda — Retenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FunnelChart pipeline={postSalesPipeline} />
          </CardContent>
        </Card>
      )}

      {/* Alertas Pós-Venda */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Clientes em Risco</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { name: 'Maria Santos', risk: 'Sem interação há 45 dias', severity: 'high' },
              { name: 'João Oliveira', risk: 'Inadimplente há 2 parcelas', severity: 'high' },
              { name: 'Ana Costa', risk: 'Reclamação aberta não resolvida', severity: 'medium' },
              { name: 'Pedro Lima', risk: 'Sem atividade pós-onboarding', severity: 'medium' },
              { name: 'Carla Dias', risk: 'NPS negativo no último contato', severity: 'low' },
            ].map((c, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                <div className={`w-2 h-2 rounded-full shrink-0 ${c.severity === 'high' ? 'bg-destructive' : c.severity === 'medium' ? 'bg-amber-500' : 'bg-muted-foreground'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.risk}</p>
                </div>
                <Badge variant={c.severity === 'high' ? 'destructive' : 'outline'} className="text-xs shrink-0">
                  {c.severity === 'high' ? 'Alto' : c.severity === 'medium' ? 'Médio' : 'Baixo'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
