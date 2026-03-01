import { useState, useMemo } from 'react';
import { useEventLogs, useEventLogsStats, EventLogsFilters, EventLog } from '@/hooks/useEventLogs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { GlobalBreadcrumb } from '@/components/GlobalBreadcrumb';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Activity,
  Search,
  Filter,
  RefreshCw,
  Eye,
  MousePointer,
  LogIn,
  LogOut,
  AlertTriangle,
  Zap,
  Clock,
  BarChart3,
  Layers,
  Calendar,
  ChevronDown,
  ChevronRight,
  Globe,
  Monitor,
  User,
  Hash,
  Trophy,
  Timer,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const eventTypeConfig: Record<string, { icon: typeof Activity; color: string; label: string }> = {
  page_view: { icon: Eye, color: 'bg-blue-500', label: 'Visualização' },
  action: { icon: MousePointer, color: 'bg-green-500', label: 'Ação' },
  login: { icon: LogIn, color: 'bg-emerald-500', label: 'Login' },
  logout: { icon: LogOut, color: 'bg-amber-500', label: 'Logout' },
  error: { icon: AlertTriangle, color: 'bg-red-500', label: 'Erro' },
  api_call: { icon: Zap, color: 'bg-purple-500', label: 'API' },
};

const eventCategoryConfig: Record<string, string> = {
  navigation: 'Navegação',
  authentication: 'Autenticação',
  data: 'Dados',
  admin: 'Administração',
  system: 'Sistema',
};

interface ExpandableRowProps {
  log: EventLog;
  isExpanded: boolean;
  onToggle: () => void;
}

function ExpandableRow({ log, isExpanded, onToggle }: ExpandableRowProps) {
  const typeConfig = eventTypeConfig[log.event_type] || { icon: Activity, color: 'bg-gray-500', label: log.event_type };
  const categoryLabel = eventCategoryConfig[log.event_category] || log.event_category;

  return (
    <>
      <TableRow className="hover:bg-slate-700/30 cursor-pointer border-slate-700/50" onClick={onToggle}>
        <TableCell className="w-10 p-2">
          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400" onClick={(e) => { e.stopPropagation(); onToggle(); }}>
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </TableCell>
        <TableCell className="font-mono text-xs text-slate-400 p-2">
          {format(new Date(log.created_at), 'dd/MM HH:mm:ss')}
        </TableCell>
        <TableCell className="p-2">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1 whitespace-nowrap border-slate-600 text-slate-300">
            <div className={`w-1.5 h-1.5 rounded-full ${typeConfig.color}`} />
            {typeConfig.label}
          </Badge>
        </TableCell>
        <TableCell className="p-2">
          <span className="text-xs text-slate-400">{categoryLabel}</span>
        </TableCell>
        <TableCell className="p-2 max-w-[200px]">
          <span className="text-sm text-slate-200 truncate block">{log.event_name}</span>
        </TableCell>
        <TableCell className="p-2">
          <span className="text-sm text-slate-300 truncate block max-w-[120px]">{log.user_name || 'Sistema'}</span>
        </TableCell>
        <TableCell className="p-2">
          {log.module && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-slate-600 text-slate-400">
              {log.module}
            </Badge>
          )}
        </TableCell>
        <TableCell className="p-2">
          <span className="text-xs text-slate-500 truncate block max-w-[150px]">
            {log.page_path || '-'}
          </span>
        </TableCell>
      </TableRow>

      {isExpanded && (
        <TableRow className="bg-slate-800/60 hover:bg-slate-800/60 border-slate-700/50">
          <TableCell colSpan={8} className="p-0">
            <div className="p-4 space-y-3 border-l-2 border-blue-500/30 ml-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-400">
                    <User className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Usuário</span>
                  </div>
                  <div className="pl-5 space-y-0.5">
                    <p className="font-medium text-white">{log.user_name || 'Anônimo'}</p>
                    <p className="text-xs text-slate-400">{log.user_email || 'Sem email'}</p>
                    {log.user_id && <p className="text-xs font-mono text-slate-500">ID: {log.user_id.slice(0, 8)}...</p>}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Hash className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Sessão</span>
                  </div>
                  <div className="pl-5">
                    <p className="text-xs font-mono text-slate-400">{log.session_id || 'Sem sessão'}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Data/Hora</span>
                  </div>
                  <div className="pl-5 space-y-0.5">
                    <p className="text-white">{format(new Date(log.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                    <p className="text-xs text-slate-400">
                      {format(new Date(log.created_at), 'HH:mm:ss')} ({formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })})
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Globe className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Página</span>
                  </div>
                  <div className="pl-5">
                    <p className="font-mono text-xs text-slate-300 break-all">{log.page_path || 'Não registrada'}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Monitor className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Dispositivo</span>
                  </div>
                  <div className="pl-5">
                    <p className="text-xs text-slate-500 break-all line-clamp-2">{log.user_agent || 'Não registrado'}</p>
                    {log.ip_address && <p className="text-xs font-mono text-slate-400 mt-1">IP: {log.ip_address}</p>}
                  </div>
                </div>
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Layers className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">Metadados</span>
                    </div>
                    <div className="pl-5">
                      <pre className="text-xs bg-slate-900/50 text-slate-300 p-2 rounded-md overflow-x-auto max-w-full">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
              <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-500">
                <span className="font-mono">ID: {log.id}</span>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// ── User ranking helpers ──
interface UserRanking {
  userId: string;
  name: string;
  email: string | null;
  count: number;
}

interface UserTimeRanking {
  userId: string;
  name: string;
  email: string | null;
  sessions: number;
  estimatedMinutes: number;
}

function buildActionRanking(logs: EventLog[]): UserRanking[] {
  const map = new Map<string, UserRanking>();
  for (const l of logs) {
    if (!l.user_id) continue;
    const existing = map.get(l.user_id);
    if (existing) {
      existing.count++;
    } else {
      map.set(l.user_id, { userId: l.user_id, name: l.user_name || 'Anônimo', email: l.user_email, count: 1 });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 10);
}

function buildTimeRanking(logs: EventLog[]): UserTimeRanking[] {
  // Group events by user+session, estimate time as span between first and last event per session
  const sessions = new Map<string, { userId: string; name: string; email: string | null; times: number[] }>();
  for (const l of logs) {
    if (!l.user_id || !l.session_id) continue;
    const key = `${l.user_id}__${l.session_id}`;
    const ts = new Date(l.created_at).getTime();
    const existing = sessions.get(key);
    if (existing) {
      existing.times.push(ts);
    } else {
      sessions.set(key, { userId: l.user_id, name: l.user_name || 'Anônimo', email: l.user_email, times: [ts] });
    }
  }

  const userTime = new Map<string, { name: string; email: string | null; totalMs: number; sessions: number }>();
  for (const s of sessions.values()) {
    if (s.times.length < 2) continue;
    const min = Math.min(...s.times);
    const max = Math.max(...s.times);
    const duration = max - min;
    const existing = userTime.get(s.userId);
    if (existing) {
      existing.totalMs += duration;
      existing.sessions++;
    } else {
      userTime.set(s.userId, { name: s.name, email: s.email, totalMs: duration, sessions: 1 });
    }
  }

  return Array.from(userTime.entries())
    .map(([userId, d]) => ({
      userId,
      name: d.name,
      email: d.email,
      sessions: d.sessions,
      estimatedMinutes: Math.round(d.totalMs / 60000),
    }))
    .sort((a, b) => b.estimatedMinutes - a.estimatedMinutes)
    .slice(0, 10);
}

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// ── Medal colors ──
const medalColors = ['text-amber-400', 'text-slate-300', 'text-orange-400'];

export default function EventLogs() {
  const [filters, setFilters] = useState<EventLogsFilters>({});
  const [searchInput, setSearchInput] = useState('');
  const [limit, setLimit] = useState(100);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { data: logs, isLoading, refetch, isFetching } = useEventLogs(filters, limit);
  const { data: stats, isLoading: statsLoading } = useEventLogsStats();

  // Rankings based on current loaded logs
  const actionRanking = useMemo(() => buildActionRanking(logs || []), [logs]);
  const timeRanking = useMemo(() => buildTimeRanking(logs || []), [logs]);

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchInput || undefined }));
  };

  const handleFilterChange = (key: keyof EventLogsFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value === 'all' ? undefined : value }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchInput('');
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const uniqueModules = useMemo(() => {
    if (!logs) return [];
    const modules = new Set(logs.map(log => log.module).filter(Boolean));
    return Array.from(modules) as string[];
  }, [logs]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 p-3 lg:p-6 space-y-5">
      <GlobalBreadcrumb />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="h-6 w-6 text-cyan-400" />
            Log de Eventos
          </h1>
          <p className="text-sm text-slate-400">
            Acompanhe todas as atividades do sistema em tempo real
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          variant="outline"
          size="sm"
          disabled={isFetching}
          className="gap-2 border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-slate-800/60 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Clock className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Última hora</p>
                <p className="text-xl font-bold text-white">
                  {statsLoading ? <Skeleton className="h-6 w-12 bg-slate-700" /> : stats?.lastHour || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/60 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <BarChart3 className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Últimas 24h</p>
                <p className="text-xl font-bold text-white">
                  {statsLoading ? <Skeleton className="h-6 w-12 bg-slate-700" /> : stats?.last24h || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/60 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Calendar className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Hoje</p>
                <p className="text-xl font-bold text-white">
                  {statsLoading ? <Skeleton className="h-6 w-12 bg-slate-700" /> : stats?.today || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/60 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Layers className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Tipos (24h)</p>
                <p className="text-xl font-bold text-white">
                  {statsLoading ? <Skeleton className="h-6 w-12 bg-slate-700" /> : Object.keys(stats?.byType || {}).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Type breakdown */}
      {stats?.byType && Object.keys(stats.byType).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats.byType).map(([type, count]) => {
            const config = eventTypeConfig[type] || { icon: Activity, color: 'bg-gray-500', label: type };
            return (
              <Badge key={type} variant="outline" className="gap-1.5 py-1 border-slate-600 text-slate-300">
                <div className={`w-2 h-2 rounded-full ${config.color}`} />
                {config.label}: {count}
              </Badge>
            );
          })}
        </div>
      )}

      {/* Rankings */}
      {!isLoading && logs && logs.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Actions ranking */}
          <Card className="bg-slate-800/60 border-slate-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-white">
                <Trophy className="h-4 w-4 text-amber-400" />
                Ranking — Mais Ações
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {actionRanking.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">Sem dados suficientes</p>
              ) : (
                <div className="space-y-2">
                  {actionRanking.map((u, i) => (
                    <div key={u.userId} className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/40">
                      <span className={`text-sm font-bold w-6 text-center ${medalColors[i] || 'text-slate-500'}`}>
                        {i + 1}º
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{u.name}</p>
                        {u.email && <p className="text-[10px] text-slate-500 truncate">{u.email}</p>}
                      </div>
                      <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs">
                        {u.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Time ranking */}
          <Card className="bg-slate-800/60 border-slate-700/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-white">
                <Timer className="h-4 w-4 text-emerald-400" />
                Ranking — Mais Tempo Online
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {timeRanking.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">Sem dados de sessão suficientes</p>
              ) : (
                <div className="space-y-2">
                  {timeRanking.map((u, i) => (
                    <div key={u.userId} className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/40">
                      <span className={`text-sm font-bold w-6 text-center ${medalColors[i] || 'text-slate-500'}`}>
                        {i + 1}º
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{u.name}</p>
                        {u.email && <p className="text-[10px] text-slate-500 truncate">{u.email}</p>}
                      </div>
                      <div className="text-right">
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
                          {formatMinutes(u.estimatedMinutes)}
                        </Badge>
                        <p className="text-[10px] text-slate-500 mt-0.5">{u.sessions} sessões</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="bg-slate-800/60 border-slate-700/50">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Buscar por evento, usuário, email ou página..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
              />
              <Button onClick={handleSearch} size="icon" className="bg-slate-700 hover:bg-slate-600 text-white">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <Select value={filters.eventType || 'all'} onValueChange={(v) => handleFilterChange('eventType', v)}>
              <SelectTrigger className="w-[150px] bg-slate-900/50 border-slate-700 text-white">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="page_view">Visualização</SelectItem>
                <SelectItem value="action">Ação</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
                <SelectItem value="api_call">API</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.eventCategory || 'all'} onValueChange={(v) => handleFilterChange('eventCategory', v)}>
              <SelectTrigger className="w-[150px] bg-slate-900/50 border-slate-700 text-white">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                <SelectItem value="navigation">Navegação</SelectItem>
                <SelectItem value="authentication">Autenticação</SelectItem>
                <SelectItem value="data">Dados</SelectItem>
                <SelectItem value="admin">Administração</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
              </SelectContent>
            </Select>

            {uniqueModules.length > 0 && (
              <Select value={filters.module || 'all'} onValueChange={(v) => handleFilterChange('module', v)}>
                <SelectTrigger className="w-[150px] bg-slate-900/50 border-slate-700 text-white">
                  <SelectValue placeholder="Módulo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos módulos</SelectItem>
                  {uniqueModules.map((mod) => (
                    <SelectItem key={mod} value={mod}>{mod}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button onClick={clearFilters} variant="ghost" size="sm" className="gap-1 text-slate-400 hover:text-white">
              <Filter className="h-4 w-4" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="bg-slate-800/60 border-slate-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between text-white">
            <span className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              Eventos Recentes
              {logs && logs.length > 0 && (
                <Badge className="ml-2 bg-slate-700 text-slate-300 border-slate-600">{logs.length}</Badge>
              )}
            </span>
            <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
              <SelectTrigger className="w-[100px] h-8 bg-slate-900/50 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="250">250</SelectItem>
                <SelectItem value="500">500</SelectItem>
              </SelectContent>
            </Select>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-full bg-slate-700" />
                </div>
              ))}
            </div>
          ) : logs && logs.length > 0 ? (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader className="sticky top-0 bg-slate-800 z-10">
                  <TableRow className="border-slate-700/50 hover:bg-slate-800">
                    <TableHead className="w-10 p-2"></TableHead>
                    <TableHead className="p-2 text-xs text-slate-400">Data/Hora</TableHead>
                    <TableHead className="p-2 text-xs text-slate-400">Tipo</TableHead>
                    <TableHead className="p-2 text-xs text-slate-400">Categoria</TableHead>
                    <TableHead className="p-2 text-xs text-slate-400">Evento</TableHead>
                    <TableHead className="p-2 text-xs text-slate-400">Usuário</TableHead>
                    <TableHead className="p-2 text-xs text-slate-400">Módulo</TableHead>
                    <TableHead className="p-2 text-xs text-slate-400">Página</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <ExpandableRow
                      key={log.id}
                      log={log}
                      isExpanded={expandedRows.has(log.id)}
                      onToggle={() => toggleRow(log.id)}
                    />
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <div className="p-8 text-center text-slate-400">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum evento encontrado</p>
              <p className="text-xs mt-1">Os eventos serão registrados conforme usuários navegam no sistema</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
