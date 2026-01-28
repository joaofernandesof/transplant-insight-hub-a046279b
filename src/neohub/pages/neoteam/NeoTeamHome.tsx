import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, Calendar, ArrowRight, ListTodo,
  AlertCircle, Stethoscope, FileText, 
  HeadphonesIcon, ClipboardCheck, BarChart3, 
  FolderOpen, Scissors, GraduationCap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useNeoTeamTasks } from '@/neohub/hooks/useNeoTeamTasks';
import { NeoTeamBreadcrumb } from '@/neohub/components/NeoTeamBreadcrumb';
import { HubDiagram } from '@/components/shared/HubDiagram';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function NeoTeamHome() {
  const { user } = useUnifiedAuth();
  const navigate = useNavigate();
  const today = new Date();

  const { tasks } = useNeoTeamTasks();

  // Task stats
  const pendingTasks = tasks.filter(t => t.status !== 'done').length;
  const urgentTasks = tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length;
  const highPriorityTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'done').length;
  const overdueTasks = tasks.filter(t => {
    if (t.status === 'done' || !t.due_date) return false;
    return new Date(t.due_date) < new Date();
  }).length;

  // Get urgent/high priority tasks for display
  const priorityTasksList = tasks
    .filter(t => ['urgent', 'high'].includes(t.priority) && t.status !== 'done')
    .sort((a, b) => {
      // Urgentes primeiro, depois por data
      if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
      if (b.priority === 'urgent' && a.priority !== 'urgent') return 1;
      if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      return 0;
    })
    .slice(0, 5);

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
    { 
      icon: ListTodo, 
      label: 'Tarefas', 
      path: '/neoteam/tasks', 
      description: 'Gestão de tarefas'
    },
    { 
      icon: FolderOpen, 
      label: 'Documentos', 
      path: '/neoteam/documents', 
      description: 'Arquivos e contratos'
    },
    { 
      icon: GraduationCap, 
      label: 'Educação', 
      path: '/neoteam/education', 
      description: 'Cursos e eventos'
    },
    { 
      icon: BarChart3, 
      label: 'Relatórios', 
      path: '/neoteam/reports', 
      description: 'Analytics'
    },
  ];

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

      {/* Task Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/neoteam/tasks')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-blue-500 w-10 h-10 rounded-lg flex items-center justify-center">
                <ListTodo className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold">{pendingTasks}</p>
            <p className="text-sm text-muted-foreground">Tarefas Pendentes</p>
          </CardContent>
        </Card>
        
        <Card 
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/neoteam/tasks?priority=urgent')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-destructive w-10 h-10 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold">{urgentTasks}</p>
            <p className="text-sm text-muted-foreground">Urgentes</p>
          </CardContent>
        </Card>
        
        <Card 
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/neoteam/tasks?priority=high')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-orange-500 w-10 h-10 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold">{highPriorityTasks}</p>
            <p className="text-sm text-muted-foreground">Alta Prioridade</p>
          </CardContent>
        </Card>
        
        <Card 
          className={`hover:shadow-md transition-shadow cursor-pointer ${overdueTasks > 0 ? 'border-destructive' : ''}`}
          onClick={() => navigate('/neoteam/tasks?overdue=true')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`${overdueTasks > 0 ? 'bg-destructive' : 'bg-muted'} w-10 h-10 rounded-lg flex items-center justify-center`}>
                <AlertCircle className={`h-5 w-5 ${overdueTasks > 0 ? 'text-white' : 'text-muted-foreground'}`} />
              </div>
            </div>
            <p className="text-2xl font-bold">{overdueTasks}</p>
            <p className="text-sm text-muted-foreground">Atrasadas</p>
          </CardContent>
        </Card>
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

      {/* Priority Tasks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Tarefas Prioritárias
            </CardTitle>
            <CardDescription>
              {urgentTasks + highPriorityTasks} tarefas de alta prioridade
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/neoteam/tasks')}>
            Ver todas
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {priorityTasksList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma tarefa prioritária pendente</p>
            </div>
          ) : (
            priorityTasksList.map((task) => {
              const isOverdue = task.due_date && new Date(task.due_date) < new Date();
              return (
                <div 
                  key={task.id} 
                  className={`flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer ${isOverdue ? 'border-l-4 border-destructive' : ''}`}
                  onClick={() => navigate('/neoteam/tasks')}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      task.priority === 'urgent' ? 'bg-destructive/20' : 'bg-orange-100 dark:bg-orange-900/30'
                    }`}>
                      <AlertCircle className={`h-5 w-5 ${
                        task.priority === 'urgent' ? 'text-destructive' : 'text-orange-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{task.title}</p>
                      {task.due_date && (
                        <p className={`text-xs ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                          {isOverdue ? '⚠️ Atrasado: ' : 'Prazo: '}
                          {format(new Date(task.due_date), 'dd/MM')}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={task.priority === 'urgent' ? 'destructive' : 'secondary'}>
                    {task.priority === 'urgent' ? 'Urgente' : 'Alta'}
                  </Badge>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Hub Diagram Section */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
        <CardHeader className="pb-2 text-center">
          <CardTitle className="text-white text-lg">Ecossistema NeoHub</CardTitle>
          <CardDescription className="text-slate-400">Você faz parte do nosso ecossistema</CardDescription>
        </CardHeader>
        <CardContent>
          <HubDiagram highlightPortal="neoteam" />
        </CardContent>
      </Card>
    </div>
  );
}
