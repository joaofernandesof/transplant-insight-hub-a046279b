import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Lock,
  MessageSquare,
  Trophy,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePostVendaChecklist, ChecklistItem } from "../hooks/usePostVendaChecklist";
import { toast } from "sonner";

interface ChecklistItemRowProps {
  item: ChecklistItem;
  canComplete: boolean;
  onToggle: (itemId: string, isCompleted: boolean) => void;
  onNotesChange: (itemId: string, notes: string) => void;
  isLast: boolean;
}

function ChecklistItemRow({ item, canComplete, onToggle, onNotesChange, isLast }: ChecklistItemRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localNotes, setLocalNotes] = useState(item.notes || "");

  const handleToggle = (checked: boolean) => {
    if (!canComplete && checked) {
      toast.error("Complete as etapas anteriores primeiro!");
      return;
    }
    onToggle(item.id, checked);
  };

  return (
    <div
      className={cn(
        "border rounded-lg p-3 transition-all",
        item.is_completed ? "bg-primary/10 border-primary/30" : "bg-card",
        !canComplete && !item.is_completed && "opacity-60"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1">
          {!canComplete && !item.is_completed ? (
            <Lock className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Checkbox
              checked={item.is_completed}
              onCheckedChange={(checked) => handleToggle(!!checked)}
              disabled={!canComplete && !item.is_completed}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "font-medium",
                item.is_completed && "line-through text-muted-foreground"
              )}
            >
              {item.title}
            </span>
            <Badge variant="outline" className="text-[10px]">
              {item.order_index}
            </Badge>
            {!canComplete && !item.is_completed && (
              <Badge variant="secondary" className="text-[10px] gap-1">
                <Lock className="h-2.5 w-2.5" />
                Bloqueado
              </Badge>
            )}
          </div>

          {item.description && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {item.description}
            </p>
          )}

          {item.guidance && (
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="mt-2 h-7 px-2 text-xs">
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3 mr-1" />
                  ) : (
                    <ChevronRight className="h-3 w-3 mr-1" />
                  )}
                  {isExpanded ? "Ocultar detalhes" : "Ver detalhes"}
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="mt-3 space-y-3">
                <div className="bg-muted/50 rounded-md p-3">
                  <p className="text-sm font-medium mb-1">💬 Orientação:</p>
                  <p className="text-sm text-muted-foreground italic">
                    {item.guidance}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium mb-1 flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    Anotações:
                  </p>
                  <Textarea
                    value={localNotes}
                    onChange={(e) => setLocalNotes(e.target.value)}
                    onBlur={() => {
                      if (localNotes !== item.notes) {
                        onNotesChange(item.id, localNotes);
                      }
                    }}
                    placeholder="Adicione observações sobre esta etapa..."
                    className="text-sm min-h-[60px]"
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>
    </div>
  );
}

const PHASE_ICONS: Record<string, string> = {
  "Recepção": "📞",
  "Documentação": "📄",
  "Análise": "🔍",
  "Aprovação": "✅",
  "Negociação": "🤝",
  "Execução": "⚡",
  "Finalização": "🏁",
  "Registro": "📋",
  "Resolução": "💡",
  "Solicitação": "📝",
};

interface PostVendaChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  chamadoId: string;
  tipoDemanda: string;
  pacienteNome?: string;
}

export function PostVendaChecklistModal({
  isOpen,
  onClose,
  chamadoId,
  tipoDemanda,
  pacienteNome,
}: PostVendaChecklistModalProps) {
  const {
    items,
    isLoading,
    stats,
    initializeChecklist,
    toggleItem,
    updateItemNotes,
    canCompleteItem,
  } = usePostVendaChecklist(chamadoId);

  const [activePhase, setActivePhase] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Initialize checklist if empty
  useEffect(() => {
    if (isOpen && !isLoading && items.length === 0 && !isInitializing) {
      setIsInitializing(true);
      initializeChecklist.mutate(
        { chamadoId, tipoDemanda },
        {
          onSettled: () => setIsInitializing(false),
        }
      );
    }
  }, [isOpen, isLoading, items.length, chamadoId, tipoDemanda]);

  // Group items by phase
  const phases = items.length > 0 ? [...new Set(items.map((i) => i.phase))] : [];
  const itemsByPhase = items.reduce((acc, item) => {
    if (!acc[item.phase]) acc[item.phase] = [];
    acc[item.phase].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  const getTipoDemandaLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      distrato: "Distrato",
      reclamacao_atendimento: "Reclamação",
      reagendamento: "Reagendamento",
      duvida_pos_operatorio: "Dúvida Pós-Op",
    };
    return labels[tipo] || tipo;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Checklist de {getTipoDemandaLabel(tipoDemanda)}
          </DialogTitle>
          <DialogDescription>
            {items.length} etapas para completar o processo
          </DialogDescription>
        </DialogHeader>

        {/* Patient Info & Progress */}
        <div className="space-y-4 flex-shrink-0">
          {pacienteNome && (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{pacienteNome}</p>
                <p className="text-sm text-muted-foreground">
                  {getTipoDemandaLabel(tipoDemanda)}
                </p>
              </div>
              {stats && stats.percentage === 100 && (
                <Badge className="bg-primary gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Concluído
                </Badge>
              )}
            </div>
          )}

          {/* Progress Bar */}
          {stats && (
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progresso Geral</span>
                <span className="text-sm text-muted-foreground">
                  {stats.completed}/{stats.total} ({stats.percentage}%)
                </span>
              </div>
              <Progress value={stats.percentage} className="h-2" />

              {stats.percentage === 100 && (
                <div className="flex items-center gap-2 mt-3 text-primary">
                  <Trophy className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Processo completo! 🎉
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Loading state */}
        {(isLoading || isInitializing) && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isInitializing && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mb-3 opacity-50" />
            <p>Nenhum checklist disponível para este tipo de demanda</p>
          </div>
        )}

        {/* Phase List */}
        {!isLoading && !isInitializing && items.length > 0 && (
          <ScrollArea className="flex-1 pr-4 -mr-4">
            <div className="space-y-3 pb-4">
              {phases.map((phase) => {
                const phaseStats = stats?.byPhase[phase];
                const isComplete =
                  phaseStats?.completed === phaseStats?.total;
                const isOpen = activePhase === phase;

                return (
                  <Collapsible
                    key={phase}
                    open={isOpen}
                    onOpenChange={() =>
                      setActivePhase(isOpen ? null : phase)
                    }
                  >
                    <CollapsibleTrigger asChild>
                      <Card
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-md",
                          isComplete && "border-primary/50"
                        )}
                      >
                        <CardHeader className="py-3 px-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">
                                {PHASE_ICONS[phase] || "📋"}
                              </span>
                              <CardTitle className="text-base">
                                {phase}
                              </CardTitle>
                              {isComplete && (
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge
                                variant="secondary"
                                className="text-xs"
                              >
                                {phaseStats?.completed}/{phaseStats?.total}
                              </Badge>
                              {isOpen ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="mt-2 space-y-2 pl-4">
                      {itemsByPhase[phase]?.map((item, idx) => (
                        <ChecklistItemRow
                          key={item.id}
                          item={item}
                          canComplete={canCompleteItem(item.order_index)}
                          onToggle={(id, checked) =>
                            toggleItem.mutate({ itemId: id, isCompleted: checked })
                          }
                          onNotesChange={(id, notes) =>
                            updateItemNotes.mutate({ itemId: id, notes })
                          }
                          isLast={idx === itemsByPhase[phase].length - 1}
                        />
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
