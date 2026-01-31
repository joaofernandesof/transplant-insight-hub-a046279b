/**
 * Costs Tab - Detailed cost analysis for procedures
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Package,
  Calendar,
  Download,
  Filter,
  PieChart,
  BarChart3,
  AlertTriangle
} from 'lucide-react';
import { format, subDays, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  useProcedureCostSummary,
  useProcedureFinancialSummary,
  useExecutionCosts,
  useCostsByCategory,
  useCostsByPeriod
} from '../hooks/useProcedureCosts';
import { CATEGORY_LABELS } from '../types';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(value);
};

export function CostsTab() {
  const [dateRange, setDateRange] = useState('month');
  const [selectedClinic, setSelectedClinic] = useState<string>('all');

  // Calculate date filters
  const getDateFilters = () => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return { startDate: now.toISOString().split('T')[0] };
      case 'week':
        return { startDate: subDays(now, 7).toISOString().split('T')[0] };
      case 'month':
        return { startDate: startOfMonth(now).toISOString().split('T')[0] };
      case 'quarter':
        return { startDate: subDays(now, 90).toISOString().split('T')[0] };
      default:
        return {};
    }
  };

  const filters = {
    ...getDateFilters(),
    clinicId: selectedClinic !== 'all' ? selectedClinic : undefined
  };

  const { data: summary } = useProcedureFinancialSummary(filters);
  const { data: procedureCosts } = useProcedureCostSummary(filters);
  const { data: executionCosts } = useExecutionCosts({ ...filters, limit: 20 });
  const { data: categoryCosts } = useCostsByCategory(filters);
  const { data: periodCosts } = useCostsByPeriod('day', filters);

  // Calculate variance from average
  const avgCost = summary?.avg_cost_per_execution || 0;
  const varianceThreshold = avgCost * 0.2; // 20% threshold

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Últimos 7 dias</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
              <SelectItem value="quarter">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300">Custo Total</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {formatCurrency(summary?.total_cost || 0)}
                </p>
                <p className="text-xs text-blue-600">{summary?.total_executions || 0} aplicações</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 dark:text-green-300">Custo Médio</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {formatCurrency(summary?.avg_cost_per_execution || 0)}
                </p>
                <p className="text-xs text-green-600">por aplicação</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 dark:text-purple-300">Custo Hoje</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {formatCurrency(summary?.today_cost || 0)}
                </p>
                <p className="text-xs text-purple-600">{summary?.today_executions || 0} aplicações</p>
              </div>
              <Package className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700 dark:text-orange-300">Custo Mês</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {formatCurrency(summary?.month_cost || 0)}
                </p>
                <p className="text-xs text-orange-600">{summary?.month_executions || 0} aplicações</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cost by Procedure */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Custo por Procedimento
            </CardTitle>
            <CardDescription>
              Ranking de custos por tipo de procedimento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Procedimento</TableHead>
                  <TableHead className="text-center">Qtd</TableHead>
                  <TableHead className="text-right">Médio</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {procedureCosts?.map((proc) => (
                  <TableRow key={proc.procedure_id}>
                    <TableCell className="font-medium">{proc.procedure_name}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{proc.total_executions}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(proc.avg_cost_per_execution)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-primary">
                      {formatCurrency(proc.total_cost)}
                    </TableCell>
                  </TableRow>
                ))}
                {(!procedureCosts || procedureCosts.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Nenhum dado disponível
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Cost by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Custo por Categoria
            </CardTitle>
            <CardDescription>
              Distribuição de custos por tipo de material
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryCosts?.map((cat) => {
                const total = categoryCosts.reduce((sum, c) => sum + c.total_cost, 0);
                const percentage = total > 0 ? (cat.total_cost / total) * 100 : 0;
                
                return (
                  <div key={cat.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{cat.category_label}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {cat.items_count} itens
                        </span>
                      </div>
                      <span className="font-medium">{formatCurrency(cat.total_cost)}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-right">
                      {percentage.toFixed(1)}% do total
                    </p>
                  </div>
                );
              })}
              {(!categoryCosts || categoryCosts.length === 0) && (
                <div className="text-center text-muted-foreground py-8">
                  Nenhum dado disponível
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Executions with Cost */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimas Aplicações</CardTitle>
          <CardDescription>
            Detalhamento de custo por aplicação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Procedimento</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Clínica</TableHead>
                <TableHead className="text-center">Itens</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Custo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {executionCosts?.map((exec) => {
                const isAboveAvg = exec.total_cost > avgCost + varianceThreshold;
                const isBelowAvg = exec.total_cost < avgCost - varianceThreshold;
                
                return (
                  <TableRow key={exec.execution_id}>
                    <TableCell>
                      {format(new Date(exec.executed_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-medium">{exec.procedure_name}</TableCell>
                    <TableCell>{exec.patient_name}</TableCell>
                    <TableCell>{exec.clinic_name}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{exec.items_count}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {exec.has_divergence ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Divergência
                        </Badge>
                      ) : (
                        <Badge variant="default">OK</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-medium ${
                        isAboveAvg ? 'text-red-500' : isBelowAvg ? 'text-green-500' : ''
                      }`}>
                        {formatCurrency(exec.total_cost)}
                        {isAboveAvg && <TrendingUp className="inline h-3 w-3 ml-1" />}
                        {isBelowAvg && <TrendingDown className="inline h-3 w-3 ml-1" />}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!executionCosts || executionCosts.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhuma aplicação encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
