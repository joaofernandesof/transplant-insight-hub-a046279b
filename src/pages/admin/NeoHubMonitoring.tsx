import React, { useState, useMemo } from 'react';
import {
  useEdgeFunctionLogs,
  useMonitoringKPIs,
  useCostByAccount,
  useCostByFunction,
  useNeoHubCost,
  useDailyCostChart,
  useAccountNames,
  type MonitoringFilters,
} from '@/hooks/useEdgeFunctionLogs';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Activity, DollarSign, Zap, AlertTriangle, Server, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SUPER_ADMIN_EMAIL = 'adm@neofolic.com.br';

export default function NeoHubMonitoring() {
  const { user } = useUnifiedAuth();
  const [filters, setFilters] = useState<MonitoringFilters>({ period: '7d' });

  // Access control
  if (user?.email !== SUPER_ADMIN_EMAIL) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">Acesso Restrito</h2>
          <p className="text-muted-foreground">Esta página é exclusiva para o Super Admin.</p>
        </div>
      </div>
    );
  }

  const { data: logs = [], isLoading } = useEdgeFunctionLogs(filters);
  const kpis = useMonitoringKPIs(logs);
  const costByAccount = useCostByAccount(logs);
  const costByFunction = useCostByFunction(logs);
  const neohubCost = useNeoHubCost(logs);
  const dailyCost = useDailyCostChart(logs);

  const accountIds = useMemo(() => costByAccount.map(a => a.accountId), [costByAccount]);
  const { data: accountNames = {} } = useAccountNames(accountIds);

  const uniqueFunctions = useMemo(() => {
    const fns = new Set(logs.map(l => l.function_name));
    return Array.from(fns).sort();
  }, [logs]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-400" />
            Monitoramento NeoHub
          </h1>
          <p className="text-slate-400 text-sm">Custos e execuções de Edge Functions</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <Select value={filters.period} onValueChange={(v) => setFilters(f => ({ ...f, period: v as MonitoringFilters['period'] }))}>
            <SelectTrigger className="w-[130px] bg-slate-800 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.functionName || 'all'} onValueChange={(v) => setFilters(f => ({ ...f, functionName: v === 'all' ? undefined : v }))}>
            <SelectTrigger className="w-[200px] bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Todas funções" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas funções</SelectItem>
              {uniqueFunctions.map(fn => (
                <SelectItem key={fn} value={fn}>{fn}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20"><Zap className="h-5 w-5 text-blue-400" /></div>
              <div>
                <p className="text-xs text-slate-400">Total Execuções</p>
                <p className="text-2xl font-bold text-white">{kpis.totalExecutions.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20"><DollarSign className="h-5 w-5 text-green-400" /></div>
              <div>
                <p className="text-xs text-slate-400">Custo Total (USD)</p>
                <p className="text-2xl font-bold text-white">${kpis.totalCost.toFixed(4)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20"><TrendingUp className="h-5 w-5 text-purple-400" /></div>
              <div>
                <p className="text-xs text-slate-400">Mais Chamada</p>
                <p className="text-lg font-bold text-white truncate">{kpis.mostCalledFunction?.name || '-'}</p>
                <p className="text-xs text-slate-400">{kpis.mostCalledFunction?.count || 0}x</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20"><AlertTriangle className="h-5 w-5 text-red-400" /></div>
              <div>
                <p className="text-xs text-slate-400">Taxa de Erro</p>
                <p className="text-2xl font-bold text-white">{kpis.errorRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Cost Chart */}
      {dailyCost.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">Evolução Diária de Custo (USD)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyCost}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v.toFixed(3)}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                  formatter={(value: number) => [`$${value.toFixed(4)}`, '']}
                />
                <Legend />
                <Line type="monotone" dataKey="neohub" stroke="#3b82f6" name="NeoHub" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="avivar" stroke="#10b981" name="Avivar Accounts" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Cost by Account */}
      {costByAccount.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">Custo por Conta Avivar</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-400">Conta</TableHead>
                  <TableHead className="text-slate-400 text-right">Execuções</TableHead>
                  <TableHead className="text-slate-400 text-right">Tokens</TableHead>
                  <TableHead className="text-slate-400 text-right">Custo (USD)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costByAccount.map(a => (
                  <TableRow key={a.accountId} className="border-slate-700">
                    <TableCell className="text-white font-medium">{accountNames[a.accountId] || a.accountId.substring(0, 8)}</TableCell>
                    <TableCell className="text-slate-300 text-right">{a.executions.toLocaleString()}</TableCell>
                    <TableCell className="text-slate-300 text-right">{a.tokens.toLocaleString()}</TableCell>
                    <TableCell className="text-green-400 text-right font-mono">${a.cost.toFixed(4)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Cost by Function */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Custo por Função</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-400">Função</TableHead>
                <TableHead className="text-slate-400 text-right">Exec.</TableHead>
                <TableHead className="text-slate-400 text-right">Tempo Médio</TableHead>
                <TableHead className="text-slate-400 text-right">Tokens (in/out)</TableHead>
                <TableHead className="text-slate-400 text-right">Custo (USD)</TableHead>
                <TableHead className="text-slate-400 text-right">Erros</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costByFunction.map(f => (
                <TableRow key={f.functionName} className="border-slate-700">
                  <TableCell className="text-white font-medium font-mono text-sm">{f.functionName}</TableCell>
                  <TableCell className="text-slate-300 text-right">{f.executions.toLocaleString()}</TableCell>
                  <TableCell className="text-slate-300 text-right">{f.avgTime}ms</TableCell>
                  <TableCell className="text-slate-300 text-right">{f.tokensIn.toLocaleString()} / {f.tokensOut.toLocaleString()}</TableCell>
                  <TableCell className="text-green-400 text-right font-mono">${f.cost.toFixed(4)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={f.errorRate > 5 ? 'destructive' : 'secondary'} className="text-xs">
                      {f.errorRate.toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* NeoHub Own Cost */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Server className="h-5 w-5 text-blue-400" />
            Custo do NeoHub (sem account_id)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-3xl font-bold text-blue-400">${neohubCost.totalCost.toFixed(4)}</p>
            <p className="text-xs text-slate-400">Gasto total em funções internas do NeoHub</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {neohubCost.breakdown.map(b => (
              <div key={b.functionName} className="p-3 rounded-lg bg-slate-700/50">
                <p className="text-xs text-slate-400 truncate">{b.functionName}</p>
                <p className="text-lg font-bold text-white">${b.cost.toFixed(4)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
