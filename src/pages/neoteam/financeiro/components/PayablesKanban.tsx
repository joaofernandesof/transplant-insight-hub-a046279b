/**
 * Kanban de Contas a Pagar - Visualização por etapa do workflow BPMN
 */

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  ArrowRight,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Loader2,
  User,
  XCircle,
  Zap,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Payable } from "@/pages/ipromed/hooks/usePayables";
import { WORKFLOW_STAGES, STAGE_MAP, getNextStages } from "../config/workflowStages";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

interface PayablesKanbanProps {
  payables: Payable[];
  onMoveStage: (id: string, newStage: string, reason?: string) => Promise<void>;
  isUpdating: boolean;
}

function KanbanCard({ 
  payable, 
  onClick 
}: { 
  payable: Payable; 
  onClick: () => void;
}) {
  const isUrgent = (payable as any).is_urgent;
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-background rounded-lg p-3 shadow-sm border border-border/50",
        "hover:shadow-md hover:border-primary/30 transition-all cursor-pointer",
        isUrgent && "border-l-4 border-l-rose-500"
      )}
    >
      <div className="space-y-2">
        {/* Title + Urgent badge */}
        <div className="flex items-start gap-2">
          <p className="text-sm font-medium line-clamp-2 flex-1">{payable.description}</p>
          {isUrgent && (
            <Badge className="bg-rose-100 text-rose-700 text-[10px] shrink-0 gap-0.5">
              <Zap className="h-2.5 w-2.5" /> Urgente
            </Badge>
          )}
        </div>
        
        {/* Supplier */}
        {payable.supplier && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Building className="h-3 w-3" />
            <span className="truncate">{payable.supplier}</span>
          </div>
        )}

        {/* Amount + Date */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-primary">
            {formatCurrency(payable.amount)}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(payable.due_date), "dd/MM", { locale: ptBR })}
          </span>
        </div>

        {/* Requester */}
        {(payable as any).requester_name && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground pt-1 border-t border-border/30">
            <User className="h-2.5 w-2.5" />
            {(payable as any).requester_name}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PayablesKanban({ payables, onMoveStage, isUpdating }: PayablesKanbanProps) {
  const [selectedPayable, setSelectedPayable] = useState<Payable | null>(null);
  const [moveTarget, setMoveTarget] = useState('');
  const [moveReason, setMoveReason] = useState('');

  // Group payables by workflow_stage
  const columns = useMemo(() => {
    return WORKFLOW_STAGES.map(stage => ({
      stage,
      items: payables.filter(p => (p as any).workflow_stage === stage.id),
    }));
  }, [payables]);

  const totalByStage = useMemo(() => {
    return columns.map(col => ({
      ...col.stage,
      count: col.items.length,
      total: col.items.reduce((sum, p) => sum + Number(p.amount), 0),
    }));
  }, [columns]);

  const handleMove = async () => {
    if (!selectedPayable || !moveTarget) return;
    await onMoveStage(selectedPayable.id, moveTarget, moveReason || undefined);
    setSelectedPayable(null);
    setMoveTarget('');
    setMoveReason('');
  };

  const nextStages = selectedPayable
    ? getNextStages((selectedPayable as any).workflow_stage, (selectedPayable as any).is_urgent)
    : [];

  return (
    <div className="space-y-4">
      {/* Summary Row */}
      <div className="flex flex-wrap gap-2">
        {totalByStage.filter(s => s.count > 0 || !['negado'].includes(s.id)).map(s => (
          <div key={s.id} className="flex-1 min-w-[110px] bg-muted/30 rounded-lg p-2.5 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-0.5">
              <div className={cn("w-2 h-2 rounded-full", s.color)} />
              <span className="text-[10px] font-medium text-muted-foreground">{s.shortLabel}</span>
            </div>
            <span className="text-lg font-bold">{s.count}</span>
            {s.total > 0 && (
              <p className="text-[10px] text-muted-foreground">{formatCurrency(s.total)}</p>
            )}
          </div>
        ))}
      </div>

      {/* Kanban Columns */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {columns.filter(col => col.items.length > 0 || !['negado'].includes(col.stage.id)).map(col => (
          <div key={col.stage.id} className="flex-shrink-0 w-[230px]">
            <Card className="border-none shadow-sm overflow-hidden">
              {/* Column Header */}
              <div className={cn(
                "px-3 py-2.5 bg-gradient-to-r text-white text-center",
                col.stage.gradient
              )}>
                <h3 className="font-semibold text-xs">{col.stage.label}</h3>
                <p className="text-[10px] opacity-80">{col.stage.responsible}</p>
              </div>

              {/* Cards */}
              <CardContent className="p-2 bg-muted/20 min-h-[250px]">
                {col.items.length === 0 ? (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground text-xs">
                    Nenhum item
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2 pr-1">
                      {col.items.map(item => (
                        <KanbanCard
                          key={item.id}
                          payable={item}
                          onClick={() => {
                            setSelectedPayable(item);
                            setMoveTarget('');
                            setMoveReason('');
                          }}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Detail / Move Dialog */}
      <Dialog open={!!selectedPayable} onOpenChange={(open) => !open && setSelectedPayable(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedPayable?.description}
              {(selectedPayable as any)?.is_urgent && (
                <Badge className="bg-rose-100 text-rose-700 text-xs gap-0.5">
                  <Zap className="h-3 w-3" /> Urgente
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Detalhes e movimentação do pagamento
            </DialogDescription>
          </DialogHeader>

          {selectedPayable && (
            <div className="space-y-4">
              {/* Details */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Fornecedor</p>
                  <p className="font-medium">{selectedPayable.supplier || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Valor</p>
                  <p className="font-bold text-primary">{formatCurrency(selectedPayable.amount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Vencimento</p>
                  <p>{format(new Date(selectedPayable.due_date), "dd/MM/yyyy")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Categoria</p>
                  <Badge variant="outline" className="text-xs">{selectedPayable.category}</Badge>
                </div>
                {(selectedPayable as any).requester_name && (
                  <div>
                    <p className="text-muted-foreground text-xs">Solicitante</p>
                    <p>{(selectedPayable as any).requester_name}</p>
                  </div>
                )}
                {(selectedPayable as any).requester_department && (
                  <div>
                    <p className="text-muted-foreground text-xs">Departamento</p>
                    <p>{(selectedPayable as any).requester_department}</p>
                  </div>
                )}
              </div>

              {/* Current stage */}
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Etapa Atual</p>
                <div className="flex items-center gap-2">
                  <div className={cn("w-3 h-3 rounded-full", STAGE_MAP[(selectedPayable as any).workflow_stage]?.color || 'bg-gray-500')} />
                  <span className="font-medium text-sm">
                    {STAGE_MAP[(selectedPayable as any).workflow_stage]?.label || (selectedPayable as any).workflow_stage}
                  </span>
                </div>
              </div>

              {/* Notes / Bank data */}
              {selectedPayable.notes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Observações</p>
                  <p className="text-sm bg-muted/30 p-2 rounded">{selectedPayable.notes}</p>
                </div>
              )}
              {(selectedPayable as any).bank_data && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Dados Bancários</p>
                  <p className="text-sm bg-muted/30 p-2 rounded font-mono text-xs">{(selectedPayable as any).bank_data}</p>
                </div>
              )}

              {/* Pending/Rejection reason */}
              {(selectedPayable as any).pending_reason && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-xs text-amber-700 font-medium mb-1">Motivo da Pendência</p>
                  <p className="text-sm text-amber-800">{(selectedPayable as any).pending_reason}</p>
                </div>
              )}
              {(selectedPayable as any).rejection_reason && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
                  <p className="text-xs text-rose-700 font-medium mb-1">Motivo da Negativa</p>
                  <p className="text-sm text-rose-800">{(selectedPayable as any).rejection_reason}</p>
                </div>
              )}

              {/* Move to next stage */}
              {nextStages.length > 0 && (
                <div className="space-y-3 pt-2 border-t">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <ArrowRight className="h-4 w-4" /> Mover para
                  </Label>
                  <Select value={moveTarget} onValueChange={setMoveTarget}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a próxima etapa" />
                    </SelectTrigger>
                    <SelectContent>
                      {nextStages.map(stageId => (
                        <SelectItem key={stageId} value={stageId}>
                          {STAGE_MAP[stageId]?.label || stageId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {(moveTarget === 'pendencia' || moveTarget === 'negado') && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">
                        {moveTarget === 'pendencia' ? 'Motivo da pendência *' : 'Motivo da negativa *'}
                      </Label>
                      <Textarea
                        placeholder={moveTarget === 'pendencia' 
                          ? 'Descreva os campos a corrigir...' 
                          : 'Informe o motivo da negativa...'}
                        value={moveReason}
                        onChange={e => setMoveReason(e.target.value)}
                        rows={2}
                      />
                    </div>
                  )}

                  <Button 
                    onClick={handleMove} 
                    disabled={!moveTarget || isUpdating || ((moveTarget === 'pendencia' || moveTarget === 'negado') && !moveReason.trim())}
                    className="w-full"
                  >
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4 mr-2" />
                    )}
                    Confirmar Movimentação
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
