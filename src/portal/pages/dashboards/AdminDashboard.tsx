import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, Calendar, DollarSign, Package, TrendingUp, 
  Activity, AlertTriangle, CheckCircle2, Clock, ArrowRight,
  Stethoscope, UserPlus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePortalAuth } from '../../contexts/PortalAuthContext';

export default function PortalAdminDashboard() {
  const { user } = usePortalAuth();
  const navigate = useNavigate();

  const stats = [
    { label: 'Pacientes', value: '0', icon: Users, color: 'bg-blue-500', path: '/portal/patients' },
    { label: 'Médicos', value: '0', icon: Stethoscope, color: 'bg-green-500', path: '/portal/admin/doctors' },
    { label: 'Agendamentos Hoje', value: '0', icon: Calendar, color: 'bg-purple-500', path: '/portal/schedule' },
    { label: 'Faturamento Mês', value: 'R$ 0', icon: DollarSign, color: 'bg-orange-500', path: '/portal/cash-flow' },
  ];

  const secondaryStats = [
    { label: 'Estoque Baixo', value: '0', icon: Package, color: 'text-red-500' },
    { label: 'Consultas Semana', value: '0', icon: TrendingUp, color: 'text-green-500' },
    { label: 'Pendências', value: '0', icon: AlertTriangle, color: 'text-yellow-500' },
    { label: 'NPS Médio', value: '-', icon: Activity, color: 'text-blue-500' },
  ];

  const quickActions = [
    { icon: UserPlus, label: 'Novo Paciente', path: '/portal/patients/new' },
    { icon: Calendar, label: 'Novo Agendamento', path: '/portal/schedule/new' },
    { icon: Users, label: 'Usuários', path: '/portal/admin/users' },
    { icon: Package, label: 'Estoque', path: '/portal/inventory/items' },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-500 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-1">
          Painel Administrativo
        </h1>
        <p className="opacity-90">Bem-vindo, {user?.full_name}. Aqui está o resumo do sistema.</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card 
            key={stat.label}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(stat.path)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`${stat.color} w-10 h-10 rounded-lg flex items-center justify-center`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
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

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {secondaryStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-4">
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
              <div>
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Overview */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sala de Espera</CardTitle>
            <CardDescription>Pacientes aguardando atendimento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum paciente aguardando</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertas do Sistema</CardTitle>
            <CardDescription>Notificações e pendências importantes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>Sistema operando normalmente</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
