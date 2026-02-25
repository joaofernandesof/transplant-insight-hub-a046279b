/**
 * Página de Log de Ações do Portal CPG
 * Exibe todas as ações realizadas no portal, combinando:
 * - system_event_logs (page views, login, logout, actions)
 * - ipromed_activity_logs (CRUD de entidades)
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Search,
  Calendar,
  User,
  FileText,
  Users,
  Briefcase,
  Settings,
  Eye,
  Edit,
  Trash2,
  Plus,
  Download,
  RefreshCw,
  Clock,
  Activity,
  X,
  LogIn,
  LogOut,
  CalendarDays,
  FileSignature,
  MousePointerClick,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface UnifiedLog {
  id: string;
  user_name: string | null;
  user_email: string | null;
  action_type: string;
  entity_type: string;
  description: string;
  entity_name: string | null;
  created_at: string;
  source: 'activity' | 'event';
}

// Ícones por tipo de entidade
const entityIcons: Record<string, React.ElementType> = {
  client: Users,
  contract: FileText,
  meeting: CalendarDays,
  task: Briefcase,
  document: FileText,
  user: User,
  settings: Settings,
  onboarding: MousePointerClick,
  checklist: FileSignature,
  proposal: FileSignature,
  agenda: CalendarDays,
  page_view: Globe,
  login: LogIn,
  logout: LogOut,
  action: MousePointerClick,
  default: Activity,
};

// Cores por tipo de ação
const actionColors: Record<string, string> = {
  create: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  update: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  delete: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  view: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  login: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  logout: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  complete: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  page_view: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  action: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  default: "bg-muted text-muted-foreground",
};

// Labels traduzidos
const actionLabels: Record<string, string> = {
  create: "Criação",
  update: "Atualização",
  delete: "Exclusão",
  view: "Visualização",
  login: "Login",
  logout: "Logout",
  complete: "Conclusão",
  page_view: "Navegação",
  action: "Ação",
};

const entityLabels: Record<string, string> = {
  client: "Cliente",
  contract: "Contrato",
  meeting: "Reunião",
  task: "Tarefa",
  document: "Documento",
  user: "Usuário",
  settings: "Configurações",
  onboarding: "Onboarding",
  checklist: "Checklist",
  proposal: "Proposta",
  agenda: "Agenda",
  page_view: "Página",
  login: "Autenticação",
  logout: "Autenticação",
  action: "Sistema",
};

export default function IpromedActivityLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedActionType, setSelectedActionType] = useState<string>("all");
  const [selectedEntityType, setSelectedEntityType] = useState<string>("all");
  const [selectedDateRange, setSelectedDateRange] = useState<string>("7");
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>();
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>();

  const getDateRange = () => {
    if (selectedDateRange === "custom" && customDateFrom && customDateTo) {
      return { from: startOfDay(customDateFrom), to: endOfDay(customDateTo) };
    }
    const days = parseInt(selectedDateRange);
    return { from: startOfDay(subDays(new Date(), days)), to: endOfDay(new Date()) };
  };

  // Query combinada: activity_logs + system_event_logs do CPG
  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ["cpg-unified-logs", searchTerm, selectedActionType, selectedEntityType, selectedDateRange, customDateFrom, customDateTo],
    queryFn: async () => {
      const { from, to } = getDateRange();
      const fromISO = from.toISOString();
      const toISO = to.toISOString();

      // Fetch both sources in parallel
      const [activityResult, eventResult] = await Promise.all([
        // 1) ipromed_activity_logs
        (() => {
          let q = supabase
            .from("ipromed_activity_logs" as any)
            .select("*")
            .gte("created_at", fromISO)
            .lte("created_at", toISO)
            .order("created_at", { ascending: false })
            .limit(300);

          if (selectedActionType !== "all" && !['page_view', 'login', 'logout', 'action'].includes(selectedActionType)) {
            q = q.eq("action_type", selectedActionType);
          }
          if (selectedEntityType !== "all" && !['page_view', 'login', 'logout', 'action'].includes(selectedEntityType)) {
            q = q.eq("entity_type", selectedEntityType);
          }
          if (searchTerm) {
            q = q.ilike("description", `%${searchTerm}%`);
          }
          return q;
        })(),

        // 2) system_event_logs filtered to CPG paths or login events
        (() => {
          let q = supabase
            .from("system_event_logs")
            .select("*")
            .gte("created_at", fromISO)
            .lte("created_at", toISO)
            .order("created_at", { ascending: false })
            .limit(300);

          // Filter to CPG-related events
          q = q.or("page_path.like./cpg%,event_type.eq.login,event_type.eq.logout");

          if (selectedActionType !== "all" && ['page_view', 'login', 'logout', 'action'].includes(selectedActionType)) {
            q = q.eq("event_type", selectedActionType);
          }

          if (searchTerm) {
            q = q.or(`event_name.ilike.%${searchTerm}%,user_name.ilike.%${searchTerm}%`);
          }
          return q;
        })(),
      ]);

      // Normalize activity logs
      const activityLogs: UnifiedLog[] = (activityResult.data || []).map((log: any) => ({
        id: log.id,
        user_name: log.user_name,
        user_email: log.user_email,
        action_type: log.action_type,
        entity_type: log.entity_type,
        description: log.description,
        entity_name: log.entity_name,
        created_at: log.created_at,
        source: 'activity' as const,
      }));

      // Normalize system event logs
      const eventLogs: UnifiedLog[] = (eventResult.data || []).map((log: any) => ({
        id: log.id,
        user_name: log.user_name,
        user_email: log.user_email,
        action_type: log.event_type,
        entity_type: log.event_type, // page_view, login, logout, action
        description: log.event_name || `${log.event_type} - ${log.page_path || ''}`,
        entity_name: log.page_path || null,
        created_at: log.created_at,
        source: 'event' as const,
      }));

      // Filter event logs if entity type filter is for activity-only types
      let filteredEvents = eventLogs;
      if (selectedEntityType !== "all" && !['page_view', 'login', 'logout', 'action'].includes(selectedEntityType)) {
        filteredEvents = []; // Don't show event logs when filtering by entity type
      }

      // Filter activity logs if action type is event-only
      let filteredActivities = activityLogs;
      if (selectedActionType !== "all" && ['page_view', 'login', 'logout', 'action'].includes(selectedActionType)) {
        filteredActivities = [];
      }

      // Combine and sort
      const combined = [...filteredActivities, ...filteredEvents];
      combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return combined.slice(0, 500);
    },
  });

  // Estatísticas
  const stats = {
    total: logs?.length || 0,
    creates: logs?.filter(l => l.action_type === "create").length || 0,
    logins: logs?.filter(l => l.action_type === "login").length || 0,
    pageViews: logs?.filter(l => l.action_type === "page_view").length || 0,
    updates: logs?.filter(l => l.action_type === "update").length || 0,
  };

  // Agrupar logs por data
  const groupedLogs = logs?.reduce((acc, log) => {
    const date = format(new Date(log.created_at), "yyyy-MM-dd");
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {} as Record<string, UnifiedLog[]>) || {};

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedActionType("all");
    setSelectedEntityType("all");
    setSelectedDateRange("7");
    setCustomDateFrom(undefined);
    setCustomDateTo(undefined);
  };

  const hasActiveFilters = searchTerm || selectedActionType !== "all" || selectedEntityType !== "all" || selectedDateRange !== "7";

  return (
    <div className="space-y-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Log de Ações
          </h1>
          <p className="text-muted-foreground">
            Histórico completo de todas as ações realizadas no portal CPG
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total de ações</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <LogIn className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.logins}</p>
                <p className="text-xs text-muted-foreground">Logins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-100 dark:bg-sky-900/30 rounded-lg">
                <Globe className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pageViews}</p>
                <p className="text-xs text-muted-foreground">Navegações</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <Plus className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.creates}</p>
                <p className="text-xs text-muted-foreground">Criações</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar ações, usuários, páginas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedActionType} onValueChange={setSelectedActionType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo de ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                <SelectItem value="create">Criações</SelectItem>
                <SelectItem value="update">Atualizações</SelectItem>
                <SelectItem value="delete">Exclusões</SelectItem>
                <SelectItem value="complete">Conclusões</SelectItem>
                <SelectItem value="page_view">Navegações</SelectItem>
                <SelectItem value="login">Logins</SelectItem>
                <SelectItem value="logout">Logouts</SelectItem>
                <SelectItem value="action">Ações do sistema</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo de entidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as entidades</SelectItem>
                <SelectItem value="client">Clientes</SelectItem>
                <SelectItem value="contract">Contratos</SelectItem>
                <SelectItem value="meeting">Reuniões</SelectItem>
                <SelectItem value="task">Tarefas</SelectItem>
                <SelectItem value="proposal">Propostas</SelectItem>
                <SelectItem value="agenda">Agenda</SelectItem>
                <SelectItem value="onboarding">Onboarding</SelectItem>
                <SelectItem value="page_view">Navegações</SelectItem>
                <SelectItem value="login">Logins</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Hoje</SelectItem>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="365">Último ano</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>

          {selectedDateRange === "custom" && (
            <div className="flex items-center gap-4 mt-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[200px] justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    {customDateFrom ? format(customDateFrom, "dd/MM/yyyy") : "Data inicial"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={customDateFrom}
                    onSelect={setCustomDateFrom}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground">até</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[200px] justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    {customDateTo ? format(customDateTo, "dd/MM/yyyy") : "Data final"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={customDateTo}
                    onSelect={setCustomDateTo}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Atividades Recentes
            {logs && <Badge variant="outline">{logs.length} registros</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : logs && logs.length > 0 ? (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-6">
                {Object.entries(groupedLogs).map(([date, dayLogs]) => (
                  <div key={date}>
                    <div className="sticky top-0 bg-background py-2 z-10">
                      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        <Badge variant="secondary" className="text-xs">{dayLogs.length}</Badge>
                      </h3>
                    </div>
                    <div className="space-y-3 mt-2">
                      {dayLogs.map((log) => {
                        const EntityIcon = entityIcons[log.entity_type] || entityIcons.default;
                        const actionColor = actionColors[log.action_type] || actionColors.default;
                        const actionLabel = actionLabels[log.action_type] || log.action_type;
                        const entityLabel = entityLabels[log.entity_type] || log.entity_type;

                        return (
                          <div
                            key={log.id}
                            className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                          >
                            <div className={cn("p-2 rounded-lg shrink-0", actionColor)}>
                              <EntityIcon className="h-4 w-4" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{log.description}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge variant="outline" className="text-xs">
                                  {actionLabel}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {entityLabel}
                                </Badge>
                                {log.entity_name && (
                                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                    • {log.entity_name}
                                  </span>
                                )}
                              </div>
                              {log.user_name && (
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {log.user_name}
                                  {log.user_email && (
                                    <span className="opacity-60">({log.user_email})</span>
                                  )}
                                </p>
                              )}
                            </div>

                            <div className="text-xs text-muted-foreground whitespace-nowrap flex flex-col items-end gap-1">
                              <span>{format(new Date(log.created_at), "HH:mm")}</span>
                              {log.source === 'event' && (
                                <Badge variant="outline" className="text-[10px] px-1 py-0">
                                  sistema
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Nenhuma atividade encontrada</h3>
              <p className="text-muted-foreground">
                {hasActiveFilters
                  ? "Tente ajustar os filtros para ver mais resultados"
                  : "As atividades do portal aparecerão aqui"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
