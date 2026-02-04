/**
 * Sheet para gerenciar checklists das fases da jornada do cliente
 * Permite configurar os itens obrigatórios de cada fase
 */

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CheckSquare,
  Plus,
  Trash2,
  GripVertical,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { journeyPhasesDetailed, PhaseDetail } from "./JourneyPhaseDetail";
import { toast } from "sonner";

interface JourneyChecklistSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ChecklistItem {
  id: string;
  label: string;
  isRequired: boolean;
}

// Default checklists for each phase
const defaultChecklists: Record<string, ChecklistItem[]> = {
  'Novos': [
    { id: '1', label: 'Contato inicial realizado', isRequired: true },
    { id: '2', label: 'Dados cadastrais coletados', isRequired: true },
    { id: '3', label: 'Documentos iniciais solicitados', isRequired: false },
    { id: '4', label: 'Primeira reunião agendada', isRequired: true },
  ],
  'Agendado': [
    { id: '1', label: 'Reunião de onboarding realizada', isRequired: true },
    { id: '2', label: 'Roteiro de reunião seguido', isRequired: false },
    { id: '3', label: 'Contrato apresentado', isRequired: true },
    { id: '4', label: 'Dúvidas esclarecidas', isRequired: true },
    { id: '5', label: 'Próximos passos definidos', isRequired: true },
  ],
  'Andamento': [
    { id: '1', label: 'Contrato assinado', isRequired: true },
    { id: '2', label: 'Pagamento confirmado', isRequired: true },
    { id: '3', label: 'Documentação completa', isRequired: true },
    { id: '4', label: 'Processo protocolado', isRequired: false },
    { id: '5', label: 'Cliente notificado sobre andamento', isRequired: true },
  ],
  'Apresentacao': [
    { id: '1', label: 'Reunião de apresentação agendada', isRequired: true },
    { id: '2', label: 'Pacote jurídico preparado', isRequired: true },
    { id: '3', label: 'Apresentação realizada', isRequired: true },
    { id: '4', label: 'Feedback do cliente coletado', isRequired: false },
  ],
  'Continuo': [
    { id: '1', label: 'Acompanhamento mensal realizado', isRequired: true },
    { id: '2', label: 'Relatório de status enviado', isRequired: false },
    { id: '3', label: 'Contato periódico mantido', isRequired: true },
    { id: '4', label: 'Avaliação de satisfação solicitada', isRequired: false },
    { id: '5', label: 'Indicações solicitadas', isRequired: false },
  ],
};

export function JourneyChecklistSheet({ open, onOpenChange }: JourneyChecklistSheetProps) {
  const [checklists, setChecklists] = useState<Record<string, ChecklistItem[]>>(defaultChecklists);
  const [editingItem, setEditingItem] = useState<{ phase: string; id: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newItemPhase, setNewItemPhase] = useState<string | null>(null);
  const [newItemValue, setNewItemValue] = useState("");

  const handleToggleRequired = (phase: string, itemId: string) => {
    setChecklists(prev => ({
      ...prev,
      [phase]: prev[phase].map(item =>
        item.id === itemId ? { ...item, isRequired: !item.isRequired } : item
      ),
    }));
  };

  const handleDeleteItem = (phase: string, itemId: string) => {
    setChecklists(prev => ({
      ...prev,
      [phase]: prev[phase].filter(item => item.id !== itemId),
    }));
    toast.success("Item removido");
  };

  const handleStartEdit = (phase: string, item: ChecklistItem) => {
    setEditingItem({ phase, id: item.id });
    setEditValue(item.label);
  };

  const handleSaveEdit = () => {
    if (!editingItem || !editValue.trim()) return;
    
    setChecklists(prev => ({
      ...prev,
      [editingItem.phase]: prev[editingItem.phase].map(item =>
        item.id === editingItem.id ? { ...item, label: editValue.trim() } : item
      ),
    }));
    setEditingItem(null);
    setEditValue("");
  };

  const handleAddItem = (phase: string) => {
    if (!newItemValue.trim()) return;
    
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      label: newItemValue.trim(),
      isRequired: false,
    };
    
    setChecklists(prev => ({
      ...prev,
      [phase]: [...prev[phase], newItem],
    }));
    setNewItemPhase(null);
    setNewItemValue("");
    toast.success("Item adicionado");
  };

  const getPhaseColor = (phaseId: string) => {
    const phase = journeyPhasesDetailed.find(p => p.id === phaseId);
    return phase?.bgColor || "bg-gray-500";
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[600px] overflow-hidden flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            Checklists da Jornada
          </SheetTitle>
          <SheetDescription>
            Configure os itens obrigatórios para cada fase da jornada do cliente
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6 mt-4">
          <Accordion type="multiple" className="space-y-2" defaultValue={['Novos']}>
            {journeyPhasesDetailed.map((phase) => {
              const items = checklists[phase.id] || [];
              const requiredCount = items.filter(i => i.isRequired).length;
              
              return (
                <AccordionItem
                  key={phase.id}
                  value={phase.id}
                  className="border rounded-lg overflow-hidden"
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={cn("w-3 h-3 rounded-full", phase.bgColor)} />
                      <span className="font-medium">{phase.name}</span>
                      <Badge variant="secondary" className="ml-auto mr-2">
                        {items.length} itens
                      </Badge>
                      {requiredCount > 0 && (
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          {requiredCount} obrigatórios
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-0">
                    <div className="px-4 pb-4 space-y-2">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border bg-muted/30",
                            editingItem?.id === item.id && "ring-2 ring-primary"
                          )}
                        >
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                          
                          {editingItem?.id === item.id ? (
                            <div className="flex-1 flex items-center gap-2">
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="h-8 text-sm"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={handleSaveEdit}
                              >
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setEditingItem(null)}
                              >
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <span className="flex-1 text-sm">{item.label}</span>
                              
                              <div className="flex items-center gap-2">
                                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                                  <Checkbox
                                    checked={item.isRequired}
                                    onCheckedChange={() => handleToggleRequired(phase.id, item.id)}
                                  />
                                  Obrigatório
                                </label>
                                
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleStartEdit(phase.id, item)}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive"
                                  onClick={() => handleDeleteItem(phase.id, item.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}

                      {/* Add new item */}
                      {newItemPhase === phase.id ? (
                        <div className="flex items-center gap-2 p-2">
                          <Input
                            placeholder="Nome do item..."
                            value={newItemValue}
                            onChange={(e) => setNewItemValue(e.target.value)}
                            className="h-8 text-sm"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleAddItem(phase.id)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleAddItem(phase.id)}
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setNewItemPhase(null);
                              setNewItemValue("");
                            }}
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => setNewItemPhase(phase.id)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Item
                        </Button>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </ScrollArea>

        <Separator className="my-4" />
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={() => {
            toast.success("Checklists salvos com sucesso!");
            onOpenChange(false);
          }}>
            Salvar Alterações
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
