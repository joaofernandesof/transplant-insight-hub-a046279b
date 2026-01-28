import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, Calendar, Clock, Activity, 
  UserPlus, ClipboardList, Bell, ArrowRight,
  CheckCircle2, AlertCircle, Timer, ListTodo,
  TrendingUp, Stethoscope, FileText, Building2,
  HeadphonesIcon, Ticket
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useNeoTeamWaitingRoom } from '@/neohub/hooks/useNeoTeamWaitingRoom';
import { useNeoTeamTasks } from '@/neohub/hooks/useNeoTeamTasks';
import { NeoTeamBreadcrumb } from '@/neohub/components/NeoTeamBreadcrumb';
import { HubDiagram } from '@/components/shared/HubDiagram';
import { format, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function NeoTeamHome() {
  const { user } = useUnifiedAuth();
  const navigate = useNavigate();
  const today = new Date();
  const [currentTime, setCurrentTime] = useState(new Date());

  const { patients } = useNeoTeamWaitingRoom();
  const { tasks } = useNeoTeamTasks();

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Compute real stats
  const waitingCount = patients.filter(p => ['arrived', 'waiting'].includes(p.status)).length;
  const inServiceCount = patients.filter(p => p.status === 'in_service').length;
  const completedCount = patients.filter(p => p.status === 'completed').length;
  
  const pendingTasks = tasks.filter(t => t.status !== 'done').length;
  const urgentTasks = tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length;

  const avgWaitTime = patients.length > 0
    ? Math.round(patients.reduce((acc, p) => acc + differenceInMinutes(currentTime, new Date(p.arrival_time)), 0) / patients.length)
    : 0;

  const stats = [
    { 
      label: 'Na Sala de Espera', 
      value: waitingCount.toString(), 
      icon: Clock, 
      color: 'bg-amber-500',
      subtitle: `~${avgWaitTime}min média`
    },
    { 
      label: 'Em Atendimento', 
      value: inServiceCount.toString(), 
      icon: Stethoscope, 
      color: 'bg-purple-500',
      subtitle: 'Agora'
    },
    { 
      label: 'Atendidos Hoje', 
      value: completedCount.toString(), 
      icon: CheckCircle2, 
      color: 'bg-green-500',
      subtitle: 'Finalizados'
    },
    { 
      label: 'Tarefas Pendentes', 
      value: pendingTasks.toString(), 
      icon: ListTodo, 
      color: 'bg-blue-500',
      subtitle: urgentTasks > 0 ? `${urgentTasks} urgente(s)` : 'Nenhuma urgente'
    },
  ];

  const quickActions = [
    { icon: UserPlus, label: 'Novo Paciente', path: '/neoteam/patients', color: 'text-blue-500' },
    { icon: Calendar, label: 'Agenda', path: '/neoteam/schedule', color: 'text-green-500' },
    { icon: Clock, label: 'Sala de Espera', path: '/neoteam/waiting-room', color: 'text-amber-500' },
    { icon: Ticket, label: 'Chamados', path: '/neoteam/postvenda/chamados', color: 'text-rose-500' },
  ];

  const modules = [
    { icon: Calendar, label: 'Agendamentos', path: '/neoteam/schedule', description: 'Gerenciar agenda', color: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600' },
    { icon: Clock, label: 'Sala de Espera', path: '/neoteam/waiting-room', description: 'Fila de pacientes', color: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-600' },
    { icon: Stethoscope, label: 'Visão Médico', path: '/neoteam/doctor-view', description: 'Pacientes chamados', color: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-green-600' },
    { icon: Users, label: 'Pacientes', path: '/neoteam/patients', description: 'Cadastro de pacientes', color: 'bg-purple-100 dark:bg-purple-900/30', iconColor: 'text-purple-600' },
    { icon: FileText, label: 'Prontuários', path: '/neoteam/medical-records', description: 'Histórico médico', color: 'bg-rose-100 dark:bg-rose-900/30', iconColor: 'text-rose-600' },
    { icon: Ticket, label: 'Chamados', path: '/neoteam/postvenda/chamados', description: 'Gestão de atendimento', color: 'bg-pink-100 dark:bg-pink-900/30', iconColor: 'text-pink-600' },
    { icon: HeadphonesIcon, label: 'Pós-Venda', path: '/neoteam/postvenda', description: 'Dashboard completo', color: 'bg-teal-100 dark:bg-teal-900/30', iconColor: 'text-teal-600' },
  ];

  // Get recent waiting patients
  const waitingPatients = patients
    .filter(p => ['arrived', 'waiting'].includes(p.status))
    .slice(0, 4);

  // Get urgent/high priority tasks
  const urgentTasksList = tasks
    .filter(t => ['urgent', 'high'].includes(t.priority) && t.status !== 'done')
    .slice(0, 4);

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
          <div className="hidden md:flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2">
            <Activity className="h-5 w-5" />
            <span className="font-medium">Clínica Ativa</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`${stat.color} w-10 h-10 rounded-lg flex items-center justify-center`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-accent"
            onClick={() => navigate(action.path)}
          >
            <action.icon className={`h-6 w-6 ${action.color}`} />
            <span className="text-sm font-medium">{action.label}</span>
          </Button>
        ))}
      </div>

      {/* Modules Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Módulos</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((module) => (
            <Card 
              key={module.label} 
              className="hover:shadow-md transition-all cursor-pointer group"
              onClick={() => navigate(module.path)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`${module.color} p-3 rounded-lg`}>
                  <module.icon className={`h-6 w-6 ${module.iconColor}`} />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{module.label}</p>
                  <p className="text-xs text-muted-foreground">{module.description}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Waiting Room */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                Sala de Espera
              </CardTitle>
              <CardDescription>{waitingCount} pacientes aguardando</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/neoteam/waiting-room')}>
              Ver todos
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {waitingPatients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum paciente aguardando
              </div>
            ) : (
              waitingPatients.map((patient) => {
                const waitMinutes = differenceInMinutes(currentTime, new Date(patient.arrival_time));
                return (
                  <div 
                    key={patient.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {patient.patient_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{patient.patient_name}</p>
                        <p className="text-xs text-muted-foreground">{patient.type}</p>
                      </div>
                    </div>
                    <Badge variant={waitMinutes > 15 ? 'destructive' : 'secondary'}>
                      {waitMinutes}min
                    </Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Urgent Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Tarefas Prioritárias
              </CardTitle>
              <CardDescription>{urgentTasks} tarefas urgentes</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/neoteam/tasks')}>
              Ver todas
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {urgentTasksList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma tarefa prioritária
              </div>
            ) : (
              urgentTasksList.map((task) => (
                <div 
                  key={task.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      task.priority === 'urgent' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-orange-100 dark:bg-orange-900/30'
                    }`}>
                      <AlertCircle className={`h-5 w-5 ${
                        task.priority === 'urgent' ? 'text-red-600' : 'text-orange-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{task.title}</p>
                      {task.due_date && (
                        <p className="text-xs text-muted-foreground">
                          Prazo: {format(new Date(task.due_date), 'dd/MM')}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={task.priority === 'urgent' ? 'destructive' : 'secondary'}>
                    {task.priority === 'urgent' ? 'Urgente' : 'Alta'}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alert if many patients waiting */}
      {waitingCount >= 3 && avgWaitTime > 15 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">Atenção</p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {waitingCount} pacientes aguardando com tempo médio de {avgWaitTime} minutos. Considere priorizar o atendimento.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
