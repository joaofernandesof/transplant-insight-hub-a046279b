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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <TableRow className="hover:bg-muted/50 cursor-pointer" onClick={onToggle}>
        <TableCell className="w-10 p-2">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => e.stopPropagation()}>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
        </TableCell>
        <TableCell className="font-mono text-xs text-muted-foreground p-2">
          {format(new Date(log.created_at), 'dd/MM HH:mm:ss')}
        </TableCell>
        <TableCell className="p-2">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1 whitespace-nowrap">
            <div className={`w-1.5 h-1.5 rounded-full ${typeConfig.color}`} />
            {typeConfig.label}
          </Badge>
        </TableCell>
        <TableCell className="p-2">
          <span className="text-xs text-muted-foreground">{categoryLabel}</span>
        </TableCell>
        <TableCell className="p-2 max-w-[200px]">
          <span className="text-sm truncate block">{log.event_name}</span>
        </TableCell>
        <TableCell className="p-2">
          <span className="text-sm truncate block max-w-[120px]">{log.user_name || 'Sistema'}</span>
        </TableCell>
        <TableCell className="p-2">
          {log.module && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {log.module}
            </Badge>
          )}
        </TableCell>
        <TableCell className="p-2">
          <span className="text-xs text-muted-foreground truncate block max-w-[150px]">
            {log.page_path || '-'}
          </span>
        </TableCell>
      </TableRow>

      <CollapsibleContent asChild>
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableCell colSpan={8} className="p-0">
            <div className="p-4 space-y-3 border-l-2 border-primary/30 ml-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                {/* User Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Usuário</span>
                  </div>
                  <div className="pl-5 space-y-0.5">
                    <p className="font-medium">{log.user_name || 'Anônimo'}</p>
                    <p className="text-xs text-muted-foreground">{log.user_email || 'Sem email'}</p>
                    {log.user_id && (
                      <p className="text-xs font-mono text-muted-foreground">ID: {log.user_id.slice(0, 8)}...</p>
                    )}
                  </div>
                </div>

                {/* Session Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Hash className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Sessão</span>
                  </div>
                  <div className="pl-5 space-y-0.5">
                    <p className="text-xs font-mono">{log.session_id || 'Sem sessão'}</p>
                  </div>
                </div>

                {/* Time Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Data/Hora</span>
                  </div>
                  <div className="pl-5 space-y-0.5">
                    <p>{format(new Date(log.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(log.created_at), 'HH:mm:ss')} ({formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })})
                    </p>
                  </div>
                </div>

                {/* Page/Path Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Página</span>
                  </div>
                  <div className="pl-5">
                    <p className="font-mono text-xs break-all">{log.page_path || 'Não registrada'}</p>
                  </div>
                </div>

                {/* Device Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Monitor className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Dispositivo</span>
                  </div>
                  <div className="pl-5">
                    <p className="text-xs text-muted-foreground break-all line-clamp-2">
                      {log.user_agent || 'Não registrado'}
                    </p>
                    {log.ip_address && (
                      <p className="text-xs font-mono mt-1">IP: {log.ip_address}</p>
                    )}
                  </div>
                </div>

                {/* Metadata */}
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Layers className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">Metadados</span>
                    </div>
                    <div className="pl-5">
                      <pre className="text-xs bg-muted/50 p-2 rounded-md overflow-x-auto max-w-full">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              {/* Event ID */}
              <div className="pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-mono">ID: {log.id}</span>
              </div>
            </div>
          </TableCell>
        </TableRow>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function EventLogs() {
  const [filters, setFilters] = useState<EventLogsFilters>({});
  const [searchInput, setSearchInput] = useState('');
  const [limit, setLimit] = useState(100);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { data: logs, isLoading, refetch, isFetching } = useEventLogs(filters, limit);
  const { data: stats, isLoading: statsLoading } = useEventLogsStats();

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
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const uniqueModules = useMemo(() => {
    if (!logs) return [];
    const modules = new Set(logs.map(log => log.module).filter(Boolean));
    return Array.from(modules) as string[];
  }, [logs]);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <GlobalBreadcrumb />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Log de Eventos
          </h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe todas as atividades do sistema em tempo real
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          variant="outline"
          size="sm"
          disabled={isFetching}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Última hora</p>
                <p className="text-xl font-bold">
                  {statsLoading ? <Skeleton className="h-6 w-12" /> : stats?.lastHour || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <BarChart3 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Últimas 24h</p>
                <p className="text-xl font-bold">
                  {statsLoading ? <Skeleton className="h-6 w-12" /> : stats?.last24h || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Hoje</p>
                <p className="text-xl font-bold">
                  {statsLoading ? <Skeleton className="h-6 w-12" /> : stats?.today || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Layers className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tipos (24h)</p>
                <p className="text-xl font-bold">
                  {statsLoading ? <Skeleton className="h-6 w-12" /> : Object.keys(stats?.byType || {}).length}
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
              <Badge key={type} variant="outline" className="gap-1.5 py-1">
                <div className={`w-2 h-2 rounded-full ${config.color}`} />
                {config.label}: {count}
              </Badge>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Buscar por evento, usuário, email ou página..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} size="icon" variant="secondary">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <Select value={filters.eventType || 'all'} onValueChange={(v) => handleFilterChange('eventType', v)}>
              <SelectTrigger className="w-[150px]">
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
              <SelectTrigger className="w-[150px]">
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
                <SelectTrigger className="w-[150px]">
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

            <Button onClick={clearFilters} variant="ghost" size="sm" className="gap-1">
              <Filter className="h-4 w-4" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Eventos Recentes
              {logs && logs.length > 0 && (
                <Badge variant="secondary" className="ml-2">{logs.length}</Badge>
              )}
            </span>
            <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
              <SelectTrigger className="w-[100px] h-8">
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
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          ) : logs && logs.length > 0 ? (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-10 p-2"></TableHead>
                    <TableHead className="p-2 text-xs">Data/Hora</TableHead>
                    <TableHead className="p-2 text-xs">Tipo</TableHead>
                    <TableHead className="p-2 text-xs">Categoria</TableHead>
                    <TableHead className="p-2 text-xs">Evento</TableHead>
                    <TableHead className="p-2 text-xs">Usuário</TableHead>
                    <TableHead className="p-2 text-xs">Módulo</TableHead>
                    <TableHead className="p-2 text-xs">Página</TableHead>
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
            <div className="p-8 text-center text-muted-foreground">
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