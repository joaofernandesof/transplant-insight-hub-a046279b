/**
 * Widget de Insights Operacionais
 * Métricas globais com sugestões acionáveis
 */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  FileSignature,
  Gavel,
  Calendar,
  Target,
  Zap,
  ShieldCheck,
} from "lucide-react";

interface InsightWidgetProps {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  insight: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  trend?: {
    value: string;
    isPositive: boolean;
  };
  status?: 'success' | 'warning' | 'danger' | 'neutral';
  isLoading?: boolean;
}

export function InsightWidget({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
  insight,
  action,
  trend,
  status = 'neutral',
  isLoading = false,
}: InsightWidgetProps) {
  const statusColors = {
    success: 'border-l-emerald-500',
    warning: 'border-l-amber-500',
    danger: 'border-l-rose-500',
    neutral: 'border-l-primary',
  };

  return (
    <Card className={`border-none shadow-md border-l-4 ${statusColors[status]} hover:shadow-lg transition-all`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <p className={`text-3xl font-bold ${color} mt-1`}>{value}</p>
            )}
            
            {trend && (
              <div className="flex items-center gap-1 mt-1">
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-rose-500" />
                )}
                <span className={`text-xs ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {trend.value}
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 ${bgColor} rounded-xl shrink-0`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>

        {/* Insight */}
        <div className="mt-3 pt-3 border-t border-dashed">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">{insight}</p>
          </div>
        </div>

        {/* Action Button */}
        {action && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full mt-3 justify-between text-xs h-8"
            onClick={action.onClick}
          >
            {action.label}
            <ArrowRight className="h-3 w-3" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Aggregate metrics component
interface OperationalMetricsProps {
  data: {
    totalClients: number;
    activeContracts: number;
    activeCases: number;
    pendingSignatures: number;
    expiringContracts: number;
    tasksOverdue: number;
    meetingsThisWeek: number;
    clientsWithoutContract: number;
    averageContractValue: number;
    retentionRate: number;
  };
  isLoading: boolean;
  navigate: (path: string) => void;
}

export function OperationalMetrics({ data, isLoading, navigate }: OperationalMetricsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {/* Clientes Protegidos */}
      <InsightWidget
        title="Clientes Protegidos"
        value={data.totalClients}
        icon={ShieldCheck}
        color="text-blue-600"
        bgColor="bg-blue-100 dark:bg-blue-900/40"
        insight={data.totalClients < 50 
          ? "Meta: 50 clientes. Foque em converter leads do funil comercial."
          : "Base sólida! Priorize retenção e upsell de serviços premium."}
        status={data.totalClients >= 50 ? 'success' : 'neutral'}
        trend={{ value: "+3 este mês", isPositive: true }}
        action={{
          label: "Ver clientes",
          onClick: () => navigate('/cpg/clients')
        }}
        isLoading={isLoading}
      />

      {/* Contratos Ativos */}
      <InsightWidget
        title="Contratos Ativos"
        value={data.activeContracts}
        icon={FileSignature}
        color="text-emerald-600"
        bgColor="bg-emerald-100 dark:bg-emerald-900/40"
        insight={data.clientsWithoutContract > 0 
          ? `${data.clientsWithoutContract} cliente(s) sem contrato ativo. Regularize urgente!`
          : "Todos os clientes estão com contratos em dia. Excelente!"}
        status={data.clientsWithoutContract > 0 ? 'warning' : 'success'}
        action={{
          label: "Gerenciar contratos",
          onClick: () => navigate('/cpg/contracts')
        }}
        isLoading={isLoading}
      />

      {/* Assinaturas Pendentes */}
      <InsightWidget
        title="Aguard. Assinatura"
        value={data.pendingSignatures}
        icon={Clock}
        color="text-purple-600"
        bgColor="bg-purple-100 dark:bg-purple-900/40"
        insight={data.pendingSignatures > 0 
          ? "Envie lembretes para acelerar a assinatura. Cada dia sem contrato é risco."
          : "Nenhuma assinatura pendente. Fluxo em dia!"}
        status={data.pendingSignatures > 2 ? 'danger' : data.pendingSignatures > 0 ? 'warning' : 'success'}
        action={data.pendingSignatures > 0 ? {
          label: "Ver pendências",
          onClick: () => navigate('/cpg/contracts?status=pending_signature')
        } : undefined}
        isLoading={isLoading}
      />

      {/* Processos em Andamento */}
      <InsightWidget
        title="Processos Ativos"
        value={data.activeCases}
        icon={Gavel}
        color="text-rose-600"
        bgColor="bg-rose-100 dark:bg-rose-900/40"
        insight={data.activeCases > 10 
          ? "Alta demanda judicial. Considere ampliar a equipe ou priorizar casos críticos."
          : "Volume gerenciável. Mantenha o acompanhamento regular de cada processo."}
        status={data.activeCases > 10 ? 'warning' : 'neutral'}
        action={{
          label: "Ver processos",
          onClick: () => navigate('/cpg/cases')
        }}
        isLoading={isLoading}
      />

      {/* Contratos Vencendo */}
      <InsightWidget
        title="Vencendo em 30 dias"
        value={data.expiringContracts}
        icon={AlertTriangle}
        color="text-amber-600"
        bgColor="bg-amber-100 dark:bg-amber-900/40"
        insight={data.expiringContracts > 0 
          ? "Inicie contato para renovação AGORA. Clientes satisfeitos renovam com 85% de chance."
          : "Nenhum contrato vencendo. Aproveite para prospectar novos clientes."}
        status={data.expiringContracts > 3 ? 'danger' : data.expiringContracts > 0 ? 'warning' : 'success'}
        action={data.expiringContracts > 0 ? {
          label: "Renovar contratos",
          onClick: () => navigate('/cpg/contracts?expiring=true')
        } : undefined}
        isLoading={isLoading}
      />

      {/* Reuniões Esta Semana */}
      <InsightWidget
        title="Reuniões Esta Semana"
        value={data.meetingsThisWeek}
        icon={Calendar}
        color="text-cyan-600"
        bgColor="bg-cyan-100 dark:bg-cyan-900/40"
        insight={data.meetingsThisWeek === 0 
          ? "Nenhuma reunião agendada. Aproveite para ligar para clientes inativos."
          : `${data.meetingsThisWeek} reunião(ões) programada(s). Prepare pautas com antecedência.`}
        status="neutral"
        action={{
          label: "Ver agenda",
          onClick: () => navigate('/cpg')
        }}
        isLoading={isLoading}
      />

      {/* Taxa de Retenção */}
      <InsightWidget
        title="Taxa de Retenção"
        value={`${data.retentionRate}%`}
        icon={Target}
        color={data.retentionRate >= 80 ? "text-emerald-600" : "text-amber-600"}
        bgColor={data.retentionRate >= 80 ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-amber-100 dark:bg-amber-900/40"}
        insight={data.retentionRate >= 80 
          ? "Excelente! Clientes leais. Peça indicações e depoimentos."
          : "Abaixo do ideal (80%). Implemente pesquisa de satisfação e NPS."}
        status={data.retentionRate >= 80 ? 'success' : 'warning'}
        trend={{ value: data.retentionRate >= 80 ? "+2% vs mês passado" : "-3% vs mês passado", isPositive: data.retentionRate >= 80 }}
        isLoading={isLoading}
      />

      {/* Ticket Médio */}
      <InsightWidget
        title="Ticket Médio"
        value={`R$ ${data.averageContractValue.toLocaleString('pt-BR')}`}
        icon={Zap}
        color="text-indigo-600"
        bgColor="bg-indigo-100 dark:bg-indigo-900/40"
        insight={data.averageContractValue < 5000 
          ? "Ticket baixo. Ofereça pacotes premium e serviços adicionais (cursos, consultorias)."
          : "Ticket saudável! Mantenha a qualidade e considere reajustes anuais."}
        status={data.averageContractValue >= 5000 ? 'success' : 'neutral'}
        isLoading={isLoading}
      />
    </div>
  );
}
