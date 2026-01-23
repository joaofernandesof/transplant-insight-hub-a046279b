import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  ListTodo,
  Search,
  Plus,
  CalendarDays,
  MapPin,
  CircleDashed,
  XCircle,
  User,
  Bell,
  BellRing
} from "lucide-react";
import { useEventChecklists, useChecklistItems, EventChecklist } from "@/neohub/hooks/useEventChecklists";
import { NewChecklistDialog } from "@/neohub/components/NewChecklistDialog";
import { AddTaskDialog } from "@/neohub/components/AddTaskDialog";
import { format, differenceInDays, parseISO, isToday, isPast } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const statusConfig = {
  pendente: { label: "Pendente", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300", icon: CircleDashed },
  em_andamento: { label: "Em Andamento", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300", icon: Clock },
  concluido: { label: "Concluído", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", icon: CheckCircle2 },
  cancelado: { label: "Cancelado", color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300", icon: XCircle },
};

const priorityConfig = {
  baixa: { label: "Baixa", color: "text-gray-500" },
  normal: { label: "Normal", color: "text-blue-500" },
  alta: { label: "Alta", color: "text-orange-500" },
  urgente: { label: "Urgente", color: "text-red-500" },
};

export default function NeoTeamEvents() {
  const { checklists, upcomingClasses, isLoading, createChecklist } = useEventChecklists();
  const [selectedChecklist, setSelectedChecklist] = useState<EventChecklist | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterResponsible, setFilterResponsible] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showOverdueAlert, setShowOverdueAlert] = useState(true);

  const { items, stats, updateItemStatus, createItem, isLoading: loadingItems } = useChecklistItems(selectedChecklist?.id || null);

  // Auto-select first checklist when loaded
  useEffect(() => {
    if (checklists && checklists.length > 0 && !selectedChecklist) {
      setSelectedChecklist(checklists[0]);
    }
  }, [checklists, selectedChecklist]);

  // Show overdue notifications
  useEffect(() => {
    if (stats && stats.atrasados > 0 && showOverdueAlert) {
      toast.warning(`${stats.atrasados} tarefa(s) atrasada(s)!`, {
        description: "Verifique as tarefas pendentes do evento.",
        duration: 5000,
      });
    }
  }, [stats?.atrasados, showOverdueAlert]);

  // Get unique responsibles
  const uniqueResponsibles = useMemo(() => {
    if (!items) return [];
    return [...new Set(items.map(i => i.responsible))].sort();
  }, [items]);

  // Filter items
  const filteredItems = useMemo(() => {
    if (!items) return [];
    
    return items.filter(item => {
      if (filterStatus !== "all" && item.status !== filterStatus) return false;
      if (filterResponsible !== "all" && item.responsible !== filterResponsible) return false;
      if (searchQuery && !item.task_description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [items, filterStatus, filterResponsible, searchQuery]);

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
    if (offset < 0) return `D${offset} (${Math.abs(offset)} dias antes)`;
    if (offset === 0) return "D0 (Dia do evento)";
    return `D+${offset} (${offset} dias depois)`;
  };

  const getItemDueStatus = (item: typeof items[0]) => {
    if (!item.due_date || item.status === "concluido" || item.status === "cancelado") return null;
    const dueDate = parseISO(item.due_date);
    if (isToday(dueDate)) return "today";
    if (isPast(dueDate)) return "overdue";
    if (differenceInDays(dueDate, new Date()) <= 2) return "soon";
    return "ok";
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 w-full overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              Organização de Eventos
            </h1>
            <p className="text-muted-foreground text-sm">
              Gerencie checklists e tarefas dos cursos IBRAMEC
            </p>
          </div>
          <NewChecklistDialog
            upcomingClasses={upcomingClasses?.map(c => ({
              id: c.id,
              name: c.name,
              code: c.code,
              start_date: c.start_date,
              end_date: c.end_date,
              location: c.location
            }))}
            onCreateChecklist={(data) => {
              createChecklist.mutate(data);
            }}
          />
        </div>

        {/* Overdue Alert */}
        {stats && stats.atrasados > 0 && showOverdueAlert && (
          <Alert variant="destructive" className="border-red-300 bg-red-50 dark:bg-red-950/30">
            <BellRing className="h-4 w-4" />
            <AlertTitle className="flex items-center justify-between">
              <span>Atenção: {stats.atrasados} tarefa(s) atrasada(s)</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-xs"
                onClick={() => setShowOverdueAlert(false)}
              >
                Dispensar
              </Button>
            </AlertTitle>
            <AlertDescription>
              Existem tarefas pendentes que já passaram do prazo. Revise o checklist para garantir que tudo seja concluído.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar - Event List */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Próximos Eventos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-1 p-3 pt-0">
                    {checklists && checklists.length > 0 ? (
                      checklists.map((checklist) => {
                        const daysUntil = differenceInDays(parseISO(checklist.event_start_date), new Date());
                        const isSelected = selectedChecklist?.id === checklist.id;
                        
                        return (
                          <button
                            key={checklist.id}
                            onClick={() => setSelectedChecklist(checklist)}
                            className={cn(
                              "w-full p-3 rounded-lg text-left transition-all",
                              isSelected 
                                ? "bg-primary/10 border-2 border-primary" 
                                : "hover:bg-muted border-2 border-transparent"
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm truncate">{checklist.event_name}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(parseISO(checklist.event_start_date), "dd/MM/yyyy")}
                                </p>
                                {checklist.location && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {checklist.location}
                                  </p>
                                )}
                              </div>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs shrink-0",
                                  daysUntil <= 0 ? "bg-red-100 text-red-700 border-red-200" :
                                  daysUntil <= 7 ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
                                  "bg-green-100 text-green-700 border-green-200"
                                )}
                              >
                                {daysUntil === 0 ? "Hoje" : daysUntil < 0 ? `D+${Math.abs(daysUntil)}` : `D-${daysUntil}`}
                              </Badge>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhum checklist cadastrado</p>
                        <p className="text-xs">Clique em "Novo Checklist" para começar</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Upcoming Classes Card */}
            {upcomingClasses && upcomingClasses.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Próximas Turmas</CardTitle>
                  <CardDescription>Turmas sem checklist</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {upcomingClasses.slice(0, 3).map((cls) => (
                    <div key={cls.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">{cls.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {cls.start_date && format(parseISO(cls.start_date), "dd/MM/yyyy")}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-8 xl:col-span-9">
            {selectedChecklist ? (
              <div className="space-y-4">
                {/* Stats Dashboard */}
                {stats && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                    <Card className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                          <ListTodo className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{stats.total}</p>
                          <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{stats.concluido}</p>
                          <p className="text-xs text-muted-foreground">Concluídos</p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                          <Clock className="h-4 w-4 text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{stats.pendente + stats.em_andamento}</p>
                          <p className="text-xs text-muted-foreground">Pendentes</p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{stats.atrasados}</p>
                          <p className="text-xs text-muted-foreground">Atrasados</p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-3 col-span-2 sm:col-span-4 lg:col-span-1">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-medium">{Math.round((stats.concluido / stats.total) * 100)}%</span>
                        </div>
                        <Progress value={(stats.concluido / stats.total) * 100} className="h-2" />
                      </div>
                    </Card>
                  </div>
                )}

                {/* Tabs */}
                <Tabs defaultValue="timeline" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="timeline" className="gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <span className="hidden sm:inline">Timeline</span>
                    </TabsTrigger>
                    <TabsTrigger value="list" className="gap-1.5">
                      <ListTodo className="h-4 w-4" />
                      <span className="hidden sm:inline">Lista</span>
                    </TabsTrigger>
                    <TabsTrigger value="team" className="gap-1.5">
                      <Users className="h-4 w-4" />
                      <span className="hidden sm:inline">Por Responsável</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Filters & Add Task */}
                  <div className="flex flex-col sm:flex-row gap-2 mt-4 items-start sm:items-center">
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
                    <AddTaskDialog
                      checklistId={selectedChecklist.id}
                      onAddTask={(task) => createItem.mutate(task)}
                    />
                  </div>

                  {/* Timeline View */}
                  <TabsContent value="timeline" className="mt-4">
                    {loadingItems ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-24" />
                        ))}
                      </div>
                    ) : (
                      <ScrollArea className="h-[500px] pr-4">
                        <div className="space-y-6">
                          {groupedItems.map(([offset, groupItems]) => (
                            <div key={offset} className="relative">
                              {/* Timeline marker */}
                              <div className="flex items-center gap-3 mb-3">
                                <div className={cn(
                                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                                  parseInt(offset) === 0 
                                    ? "bg-primary text-primary-foreground" 
                                    : parseInt(offset) < 0 
                                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                                      : "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300"
                                )}>
                                  {offset === "0" ? "D0" : parseInt(offset) > 0 ? `+${offset}` : offset}
                                </div>
                                <div>
                                  <p className="font-medium">{getDaysLabel(parseInt(offset))}</p>
                                  <p className="text-xs text-muted-foreground">{groupItems.length} tarefas</p>
                                </div>
                              </div>
                              
                              {/* Items */}
                              <div className="ml-5 border-l-2 border-muted pl-8 space-y-2 pb-4">
                                {groupItems.map((item) => {
                                  const dueStatus = getItemDueStatus(item);
                                  const StatusIcon = statusConfig[item.status as keyof typeof statusConfig]?.icon || CircleDashed;
                                  
                                  return (
                                    <div 
                                      key={item.id}
                                      className={cn(
                                        "p-3 rounded-lg border transition-all",
                                        item.status === "concluido" && "opacity-60",
                                        dueStatus === "overdue" && "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                                      )}
                                    >
                                      <div className="flex items-start gap-3">
                                        <Checkbox
                                          checked={item.status === "concluido"}
                                          onCheckedChange={(checked) => {
                                            updateItemStatus.mutate({
                                              itemId: item.id,
                                              status: checked ? "concluido" : "pendente"
                                            });
                                          }}
                                          className="mt-0.5"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <p className={cn(
                                            "text-sm font-medium",
                                            item.status === "concluido" && "line-through text-muted-foreground"
                                          )}>
                                            {item.task_description}
                                          </p>
                                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                            <Badge variant="outline" className="text-xs gap-1">
                                              <User className="h-3 w-3" />
                                              {item.responsible}
                                            </Badge>
                                            <Badge className={cn("text-xs", statusConfig[item.status as keyof typeof statusConfig]?.color)}>
                                              <StatusIcon className="h-3 w-3 mr-1" />
                                              {statusConfig[item.status as keyof typeof statusConfig]?.label}
                                            </Badge>
                                            {dueStatus === "overdue" && (
                                              <Badge variant="destructive" className="text-xs gap-1">
                                                <AlertTriangle className="h-3 w-3" />
                                                Atrasado
                                              </Badge>
                                            )}
                                          </div>
                                          {item.observation && (
                                            <p className="text-xs text-muted-foreground mt-2 italic">
                                              {item.observation}
                                            </p>
                                          )}
                                        </div>
                                        <Select 
                                          value={item.status} 
                                          onValueChange={(status) => updateItemStatus.mutate({ itemId: item.id, status })}
                                        >
                                          <SelectTrigger className="w-32 h-8 text-xs">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="pendente">Pendente</SelectItem>
                                            <SelectItem value="em_andamento">Em Andamento</SelectItem>
                                            <SelectItem value="concluido">Concluído</SelectItem>
                                            <SelectItem value="cancelado">Cancelado</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </TabsContent>

                  {/* List View */}
                  <TabsContent value="list" className="mt-4">
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-2">
                        {filteredItems.map((item) => {
                          const StatusIcon = statusConfig[item.status as keyof typeof statusConfig]?.icon || CircleDashed;
                          
                          return (
                            <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                              <Checkbox
                                checked={item.status === "concluido"}
                                onCheckedChange={(checked) => {
                                  updateItemStatus.mutate({
                                    itemId: item.id,
                                    status: checked ? "concluido" : "pendente"
                                  });
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className={cn(
                                  "text-sm",
                                  item.status === "concluido" && "line-through text-muted-foreground"
                                )}>
                                  {item.task_description}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs shrink-0">{item.responsible}</Badge>
                              <Badge className={cn("text-xs shrink-0", statusConfig[item.status as keyof typeof statusConfig]?.color)}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig[item.status as keyof typeof statusConfig]?.label}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {/* Team View */}
                  <TabsContent value="team" className="mt-4">
                    {stats && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(stats.byResponsible)
                          .sort((a, b) => b[1].total - a[1].total)
                          .map(([name, data]) => (
                            <Card key={name} className="p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">{name}</p>
                                  <p className="text-xs text-muted-foreground">{data.total} tarefas</p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Progresso</span>
                                  <span className="font-medium">{Math.round((data.concluido / data.total) * 100)}%</span>
                                </div>
                                <Progress value={(data.concluido / data.total) * 100} className="h-2" />
                                <div className="flex gap-3 text-xs">
                                  <span className="text-green-600">✓ {data.concluido} concluídos</span>
                                  <span className="text-yellow-600">○ {data.pendente} pendentes</span>
                                  <span className="text-blue-600">◐ {data.em_andamento} em andamento</span>
                                </div>
                              </div>
                            </Card>
                          ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <Card className="flex flex-col items-center justify-center p-12 text-center">
                <Calendar className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">Selecione um evento</h3>
                <p className="text-muted-foreground text-sm max-w-md">
                  Escolha um evento na lista ao lado para visualizar e gerenciar seu checklist de tarefas.
                </p>
              </Card>
            )}
        </div>
      </div>
    </div>
  );
}
