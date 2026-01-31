/**
 * Procedure Costs Card - For Financial Dashboard Integration
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Package,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProcedureCostSummary, useProcedureFinancialSummary } from '../hooks/useProcedureCosts';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(value);
};

interface ProcedureCostsCardProps {
  clinicId?: string;
  startDate?: string;
  endDate?: string;
  onViewDetails?: () => void;
}

export function ProcedureCostsCard({ 
  clinicId, 
  startDate, 
  endDate,
  onViewDetails 
}: ProcedureCostsCardProps) {
  const { data: summary, isLoading: loadingSummary } = useProcedureFinancialSummary({
    clinicId,
    startDate,
    endDate
  });

  const { data: procedureCosts, isLoading: loadingCosts } = useProcedureCostSummary({
    clinicId,
    startDate,
    endDate
  });

  const isLoading = loadingSummary || loadingCosts;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            Custos de Procedimentos
          </CardTitle>
          <CardDescription>
            Consumo de materiais por aplicação
          </CardDescription>
        </div>
        {onViewDetails && (
          <Button variant="outline" size="sm" onClick={onViewDetails}>
            Ver detalhes
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            Carregando...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Custo Total (Mês)</p>
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(summary?.month_cost || 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {summary?.month_executions || 0} aplicações
                </p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Custo Hoje</p>
                <p className="text-lg font-bold">
                  {formatCurrency(summary?.today_cost || 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {summary?.today_executions || 0} aplicações
                </p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Custo Médio</p>
                <p className="text-lg font-bold">
                  {formatCurrency(summary?.avg_cost_per_execution || 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  por aplicação
                </p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Total Aplicações</p>
                <p className="text-lg font-bold">
                  {summary?.total_executions || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  finalizadas
                </p>
              </div>
            </div>

            {/* Top Procedures by Cost */}
            {procedureCosts && procedureCosts.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3">Top Procedimentos por Custo</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Procedimento</TableHead>
                      <TableHead className="text-center">Aplicações</TableHead>
                      <TableHead className="text-right">Custo Médio</TableHead>
                      <TableHead className="text-right">Custo Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {procedureCosts.slice(0, 5).map((proc) => (
                      <TableRow key={proc.procedure_id}>
                        <TableCell className="font-medium">
                          {proc.procedure_name}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">
                            {proc.total_executions}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(proc.avg_cost_per_execution)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-primary">
                          {formatCurrency(proc.total_cost)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Mini version for sidebar or compact views
 */
export function ProcedureCostsMini({ clinicId }: { clinicId?: string }) {
  const { data: summary, isLoading } = useProcedureFinancialSummary({ clinicId });

  if (isLoading) {
    return (
      <div className="p-4 bg-muted rounded-lg animate-pulse">
        <div className="h-4 bg-muted-foreground/20 rounded w-1/2 mb-2" />
        <div className="h-6 bg-muted-foreground/20 rounded w-3/4" />
      </div>
    );
  }

  return (
    <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg border border-orange-200 dark:border-orange-800">
      <div className="flex items-center gap-2 mb-2">
        <Package className="h-4 w-4 text-orange-600" />
        <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
          Custos Procedimentos
        </span>
      </div>
      <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
        {formatCurrency(summary?.month_cost || 0)}
      </p>
      <p className="text-xs text-orange-600 dark:text-orange-400">
        {summary?.month_executions || 0} aplicações este mês
      </p>
    </div>
  );
}
