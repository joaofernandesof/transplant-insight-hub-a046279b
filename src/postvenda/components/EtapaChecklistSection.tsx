import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Lock,
  MessageSquare,
  ClipboardCheck,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePostVendaChecklist, ChecklistItem } from "../hooks/usePostVendaChecklist";
import { toast } from "sonner";

interface EtapaChecklistSectionProps {
  chamadoId: string;
  tipoDemanda: string;
  currentEtapa: string;
  onChecklistComplete?: () => void;
  compact?: boolean;
}

export function EtapaChecklistSection({
  chamadoId,
  tipoDemanda,
  currentEtapa,
  onChecklistComplete,
  compact = false,
}: EtapaChecklistSectionProps) {
  const {
    items,
    isLoading,
    initializeChecklist,
    toggleItem,
    updateItemNotes,
    canCompleteItem,
  } = usePostVendaChecklist(chamadoId);

  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});
  const [isInitializing, setIsInitializing] = useState(false);

  // Inicializar checklist se vazio
  useEffect(() => {
    if (!isLoading && items.length === 0 && !isInitializing && chamadoId) {
      setIsInitializing(true);
      initializeChecklist.mutate(
        { chamadoId, tipoDemanda },
        {
          onSettled: () => setIsInitializing(false),
        }
      );
    }
  }, [isLoading, items.length, chamadoId, tipoDemanda, isInitializing]);

  // Filtrar items pela etapa atual
  const etapaItems = items.filter(item => item.etapa_bpmn === currentEtapa);
  const completedItems = etapaItems.filter(item => item.is_completed);
  const isComplete = etapaItems.length > 0 && completedItems.length === etapaItems.length;
  const percentage = etapaItems.length > 0 
    ? Math.round((completedItems.length / etapaItems.length) * 100)
    : 0;

  // Notificar quando o checklist estiver completo
  useEffect(() => {
    if (isComplete && onChecklistComplete) {
      onChecklistComplete();
    }
  }, [isComplete, onChecklistComplete]);

  const handleToggleItem = (item: ChecklistItem, checked: boolean) => {
    if (!canCompleteItem(item.order_index) && checked) {
      toast.error("Complete as etapas anteriores primeiro!");
      return;
    }
    toggleItem.mutate({ itemId: item.id, isCompleted: checked });
  };

  const toggleItemExpanded = (itemId: string) => {
    const newSet = new Set(expandedItems);
    if (newSet.has(itemId)) {
      newSet.delete(itemId);
    } else {
      newSet.add(itemId);
    }
    setExpandedItems(newSet);
  };

  if (isLoading || isInitializing) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
          <span className="text-sm text-muted-foreground">Carregando checklist...</span>
        </CardContent>
      </Card>
    );
  }

  if (etapaItems.length === 0) {
    return null; // Sem checklist para esta etapa
  }

  if (compact) {
    // Versão compacta para mostrar inline no fluxo
    return (
      <div className={cn(
        "border rounded-lg p-3 transition-all",
        isComplete 
          ? "bg-primary/5 border-primary/30" 
          : "bg-amber-50/50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800"
      )}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {isComplete ? (
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            ) : (
              <ClipboardCheck className="h-4 w-4 text-amber-600 shrink-0" />
            )}
            <span className="text-sm font-medium truncate">
              Checklist da Etapa
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge 
              variant={isComplete ? "default" : "outline"}
              className={cn(
                "text-xs",
                !isComplete && "border-amber-300 text-amber-700"
              )}
            >
              {completedItems.length}/{etapaItems.length}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-3 space-y-2">
            {etapaItems.map((item) => {
              const canComplete = canCompleteItem(item.order_index);
              const isItemExpanded = expandedItems.has(item.id);

              return (
                <div
                  key={item.id}
                  className={cn(
                    "border rounded-md p-2 bg-background/80",
                    item.is_completed && "border-primary/30",
                    !canComplete && !item.is_completed && "opacity-60"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">
                      {!canComplete && !item.is_completed ? (
                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <Checkbox
                          checked={item.is_completed}
                          onCheckedChange={(checked) => handleToggleItem(item, !!checked)}
                          disabled={!canComplete && !item.is_completed}
                          className="h-4 w-4"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm",
                        item.is_completed && "line-through text-muted-foreground"
                      )}>
                        {item.title}
                      </p>
                      {item.guidance && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-1 text-xs text-muted-foreground mt-1"
                          onClick={() => toggleItemExpanded(item.id)}
                        >
                          {isItemExpanded ? "Ocultar" : "Ver orientação"}
                        </Button>
                      )}
                      {isItemExpanded && item.guidance && (
                        <div className="mt-2 p-2 bg-muted/50 rounded text-xs text-muted-foreground">
                          💬 {item.guidance}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!isComplete && (
          <div className="mt-3 flex items-center gap-2 text-xs text-amber-600">
            <AlertCircle className="h-3.5 w-3.5" />
            Complete o checklist para avançar
          </div>
        )}
      </div>
    );
  }

  // Versão completa (para card separado)
  return (
    <Card className={cn(
      "transition-all",
      isComplete 
        ? "border-primary/30 bg-primary/5" 
        : "border-amber-200 bg-amber-50/30 dark:bg-amber-900/10 dark:border-amber-800"
    )}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer py-4 hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <ClipboardCheck className="h-5 w-5 text-amber-600" />
                )}
                <CardTitle className="text-base">
                  Checklist da Etapa Atual
                </CardTitle>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Progress value={percentage} className="w-20 h-2" />
                  <Badge variant={isComplete ? "default" : "secondary"}>
                    {completedItems.length}/{etapaItems.length}
                  </Badge>
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3">
            {etapaItems.map((item) => {
              const canComplete = canCompleteItem(item.order_index);
              const isItemExpanded = expandedItems.has(item.id);
              const notes = localNotes[item.id] ?? item.notes ?? "";

              return (
                <div
                  key={item.id}
                  className={cn(
                    "border rounded-lg p-3 transition-all",
                    item.is_completed ? "bg-primary/5 border-primary/30" : "bg-card",
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
                          onCheckedChange={(checked) => handleToggleItem(item, !!checked)}
                          disabled={!canComplete && !item.is_completed}
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn(
                          "font-medium",
                          item.is_completed && "line-through text-muted-foreground"
                        )}>
                          {item.title}
                        </span>
                        {!canComplete && !item.is_completed && (
                          <Badge variant="secondary" className="text-[10px] gap-1">
                            <Lock className="h-2.5 w-2.5" />
                            Bloqueado
                          </Badge>
                        )}
                      </div>

                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.description}
                        </p>
                      )}

                      {item.guidance && (
                        <Collapsible open={isItemExpanded} onOpenChange={() => toggleItemExpanded(item.id)}>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="mt-2 h-7 px-2 text-xs">
                              {isItemExpanded ? (
                                <ChevronDown className="h-3 w-3 mr-1" />
                              ) : (
                                <ChevronRight className="h-3 w-3 mr-1" />
                              )}
                              {isItemExpanded ? "Ocultar detalhes" : "Ver orientação"}
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
                                value={notes}
                                onChange={(e) => setLocalNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                                onBlur={() => {
                                  if (notes !== item.notes) {
                                    updateItemNotes.mutate({ itemId: item.id, notes });
                                  }
                                }}
                                placeholder="Adicione observações..."
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
            })}

            {!isComplete && (
              <div className="flex items-center gap-2 text-sm text-amber-600 pt-2">
                <AlertCircle className="h-4 w-4" />
                Complete todos os itens para avançar para a próxima etapa
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// Hook para verificar se o checklist da etapa está completo
export function useEtapaChecklistStatus(chamadoId: string | undefined, currentEtapa: string) {
  const { items, isLoading } = usePostVendaChecklist(chamadoId);

  const etapaItems = items.filter(item => item.etapa_bpmn === currentEtapa);
  const isComplete = etapaItems.length === 0 || etapaItems.every(item => item.is_completed);
  const completedCount = etapaItems.filter(item => item.is_completed).length;
  const totalCount = etapaItems.length;

  return {
    isComplete,
    isLoading,
    completedCount,
    totalCount,
    hasChecklist: etapaItems.length > 0,
  };
}