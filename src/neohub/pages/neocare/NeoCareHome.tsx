import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, Video, MessageSquare, Clock, Bell, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNeoHubAuth } from '@/neohub/contexts/NeoHubAuthContext';

export default function NeoCareHome() {
  const { user } = useNeoHubAuth();
  const navigate = useNavigate();

  const quickActions = [
    { icon: Calendar, label: 'Agendar Consulta', path: '/neocare/appointments/new', color: 'bg-[hsl(var(--neocare-primary))]' },
    { icon: FileText, label: 'Meus Documentos', path: '/neocare/my-records', color: 'bg-emerald-500' },
    { icon: Video, label: 'Orientações', path: '/neocare/teleconsultation', color: 'bg-purple-500' },
    { icon: Bell, label: 'Notícias', path: '/neocare/notifications', color: 'bg-orange-500' },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Welcome */}
      <div className="bg-[var(--neocare-gradient)] rounded-2xl p-6 text-white flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
          {user?.fullName?.charAt(0) || 'P'}
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            Olá, {user?.fullName?.split(' ')[0] || 'Paciente'}!
          </h1>
          <p className="opacity-90">Bem-vindo ao seu Portal Neo Folic</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Card 
            key={action.label}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(action.path)}
          >
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className={`${action.color} w-12 h-12 rounded-full flex items-center justify-center mb-3`}>
                <action.icon className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium">{action.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Próximos Agendamentos</CardTitle>
            <CardDescription>Suas consultas e procedimentos agendados</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/neocare/appointments')}>
            Ver todos
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Você não tem agendamentos próximos</p>
            <Button className="mt-4 bg-[hsl(var(--neocare-primary))] hover:bg-[hsl(var(--neocare-primary))]/90" onClick={() => navigate('/neocare/appointments/new')}>
              Agendar Consulta
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Documents */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Documentos Recentes</CardTitle>
            <CardDescription>Seus últimos exames e laudos</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/neocare/my-records')}>
            Ver todos
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum documento disponível</p>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <p>Você está em dia! Nenhuma notificação pendente.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
