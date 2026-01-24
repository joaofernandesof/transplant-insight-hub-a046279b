import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Calendar,
  AlertTriangle,
  ListTodo,
  CalendarDays,
  BookOpen,
  GraduationCap,
  ClipboardList,
  BellRing,
} from "lucide-react";
import { useEventChecklists, useChecklistItems, EventChecklist } from "@/neohub/hooks/useEventChecklists";
import { NewChecklistDialog } from "@/neohub/components/NewChecklistDialog";
import { VisualScheduleEditor } from "@/neohub/components/VisualScheduleEditor";
import { EventExamsPanel } from "@/neohub/components/EventExamsPanel";
import { EventStudentsPanel } from "@/neohub/components/EventStudentsPanel";
import { EventSurveyDashboard } from "@/neohub/components/EventSurveyDashboard";
import { EventOrganizationPanel } from "@/neohub/components/EventOrganizationPanel";
import { differenceInDays, parseISO, isToday, isPast } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function NeoTeamEvents() {
  const { checklists, upcomingClasses, isLoading, createChecklist } = useEventChecklists();
  const [selectedChecklist, setSelectedChecklist] = useState<EventChecklist | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterResponsible, setFilterResponsible] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showOverdueAlert, setShowOverdueAlert] = useState(true);
  const [activeTab, setActiveTab] = useState("organization");

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
                <TabsList className="grid w-full grid-cols-5 h-auto">
                  <TabsTrigger value="organization" className="gap-1.5 py-2.5">
                    <ListTodo className="h-4 w-4" />
                    <span className="hidden sm:inline">Organização</span>
                  </TabsTrigger>
                  <TabsTrigger value="surveys" className="gap-1.5 py-2.5">
                    <ClipboardList className="h-4 w-4" />
                    <span className="hidden sm:inline">Pesquisas</span>
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

                {/* Organization Tab (replaces Dashboard + Checklist) */}
                <TabsContent value="organization" className="mt-4">
                  <EventOrganizationPanel 
                    checklist={selectedChecklist} 
                    classDetails={classDetails}
                  />
                </TabsContent>

                {/* Surveys Tab */}
                <TabsContent value="surveys" className="mt-4">
                  <EventSurveyDashboard classId={selectedChecklist.class_id}
                  />
                </TabsContent>

                {/* Schedule Tab */}
                <TabsContent value="schedule" className="mt-4">
                  <VisualScheduleEditor classId={selectedChecklist.class_id} />
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
