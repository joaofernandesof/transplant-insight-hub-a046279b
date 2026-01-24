import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ListTodo,
  Search,
  CircleDashed,
  XCircle,
  User,
  Calendar,
  Play,
  Flag,
  ChevronRight,
  Target,
  TrendingUp,
  Users,
  Package,
  FileText,
  LayoutDashboard,
} from "lucide-react";
import { EventChecklist, useChecklistItems } from "@/neohub/hooks/useEventChecklists";
import { AddTaskDialog } from "@/neohub/components/AddTaskDialog";
import { EventDashboard } from "@/neohub/components/EventDashboard";
import { parseISO, format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface EventOrganizationPanelProps {
  checklist: EventChecklist;
  classDetails?: {
    enrolledCount: number;
    examCount: number;
    scheduleCount: number;
  };
}

const statusConfig = {
  pendente: { label: "Pendente", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300", icon: CircleDashed },
  em_andamento: { label: "Em Andamento", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300", icon: Clock },
  concluido: { label: "Concluído", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", icon: CheckCircle2 },
  cancelado: { label: "Cancelado", color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300", icon: XCircle },
};

const phaseConfig = {
  pre: {
    label: "Pré-Evento",
    icon: Target,
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    description: "Tarefas de preparação (D-60 a D-1)",
    filterFn: (offset: number) => offset < 0,
  },
  durante: {
    label: "Durante",
    icon: Play,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    description: "Atividades do dia do evento (D0)",
    filterFn: (offset: number) => offset === 0,
  },
  pos: {
    label: "Pós-Evento",
    icon: Flag,
    color: "text-purple-600",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    description: "Follow-up e finalização (D+1 a D+15)",
    filterFn: (offset: number) => offset > 0,
  },
};

export function EventOrganizationPanel({ checklist, classDetails }: EventOrganizationPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "pre" | "durante" | "pos">("overview");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterResponsible, setFilterResponsible] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { items, stats, updateItemStatus, createItem } = useChecklistItems(checklist.id);

  // Calculate days until event
  const daysUntilEvent = differenceInDays(parseISO(checklist.event_start_date), new Date());
  
  // Get unique responsibles
  const uniqueResponsibles = useMemo(() => {
    if (!items) return [];
    return [...new Set(items.map(i => i.responsible))].sort();
  }, [items]);

  // Filter items by phase
  const getPhaseItems = (phase: "pre" | "durante" | "pos") => {
    if (!items) return [];
    const config = phaseConfig[phase];
    return items.filter(item => config.filterFn(item.days_offset));
  };

  // Calculate phase stats
  const phaseStats = useMemo(() => {
    const result: Record<string, { total: number; done: number; overdue: number }> = {};
    
    Object.keys(phaseConfig).forEach(phase => {
      const phaseItems = getPhaseItems(phase as "pre" | "durante" | "pos");
      const today = new Date();
      
      result[phase] = {
        total: phaseItems.length,
        done: phaseItems.filter(i => i.status === "concluido").length,
        overdue: phaseItems.filter(i => {
          if (i.status === "concluido" || i.status === "cancelado") return false;
          if (!i.due_date) return false;
          return parseISO(i.due_date) < today;
        }).length,
      };
    });
    
    return result;
  }, [items]);

  // Filter items for display
  const filteredItems = useMemo(() => {
    if (!items) return [];
    
    let filtered = items;
    
    // Filter by phase if not overview
    if (activeSubTab !== "overview") {
      const config = phaseConfig[activeSubTab];
      filtered = filtered.filter(item => config.filterFn(item.days_offset));
    }
    
    // Apply other filters
    return filtered.filter(item => {
      if (filterStatus !== "all" && item.status !== filterStatus) return false;
      if (filterResponsible !== "all" && item.responsible !== filterResponsible) return false;
      if (searchQuery && !item.task_description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [items, activeSubTab, filterStatus, filterResponsible, searchQuery]);

  // Group items by days_offset
  const groupedItems = useMemo(() => {
    const groups: Record<string, typeof filteredItems> = {};
    
    filteredItems.forEach(item => {
      const key = item.days_offset.toString();
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    return Object.entries(groups).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
  }, [filteredItems]);

  const getDaysLabel = (offset: number) => {
    if (offset < 0) return `D${offset}`;
    if (offset === 0) return "D0";
    return `D+${offset}`;
  };

  const getDaysDescription = (offset: number) => {
    if (offset < 0) return `${Math.abs(offset)} dias antes`;
    if (offset === 0) return "Dia do evento";
    return `${offset} dias depois`;
  };

  const getItemDueStatus = (item: typeof items[0]) => {
    if (!item.due_date || item.status === "concluido" || item.status === "cancelado") return null;
    const dueDate = parseISO(item.due_date);
    const today = new Date();
    if (dueDate < today) return "overdue";
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Phase Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Overview Card */}
        <Card 
          className={cn(
            "cursor-pointer transition-all hover:shadow-md",
            activeSubTab === "overview" && "ring-2 ring-primary"
          )}
          onClick={() => setActiveSubTab("overview")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <LayoutDashboard className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Visão Geral</p>
                <p className="text-xs text-muted-foreground">Dashboard completo</p>
              </div>
              {activeSubTab === "overview" && (
                <ChevronRight className="h-4 w-4 text-primary" />
              )}
            </div>
            {stats && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progresso geral</span>
                  <span className="font-medium">{stats.total > 0 ? Math.round((stats.concluido / stats.total) * 100) : 0}%</span>
                </div>
                <Progress value={stats.total > 0 ? (stats.concluido / stats.total) * 100 : 0} className="h-1.5 mt-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Phase Cards */}
        {Object.entries(phaseConfig).map(([phase, config]) => {
          const Icon = config.icon;
          const pStats = phaseStats[phase];
          const isActive = activeSubTab === phase;
          
          return (
            <Card 
              key={phase}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                isActive && "ring-2 ring-primary"
              )}
              onClick={() => setActiveSubTab(phase as "pre" | "durante" | "pos")}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2.5 rounded-lg", config.bgColor)}>
                    <Icon className={cn("h-5 w-5", config.color)} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{config.label}</p>
                    <p className="text-xs text-muted-foreground">{config.description}</p>
                  </div>
                  {isActive && (
                    <ChevronRight className="h-4 w-4 text-primary" />
                  )}
                </div>
                {pStats && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        <span>{pStats.done}/{pStats.total}</span>
                      </div>
                      {pStats.overdue > 0 && (
                        <div className="flex items-center gap-1 text-destructive">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>{pStats.overdue} atrasados</span>
                        </div>
                      )}
                    </div>
                    <Progress 
                      value={pStats.total > 0 ? (pStats.done / pStats.total) * 100 : 0} 
                      className="h-1.5 mt-2" 
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Content Area */}
      {activeSubTab === "overview" ? (
        <EventDashboard 
          checklist={checklist} 
          stats={stats}
          classDetails={classDetails}
        />
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {(() => {
                  const config = phaseConfig[activeSubTab];
                  const Icon = config.icon;
                  return (
                    <>
                      <div className={cn("p-2 rounded-lg", config.bgColor)}>
                        <Icon className={cn("h-5 w-5", config.color)} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{config.label}</CardTitle>
                        <CardDescription>{config.description}</CardDescription>
                      </div>
                    </>
                  );
                })()}
              </div>
              <AddTaskDialog
                checklistId={checklist.id}
                onAddTask={(task) => createItem.mutate(task)}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar tarefa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterResponsible} onValueChange={setFilterResponsible}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {uniqueResponsibles.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tasks grouped by day offset */}
            <ScrollArea className="h-[500px]">
              <div className="space-y-6">
                {groupedItems.length > 0 ? (
                  groupedItems.map(([offset, tasks]) => (
                    <div key={offset} className="space-y-2">
                      <div className="flex items-center gap-2 sticky top-0 bg-background py-2 z-10">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "font-mono font-semibold",
                            parseInt(offset) < 0 && "border-blue-500 text-blue-600",
                            parseInt(offset) === 0 && "border-emerald-500 text-emerald-600",
                            parseInt(offset) > 0 && "border-purple-500 text-purple-600"
                          )}
                        >
                          {getDaysLabel(parseInt(offset))}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {getDaysDescription(parseInt(offset))}
                        </span>
                        <Separator className="flex-1" />
                        <span className="text-xs text-muted-foreground">
                          {tasks.filter(t => t.status === "concluido").length}/{tasks.length}
                        </span>
                      </div>
                      
                      <div className="space-y-2 pl-4">
                        {tasks.map((item) => {
                          const dueStatus = getItemDueStatus(item);
                          const StatusIcon = statusConfig[item.status as keyof typeof statusConfig]?.icon || CircleDashed;
                          
                          return (
                            <div
                              key={item.id}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-muted/50",
                                dueStatus === "overdue" && "border-destructive/50 bg-destructive/5"
                              )}
                            >
                              <Checkbox
                                checked={item.status === "concluido"}
                                onCheckedChange={(checked) => {
                                  updateItemStatus.mutate({
                                    itemId: item.id,
                                    status: checked ? "concluido" : "pendente",
                                  });
                                }}
                                className="h-5 w-5"
                              />
                              <div className="flex-1 min-w-0">
                                <p className={cn(
                                  "font-medium text-sm",
                                  item.status === "concluido" && "line-through text-muted-foreground"
                                )}>
                                  {item.task_description}
                                </p>
                                {item.observation && (
                                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                    {item.observation}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {dueStatus === "overdue" && (
                                  <Badge variant="destructive" className="text-xs">
                                    Atrasado
                                  </Badge>
                                )}
                                <Badge variant="secondary" className="text-xs">
                                  <User className="h-3 w-3 mr-1" />
                                  {item.responsible}
                                </Badge>
                                <Badge 
                                  variant="outline" 
                                  className={cn("text-xs", statusConfig[item.status as keyof typeof statusConfig]?.color)}
                                >
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusConfig[item.status as keyof typeof statusConfig]?.label || item.status}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <ListTodo className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma tarefa encontrada</p>
                    <p className="text-xs mt-1">Adicione tarefas para esta fase do evento</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
