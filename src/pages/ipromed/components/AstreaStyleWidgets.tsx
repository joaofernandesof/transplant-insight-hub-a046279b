/**
 * IPROMED - Astrea-style Right Sidebar Widgets
 * Widgets laterais inspirados no Astrea (Minhas atividades, Processos, Estatísticas)
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Plus,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useState } from "react";

interface ActivityStats {
  completed: number;
  overdue: number;
  pending: number;
}

interface WidgetProps {
  title: string;
  collapsible?: boolean;
  children: React.ReactNode;
  action?: React.ReactNode;
  defaultCollapsed?: boolean;
}

const Widget = ({ title, collapsible = true, children, action, defaultCollapsed = false }: WidgetProps) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <Card className="border shadow-sm rounded-lg overflow-hidden">
      <CardHeader className="py-3 px-4 bg-gray-50/50 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-gray-700">{title}</CardTitle>
          <div className="flex items-center gap-2">
            {action}
            {collapsible && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                {isCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      {!isCollapsed && (
        <CardContent className="p-4">
          {children}
        </CardContent>
      )}
    </Card>
  );
};

export function ActivityWidget() {
  const stats: ActivityStats = {
    completed: 47,
    overdue: 3,
    pending: 12,
  };

  return (
    <Widget
      title="Minhas atividades"
      action={
        <div className="flex items-center gap-2">
          <Select defaultValue="week">
            <SelectTrigger className="h-7 w-[110px] text-xs bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Atualizado às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </p>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-700">{stats.completed}</div>
            <div className="text-xs text-muted-foreground">Concluídas</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-rose-600">{stats.overdue}</div>
            <div className="text-xs text-muted-foreground">Atrasadas</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-700">{stats.pending}</div>
            <div className="text-xs text-muted-foreground">A concluir</div>
          </div>
        </div>

        {/* Mini Chart placeholder */}
        <div className="h-24 bg-gray-50 rounded-lg flex items-end justify-between px-4 py-2">
          {[40, 25, 60, 80, 45, 30, 55].map((height, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1">
              <div
                className="w-4 bg-gray-200 rounded-t"
                style={{ height: `${height}%` }}
              />
              <span className="text-[10px] text-muted-foreground">
                {['Tarefa', 'Evento'][idx % 2] || ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Widget>
  );
}

export function CasesWidget() {
  return (
    <Widget
      title="Processos e casos"
      action={
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <Plus className="h-4 w-4" />
        </Button>
      }
    >
      <div className="space-y-3">
        <Select defaultValue="30">
          <SelectTrigger className="h-8 text-sm bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>

        <div className="space-y-2">
          <button className="w-full text-left text-sm text-[#0066CC] hover:underline">
            0 não tiveram movimentação
          </button>
          <button className="w-full text-left text-sm text-[#0066CC] hover:underline">
            1 tiveram movimentação
          </button>
        </div>
      </div>
    </Widget>
  );
}

export function StatsWidget() {
  const metrics = [
    { label: 'Atendimentos ativos', value: 8, trend: 'up' },
    { label: 'Contratos pendentes', value: 5, trend: 'down' },
    { label: 'Processos em andamento', value: 12, trend: 'neutral' },
  ];

  return (
    <Widget title="Estatísticas">
      <div className="space-y-3">
        {metrics.map((metric, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <button className="text-sm text-[#0066CC] hover:underline">
              {metric.label}: {metric.value}
            </button>
            {metric.trend === 'up' && <TrendingUp className="h-4 w-4 text-emerald-500" />}
            {metric.trend === 'down' && <TrendingDown className="h-4 w-4 text-rose-500" />}
          </div>
        ))}
      </div>
    </Widget>
  );
}

export function PublicationsWidget() {
  return (
    <Widget title="Publicações de hoje">
      <div className="space-y-3">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="space-y-1">
            <div className="text-lg font-bold text-gray-700">2</div>
            <div className="text-[10px] text-muted-foreground uppercase">Recebidas</div>
          </div>
          <div className="space-y-1">
            <div className="text-lg font-bold text-emerald-600">14</div>
            <div className="text-[10px] text-muted-foreground uppercase">Tratadas</div>
          </div>
          <div className="space-y-1">
            <div className="text-lg font-bold text-rose-600">1</div>
            <div className="text-[10px] text-muted-foreground uppercase">Descartadas</div>
          </div>
          <div className="space-y-1">
            <div className="text-lg font-bold text-amber-600">5</div>
            <div className="text-[10px] text-muted-foreground uppercase">Não Tratadas</div>
          </div>
        </div>

        {/* Mini bar chart */}
        <div className="flex items-end justify-center gap-1 h-12">
          {[2, 4, 6, 3, 5, 2, 1].map((h, i) => (
            <div
              key={i}
              className="w-3 bg-[#0066CC] rounded-t"
              style={{ height: `${h * 8}px` }}
            />
          ))}
        </div>
        <div className="flex justify-center gap-1 text-[10px] text-muted-foreground">
          {['T', 'Q', 'Q', 'S', 'S', 'D', 'S'].map((d, i) => (
            <span key={i} className="w-3 text-center">{d}</span>
          ))}
        </div>
      </div>
    </Widget>
  );
}

export default function AstreaStyleWidgets() {
  return (
    <div className="space-y-4">
      <ActivityWidget />
      <CasesWidget />
      <StatsWidget />
    </div>
  );
}
