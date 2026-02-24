/**
 * Página de Log de Ações do Portal CPG
 * Exibe todas as ações realizadas no sistema com filtros e pesquisa
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Search,
  Filter,
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
  ChevronDown,
  X,
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

interface ActivityLog {
  id: string;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
}

// Ícones por tipo de entidade
const entityIcons: Record<string, React.ElementType> = {
  client: Users,
  contract: FileText,
  meeting: Calendar,
  task: Briefcase,
  document: FileText,
  user: User,
  settings: Settings,
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
};

export default function IpromedActivityLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedActionType, setSelectedActionType] = useState<string>("all");
  const [selectedEntityType, setSelectedEntityType] = useState<string>("all");
  const [selectedDateRange, setSelectedDateRange] = useState<string>("7");
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>();
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>();

  // Calcular datas do filtro
  const getDateRange = () => {
    if (selectedDateRange === "custom" && customDateFrom && customDateTo) {
      return { from: startOfDay(customDateFrom), to: endOfDay(customDateTo) };
    }
    const days = parseInt(selectedDateRange);
    return { 
      from: startOfDay(subDays(new Date(), days)), 
      to: endOfDay(new Date()) 
    };
  };

  // Query para buscar logs
  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ["ipromed-activity-logs", searchTerm, selectedActionType, selectedEntityType, selectedDateRange, customDateFrom, customDateTo],
    queryFn: async () => {
      const { from, to } = getDateRange();
      
      let query = supabase
        .from("ipromed_activity_logs" as any)
        .select("*")
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString())
        .order("created_at", { ascending: false })
        .limit(500);

      if (selectedActionType !== "all") {
        query = query.eq("action_type", selectedActionType);
      }

      if (selectedEntityType !== "all") {
        query = query.eq("entity_type", selectedEntityType);
      }

      if (searchTerm) {
        query = query.ilike("description", `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as ActivityLog[];
    },
  });

  // Estatísticas
  const stats = {
    total: logs?.length || 0,
    creates: logs?.filter(l => l.action_type === "create").length || 0,
    updates: logs?.filter(l => l.action_type === "update").length || 0,
    deletes: logs?.filter(l => l.action_type === "delete").length || 0,
  };

  // Agrupar logs por data
  const groupedLogs = logs?.reduce((acc, log) => {
    const date = format(new Date(log.created_at), "yyyy-MM-dd");
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {} as Record<string, ActivityLog[]>) || {};

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
            Histórico completo de todas as ações realizadas no portal
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
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
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Edit className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.updates}</p>
                <p className="text-xs text-muted-foreground">Atualizações</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.deletes}</p>
                <p className="text-xs text-muted-foreground">Exclusões</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar ações, clientes, contratos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Action Type Filter */}
            <Select value={selectedActionType} onValueChange={setSelectedActionType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo de ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                <SelectItem value="create">Criações</SelectItem>
                <SelectItem value="update">Atualizações</SelectItem>
                <SelectItem value="delete">Exclusões</SelectItem>
                <SelectItem value="view">Visualizações</SelectItem>
                <SelectItem value="complete">Conclusões</SelectItem>
              </SelectContent>
            </Select>

            {/* Entity Type Filter */}
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
                <SelectItem value="document">Documentos</SelectItem>
                <SelectItem value="onboarding">Onboarding</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range Filter */}
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

          {/* Custom date range */}
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
                            {/* Icon */}
                            <div className={cn("p-2 rounded-lg", actionColor)}>
                              <EntityIcon className="h-4 w-4" />
                            </div>

                            {/* Content */}
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
                                  <span className="text-xs text-muted-foreground">
                                    • {log.entity_name}
                                  </span>
                                )}
                              </div>
                              {log.user_name && (
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {log.user_name}
                                </p>
                              )}
                            </div>

                            {/* Time */}
                            <div className="text-xs text-muted-foreground whitespace-nowrap">
                              {format(new Date(log.created_at), "HH:mm")}
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
