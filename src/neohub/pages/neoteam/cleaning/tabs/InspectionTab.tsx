import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  CheckCircle2, XCircle, Clock, User, 
  Eye, AlertTriangle, ChevronDown, ChevronUp 
} from 'lucide-react';
import { useCleaningRoutine, useCleaningInspection, useCleaningExecution } from '../hooks';
import { 
  CleaningEnvironmentExecutionWithDetails, 
  RISK_LEVEL_BADGES,
  ITEM_CATEGORY_LABELS,
} from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface InspectionTabProps {
  branchId: string;
}

export function InspectionTab({ branchId }: InspectionTabProps) {
  const { pendingInspections, inspectedToday, isLoading } = useCleaningInspection(branchId);
  const { approveExecution, rejectExecution } = useCleaningRoutine(branchId);

  const [selectedExecution, setSelectedExecution] = useState<CleaningEnvironmentExecutionWithDetails | null>(null);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [rejectedItems, setRejectedItems] = useState<string[]>([]);
  const [rejectionNotes, setRejectionNotes] = useState('');

  const handleApprove = async (executionId: string) => {
    await approveExecution.mutateAsync(executionId);
  };

  const handleReject = async () => {
    if (!selectedExecution || rejectedItems.length === 0 || rejectionNotes.length < 10) return;

    await rejectExecution.mutateAsync({
      executionId: selectedExecution.id,
      rejectedItems,
      notes: rejectionNotes,
    });

    setShowRejectionDialog(false);
    setSelectedExecution(null);
    setRejectedItems([]);
    setRejectionNotes('');
  };

  const openRejectionDialog = (execution: CleaningEnvironmentExecutionWithDetails) => {
    setSelectedExecution(execution);
    setRejectedItems([]);
    setRejectionNotes('');
    setShowRejectionDialog(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Aguardando fiscalização */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            Aguardando Fiscalização
            {pendingInspections.length > 0 && (
              <Badge variant="secondary">{pendingInspections.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Ambientes finalizados aguardando sua aprovação
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingInspections.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum ambiente aguardando fiscalização no momento.
            </p>
          ) : (
            <div className="space-y-4">
              {pendingInspections.map(execution => (
                <InspectionCard
                  key={execution.id}
                  execution={execution}
                  onApprove={() => handleApprove(execution.id)}
                  onReject={() => openRejectionDialog(execution)}
                  isApproving={approveExecution.isPending}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Já inspecionados hoje */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Inspecionados Hoje
            {inspectedToday.length > 0 && (
              <Badge variant="outline">{inspectedToday.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inspectedToday.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Nenhuma inspeção realizada hoje.
            </p>
          ) : (
            <div className="space-y-2">
              {inspectedToday.map(execution => (
                <div 
                  key={execution.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {execution.status === 'aprovado' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium">{execution.environment?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {execution.approved_at && format(new Date(execution.approved_at), "HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <Badge variant={execution.status === 'aprovado' ? 'default' : 'destructive'}>
                    {execution.status === 'aprovado' ? 'Aprovado' : 'Reprovado'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Reprovação */}
      <RejectionDialog
        open={showRejectionDialog}
        onOpenChange={setShowRejectionDialog}
        execution={selectedExecution}
        rejectedItems={rejectedItems}
        setRejectedItems={setRejectedItems}
        rejectionNotes={rejectionNotes}
        setRejectionNotes={setRejectionNotes}
        onConfirm={handleReject}
        isLoading={rejectExecution.isPending}
      />
    </div>
  );
}

interface InspectionCardProps {
  execution: CleaningEnvironmentExecutionWithDetails;
  onApprove: () => void;
  onReject: () => void;
  isApproving: boolean;
}

function InspectionCard({ execution, onApprove, onReject, isApproving }: InspectionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { items } = useCleaningExecution(expanded ? execution.id : undefined);

  const duration = execution.started_at && execution.finished_at
    ? Math.round((new Date(execution.finished_at).getTime() - new Date(execution.started_at).getTime()) / 60000)
    : null;

  return (
    <Card className="border-yellow-200 dark:border-yellow-800">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{execution.environment?.name}</h3>
                <Badge {...RISK_LEVEL_BADGES[execution.environment?.sanitary_risk_level || 'nao_critico']}>
                  {RISK_LEVEL_BADGES[execution.environment?.sanitary_risk_level || 'nao_critico'].label}
                </Badge>
              </div>
              {execution.correction_count > 0 && (
                <Badge variant="destructive" className="mt-1">
                  Reprovado {execution.correction_count}x anteriormente
                </Badge>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Executado por: {execution.executor_name || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                Finalizado: {execution.finished_at && format(new Date(execution.finished_at), "HH:mm", { locale: ptBR })}
                {duration && <span className="text-muted-foreground"> ({duration} min)</span>}
              </span>
            </div>
          </div>

          {/* Expandir checklist */}
          <Button 
            variant="ghost" 
            className="w-full"
            onClick={() => setExpanded(!expanded)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {expanded ? 'Ocultar' : 'Ver'} Checklist
            {expanded ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
          </Button>

          {expanded && items.length > 0 && (
            <div className="border rounded-lg p-3 space-y-2">
              {items.map(item => (
                <div 
                  key={item.id}
                  className={`flex items-center gap-2 text-sm ${item.is_rejected ? 'text-red-500' : ''}`}
                >
                  {item.is_completed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  )}
                  <span>{item.checklist_item?.description}</span>
                </div>
              ))}
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
              onClick={onReject}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reprovar
            </Button>
            <Button 
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={onApprove}
              disabled={isApproving}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Aprovar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface RejectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  execution: CleaningEnvironmentExecutionWithDetails | null;
  rejectedItems: string[];
  setRejectedItems: (items: string[]) => void;
  rejectionNotes: string;
  setRejectionNotes: (notes: string) => void;
  onConfirm: () => void;
  isLoading: boolean;
}

function RejectionDialog({
  open,
  onOpenChange,
  execution,
  rejectedItems,
  setRejectedItems,
  rejectionNotes,
  setRejectionNotes,
  onConfirm,
  isLoading,
}: RejectionDialogProps) {
  const { items } = useCleaningExecution(open && execution ? execution.id : undefined);

  const toggleItem = (itemId: string) => {
    if (rejectedItems.includes(itemId)) {
      setRejectedItems(rejectedItems.filter(id => id !== itemId));
    } else {
      setRejectedItems([...rejectedItems, itemId]);
    }
  };

  const canSubmit = rejectedItems.length > 0 && rejectionNotes.length >= 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Reprovar Ambiente
          </DialogTitle>
          <DialogDescription>
            {execution?.environment?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Selecione os itens não conformes: *
            </label>
            <div className="border rounded-lg max-h-48 overflow-y-auto p-3 space-y-2">
              {items.map(item => (
                <div key={item.id} className="flex items-start gap-2">
                  <Checkbox
                    id={item.id}
                    checked={rejectedItems.includes(item.id)}
                    onCheckedChange={() => toggleItem(item.id)}
                  />
                  <label 
                    htmlFor={item.id}
                    className="text-sm cursor-pointer"
                  >
                    {item.checklist_item?.description}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Observação (obrigatória): *
            </label>
            <Textarea
              value={rejectionNotes}
              onChange={(e) => setRejectionNotes(e.target.value)}
              placeholder="Descreva o motivo da reprovação (mínimo 10 caracteres)..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {rejectionNotes.length}/10 caracteres mínimos
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            variant="destructive"
            onClick={onConfirm}
            disabled={!canSubmit || isLoading}
          >
            Confirmar Reprovação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
