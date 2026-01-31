import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  TrendingUp,
  Target,
  Calendar,
  Stethoscope,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  ArrowRight
} from "lucide-react";
import { ModuleLayout } from "@/components/ModuleLayout";
import { useNavigate } from "react-router-dom";
import { useProcedureFinancialSummary, useProcedureCostSummary } from "./neoteam/procedures/hooks/useProcedureCosts";

const monthlyGoals = [
  { id: 'revenue', label: 'Faturamento', current: 85000, target: 100000, unit: 'R$' },
  { id: 'surgeries', label: 'Transplantes', current: 12, target: 15, unit: '' },
  { id: 'consultations', label: 'Consultas', current: 45, target: 60, unit: '' },
  { id: 'conversion', label: 'Taxa de Conversão', current: 28, target: 35, unit: '%' },
];

const recentTransactions = [
  { id: 1, description: 'Transplante FUE - João Silva', value: 15000, type: 'income', date: '15 Jan' },
  { id: 2, description: 'Transplante Barba - Carlos', value: 8000, type: 'income', date: '14 Jan' },
  { id: 3, description: 'Kit Neo-Spa - Produtos', value: -850, type: 'expense', date: '13 Jan' },
  { id: 4, description: 'Consulta Avaliação', value: 350, type: 'income', date: '12 Jan' },
  { id: 5, description: 'Marketing - Tráfego Pago', value: -2500, type: 'expense', date: '10 Jan' },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(Math.abs(value));
};

export default function Financial() {
  const navigate = useNavigate();
  const { data: procedureSummary } = useProcedureFinancialSummary();
  const { data: procedureCosts } = useProcedureCostSummary();

  const totalRevenue = 85000;
  const totalExpenses = 32000 + (procedureSummary?.month_cost || 0);
  const profit = totalRevenue - totalExpenses;
  const profitMargin = ((profit / totalRevenue) * 100).toFixed(0);

  return (
    <ModuleLayout>
      <div className="p-4 pt-16 lg:pt-4 lg:p-6 overflow-x-hidden w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-green-600" />
            Gestão Financeira
          </h1>
          <p className="text-sm text-muted-foreground">Metas, receitas e orientações</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-green-700">Receita</p>
                <ArrowUpRight className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-green-600">+12% vs mês anterior</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-red-700">Despesas</p>
                <ArrowDownRight className="h-4 w-4 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-900">{formatCurrency(totalExpenses)}</p>
              <p className="text-xs text-red-600">Inclui custos de procedimentos</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-blue-700">Lucro</p>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(profit)}</p>
              <p className="text-xs text-blue-600">Margem: {profitMargin}%</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-purple-700">Ticket Médio</p>
                <Stethoscope className="h-4 w-4 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-900">{formatCurrency(12500)}</p>
              <p className="text-xs text-purple-600">Por transplante</p>
            </CardContent>
          </Card>
        </div>

        {/* Procedure Costs Card */}
        <Card className="mb-6 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                Custos de Procedimentos
              </CardTitle>
              <CardDescription>Consumo de materiais e medicamentos</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/neoteam/procedures?tab=costs')}>
              Ver detalhes
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Custo Mês</p>
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(procedureSummary?.month_cost || 0)}
                </p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Custo Médio</p>
                <p className="text-lg font-bold">
                  {formatCurrency(procedureSummary?.avg_cost_per_execution || 0)}
                </p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Aplicações</p>
                <p className="text-lg font-bold">{procedureSummary?.month_executions || 0}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Total Geral</p>
                <p className="text-lg font-bold">{formatCurrency(procedureSummary?.total_cost || 0)}</p>
              </div>
            </div>

            {/* Top Procedures */}
            {procedureCosts && procedureCosts.length > 0 && (
              <div className="space-y-2">
                {procedureCosts.slice(0, 3).map((proc, i) => (
                  <div key={proc.procedure_id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{i + 1}</Badge>
                      <span className="text-sm font-medium">{proc.procedure_name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-primary">{formatCurrency(proc.total_cost)}</span>
                      <span className="text-xs text-muted-foreground ml-2">({proc.total_executions}x)</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Metas do Mês
              </CardTitle>
              <CardDescription>Janeiro 2026</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {monthlyGoals.map((goal) => {
                const progress = Math.min(Math.round((goal.current / goal.target) * 100), 100);
                const isCompleted = goal.current >= goal.target;
                
                return (
                  <div key={goal.id}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{goal.label}</span>
                      <span className={`text-sm font-bold ${isCompleted ? 'text-green-600' : ''}`}>
                        {goal.unit === 'R$' ? formatCurrency(goal.current) : `${goal.current}${goal.unit}`}
                        <span className="text-muted-foreground font-normal">
                          {' / '}{goal.unit === 'R$' ? formatCurrency(goal.target) : `${goal.target}${goal.unit}`}
                        </span>
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Movimentações Recentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {tx.type === 'income' ? <ArrowUpRight className="h-4 w-4 text-green-600" /> : <ArrowDownRight className="h-4 w-4 text-red-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{tx.date}</p>
                    </div>
                  </div>
                  <span className={`font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.value)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </ModuleLayout>
  );
}
