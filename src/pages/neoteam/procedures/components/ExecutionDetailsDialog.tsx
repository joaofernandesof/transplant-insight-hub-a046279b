/**
 * Execution Details Dialog - View and manage consumption
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Camera,
  Package
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useExecutionWithConsumption, useFinalizeExecution } from '../hooks/useProcedures';
import { STATUS_LABELS, CATEGORY_LABELS, DIVERGENCE_STATUS_LABELS } from '../types';

interface ExecutionDetailsDialogProps {
  executionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExecutionDetailsDialog({ 
  executionId, 
  open, 
  onOpenChange 
}: ExecutionDetailsDialogProps) {
  const { data, isLoading } = useExecutionWithConsumption(executionId ?? undefined);
  const finalizeExecution = useFinalizeExecution();

  const execution = data?.execution;
  const entries = data?.entries || [];

  const handleFinalize = async () => {
    if (!executionId) return;
    await finalizeExecution.mutateAsync(executionId);
    onOpenChange(false);
  };

  const hasPendingDivergences = entries.some(
    e => e.has_divergence && e.divergence_status === 'pendente'
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Detalhes da Aplicação
          </DialogTitle>
          <DialogDescription>
            {execution?.procedure?.name} - {execution?.patient?.full_name || 'Sem paciente'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            Carregando...
          </div>
        ) : execution ? (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Data/Hora</p>
                <p className="font-medium">
                  {format(new Date(execution.executed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Clínica</p>
                <p className="font-medium">{execution.clinic?.name}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge variant={execution.status === 'finalizado' ? 'default' : 'secondary'}>
                  {STATUS_LABELS[execution.status]}
                </Badge>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Custo Total</p>
                <p className="font-medium text-green-600">
                  R$ {execution.total_cost?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>

            {/* Consumption Table */}
            <div>
              <h3 className="font-medium mb-3">Consumo de Materiais</h3>
              {entries.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-center">Esperado</TableHead>
                      <TableHead className="text-center">Usado</TableHead>
                      <TableHead>Lote</TableHead>
                      <TableHead>Foto</TableHead>
                      <TableHead>Divergência</TableHead>
                      <TableHead className="text-right">Custo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow key={entry.id} className={entry.has_divergence ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}>
                        <TableCell className="font-medium">
                          {entry.stock_item?.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {entry.stock_item?.category ? CATEGORY_LABELS[entry.stock_item.category] : 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {entry.quantity_expected}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={
                            entry.quantity_used > entry.quantity_expected 
                              ? 'text-red-500 font-medium' 
                              : entry.quantity_used < entry.quantity_expected 
                                ? 'text-green-500 font-medium'
                                : ''
                          }>
                            {entry.quantity_used}
                          </span>
                        </TableCell>
                        <TableCell>
                          {entry.lot_number || '-'}
                        </TableCell>
                        <TableCell>
                          {entry.photos?.length ? (
                            <Badge variant="outline" className="flex items-center gap-1 w-fit">
                              <Camera className="h-3 w-3" />
                              {entry.photos.length}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {entry.has_divergence ? (
                            <div className="space-y-1">
                              <Badge 
                                variant={
                                  entry.divergence_status === 'aprovado' 
                                    ? 'default' 
                                    : entry.divergence_status === 'rejeitado'
                                      ? 'destructive'
                                      : 'secondary'
                                }
                              >
                                {DIVERGENCE_STATUS_LABELS[entry.divergence_status]}
                              </Badge>
                              {entry.divergence_reason && (
                                <p className="text-xs text-muted-foreground">
                                  {entry.divergence_reason}
                                </p>
                              )}
                            </div>
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          R$ {entry.total_cost?.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center text-muted-foreground border rounded-lg">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum consumo registrado ainda</p>
                  <p className="text-sm">Adicione os itens consumidos nesta aplicação</p>
                </div>
              )}
            </div>

            {/* Notes */}
            {execution.notes && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Observações</p>
                <p className="text-sm">{execution.notes}</p>
              </div>
            )}

            {/* Actions */}
            {execution.status === 'em_andamento' && (
              <div className="flex items-center justify-between pt-4 border-t">
                {hasPendingDivergences && (
                  <div className="flex items-center gap-2 text-yellow-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">Divergências pendentes de aprovação</span>
                  </div>
                )}
                <div className="flex gap-2 ml-auto">
                  <Button variant="outline">
                    Adicionar Consumo
                  </Button>
                  <Button 
                    onClick={handleFinalize}
                    disabled={hasPendingDivergences || finalizeExecution.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Finalizar Aplicação
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Aplicação não encontrada
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
