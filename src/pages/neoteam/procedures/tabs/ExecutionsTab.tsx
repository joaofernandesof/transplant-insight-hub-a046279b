/**
 * Executions Tab - Patient Procedure Applications
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  PlayCircle, 
  Search, 
  Plus, 
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useProcedureExecutions } from '../hooks/useProcedures';
import { STATUS_LABELS, ProcedureExecutionStatus } from '../types';
import { NewExecutionDialog } from '../components/NewExecutionDialog';
import { ExecutionDetailsDialog } from '../components/ExecutionDetailsDialog';

const STATUS_ICONS: Record<ProcedureExecutionStatus, React.ReactNode> = {
  em_andamento: <Clock className="h-4 w-4 text-yellow-500" />,
  finalizado: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  cancelado: <XCircle className="h-4 w-4 text-red-500" />
};

const STATUS_VARIANTS: Record<ProcedureExecutionStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  em_andamento: 'secondary',
  finalizado: 'default',
  cancelado: 'destructive'
};

export function ExecutionsTab() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);
  
  const { data: executions, isLoading } = useProcedureExecutions(
    statusFilter !== 'all' ? { status: statusFilter } : undefined
  );

  const filteredExecutions = executions?.filter(e => {
    const searchLower = search.toLowerCase();
    return (
      e.patient?.full_name?.toLowerCase().includes(searchLower) ||
      e.procedure?.name?.toLowerCase().includes(searchLower) ||
      e.clinic?.name?.toLowerCase().includes(searchLower)
    );
  });

  const pendingCount = executions?.filter(e => e.status === 'em_andamento').length || 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">{pendingCount}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Finalizadas Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">
                {executions?.filter(e => 
                  e.status === 'finalizado' && 
                  new Date(e.completed_at || '').toDateString() === new Date().toDateString()
                ).length || 0}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Divergências Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold">3</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Custo Total Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {executions?.filter(e => 
                new Date(e.executed_at).toDateString() === new Date().toDateString()
              ).reduce((sum, e) => sum + (e.total_cost || 0), 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar paciente ou procedimento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="em_andamento">Em Andamento</SelectItem>
              <SelectItem value="finalizado">Finalizados</SelectItem>
              <SelectItem value="cancelado">Cancelados</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowNewDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Aplicação
        </Button>
      </div>

      {/* Executions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5" />
            Aplicações
          </CardTitle>
          <CardDescription>
            {filteredExecutions?.length || 0} registros
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Carregando...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Procedimento</TableHead>
                  <TableHead>Clínica</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Custo</TableHead>
                  <TableHead className="w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExecutions?.map((execution) => (
                  <TableRow key={execution.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {format(new Date(execution.executed_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(execution.executed_at), 'HH:mm', { locale: ptBR })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {execution.patient?.full_name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {execution.procedure?.name}
                    </TableCell>
                    <TableCell>
                      {execution.clinic?.name}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={STATUS_VARIANTS[execution.status]}
                        className="flex items-center gap-1 w-fit"
                      >
                        {STATUS_ICONS[execution.status]}
                        {STATUS_LABELS[execution.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-green-600">
                        R$ {execution.total_cost?.toFixed(2) || '0.00'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedExecutionId(execution.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!filteredExecutions?.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhuma aplicação encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <NewExecutionDialog 
        open={showNewDialog} 
        onOpenChange={setShowNewDialog} 
      />
      
      <ExecutionDetailsDialog
        executionId={selectedExecutionId}
        open={!!selectedExecutionId}
        onOpenChange={(open) => !open && setSelectedExecutionId(null)}
      />
    </div>
  );
}
