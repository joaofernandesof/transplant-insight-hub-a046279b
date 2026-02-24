/**
 * Dashboard de Tarefas - CPG Advocacia
 * 10+ insights visuais sobre produtividade e gestão de tarefas
 */

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from "recharts";
import {
  CheckCircle, Clock, AlertTriangle, TrendingUp, Users,
  ListTodo, Target, Flame, CalendarClock, BarChart3,
  Timer, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { format, isPast, isToday, isTomorrow, differenceInDays, startOfWeek, endOfWeek, isWithinInterval, subDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Task } from "../../IpromedTasks";

interface TaskDashboardProps {
  tasks: Task[];
}

const COLORS = ["#f59e0b", "#3b82f6", "#8b5cf6", "#10b981"];
const PRIORITY_COLORS = { 1: "#94a3b8", 2: "#f59e0b", 3: "#ef4444" };

export function TaskDashboard({ tasks }: TaskDashboardProps) {
  const insights = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    // Status counts
    const statusMap: Record<string, number> = {};
    const normalizeStatus = (s: string) => {
      if (["todo", "pendente", "a_fazer"].includes(s)) return "todo";
      if (["in_progress", "em_andamento"].includes(s)) return "in_progress";
      if (["in_review", "em_revisao"].includes(s)) return "in_review";
      if (["done", "concluido", "completed"].includes(s)) return "done";
      return s;
    };

    tasks.forEach(t => {
      const ns = normalizeStatus(t.status);
      statusMap[ns] = (statusMap[ns] || 0) + 1;
    });

    const total = tasks.length;
    const done = statusMap["done"] || 0;
    const todo = statusMap["todo"] || 0;
    const inProgress = statusMap["in_progress"] || 0;
    const inReview = statusMap["in_review"] || 0;
    const active = total - done;

    // Overdue
    const overdue = tasks.filter(t => {
      const ns = normalizeStatus(t.status);
      return ns !== "done" && t.due_date && isPast(new Date(t.due_date));
    });

    // Due today / tomorrow
    const dueToday = tasks.filter(t => normalizeStatus(t.status) !== "done" && t.due_date && isToday(new Date(t.due_date)));
    const dueTomorrow = tasks.filter(t => normalizeStatus(t.status) !== "done" && t.due_date && isTomorrow(new Date(t.due_date)));

    // Due this week
    const dueThisWeek = tasks.filter(t => {
      const ns = normalizeStatus(t.status);
      if (ns === "done" || !t.due_date) return false;
      return isWithinInterval(new Date(t.due_date), { start: weekStart, end: weekEnd });
    });

    // Completion rate
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

    // High priority pending
    const highPriorityPending = tasks.filter(t => {
      const ns = normalizeStatus(t.status);
      return ns !== "done" && (t.priority === 3 || t.priority === 4);
    });

    // By category
    const categoryMap: Record<string, { total: number; done: number }> = {};
    tasks.forEach(t => {
      const cat = t.category || "Sem categoria";
      if (!categoryMap[cat]) categoryMap[cat] = { total: 0, done: 0 };
      categoryMap[cat].total++;
      if (normalizeStatus(t.status) === "done") categoryMap[cat].done++;
    });

    // By assignee
    const assigneeMap: Record<string, { total: number; done: number; overdue: number }> = {};
    tasks.forEach(t => {
      const name = t.assigned_to_name || "Não atribuído";
      if (!assigneeMap[name]) assigneeMap[name] = { total: 0, done: 0, overdue: 0 };
      assigneeMap[name].total++;
      if (normalizeStatus(t.status) === "done") assigneeMap[name].done++;
      if (normalizeStatus(t.status) !== "done" && t.due_date && isPast(new Date(t.due_date))) assigneeMap[name].overdue++;
    });

    // By priority
    const priorityMap: Record<number, number> = {};
    tasks.forEach(t => {
      priorityMap[t.priority] = (priorityMap[t.priority] || 0) + 1;
    });

    // Status pie data
    const statusLabels: Record<string, string> = {
      todo: "A Fazer", in_progress: "Em Andamento", in_review: "Em Revisão", done: "Concluído"
    };
    const statusPieData = Object.entries(statusMap).map(([key, value]) => ({
      name: statusLabels[key] || key, value, key,
    }));
    const statusColorMap: Record<string, string> = {
      todo: COLORS[0], in_progress: COLORS[1], in_review: COLORS[2], done: COLORS[3],
    };

    // Category bar data
    const categoryBarData = Object.entries(categoryMap)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 8)
      .map(([name, data]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        total: data.total,
        concluidas: data.done,
        pendentes: data.total - data.done,
      }));

    // Assignee data
    const assigneeData = Object.entries(assigneeMap)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([name, data]) => ({
        name,
        total: data.total,
        concluidas: data.done,
        atrasadas: data.overdue,
        taxa: data.total > 0 ? Math.round((data.done / data.total) * 100) : 0,
      }));

    // Priority data
    const priorityLabels: Record<number, string> = { 1: "Baixa", 2: "Média", 3: "Alta", 4: "Urgente" };
    const priorityData = Object.entries(priorityMap)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([p, count]) => ({
        name: priorityLabels[Number(p)] || `P${p}`,
        value: count,
        priority: Number(p),
      }));

    // Avg time to complete (for done tasks)
    const completedWithDates = tasks.filter(t => 
      normalizeStatus(t.status) === "done" && t.completed_at && t.created_at
    );
    const avgDaysToComplete = completedWithDates.length > 0
      ? Math.round(completedWithDates.reduce((sum, t) => {
          return sum + differenceInDays(new Date(t.completed_at!), new Date(t.created_at));
        }, 0) / completedWithDates.length)
      : 0;

    // Tasks without due date
    const noDueDate = tasks.filter(t => normalizeStatus(t.status) !== "done" && !t.due_date);

    // Weekly trend (last 4 weeks created vs completed)
    const weeklyData = Array.from({ length: 4 }, (_, i) => {
      const weekEnd = subDays(now, i * 7);
      const weekStartD = subDays(weekEnd, 6);
      const label = `${format(weekStartD, "dd/MM")} - ${format(weekEnd, "dd/MM")}`;
      const created = tasks.filter(t => {
        const d = new Date(t.created_at);
        return d >= weekStartD && d <= weekEnd;
      }).length;
      const completed = tasks.filter(t => {
        if (!t.completed_at) return false;
        const d = new Date(t.completed_at);
        return d >= weekStartD && d <= weekEnd;
      }).length;
      return { name: label, criadas: created, concluidas: completed };
    }).reverse();

    return {
      total, done, todo, inProgress, inReview, active,
      overdue, dueToday, dueTomorrow, dueThisWeek,
      completionRate, highPriorityPending,
      statusPieData, statusColorMap,
      categoryBarData, assigneeData, priorityData,
      avgDaysToComplete, noDueDate, weeklyData,
    };
  }, [tasks]);

  const kpiCards = [
    { icon: ListTodo, label: "Total de Tarefas", value: insights.total, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { icon: CheckCircle, label: "Concluídas", value: insights.done, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { icon: Clock, label: "Em Andamento", value: insights.inProgress, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
    { icon: AlertTriangle, label: "Atrasadas", value: insights.overdue.length, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30" },
    { icon: Target, label: "Taxa de Conclusão", value: `${insights.completionRate}%`, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/30" },
    { icon: Flame, label: "Alta Prioridade", value: insights.highPriorityPending.length, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30" },
    { icon: CalendarClock, label: "Vencem Hoje", value: insights.dueToday.length, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
    { icon: Timer, label: "Tempo Médio (dias)", value: insights.avgDaysToComplete, color: "text-teal-600", bg: "bg-teal-50 dark:bg-teal-950/30" },
  ];

  return (
    <div className="space-y-6 p-1">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => (
          <Card key={i} className="border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${kpi.bg}`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Status Distribution */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Distribuição por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={insights.statusPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {insights.statusPieData.map((entry) => (
                      <Cell key={entry.key} fill={insights.statusColorMap[entry.key] || "#ccc"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value} tarefas`, ""]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* By Category */}
        <Card className="border shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Tarefas por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={insights.categoryBarData} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip />
                  <Bar dataKey="concluidas" name="Concluídas" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="pendentes" name="Pendentes" fill="#3b82f6" stackId="a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weekly Trend */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Tendência Semanal (4 semanas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={insights.weeklyData}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="criadas" name="Criadas" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} />
                  <Area type="monotone" dataKey="concluidas" name="Concluídas" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: "12px" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Flame className="h-4 w-4 text-muted-foreground" />
              Distribuição por Prioridade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={insights.priorityData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => [`${value} tarefas`, ""]} />
                  <Bar dataKey="value" name="Tarefas" radius={[6, 6, 0, 0]}>
                    {insights.priorityData.map((entry, i) => (
                      <Cell key={i} fill={(PRIORITY_COLORS as any)[entry.priority] || "#94a3b8"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Assignee table + alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Assignee Performance */}
        <Card className="border shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Desempenho por Responsável
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.assigneeData.map((person, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-28 truncate text-sm font-medium">{person.name}</div>
                  <div className="flex-1">
                    <Progress value={person.taxa} className="h-2.5" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
                    <span>{person.concluidas}/{person.total}</span>
                    <span className="font-semibold text-foreground">{person.taxa}%</span>
                    {person.atrasadas > 0 && (
                      <span className="text-red-500 font-semibold flex items-center gap-0.5">
                        <AlertTriangle className="h-3 w-3" /> {person.atrasadas}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {insights.assigneeData.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma tarefa atribuída</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alerts & Insights */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              Alertas & Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.overdue.length > 0 && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
                  <ArrowDownRight className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                      {insights.overdue.length} tarefa{insights.overdue.length > 1 ? "s" : ""} atrasada{insights.overdue.length > 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-red-600/70 dark:text-red-400/70">Requer atenção imediata</p>
                  </div>
                </div>
              )}

              {insights.dueToday.length > 0 && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                  <CalendarClock className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                      {insights.dueToday.length} vence{insights.dueToday.length > 1 ? "m" : ""} hoje
                    </p>
                    <p className="text-xs text-amber-600/70 dark:text-amber-400/70">Priorize essas tarefas</p>
                  </div>
                </div>
              )}

              {insights.dueTomorrow.length > 0 && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                  <Clock className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                      {insights.dueTomorrow.length} vence{insights.dueTomorrow.length > 1 ? "m" : ""} amanhã
                    </p>
                  </div>
                </div>
              )}

              {insights.highPriorityPending.length > 0 && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900">
                  <Flame className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-orange-700 dark:text-orange-400">
                      {insights.highPriorityPending.length} de alta prioridade pendente{insights.highPriorityPending.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              )}

              {insights.noDueDate.length > 0 && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800">
                  <CalendarClock className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-400">
                      {insights.noDueDate.length} sem prazo definido
                    </p>
                    <p className="text-xs text-slate-500/70">Defina datas para melhor controle</p>
                  </div>
                </div>
              )}

              {insights.completionRate >= 80 && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                  <ArrowUpRight className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      Excelente! {insights.completionRate}% concluídas
                    </p>
                    <p className="text-xs text-emerald-600/70">A equipe está entregando bem</p>
                  </div>
                </div>
              )}

              {insights.dueThisWeek.length > 0 && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900">
                  <Target className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-violet-700 dark:text-violet-400">
                      {insights.dueThisWeek.length} para esta semana
                    </p>
                  </div>
                </div>
              )}

              {insights.overdue.length === 0 && insights.dueToday.length === 0 && insights.highPriorityPending.length === 0 && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                  <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Tudo em dia!</p>
                    <p className="text-xs text-emerald-600/70">Nenhum alerta no momento</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
