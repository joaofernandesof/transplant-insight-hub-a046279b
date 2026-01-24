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
  BellRing,
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Settings,
  ClipboardList,
} from "lucide-react";
import { useEventChecklists, useChecklistItems, EventChecklist } from "@/neohub/hooks/useEventChecklists";
import { NewChecklistDialog } from "@/neohub/components/NewChecklistDialog";
import { AddTaskDialog } from "@/neohub/components/AddTaskDialog";
import { EventDashboard } from "@/neohub/components/EventDashboard";
import { EventScheduleEditor } from "@/neohub/components/EventScheduleEditor";
import { EventExamsPanel } from "@/neohub/components/EventExamsPanel";
import { EventStudentsPanel } from "@/neohub/components/EventStudentsPanel";
import { EventSurveyDashboard } from "@/neohub/components/EventSurveyDashboard";
import { format, differenceInDays, parseISO, isToday, isPast } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const statusConfig = {
  pendente: { label: "Pendente", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300", icon: CircleDashed },
  em_andamento: { label: "Em Andamento", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300", icon: Clock },
  concluido: { label: "Concluído", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", icon: CheckCircle2 },
  cancelado: { label: "Cancelado", color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300", icon: XCircle },
};

export default function NeoTeamEvents() {
  const { checklists, upcomingClasses, isLoading, createChecklist } = useEventChecklists();
  const [selectedChecklist, setSelectedChecklist] = useState<EventChecklist | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterResponsible, setFilterResponsible] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showOverdueAlert, setShowOverdueAlert] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

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

  // Get class details for dashboard
  const classDetails = selectedChecklist?.class_id ? {
    enrolledCount: 0, // Would need to fetch from DB
    examCount: 0,
    scheduleCount: 0,
  } : undefined;

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
            Gerencie checklists, cronograma, provas e alunos dos cursos IBRAMEC
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
        <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
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

      {/* Events Selection - Compact Horizontal Bar */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        <div className="flex items-center gap-2 shrink-0">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Evento:</span>
        </div>
        
        {checklists && checklists.length > 0 ? (
          <div className="flex gap-2">
            {checklists.map((checklist) => {
              const daysUntil = differenceInDays(parseISO(checklist.event_start_date), new Date());
              const isSelected = selectedChecklist?.id === checklist.id;
              
              return (
                <button
                  key={checklist.id}
                  onClick={() => {
                    setSelectedChecklist(checklist);
                    setActiveTab("dashboard");
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all shrink-0",
                    isSelected 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  <span className="font-medium">{checklist.event_name}</span>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-[10px] px-1.5 py-0",
                      isSelected ? "bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30" :
                      daysUntil <= 0 ? "bg-destructive/10 text-destructive border-destructive/30" :
                      daysUntil <= 7 ? "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300" :
                      "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300"
                    )}
                  >
                    {daysUntil === 0 ? "Hoje" : daysUntil < 0 ? `D+${Math.abs(daysUntil)}` : `D-${daysUntil}`}
                  </Badge>
                </button>
              );
            })}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Nenhum evento cadastrado</span>
        )}
        
        {upcomingClasses && upcomingClasses.length > 0 && (
          <Badge variant="outline" className="text-xs shrink-0 ml-auto">
            {upcomingClasses.length} turmas sem checklist
          </Badge>
        )}
      </div>

      {/* Main Content - Full Width */}
      <div className="w-full">
          {selectedChecklist ? (
            <div className="space-y-4">
              {/* Main Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-6 h-auto">
                  <TabsTrigger value="dashboard" className="gap-1.5 py-2.5">
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </TabsTrigger>
                  <TabsTrigger value="surveys" className="gap-1.5 py-2.5">
                    <ClipboardList className="h-4 w-4" />
                    <span className="hidden sm:inline">Pesquisas</span>
                  </TabsTrigger>
                  <TabsTrigger value="checklist" className="gap-1.5 py-2.5">
                    <ListTodo className="h-4 w-4" />
                    <span className="hidden sm:inline">Checklist</span>
                  </TabsTrigger>
                  <TabsTrigger value="schedule" className="gap-1.5 py-2.5">
                    <CalendarDays className="h-4 w-4" />
                    <span className="hidden sm:inline">Cronograma</span>
                  </TabsTrigger>
                  <TabsTrigger value="exams" className="gap-1.5 py-2.5">
                    <BookOpen className="h-4 w-4" />
                    <span className="hidden sm:inline">Provas</span>
                  </TabsTrigger>
                  <TabsTrigger value="students" className="gap-1.5 py-2.5">
                    <GraduationCap className="h-4 w-4" />
                    <span className="hidden sm:inline">Alunos</span>
                  </TabsTrigger>
                </TabsList>

                {/* Dashboard Tab */}
                <TabsContent value="dashboard" className="mt-4">
                  <EventDashboard 
                    checklist={selectedChecklist} 
                    stats={stats}
                    classDetails={classDetails}
                  />
                </TabsContent>

                {/* Surveys Tab */}
                <TabsContent value="surveys" className="mt-4">
                  <EventSurveyDashboard classId={selectedChecklist.class_id}
                  />
                </TabsContent>

                {/* Checklist Tab */}
                <TabsContent value="checklist" className="mt-4">
                  <ChecklistContent
                    stats={stats}
                    items={items}
                    filteredItems={filteredItems}
                    groupedItems={groupedItems}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    filterStatus={filterStatus}
                    setFilterStatus={setFilterStatus}
                    filterResponsible={filterResponsible}
                    setFilterResponsible={setFilterResponsible}
                    uniqueResponsibles={uniqueResponsibles}
                    updateItemStatus={updateItemStatus}
                    createItem={createItem}
                    selectedChecklistId={selectedChecklist.id}
                    getDaysLabel={getDaysLabel}
                    getItemDueStatus={getItemDueStatus}
                    statusConfig={statusConfig}
                  />
                </TabsContent>

                {/* Schedule Tab */}
                <TabsContent value="schedule" className="mt-4">
                  <EventScheduleEditor classId={selectedChecklist.class_id} />
                </TabsContent>

                {/* Exams Tab */}
                <TabsContent value="exams" className="mt-4">
                  <EventExamsPanel classId={selectedChecklist.class_id} />
                </TabsContent>

                {/* Students Tab */}
                <TabsContent value="students" className="mt-4">
                  <EventStudentsPanel classId={selectedChecklist.class_id} />
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <Card className="p-12">
              <div className="text-center text-muted-foreground">
                <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Selecione um Evento</h3>
                <p className="text-sm">Escolha um evento na lista à esquerda para gerenciar</p>
              </div>
            </Card>
          )}
        </div>
    </div>
  );
}

// Extracted Checklist Content Component
interface ChecklistContentProps {
  stats: any;
  items: any;
  filteredItems: any[];
  groupedItems: [string, any[]][];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterStatus: string;
  setFilterStatus: (s: string) => void;
  filterResponsible: string;
  setFilterResponsible: (r: string) => void;
  uniqueResponsibles: string[];
  updateItemStatus: any;
  createItem: any;
  selectedChecklistId: string;
  getDaysLabel: (offset: number) => string;
  getItemDueStatus: (item: any) => string | null;
  statusConfig: any;
}

function ChecklistContent({
  stats,
  items,
  filteredItems,
  groupedItems,
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  filterResponsible,
  setFilterResponsible,
  uniqueResponsibles,
  updateItemStatus,
  createItem,
  selectedChecklistId,
  getDaysLabel,
  getItemDueStatus,
  statusConfig,
}: ChecklistContentProps) {
  return (
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
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive" />
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
                <span className="font-medium">{stats.total > 0 ? Math.round((stats.concluido / stats.total) * 100) : 0}%</span>
              </div>
              <Progress value={stats.total > 0 ? (stats.concluido / stats.total) * 100 : 0} className="h-2" />
            </div>
          </Card>
        </div>
      )}

      {/* Filters & Add Task */}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
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
          checklistId={selectedChecklistId}
          onAddTask={(task) => createItem.mutate(task)}
        />
      </div>

      {/* Tasks List */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <div className="divide-y">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const dueStatus = getItemDueStatus(item);
                  const StatusIcon = statusConfig[item.status as keyof typeof statusConfig]?.icon || CircleDashed;
                  
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors",
                        dueStatus === "overdue" && "bg-destructive/5"
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
                        {dueStatus === "overdue" && (
                          <Badge variant="destructive" className="text-xs mt-1">
                            Atrasado
                          </Badge>
                        )}
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {item.responsible}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={cn("shrink-0", statusConfig[item.status as keyof typeof statusConfig]?.color)}
                      >
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig[item.status as keyof typeof statusConfig]?.label || item.status}
                      </Badge>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <ListTodo className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma tarefa encontrada</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
