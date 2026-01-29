/**
 * Push Jurídico - Dashboard
 * Visão geral do monitoramento
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Radar,
  Bell,
  Eye,
  FileText,
  Building2,
  Users,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Mock stats
const stats = {
  activeMonitors: 12,
  totalAlerts: 47,
  unreadAlerts: 5,
  lastScan: new Date(),
  tribunalsMonitored: 98,
  publicationsToday: 23,
};

// Recent alerts mock
const recentAlerts = [
  { 
    id: '1', 
    type: 'intimation', 
    title: 'Intimação - Processo nº 0001234-56.2024.8.26.0100',
    court: 'TJSP - 3ª Vara Cível',
    date: '2026-01-29T10:30:00',
    priority: 'high',
    client: 'Dr. João Silva',
    read: false,
  },
  { 
    id: '2', 
    type: 'sentence', 
    title: 'Sentença Publicada - Processo nº 0009876-54.2023.5.02.0001',
    court: 'TRT-2 - 15ª Vara do Trabalho',
    date: '2026-01-29T09:15:00',
    priority: 'high',
    client: 'Hospital XYZ',
    read: false,
  },
  { 
    id: '3', 
    type: 'dispatch', 
    title: 'Despacho - Processo nº 0005555-11.2025.4.03.6100',
    court: 'TRF-3 - 1ª Vara Federal',
    date: '2026-01-28T16:45:00',
    priority: 'medium',
    client: 'Clínica ABC',
    read: true,
  },
  { 
    id: '4', 
    type: 'publication', 
    title: 'Nome citado no DJE/SP - Edição 5892',
    court: 'Diário da Justiça Eletrônico - SP',
    date: '2026-01-28T08:00:00',
    priority: 'low',
    client: 'Dra. Maria Santos',
    read: true,
  },
];

// Charts data
const alertsByType = [
  { name: 'Intimações', value: 18, color: '#ef4444' },
  { name: 'Sentenças', value: 12, color: '#f59e0b' },
  { name: 'Despachos', value: 25, color: '#3b82f6' },
  { name: 'Publicações', value: 42, color: '#10b981' },
];

const alertsByWeek = [
  { day: 'Seg', alerts: 8 },
  { day: 'Ter', alerts: 12 },
  { day: 'Qua', alerts: 6 },
  { day: 'Qui', alerts: 15 },
  { day: 'Sex', alerts: 23 },
  { day: 'Sáb', alerts: 3 },
  { day: 'Dom', alerts: 0 },
];

const typeConfig = {
  intimation: { label: 'Intimação', color: 'bg-rose-100 text-rose-700', icon: AlertCircle },
  sentence: { label: 'Sentença', color: 'bg-amber-100 text-amber-700', icon: FileText },
  dispatch: { label: 'Despacho', color: 'bg-blue-100 text-blue-700', icon: FileText },
  publication: { label: 'Publicação', color: 'bg-emerald-100 text-emerald-700', icon: Eye },
};

const priorityConfig = {
  high: { label: 'Urgente', color: 'bg-rose-500 text-white' },
  medium: { label: 'Normal', color: 'bg-amber-500 text-white' },
  low: { label: 'Baixa', color: 'bg-slate-400 text-white' },
};

export default function PushDashboard() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-rose-700">Alertas Não Lidos</p>
                <p className="text-3xl font-bold text-rose-800">{stats.unreadAlerts}</p>
              </div>
              <Bell className="h-8 w-8 text-rose-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">Monitoramentos Ativos</p>
                <p className="text-3xl font-bold text-blue-800">{stats.activeMonitors}</p>
              </div>
              <Radar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-700">Tribunais Monitorados</p>
                <p className="text-3xl font-bold text-emerald-800">{stats.tribunalsMonitored}</p>
              </div>
              <Building2 className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700">Publicações Hoje</p>
                <p className="text-3xl font-bold text-purple-800">{stats.publicationsToday}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alertas por Tipo</CardTitle>
            <CardDescription>Distribuição das publicações identificadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={alertsByType}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {alertsByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alertas da Semana</CardTitle>
            <CardDescription>Volume diário de publicações identificadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={alertsByWeek}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="alerts" name="Alertas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-5 w-5 text-rose-600" />
                Alertas Recentes
              </CardTitle>
              <CardDescription>Últimas publicações identificadas pelo monitoramento</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-1">
              Ver todos
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentAlerts.map(alert => {
              const type = typeConfig[alert.type as keyof typeof typeConfig];
              const priority = priorityConfig[alert.priority as keyof typeof priorityConfig];
              const TypeIcon = type.icon;

              return (
                <div 
                  key={alert.id}
                  className={`flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${
                    !alert.read ? 'bg-rose-50/50 border-rose-200' : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${type.color}`}>
                    <TypeIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{alert.title}</span>
                      {!alert.read && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.court}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        {alert.client}
                      </Badge>
                      <Badge className={`text-xs ${priority.color}`}>
                        {priority.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(alert.date), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Last Scan Info */}
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              <div>
                <p className="font-medium text-emerald-800">Última Varredura</p>
                <p className="text-sm text-emerald-700">
                  {format(stats.lastScan, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-emerald-700">Próxima varredura em</p>
              <p className="font-bold text-emerald-800">5h 45min</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
