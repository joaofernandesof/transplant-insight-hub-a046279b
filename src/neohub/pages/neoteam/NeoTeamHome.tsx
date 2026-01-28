import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, Calendar, ArrowRight, ListTodo,
  AlertCircle, Stethoscope, FileText, 
  HeadphonesIcon, ClipboardCheck, BarChart3, 
  FolderOpen, Scissors, GraduationCap, Clock, 
  CheckCircle2, Target, Flame
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useNeoTeamTasks } from '@/neohub/hooks/useNeoTeamTasks';
import { NeoTeamBreadcrumb } from '@/neohub/components/NeoTeamBreadcrumb';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DashboardKpiCard,
  DashboardProgressCard,
  DashboardPriorityList,
  DashboardDeadlineList,
  DashboardPerformanceCard,
} from '@/neohub/components/dashboard';

export default function NeoTeamHome() {
  const { user } = useUnifiedAuth();
  const navigate = useNavigate();
  const today = new Date();
  const { tasks } = useNeoTeamTasks();

  // Task stats
  const todoTasks = tasks.filter(t => t.status === 'todo').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const cancelledTasks = tasks.filter(t => t.status === 'cancelled').length;
  const totalTasks = tasks.length;
  
  const pendingTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled').length;
  const urgentTasks = tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length;
  const highPriorityTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'done').length;
  const normalTasks = tasks.filter(t => (t.priority === 'medium' || t.priority === undefined) && t.status !== 'done').length;
  const lowTasks = tasks.filter(t => t.priority === 'low' && t.status !== 'done').length;
  
  const dueTodayTasks = tasks.filter(t => {
    if (t.status === 'done' || !t.due_date) return false;
    const dueDate = new Date(t.due_date);
    const todayDate = new Date();
    return dueDate.toDateString() === todayDate.toDateString();
  }).length;

  const overdueTasks = tasks.filter(t => {
    if (t.status === 'done' || !t.due_date) return false;
    return new Date(t.due_date) < new Date();
  }).length;

  // Get overdue tasks for deadline list
  const overdueTasksList = tasks
    .filter(t => {
      if (t.status === 'done' || !t.due_date) return false;
      return new Date(t.due_date) < new Date();
    })
    .slice(0, 5)
    .map(t => ({
      id: t.id,
      title: t.title,
      status: 'overdue' as const,
      dueDate: t.due_date,
      onClick: () => navigate('/neoteam/tasks'),
    }));

  // Performance by assignee
  const performanceByAssignee = React.useMemo(() => {
    const assigneeMap: Record<string, { done: number; total: number; overdue: number }> = {};
    
    tasks.forEach(t => {
      const assignee = t.assignee_name || 'Não atribuído';
      if (!assigneeMap[assignee]) {
        assigneeMap[assignee] = { done: 0, total: 0, overdue: 0 };
      }
      assigneeMap[assignee].total++;
      if (t.status === 'done') {
        assigneeMap[assignee].done++;
      }
      if (t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date()) {
        assigneeMap[assignee].overdue++;
      }
    });

    return Object.entries(assigneeMap).map(([name, stats]) => ({
      id: name,
      name,
      current: stats.done,
      total: stats.total,
      overdueCount: stats.overdue,
    }));
  }, [tasks]);

  // Main modules for quick access
  const mainModules = [
    { 
      icon: Users, 
      label: 'Pacientes', 
      path: '/neoteam/patients', 
      description: 'Cadastro e busca',
      color: 'bg-purple-100 dark:bg-purple-900/30', 
      iconColor: 'text-purple-600' 
    },
    { 
      icon: Calendar, 
      label: 'Agenda', 
      path: '/neoteam/schedule', 
      description: 'Agendamentos',
      color: 'bg-blue-100 dark:bg-blue-900/30', 
      iconColor: 'text-blue-600' 
    },
    { 
      icon: Scissors, 
      label: 'Cirurgias', 
      path: '/neoteam/surgeries', 
      description: 'Gestão cirúrgica',
      color: 'bg-rose-100 dark:bg-rose-900/30', 
      iconColor: 'text-rose-600' 
    },
    { 
      icon: HeadphonesIcon, 
      label: 'Pós-Venda', 
      path: '/neoteam/postvenda', 
      description: 'Chamados e suporte',
      color: 'bg-teal-100 dark:bg-teal-900/30', 
      iconColor: 'text-teal-600' 
    },
    { 
      icon: FileText, 
      label: 'Prontuários', 
      path: '/neoteam/medical-records', 
      description: 'Histórico médico',
      color: 'bg-amber-100 dark:bg-amber-900/30', 
      iconColor: 'text-amber-600' 
    },
    { 
      icon: Stethoscope, 
      label: 'Visão Médico', 
      path: '/neoteam/doctor-view', 
      description: 'Painel clínico',
      color: 'bg-green-100 dark:bg-green-900/30', 
      iconColor: 'text-green-600' 
    },
  ];

  // Secondary modules  
  const secondaryModules = [
    { icon: ListTodo, label: 'Tarefas', path: '/neoteam/tasks' },
    { icon: FolderOpen, label: 'Documentos', path: '/neoteam/documents' },
    { icon: GraduationCap, label: 'Educação', path: '/neoteam/education' },
    { icon: BarChart3, label: 'Relatórios', path: '/neoteam/reports' },
  ];

  const completionPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Breadcrumb */}
      <NeoTeamBreadcrumb />

      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              Olá, {user?.fullName?.split(' ')[0] || 'Colaborador'}! 👋
            </h1>
            <p className="opacity-90">
              {format(today, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          
          {/* Tasks Summary Badge */}
          <div className="hidden md:flex items-center gap-3">
            {overdueTasks > 0 && (
              <Badge variant="destructive" className="text-sm px-3 py-1">
                {overdueTasks} atrasada{overdueTasks !== 1 ? 's' : ''}
              </Badge>
            )}
            <div className="bg-white/20 rounded-lg px-4 py-2 flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              <span className="font-medium">{pendingTasks} tarefas</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardKpiCard
          icon={ListTodo}
          value={todoTasks}
          label="Tarefas a fazer"
          badge={String(totalTasks)}
          onClick={() => navigate('/neoteam/tasks')}
        />
        <DashboardKpiCard
          icon={Clock}
          value={dueTodayTasks}
          label="Vencem hoje"
          badge={String(inProgressTasks)}
          badgeVariant="info"
          onClick={() => navigate('/neoteam/tasks?due=today')}
        />
        <DashboardKpiCard
          icon={AlertCircle}
          value={overdueTasks}
          label="Em atraso"
          badge="Atenção"
          badgeVariant="warning"
          variant={overdueTasks > 0 ? 'warning' : 'default'}
          onClick={() => navigate('/neoteam/tasks?overdue=true')}
        />
        <DashboardKpiCard
          icon={CheckCircle2}
          value={doneTasks}
          label="Concluídas"
          badge={`${completionPercent}%`}
          badgeVariant="success"
          variant="success"
          onClick={() => navigate('/neoteam/tasks?status=done')}
        />
      </div>

      {/* Progress and Priority Row */}
      <div className="grid lg:grid-cols-2 gap-4">
        <DashboardProgressCard
          icon={Target}
          title="Progresso Geral"
          subtitle="Taxa de conclusão das tarefas"
          current={doneTasks}
          total={totalTasks}
          metrics={[
            { value: todoTasks, label: 'A Fazer', color: 'default' },
            { value: inProgressTasks, label: 'Em Andamento', color: 'primary' },
            { value: doneTasks, label: 'Concluído', color: 'success' },
            { value: cancelledTasks, label: 'Cancelados', color: 'default' },
          ]}
        />
        <DashboardPriorityList
          icon={Flame}
          title="Prioridades Pendentes"
          subtitle="Distribuição por nível de urgência"
          items={[
            { level: 'urgent', count: urgentTasks },
            { level: 'high', count: highPriorityTasks },
            { level: 'normal', count: normalTasks },
            { level: 'low', count: lowTasks },
          ]}
        />
      </div>

      {/* Deadlines and Performance Row */}
      <div className="grid lg:grid-cols-2 gap-4">
        <DashboardDeadlineList
          icon={Calendar}
          title="Próximos Prazos"
          subtitle="Tarefas com vencimento próximo"
          items={overdueTasksList}
          emptyMessage="Nenhuma tarefa atrasada 🎉"
        />
        <DashboardPerformanceCard
          icon={BarChart3}
          title="Performance da Equipe"
          subtitle="Desempenho por colaborador"
          items={performanceByAssignee}
        />
      </div>

      {/* Main Modules Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Acesso Rápido</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {mainModules.map((module) => (
            <Card 
              key={module.label} 
              className="hover:shadow-md transition-all cursor-pointer group"
              onClick={() => navigate(module.path)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`${module.color} p-3 rounded-lg`}>
                  <module.icon className={`h-6 w-6 ${module.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{module.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{module.description}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Secondary Modules */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {secondaryModules.map((module) => (
          <Button
            key={module.label}
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-accent"
            onClick={() => navigate(module.path)}
          >
            <module.icon className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">{module.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
