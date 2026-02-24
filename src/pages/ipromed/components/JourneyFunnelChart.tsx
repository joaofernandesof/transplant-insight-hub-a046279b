/**
 * Funil Visual da Jornada do Cliente
 * Mostra a progressão de clientes entre fases com taxas de conversão
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Users, 
  Calendar, 
  PlayCircle, 
  Video, 
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  AlertCircle
} from "lucide-react";

interface JourneyPhase {
  id: string;
  name: string;
  label: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

interface Props {
  data: {
    novos: number;
    agendado: number;
    andamento: number;
    reuniaoAgendada: number;
    continuo: number;
  };
}

export function JourneyFunnelChart({ data }: Props) {
  const phases: JourneyPhase[] = [
    { 
      id: 'novos', 
      name: 'Novos clientes', 
      label: 'Novos clientes',
      count: data.novos,
      icon: Users,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100 dark:bg-gray-900/40'
    },
    { 
      id: 'agendado', 
      name: 'Onboarding agendado', 
      label: 'Onboarding agendado',
      count: data.agendado,
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/40'
    },
    { 
      id: 'andamento', 
      name: 'Pacote Jurídico em andamento', 
      label: 'Pacote Jurídico em andamento',
      count: data.andamento,
      icon: PlayCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/40'
    },
    { 
      id: 'reuniaoAgendada', 
      name: 'Reunião de Apresentação', 
      label: 'Reunião de Apresentação',
      count: data.reuniaoAgendada,
      icon: Video,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/40'
    },
    { 
      id: 'continuo', 
      name: 'Acompanhamento contínuo', 
      label: 'Acompanhamento contínuo',
      count: data.continuo,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/40'
    },
  ];

  const totalClients = Object.values(data).reduce((a, b) => a + b, 0);
  const maxCount = Math.max(...phases.map(p => p.count), 1);

  // Calculate conversion rates between phases
  const getConversionRate = (from: number, to: number): number => {
    if (from === 0) return 0;
    return Math.round((to / from) * 100);
  };

  const conversions = [
    getConversionRate(data.novos, data.agendado),
    getConversionRate(data.agendado, data.andamento),
    getConversionRate(data.andamento, data.reuniaoAgendada),
    getConversionRate(data.reuniaoAgendada, data.continuo),
  ];

  // Calculate funnel health
  const avgConversion = conversions.length > 0 
    ? Math.round(conversions.reduce((a, b) => a + b, 0) / conversions.length)
    : 0;

  const getHealthStatus = () => {
    if (avgConversion >= 70) return { status: 'Saudável', color: 'text-emerald-600', bg: 'bg-emerald-100' };
    if (avgConversion >= 40) return { status: 'Atenção', color: 'text-amber-600', bg: 'bg-amber-100' };
    return { status: 'Crítico', color: 'text-rose-600', bg: 'bg-rose-100' };
  };

  const health = getHealthStatus();

  return (
    <Card className="border-none shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Funil da Jornada do Cliente
            </CardTitle>
            <CardDescription>Progressão D0 → D+30 com taxas de conversão</CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className={`${health.bg} ${health.color} border-none`}>
                  {health.status} • {avgConversion}% avg
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Taxa média de conversão entre fases</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Funnel Visualization */}
        <div className="relative">
          {phases.map((phase, index) => {
            const Icon = phase.icon;
            const conversionToNext = index < conversions.length ? conversions[index] : null;
            
            return (
              <div key={phase.id} className="mb-2">
                {/* Phase Bar */}
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${phase.bgColor} shrink-0`}>
                    <Icon className={`h-4 w-4 ${phase.color}`} />
                  </div>
                  
                  <div className="flex-1">
                    <div 
                      className={`h-10 ${phase.bgColor} rounded-lg flex items-center justify-between px-4 w-full`}
                    >
                      <span className={`text-sm font-medium ${phase.color} truncate mr-2`}>
                        {phase.name}
                      </span>
                      <span className={`text-lg font-bold ${phase.color} shrink-0`}>
                        {phase.count}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Conversion Arrow */}
                {conversionToNext !== null && (
                  <div className="flex items-center gap-3 my-1 ml-11 pl-2">
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className={`text-xs font-medium ${
                      conversionToNext >= 70 ? 'text-emerald-600' :
                      conversionToNext >= 40 ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                      {conversionToNext}% conversão
                    </span>
                    {conversionToNext < 40 && (
                      <AlertCircle className="h-3 w-3 text-rose-500" />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 pt-2 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{totalClients}</p>
            <p className="text-xs text-muted-foreground">Total no Pipeline</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{data.continuo}</p>
            <p className="text-xs text-muted-foreground">Concluídos</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${
              data.novos > 0 && data.continuo === 0 ? 'text-amber-600' : 'text-muted-foreground'
            }`}>
              {data.novos > 0 ? getConversionRate(data.novos, data.continuo) : 0}%
            </p>
            <p className="text-xs text-muted-foreground">Taxa Total</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
