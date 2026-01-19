import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, Calendar, Clock, UserPlus, 
  CheckCircle2, XCircle, ArrowRight, Phone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePortalAuth } from '../../contexts/PortalAuthContext';

export default function ReceptionDashboard() {
  const { user } = usePortalAuth();
  const navigate = useNavigate();

  const stats = [
    { label: 'Agendamentos Hoje', value: '0', icon: Calendar, color: 'bg-blue-500' },
    { label: 'Na Sala de Espera', value: '0', icon: Users, color: 'bg-green-500' },
    { label: 'Check-ins Realizados', value: '0', icon: CheckCircle2, color: 'bg-purple-500' },
    { label: 'Faltas Hoje', value: '0', icon: XCircle, color: 'bg-red-500' },
  ];

  const quickActions = [
    { icon: UserPlus, label: 'Novo Paciente', path: '/portal/patients/new' },
    { icon: Calendar, label: 'Agendar', path: '/portal/schedule/new' },
    { icon: Users, label: 'Sala de Espera', path: '/portal/waiting-room' },
    { icon: Phone, label: 'WhatsApp', path: '/portal/whatsapp' },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-pink-600 to-pink-500 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-1">Recepção</h1>
        <p className="opacity-90">Olá, {user?.full_name?.split(' ')[0]}. Pronto(a) para um ótimo dia de trabalho!</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`${stat.color} w-10 h-10 rounded-lg flex items-center justify-center`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => navigate(action.path)}
          >
            <action.icon className="h-6 w-6" />
            <span>{action.label}</span>
          </Button>
        ))}
      </div>

      {/* Waiting Room */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Sala de Espera</CardTitle>
            <CardDescription>Pacientes aguardando atendimento</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/portal/waiting-room')}>
            Gerenciar
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum paciente aguardando</p>
          </div>
        </CardContent>
      </Card>

      {/* Today's Schedule */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Agenda do Dia</CardTitle>
            <CardDescription>Próximos agendamentos</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/portal/schedule')}>
            Ver agenda
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum agendamento para hoje</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
