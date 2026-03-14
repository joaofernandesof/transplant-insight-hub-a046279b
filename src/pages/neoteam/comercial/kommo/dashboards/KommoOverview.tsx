// KommoOverview - Dashboard Executivo / Visão Geral
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '../components/KPICard';
import { AlertCard } from '../components/AlertCard';
import { FunnelChart } from '../components/FunnelChart';
import { MOCK_PIPELINES, MOCK_USERS, MOCK_ALERTS, MOCK_SOURCES } from '../types';
import { Users, DollarSign, TrendingUp, Target, Clock, XCircle, Star, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function KommoOverview() {
  const totalLeads = MOCK_PIPELINES.reduce((acc, p) => acc + p.totalLeads, 0);
  const totalValue = MOCK_PIPELINES.reduce((acc, p) => acc + p.totalValue, 0);
  const wonDeals = 43;
  const lostDeals = 160;

  return (
    <div className="space-y-6">
      {/* KPIs Principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Leads no Período" value={totalLeads.toLocaleString()} change={12.4} changeLabel="vs mês anterior" icon={<Users className="h-4 w-4" />} />
        <KPICard label="Negócios Ganhos" value={wonDeals} change={8.2} changeLabel="vs mês anterior" icon={<Star className="h-4 w-4" />} />
        <KPICard label="Receita Gerada" value={`R$ ${(totalValue / 1000).toFixed(0)}k`} change={15.3} changeLabel="vs mês anterior" icon={<DollarSign className="h-4 w-4" />} />
        <KPICard label="Taxa de Conversão" value="8.4%" change={-2.1} changeLabel="vs mês anterior" icon={<TrendingUp className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Ticket Médio" value="R$ 15.7k" change={5.8} />
        <KPICard label="Tempo Médio Fechamento" value="12.4 dias" change={-8.5} changeLabel="melhorou" />
        <KPICard label="Leads Perdidos" value={lostDeals} change={34} changeLabel="aumento" />
        <KPICard label="Leads sem Atividade" value={23} />
      </div>

      {/* Alertas */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Alertas de Atenção</h3>
        <div className="grid gap-2 md:grid-cols-2">
          {MOCK_ALERTS.slice(0, 4).map(a => <AlertCard key={a.id} alert={a} />)}
        </div>
      </div>

      {/* Funis Resumo + Ranking */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Top 2 Funis */}
        <div className="lg:col-span-2 grid gap-4 md:grid-cols-2">
          {MOCK_PIPELINES.slice(0, 2).map(p => (
            <Card key={p.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  {p.name}
                  <Badge variant="outline" className="text-xs font-normal">{p.conversionRate}%</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FunnelChart pipeline={p} />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Ranking Performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Top Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {MOCK_USERS.filter(u => u.role === 'Closer').sort((a, b) => b.revenue - a.revenue).slice(0, 5).map((user, idx) => (
              <div key={user.id} className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground w-4">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.conversionRate}% conv · {user.leadsConverted} ganhos</p>
                </div>
                <span className="text-sm font-semibold shrink-0">R$ {(user.revenue / 1000).toFixed(0)}k</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Origens Resumo */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Melhores Origens por Conversão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {MOCK_SOURCES.sort((a, b) => b.conversionRate - a.conversionRate).slice(0, 4).map(s => (
              <div key={s.name} className="p-3 rounded-lg bg-muted/30 space-y-1">
                <p className="text-xs font-medium truncate">{s.name}</p>
                <p className="text-lg font-bold">{s.conversionRate}%</p>
                <p className="text-[11px] text-muted-foreground">{s.leads} leads · R$ {(s.revenue / 1000).toFixed(0)}k</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
