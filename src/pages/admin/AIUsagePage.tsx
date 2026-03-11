/**
 * AI Usage Logs - Admin page to monitor all AI API requests across the platform
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  Brain, Search, Loader2, ArrowUpDown, Filter, CalendarIcon, RefreshCw,
  DollarSign, Zap, Clock, TrendingUp
} from 'lucide-react';

interface AIUsageLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  portal: string;
  module: string;
  action: string;
  edge_function: string;
  ai_model: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  estimated_cost_usd: number | null;
  processing_time_ms: number | null;
  status: string;
  error_message: string | null;
  metadata: any;
  created_at: string;
}

type SortField = 'created_at' | 'estimated_cost_usd' | 'total_tokens' | 'processing_time_ms';
type SortDir = 'asc' | 'desc';

export default function AIUsagePage() {
  const [logs, setLogs] = useState<AIUsageLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPortal, setFilterPortal] = useState('all');
  const [filterModule, setFilterModule] = useState('all');
  const [filterModel, setFilterModel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('ai_usage_logs')
        .select('*')
        .order(sortField, { ascending: sortDir === 'asc' })
        .limit(500);

      if (dateFrom) {
        query = query.gte('created_at', dateFrom.toISOString());
      }
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endOfDay.toISOString());
      }
      if (filterPortal !== 'all') query = query.eq('portal', filterPortal);
      if (filterModule !== 'all') query = query.eq('module', filterModule);
      if (filterModel !== 'all') query = query.eq('ai_model', filterModel);
      if (filterStatus !== 'all') query = query.eq('status', filterStatus);

      const { data, error } = await query;
      if (error) throw error;
      setLogs((data || []) as unknown as AIUsageLog[]);
    } catch (err) {
      console.error('Error fetching AI usage logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [sortField, sortDir, dateFrom, dateTo, filterPortal, filterModule, filterModel, filterStatus]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Filter by search
  const filtered = logs.filter(l => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      l.user_email?.toLowerCase().includes(s) ||
      l.user_name?.toLowerCase().includes(s) ||
      l.portal.toLowerCase().includes(s) ||
      l.module.toLowerCase().includes(s) ||
      l.action.toLowerCase().includes(s) ||
      l.edge_function.toLowerCase().includes(s) ||
      l.ai_model?.toLowerCase().includes(s)
    );
  });

  // Aggregations
  const totalCost = filtered.reduce((acc, l) => acc + (Number(l.estimated_cost_usd) || 0), 0);
  const totalRequests = filtered.length;
  const totalTokens = filtered.reduce((acc, l) => acc + (l.total_tokens || 0), 0);
  const avgProcessing = filtered.length > 0
    ? Math.round(filtered.reduce((acc, l) => acc + (l.processing_time_ms || 0), 0) / filtered.length)
    : 0;
  const errorCount = filtered.filter(l => l.status === 'error').length;

  // Unique values for filters
  const uniquePortals = [...new Set(logs.map(l => l.portal))].sort();
  const uniqueModules = [...new Set(logs.map(l => l.module))].sort();
  const uniqueModels = [...new Set(logs.map(l => l.ai_model).filter(Boolean))].sort();

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort(field)}>
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={cn("h-3 w-3", sortField === field ? "text-primary" : "text-muted-foreground/50")} />
      </div>
    </TableHead>
  );

  const clearFilters = () => {
    setSearch('');
    setFilterPortal('all');
    setFilterModule('all');
    setFilterModel('all');
    setFilterStatus('all');
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-violet-500/10">
          <Brain className="h-6 w-6 text-violet-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Uso de IA</h1>
          <p className="text-muted-foreground text-sm">
            Monitoramento de todas as requisições de IA da plataforma
          </p>
        </div>
        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={fetchLogs} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="h-5 w-5 mx-auto mb-1 text-amber-500" />
            <div className="text-2xl font-bold">{totalRequests}</div>
            <div className="text-xs text-muted-foreground">Requests</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
            <div className="text-2xl font-bold">${totalCost.toFixed(4)}</div>
            <div className="text-xs text-muted-foreground">Custo Estimado</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-blue-500" />
            <div className="text-2xl font-bold">{totalTokens.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Tokens Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 mx-auto mb-1 text-orange-500" />
            <div className="text-2xl font-bold">{avgProcessing}ms</div>
            <div className="text-xs text-muted-foreground">Tempo Médio</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="h-5 w-5 mx-auto mb-1 text-red-500" />
            <div className="text-2xl font-bold">{errorCount}</div>
            <div className="text-xs text-muted-foreground">Erros</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por usuário, portal, módulo, ação..."
            className="pl-9"
          />
        </div>
        <Select value={filterPortal} onValueChange={setFilterPortal}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Portal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos portais</SelectItem>
            {uniquePortals.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterModule} onValueChange={setFilterModule}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Módulo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos módulos</SelectItem>
            {uniqueModules.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterModel} onValueChange={setFilterModel}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Modelo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos modelos</SelectItem>
            {uniqueModels.map(m => <SelectItem key={m!} value={m!}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="success">Sucesso</SelectItem>
            <SelectItem value="error">Erro</SelectItem>
          </SelectContent>
        </Select>
        {/* Date pickers */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <CalendarIcon className="h-3.5 w-3.5" />
              {dateFrom ? format(dateFrom, 'dd/MM/yy') : 'De'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateFrom}
              onSelect={setDateFrom}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <CalendarIcon className="h-3.5 w-3.5" />
              {dateTo ? format(dateTo, 'dd/MM/yy') : 'Até'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateTo}
              onSelect={setDateTo}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
          Limpar filtros
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader field="created_at">Data/Hora</SortableHeader>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Portal</TableHead>
                  <TableHead>Módulo</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Modelo</TableHead>
                  <SortableHeader field="total_tokens">Tokens</SortableHeader>
                  <SortableHeader field="estimated_cost_usd">Custo (USD)</SortableHeader>
                  <SortableHeader field="processing_time_ms">Tempo</SortableHeader>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      {logs.length === 0 ? 'Nenhum registro de uso de IA encontrado' : 'Nenhum resultado com os filtros aplicados'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {format(new Date(log.created_at), 'dd/MM/yy HH:mm:ss', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="font-medium truncate max-w-[120px]" title={log.user_name || log.user_email || '—'}>
                          {log.user_name || log.user_email?.split('@')[0] || '—'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{log.portal}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{log.module}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{log.action}</TableCell>
                      <TableCell>
                        <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                          {log.ai_model?.split('/').pop() || '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        {log.total_tokens?.toLocaleString() || '—'}
                      </TableCell>
                      <TableCell className="text-xs text-right font-mono">
                        {log.estimated_cost_usd ? `$${Number(log.estimated_cost_usd).toFixed(4)}` : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        {log.processing_time_ms ? `${(log.processing_time_ms / 1000).toFixed(1)}s` : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={log.status === 'success' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {log.status === 'success' ? '✅' : '❌'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground text-right">
        Exibindo {filtered.length} de {logs.length} registros (máx. 500)
      </div>
    </div>
  );
}
