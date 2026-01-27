/**
 * IPROMED - Jornada do Cliente
 * Visualização e gestão das etapas da jornada jurídica
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Users,
  TrendingUp,
  Target,
  Handshake,
  UserCheck,
  Award,
  AlertTriangle,
  ChevronRight,
  ArrowRight,
  MessageCircle,
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
  BarChart3,
  Filter,
} from "lucide-react";

// Journey stages configuration
const journeyStages = [
  {
    id: 'prospect',
    title: 'Prospecto',
    description: 'Potenciais clientes em análise',
    icon: Target,
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    count: 8,
  },
  {
    id: 'onboarding',
    title: 'Onboarding',
    description: 'Novos clientes em integração',
    icon: Handshake,
    color: 'bg-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    borderColor: 'border-purple-200 dark:border-purple-800',
    count: 5,
  },
  {
    id: 'retention',
    title: 'Retenção',
    description: 'Clientes ativos e satisfeitos',
    icon: UserCheck,
    color: 'bg-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    count: 24,
  },
  {
    id: 'expansion',
    title: 'Expansão',
    description: 'Clientes em upsell/cross-sell',
    icon: TrendingUp,
    color: 'bg-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
    count: 12,
  },
  {
    id: 'advocacy',
    title: 'Advocacia',
    description: 'Clientes promotores da marca',
    icon: Award,
    color: 'bg-rose-500',
    bgColor: 'bg-rose-50 dark:bg-rose-950/30',
    borderColor: 'border-rose-200 dark:border-rose-800',
    count: 7,
  },
];

// Mock clients per stage
const mockClientsByStage: Record<string, Array<{
  id: string;
  name: string;
  avatar: string | null;
  daysInStage: number;
  nextAction: string;
  nextActionDate: string;
  healthScore: number;
  processes: number;
}>> = {
  prospect: [
    { id: '1', name: 'Dr. Paulo Andrade', avatar: null, daysInStage: 5, nextAction: 'Reunião de apresentação', nextActionDate: '2025-01-30', healthScore: 70, processes: 0 },
    { id: '2', name: 'Dra. Beatriz Costa', avatar: null, daysInStage: 12, nextAction: 'Follow-up proposta', nextActionDate: '2025-01-28', healthScore: 55, processes: 0 },
    { id: '3', name: 'Dr. Marcos Oliveira', avatar: null, daysInStage: 3, nextAction: 'Enviar material', nextActionDate: '2025-01-27', healthScore: 85, processes: 0 },
  ],
  onboarding: [
    { id: '4', name: 'Dra. Marina Silva', avatar: null, daysInStage: 8, nextAction: 'Treinamento inicial', nextActionDate: '2025-01-29', healthScore: 80, processes: 1 },
    { id: '5', name: 'Dr. Lucas Santos', avatar: null, daysInStage: 15, nextAction: 'Documentação pendente', nextActionDate: '2025-01-26', healthScore: 60, processes: 1 },
  ],
  retention: [
    { id: '6', name: 'Dr. Ricardo Mendes', avatar: null, daysInStage: 180, nextAction: 'Check-in trimestral', nextActionDate: '2025-02-15', healthScore: 95, processes: 2 },
    { id: '7', name: 'Dra. Ana Ferreira', avatar: null, daysInStage: 90, nextAction: 'Renovação contrato', nextActionDate: '2025-03-01', healthScore: 88, processes: 1 },
    { id: '8', name: 'Dr. João Pedro', avatar: null, daysInStage: 45, nextAction: 'Acompanhamento processo', nextActionDate: '2025-01-31', healthScore: 75, processes: 3 },
  ],
  expansion: [
    { id: '9', name: 'Dra. Camila Torres', avatar: null, daysInStage: 30, nextAction: 'Apresentar novo serviço', nextActionDate: '2025-02-05', healthScore: 92, processes: 3 },
    { id: '10', name: 'Dr. Felipe Lima', avatar: null, daysInStage: 60, nextAction: 'Proposta consultoria', nextActionDate: '2025-02-10', healthScore: 85, processes: 2 },
  ],
  advocacy: [
    { id: '11', name: 'Dr. André Souza', avatar: null, daysInStage: 120, nextAction: 'Solicitar depoimento', nextActionDate: '2025-02-20', healthScore: 98, processes: 4 },
    { id: '12', name: 'Dra. Patricia Rocha', avatar: null, daysInStage: 200, nextAction: 'Evento de indicação', nextActionDate: '2025-03-15', healthScore: 95, processes: 2 },
  ],
};

const journeyMetrics = [
  { label: 'Taxa de Conversão', value: '68%', trend: '+5%', icon: TrendingUp, color: 'text-emerald-600' },
  { label: 'Tempo Médio Onboarding', value: '12 dias', trend: '-2 dias', icon: Clock, color: 'text-blue-600' },
  { label: 'Retenção (12m)', value: '94%', trend: '+3%', icon: UserCheck, color: 'text-purple-600' },
  { label: 'NPS Score', value: '72', trend: '+8', icon: Award, color: 'text-amber-600' },
];

export default function IpromedJourney() {
  const navigate = useNavigate();
  const [selectedStage, setSelectedStage] = useState<string>('all');

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-100';
    if (score >= 60) return 'text-amber-600 bg-amber-100';
    return 'text-rose-600 bg-rose-100';
  };

  const getHealthProgress = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/ipromed')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          IPROMED
        </Button>
        <span className="text-muted-foreground">/</span>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="font-medium">Jornada do Cliente</span>
        </div>
      </div>

      {/* Title */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Jornada do Cliente</h1>
          <p className="text-muted-foreground">Acompanhe a evolução dos clientes em cada etapa</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/ipromed/clients')}>
            <Users className="h-4 w-4 mr-2" />
            Ver Todos Clientes
          </Button>
          <Button>
            <BarChart3 className="h-4 w-4 mr-2" />
            Relatório
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {journeyMetrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {metric.trend}
                  </Badge>
                </div>
                <div className="p-3 bg-muted rounded-xl">
                  <metric.icon className={`h-5 w-5 ${metric.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Journey Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Pipeline da Jornada
          </CardTitle>
          <CardDescription>Clique em uma etapa para ver os clientes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4 items-stretch">
            {journeyStages.map((stage, index) => (
              <div key={stage.id} className="flex-1 flex items-center gap-2">
                <button
                  onClick={() => setSelectedStage(stage.id === selectedStage ? 'all' : stage.id)}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    selectedStage === stage.id 
                      ? `${stage.borderColor} ${stage.bgColor} ring-2 ring-offset-2 ring-primary/20` 
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className={`p-3 ${stage.color} rounded-xl text-white`}>
                      <stage.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{stage.title}</p>
                      <p className="text-xs text-muted-foreground">{stage.description}</p>
                    </div>
                    <Badge variant="secondary" className="text-lg font-bold">
                      {stage.count}
                    </Badge>
                  </div>
                </button>
                {index < journeyStages.length - 1 && (
                  <ChevronRight className="h-5 w-5 text-muted-foreground hidden lg:block" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Clients by Stage */}
      <Tabs defaultValue={selectedStage !== 'all' ? selectedStage : 'prospect'} value={selectedStage !== 'all' ? selectedStage : undefined}>
        <TabsList className="w-full justify-start overflow-x-auto">
          {journeyStages.map((stage) => (
            <TabsTrigger
              key={stage.id}
              value={stage.id}
              onClick={() => setSelectedStage(stage.id)}
              className="flex items-center gap-2"
            >
              <stage.icon className="h-4 w-4" />
              {stage.title}
              <Badge variant="outline" className="ml-1">{stage.count}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {journeyStages.map((stage) => (
          <TabsContent key={stage.id} value={stage.id} className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <stage.icon className={`h-5 w-5`} style={{ color: stage.color.replace('bg-', '').replace('-500', '') }} />
                  {stage.title}
                  <Badge className={stage.color + ' text-white'}>{mockClientsByStage[stage.id]?.length || 0}</Badge>
                </CardTitle>
                <CardDescription>{stage.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockClientsByStage[stage.id]?.map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/ipromed/clients/${client.id}`)}
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={client.avatar || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(client.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {client.daysInStage} dias nesta etapa
                            </span>
                            <span>•</span>
                            <span>{client.processes} processos</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        {/* Next Action */}
                        <div className="text-right hidden md:block">
                          <p className="text-sm font-medium">{client.nextAction}</p>
                          <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(client.nextActionDate).toLocaleDateString('pt-BR')}
                          </p>
                        </div>

                        {/* Health Score */}
                        <div className="w-24">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">Saúde</span>
                            <Badge variant="outline" className={getHealthColor(client.healthScore)}>
                              {client.healthScore}%
                            </Badge>
                          </div>
                          <Progress value={client.healthScore} className="h-2" />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </div>

                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
