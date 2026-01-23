import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  ListTodo,
  BookOpen,
  Calendar,
  Target,
  TrendingUp,
  CalendarDays,
  MapPin,
} from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EventChecklist } from "@/neohub/hooks/useEventChecklists";

interface EventDashboardProps {
  checklist: EventChecklist;
  stats: {
    total: number;
    pendente: number;
    em_andamento: number;
    concluido: number;
    cancelado: number;
    atrasados: number;
    byResponsible: Record<string, { total: number; concluido: number; pendente: number; em_andamento: number }>;
  } | null;
  classDetails?: {
    enrolledCount: number;
    examCount: number;
    scheduleCount: number;
  };
}

export function EventDashboard({ checklist, stats, classDetails }: EventDashboardProps) {
  const daysUntilEvent = differenceInDays(parseISO(checklist.event_start_date), new Date());
  const isEventPast = daysUntilEvent < 0;
  const isEventToday = daysUntilEvent === 0;

  const progressPercent = stats ? Math.round((stats.concluido / stats.total) * 100) : 0;

  // Calculate team performance
  const teamPerformance = stats ? Object.entries(stats.byResponsible)
    .map(([name, data]) => ({
      name,
      total: data.total,
      completed: data.concluido,
      progress: Math.round((data.concluido / data.total) * 100),
    }))
    .sort((a, b) => b.progress - a.progress) : [];

  return (
    <div className="space-y-6">
      {/* Event Header Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">{checklist.event_name}</h2>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" />
                  {format(parseISO(checklist.event_start_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
                {checklist.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {checklist.location}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge 
                variant="outline" 
                className={`text-lg px-4 py-2 font-bold ${
                  isEventPast ? "bg-gray-100 text-gray-700 border-gray-300" :
                  isEventToday ? "bg-red-100 text-red-700 border-red-300" :
                  daysUntilEvent <= 7 ? "bg-yellow-100 text-yellow-700 border-yellow-300" :
                  "bg-green-100 text-green-700 border-green-300"
                }`}
              >
                {isEventToday ? "HOJE!" : isEventPast ? `D+${Math.abs(daysUntilEvent)}` : `D-${daysUntilEvent}`}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <ListTodo className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats?.total || 0}</p>
                <p className="text-xs text-muted-foreground">Total Tarefas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats?.concluido || 0}</p>
                <p className="text-xs text-muted-foreground">Concluídas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-yellow-100 dark:bg-yellow-900/30">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{(stats?.pendente || 0) + (stats?.em_andamento || 0)}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{stats?.atrasados || 0}</p>
                <p className="text-xs text-muted-foreground">Atrasadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {classDetails && (
          <>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{classDetails.enrolledCount}</p>
                    <p className="text-xs text-muted-foreground">Alunos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                    <BookOpen className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{classDetails.examCount}</p>
                    <p className="text-xs text-muted-foreground">Provas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Progress and Team Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-5 w-5" />
              Progresso Geral
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-4xl font-bold text-primary">{progressPercent}%</span>
              <span className="text-sm text-muted-foreground">
                {stats?.concluido || 0} de {stats?.total || 0} tarefas
              </span>
            </div>
            <Progress value={progressPercent} className="h-4" />
            
            {/* Status breakdown */}
            <div className="grid grid-cols-2 gap-2 pt-4">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <span className="text-sm">Pendente: {stats?.pendente || 0}</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-sm">Em Andamento: {stats?.em_andamento || 0}</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-sm">Concluído: {stats?.concluido || 0}</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-900/20">
                <div className="h-3 w-3 rounded-full bg-gray-500" />
                <span className="text-sm">Cancelado: {stats?.cancelado || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Desempenho por Responsável
            </CardTitle>
            <CardDescription>Ranking de conclusão de tarefas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamPerformance.slice(0, 5).map((person, index) => (
                <div key={person.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? "bg-yellow-100 text-yellow-700" :
                        index === 1 ? "bg-gray-100 text-gray-700" :
                        index === 2 ? "bg-orange-100 text-orange-700" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {index + 1}
                      </span>
                      <span className="font-medium">{person.name}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {person.completed}/{person.total} ({person.progress}%)
                    </span>
                  </div>
                  <Progress value={person.progress} className="h-2" />
                </div>
              ))}
              
              {teamPerformance.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma tarefa atribuída ainda
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
