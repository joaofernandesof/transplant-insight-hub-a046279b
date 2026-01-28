import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  MessageSquare,
  Trophy,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  Lightbulb,
  PlayCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMeetingAgendaItems, AgendaItem } from "@/hooks/useMeetingAgenda";
import { toast } from "sonner";

interface AgendaItemRowProps {
  item: AgendaItem;
  isActive: boolean;
  onToggle: (itemId: string, isCompleted: boolean) => void;
  onNotesChange: (itemId: string, notes: string) => void;
  onDelete?: (itemId: string) => void;
  onActivate: () => void;
}

function AgendaItemRow({ item, isActive, onToggle, onNotesChange, onDelete, onActivate }: AgendaItemRowProps) {
  const [isExpanded, setIsExpanded] = useState(isActive);
  const [localNotes, setLocalNotes] = useState(item.notes || "");

  useEffect(() => {
    if (isActive) setIsExpanded(true);
  }, [isActive]);

  return (
    <div
      className={cn(
        "border rounded-lg transition-all",
        item.is_completed ? "bg-primary/10 border-primary/30" : "bg-card",
        isActive && !item.is_completed && "ring-2 ring-primary/50 shadow-md"
      )}
    >
      <div 
        className="flex items-start gap-3 p-3 cursor-pointer"
        onClick={onActivate}
      >
        <div className="mt-1" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={item.is_completed}
            onCheckedChange={(checked) => onToggle(item.id, !!checked)}
          />
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
            <Badge variant="outline" className="text-[10px] gap-1">
              <Clock className="h-2.5 w-2.5" />
              {item.estimated_minutes}min
            </Badge>
            {isActive && !item.is_completed && (
              <Badge className="text-[10px] gap-1 bg-primary">
                <PlayCircle className="h-2.5 w-2.5" />
                Atual
              </Badge>
            )}
          </div>

          {item.description && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {item.description}
            </p>
          )}

          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="mt-2 h-7 px-2 text-xs">
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3 mr-1" />
                ) : (
                  <ChevronRight className="h-3 w-3 mr-1" />
                )}
                {isExpanded ? "Ocultar detalhes" : "Ver detalhes"}
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-3 space-y-3" onClick={(e) => e.stopPropagation()}>
              {/* Guidance */}
              {item.guidance && (
                <div className="bg-accent/50 border border-accent rounded-md p-3">
                  <p className="text-sm font-medium mb-1 flex items-center gap-1 text-accent-foreground">
                    <Lightbulb className="h-3.5 w-3.5" />
                    Orientação:
                  </p>
                  <p className="text-sm text-accent-foreground/80">
                    {item.guidance}
                  </p>
                </div>
              )}

              {/* Talking Points */}
              {item.talking_points && item.talking_points.length > 0 && (
                <div className="bg-muted/50 rounded-md p-3">
                  <p className="text-sm font-medium mb-2">📝 Pontos a abordar:</p>
                  <ul className="space-y-1">
                    {item.talking_points.map((point, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Notes */}
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
                  placeholder="Adicione notas sobre esta pauta..."
                  className="text-sm min-h-[60px]"
                />
              </div>

              {/* Delete button */}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onDelete(item.id)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Remover item
                </Button>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  );
}

interface MeetingAgendaModalProps {
  isOpen: boolean;
  onClose: () => void;
  agendaId: string;
  agendaTitle?: string;
  agendaDate?: string;
}

export function MeetingAgendaModal({
  isOpen,
  onClose,
  agendaId,
  agendaTitle,
  agendaDate,
}: MeetingAgendaModalProps) {
  const {
    items,
    isLoading,
    stats,
    toggleItem,
    updateItemNotes,
    addItem,
    deleteItem,
    getNextIncompleteItem,
  } = useMeetingAgendaItems(agendaId);

  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', description: '', guidance: '' });

  // Set active item to next incomplete
  useEffect(() => {
    if (items.length > 0 && !activeItemId) {
      const next = getNextIncompleteItem();
      if (next) setActiveItemId(next.id);
    }
  }, [items, activeItemId]);

  const handleToggle = (itemId: string, isCompleted: boolean) => {
    toggleItem.mutate({ itemId, isCompleted });
    
    // Move to next item if completed
    if (isCompleted) {
      const currentIndex = items.findIndex(i => i.id === itemId);
      const nextItem = items[currentIndex + 1];
      if (nextItem && !nextItem.is_completed) {
        setActiveItemId(nextItem.id);
      }
    }
  };

  const handleAddItem = () => {
    if (!newItem.title.trim()) {
      toast.error("Digite um título para o item");
      return;
    }

    addItem.mutate({
      agendaId,
      title: newItem.title,
      description: newItem.description || undefined,
      guidance: newItem.guidance || undefined,
    });

    setNewItem({ title: '', description: '', guidance: '' });
    setShowAddItem(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            📋 {agendaTitle || "Pauta da Reunião"}
          </DialogTitle>
          <DialogDescription>
            {agendaDate && `${agendaDate} • `}
            {items.length} itens na pauta
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        {stats && (
          <div className="bg-muted/30 rounded-lg p-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progresso da Reunião</span>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{stats.completed}/{stats.total} ({stats.percentage}%)</span>
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {stats.completedMinutes}/{stats.totalMinutes}min
                </Badge>
              </div>
            </div>
            <Progress value={stats.percentage} className="h-2" />

            {stats.percentage === 100 && (
              <div className="flex items-center gap-2 mt-3 text-primary">
                <Trophy className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Reunião concluída! 🎉
                </span>
              </div>
            )}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mb-3 opacity-50" />
            <p>Nenhum item na pauta</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setShowAddItem(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar primeiro item
            </Button>
          </div>
        )}

        {/* Items List */}
        {!isLoading && items.length > 0 && (
          <ScrollArea className="flex-1 pr-4 -mr-4">
            <div className="space-y-2 pb-4">
              {items.map((item) => (
                <AgendaItemRow
                  key={item.id}
                  item={item}
                  isActive={activeItemId === item.id}
                  onToggle={handleToggle}
                  onNotesChange={(id, notes) =>
                    updateItemNotes.mutate({ itemId: id, notes })
                  }
                  onDelete={(id) => deleteItem.mutate(id)}
                  onActivate={() => setActiveItemId(item.id)}
                />
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Add New Item */}
        {showAddItem && (
          <Card className="border-dashed flex-shrink-0">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Novo Item da Pauta</CardTitle>
            </CardHeader>
            <div className="px-4 pb-4 space-y-3">
              <div>
                <Label className="text-xs">Título *</Label>
                <Input
                  value={newItem.title}
                  onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Discutir orçamento do projeto"
                />
              </div>
              <div>
                <Label className="text-xs">Descrição</Label>
                <Input
                  value={newItem.description}
                  onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Breve descrição do tópico"
                />
              </div>
              <div>
                <Label className="text-xs">Orientação/Guia</Label>
                <Textarea
                  value={newItem.guidance}
                  onChange={(e) => setNewItem(prev => ({ ...prev, guidance: e.target.value }))}
                  placeholder="Dicas de como conduzir este tópico..."
                  className="min-h-[60px]"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddItem}>
                  <Plus className="h-3 w-3 mr-1" />
                  Adicionar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAddItem(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Footer */}
        <div className="flex justify-between pt-4 border-t flex-shrink-0">
          {!showAddItem && items.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setShowAddItem(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Item
            </Button>
          )}
          {showAddItem && <div />}
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
