import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, Calendar, Clock, Activity, 
  UserPlus, ClipboardList, Bell, ArrowRight,
  CheckCircle2, AlertCircle, Timer
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function NeoTeamHome() {
  const { user } = useUnifiedAuth();
  const navigate = useNavigate();
  const today = new Date();

  // Mock data - will be replaced with real data
  const stats = [
    { 
      label: 'Pacientes Hoje', 
      value: '12', 
      icon: Users, 
      color: 'bg-blue-500',
      change: '+3 vs ontem'
    },
    { 
      label: 'Na Sala de Espera', 
      value: '4', 
      icon: Clock, 
      color: 'bg-amber-500',
      change: '~15min média'
    },
    { 
      label: 'Atendidos', 
      value: '8', 
      icon: CheckCircle2, 
      color: 'bg-green-500',
      change: '67% do dia'
    },
    { 
      label: 'Próximo Horário', 
      value: '14:30', 
      icon: Timer, 
      color: 'bg-purple-500',
      change: 'em 25min'
    },
  ];

  const quickActions = [
    { icon: UserPlus, label: 'Novo Paciente', path: '/neoteam/patients/new', color: 'text-blue-500' },
    { icon: Calendar, label: 'Agendar', path: '/neoteam/schedule/new', color: 'text-green-500' },
    { icon: ClipboardList, label: 'Prontuário', path: '/neoteam/medical-records', color: 'text-purple-500' },
    { icon: Bell, label: 'Chamar Próximo', path: '/neoteam/waiting-room', color: 'text-amber-500' },
  ];

  const waitingPatients = [
    { id: 1, name: 'Maria Silva', time: '14:00', waitTime: '15min', status: 'waiting', type: 'Consulta' },
    { id: 2, name: 'João Santos', time: '14:15', waitTime: '10min', status: 'waiting', type: 'Retorno' },
    { id: 3, name: 'Ana Costa', time: '14:30', waitTime: '5min', status: 'waiting', type: 'Procedimento' },
    { id: 4, name: 'Pedro Lima', time: '14:45', waitTime: '2min', status: 'arrived', type: 'Consulta' },
  ];

  const upcomingAppointments = [
    { id: 1, name: 'Carlos Oliveira', time: '15:00', type: 'Avaliação', doctor: 'Dr. Ricardo' },
    { id: 2, name: 'Fernanda Souza', time: '15:30', type: 'Procedimento', doctor: 'Dra. Paula' },
    { id: 3, name: 'Bruno Alves', time: '16:00', type: 'Retorno', doctor: 'Dr. Ricardo' },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-6 text-white">
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
              <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
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
              <CardDescription>{waitingPatients.length} pacientes aguardando</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/neoteam/waiting-room')}>
              Ver todos
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {waitingPatients.slice(0, 4).map((patient) => (
              <div 
                key={patient.id} 
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {patient.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{patient.name}</p>
                    <p className="text-xs text-muted-foreground">{patient.type} • {patient.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={patient.status === 'arrived' ? 'default' : 'secondary'}>
                    {patient.waitTime}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Próximos Atendimentos
              </CardTitle>
              <CardDescription>Agenda do restante do dia</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/neoteam/schedule')}>
              Ver agenda
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingAppointments.map((apt) => (
              <div 
                key={apt.id} 
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{apt.time}</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{apt.name}</p>
                    <p className="text-xs text-muted-foreground">{apt.type} • {apt.doctor}</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">Atenção</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                3 pacientes aguardando há mais de 20 minutos. Considere priorizar o atendimento.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
