import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, FileText, Video, Clock, TrendingUp, ArrowRight, Stethoscope } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePortalAuth } from '../../contexts/PortalAuthContext';

export default function DoctorDashboard() {
  const { user } = usePortalAuth();
  const navigate = useNavigate();

  const stats = [
    { label: 'Consultas Hoje', value: '0', icon: Calendar, color: 'text-blue-500' },
    { label: 'Pacientes Ativos', value: '0', icon: Users, color: 'text-green-500' },
    { label: 'Teleconsultas', value: '0', icon: Video, color: 'text-purple-500' },
    { label: 'Procedimentos Mês', value: '0', icon: TrendingUp, color: 'text-orange-500' },
  ];

  const quickActions = [
    { icon: Calendar, label: 'Minha Agenda', path: '/portal/schedule' },
    { icon: Users, label: 'Pacientes', path: '/portal/patients' },
    { icon: FileText, label: 'Prontuários', path: '/portal/medical-records' },
    { icon: Video, label: 'Teleconsulta', path: '/portal/teleconsultation' },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <Stethoscope className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-1">
              Dr(a). {user?.full_name?.split(' ')[0]}
            </h1>
            <p className="opacity-90">Painel Médico - Portal Neo Folic</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
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

      {/* Today's Schedule */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Agenda de Hoje</CardTitle>
            <CardDescription>Seus compromissos para hoje</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/portal/schedule')}>
            Ver agenda completa
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma consulta agendada para hoje</p>
          </div>
        </CardContent>
      </Card>

      {/* Waiting Room */}
      <Card>
        <CardHeader>
          <CardTitle>Sala de Espera</CardTitle>
          <CardDescription>Pacientes aguardando atendimento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum paciente na sala de espera</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
