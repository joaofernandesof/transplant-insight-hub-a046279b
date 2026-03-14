// KommoROI - Dashboard de ROI cruzando custos de campanha com leads do Kommo
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, DollarSign, TrendingUp, Users, Target, BarChart3, ArrowUpRight, ArrowDownRight, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { useKommoLeads } from '../hooks/useKommoData';
import { useCampaignCosts, useSyncSheets, useAdsConfigs, useUpsertAdsConfig } from '../hooks/useAdsData';
import { useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value);
}

// Pre-configured sheets
const PRECONFIGURED_SHEETS = [
  {
    name: 'Neo Folic',
    spreadsheet_id: '1_6HQ3nQRzzsYDLgXVg9od6qZLM-88Hr1JjYxswcdWCU',
    business_unit: 'neofolic',
    gids: [
      { gid: '0', type: 'summary' as const, label: 'Resumo Mensal' },
      { gid: '813391227', type: 'detail' as const, label: 'Google Ads Detalhe' },
    ],
  },
  {
    name: 'IBRAMEC',
    spreadsheet_id: '1SXrvIZHk3KDDcRy3NAkEWa8pQTeyJ9_E2LNx8adnDOE',
    business_unit: 'ibramec',
    gids: [
      { gid: '734559877', type: 'detail' as const, label: 'Detalhe Campanhas' },
    ],
  },
];

export default function KommoROI() {
  const { data: leads = [], isLoading: loadingLeads } = useKommoLeads();
  const { data: costs = [], isLoading: loadingCosts } = useCampaignCosts();
  const { data: configs = [] } = useAdsConfigs();
  const syncSheets = useSyncSheets();
  const upsertConfig = useUpsertAdsConfig();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      // Ensure configs exist in DB, then sync
      for (const sheet of PRECONFIGURED_SHEETS) {
        await upsertConfig.mutateAsync({
          platform: 'google_sheets',
          account_id: sheet.spreadsheet_id,
          account_name: sheet.name,
          is_active: true,
          config: { gids: sheet.gids, business_unit: sheet.business_unit },
        });
      }
      await syncSheets.mutateAsync(PRECONFIGURED_SHEETS);
    } finally {
      setSyncing(false);
    }
  };

  // Compute ROI metrics
  const metrics = useMemo(() => {
    const totalSpend = costs.reduce((s, c) => s + (c.spend || 0), 0);
    const totalClicks = costs.reduce((s, c) => s + (c.clicks || 0), 0);
    const totalImpressions = costs.reduce((s, c) => s + (c.impressions || 0), 0);
    const totalConversions = costs.reduce((s, c) => s + (c.conversions || 0), 0);

    const wonLeads = leads.filter(l => l.is_won);
    const totalRevenue = wonLeads.reduce((s, l) => s + (l.price || 0), 0);
    const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;
    const cpl = leads.length > 0 ? totalSpend / leads.length : 0;
    const cpa = wonLeads.length > 0 ? totalSpend / wonLeads.length : 0;
    const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

    return { totalSpend, totalClicks, totalImpressions, totalConversions, totalRevenue, roi, cpl, cpa, roas, wonLeads: wonLeads.length, totalLeads: leads.length };
  }, [costs, leads]);

  // Spend by month
  const monthlyData = useMemo(() => {
    const map = new Map<string, { month: string; spend: number; leads: number; won: number; revenue: number }>();
    
    costs.forEach(c => {
      const month = c.date?.slice(0, 7) || 'unknown';
      const existing = map.get(month) || { month, spend: 0, leads: 0, won: 0, revenue: 0 };
      existing.spend += c.spend || 0;
      map.set(month, existing);
    });

    leads.forEach(l => {
      const month = l.created_at_kommo?.slice(0, 7) || 'unknown';
      const existing = map.get(month) || { month, spend: 0, leads: 0, won: 0, revenue: 0 };
      existing.leads += 1;
      if (l.is_won) {
        existing.won += 1;
        existing.revenue += l.price || 0;
      }
      map.set(month, existing);
    });

    return Array.from(map.values())
      .filter(d => d.month !== 'unknown')
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);
  }, [costs, leads]);

  // Spend by campaign (top 10)
  const campaignData = useMemo(() => {
    const map = new Map<string, { campaign: string; spend: number; clicks: number; impressions: number }>();
    costs.forEach(c => {
      const key = c.campaign_name || 'Desconhecido';
      const existing = map.get(key) || { campaign: key, spend: 0, clicks: 0, impressions: 0 };
      existing.spend += c.spend || 0;
      existing.clicks += c.clicks || 0;
      existing.impressions += c.impressions || 0;
      map.set(key, existing);
    });
    return Array.from(map.values())
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 10);
  }, [costs]);

  // Platform breakdown
  const platformData = useMemo(() => {
    const map = new Map<string, number>();
    costs.forEach(c => {
      const p = c.platform === 'google' ? 'Google Ads' : c.platform === 'meta' ? 'Meta Ads' : 'Outros';
      map.set(p, (map.get(p) || 0) + (c.spend || 0));
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [costs]);

  const isLoading = loadingLeads || loadingCosts;
  const hasData = costs.length > 0;
  const lastSync = configs.find(c => c.last_sync_at)?.last_sync_at;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with sync */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">ROI & Custos de Campanha</h2>
          <p className="text-xs text-muted-foreground">
            {hasData 
              ? `${formatNumber(costs.length)} registros de custo · Último sync: ${lastSync ? formatDistanceToNow(new Date(lastSync), { addSuffix: true, locale: ptBR }) : 'nunca'}`
              : 'Sincronize as planilhas para visualizar os dados de ROI'
            }
          </p>
        </div>
        <Button onClick={handleSync} disabled={syncing} size="sm" className="gap-2">
          {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {syncing ? 'Sincronizando...' : 'Sincronizar Planilhas'}
        </Button>
      </div>

      {/* Sheet configs info */}
      <div className="flex gap-2 flex-wrap">
        {PRECONFIGURED_SHEETS.map(s => (
          <Badge key={s.spreadsheet_id} variant="outline" className="text-xs gap-1">
            <FileSpreadsheet className="h-3 w-3" />
            {s.name} ({s.gids.length} aba{s.gids.length > 1 ? 's' : ''})
          </Badge>
        ))}
      </div>

      {!hasData && (
        <Card>
          <CardContent className="py-8 text-center space-y-3">
            <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground" />
            <div>
              <p className="font-medium">Nenhum dado de custo importado</p>
              <p className="text-sm text-muted-foreground">Clique em "Sincronizar Planilhas" para importar os dados das suas planilhas do Google Sheets.</p>
              <p className="text-xs text-muted-foreground mt-1">⚠️ A planilha IBRAMEC precisa ter acesso público (Qualquer pessoa com o link pode ver).</p>
            </div>
          </CardContent>
        </Card>
      )}

      {hasData && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Investimento Total', value: formatCurrency(metrics.totalSpend), icon: DollarSign, color: 'text-blue-500' },
              { label: 'Receita (Leads Ganhos)', value: formatCurrency(metrics.totalRevenue), icon: TrendingUp, color: 'text-emerald-500' },
              { label: 'ROI', value: `${metrics.roi.toFixed(1)}%`, icon: metrics.roi >= 0 ? ArrowUpRight : ArrowDownRight, color: metrics.roi >= 0 ? 'text-emerald-500' : 'text-red-500' },
              { label: 'ROAS', value: `${metrics.roas.toFixed(2)}x`, icon: Target, color: 'text-violet-500' },
              { label: 'CPL (Custo/Lead)', value: formatCurrency(metrics.cpl), icon: Users, color: 'text-amber-500' },
              { label: 'CPA (Custo/Venda)', value: formatCurrency(metrics.cpa), icon: BarChart3, color: 'text-pink-500' },
              { label: 'Leads Gerados', value: formatNumber(metrics.totalLeads), icon: Users, color: 'text-blue-400' },
              { label: 'Vendas', value: formatNumber(metrics.wonLeads), icon: Target, color: 'text-emerald-400' },
            ].map((kpi, i) => (
              <Card key={i}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                    <span className="text-xs text-muted-foreground">{kpi.label}</span>
                  </div>
                  <p className="text-lg font-bold">{kpi.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Monthly trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Investimento vs Receita (Mensal)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                  <Bar dataKey="spend" name="Investimento" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="revenue" name="Receita" fill="#10b981" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Platform split */}
            {platformData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Investimento por Plataforma</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={platformData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {platformData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Leads trend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Leads vs Vendas (Mensal)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="leads" name="Leads" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="won" name="Vendas" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Campaigns */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Top 10 Campanhas por Investimento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {campaignData.map((c, i) => {
                  const maxSpend = campaignData[0]?.spend || 1;
                  const pct = (c.spend / maxSpend) * 100;
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="truncate max-w-[60%] font-medium">{c.campaign}</span>
                        <span className="text-muted-foreground">{formatCurrency(c.spend)} · {formatNumber(c.clicks)} cliques</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
