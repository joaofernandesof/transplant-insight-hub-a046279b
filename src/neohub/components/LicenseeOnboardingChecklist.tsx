import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ChevronDown, 
  ChevronRight, 
  CheckCircle2, 
  Circle,
  Users,
  Plus,
  MessageSquare,
  Play,
  Pause,
  Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  useLicenseeOnboarding, 
  useOnboardingItems,
  OnboardingChecklist,
  OnboardingItem
} from "@/neohub/hooks/useLicenseeOnboarding";

interface OnboardingItemRowProps {
  item: OnboardingItem;
  onToggle: (itemId: string, isCompleted: boolean) => void;
  onNotesChange: (itemId: string, notes: string) => void;
}

function OnboardingItemRow({ item, onToggle, onNotesChange }: OnboardingItemRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localNotes, setLocalNotes] = useState(item.notes || "");

  return (
    <div className={cn(
      "border rounded-lg p-3 transition-all",
      item.is_completed ? "bg-primary/10 border-primary/30" : "bg-card"
    )}>
      <div className="flex items-start gap-3">
        <Checkbox
          checked={item.is_completed}
          onCheckedChange={(checked) => onToggle(item.id, !!checked)}
          className="mt-1"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              "font-medium",
              item.is_completed && "line-through text-muted-foreground"
            )}>
              {item.title}
            </span>
            <Badge variant="outline" className="text-[10px]">
              {item.order_index}/31
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground mt-0.5">
            {item.description}
          </p>
          
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="mt-2 h-7 px-2 text-xs">
                {isExpanded ? <ChevronDown className="h-3 w-3 mr-1" /> : <ChevronRight className="h-3 w-3 mr-1" />}
                {isExpanded ? "Ocultar detalhes" : "Ver detalhes"}
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-3 space-y-3">
              <div className="bg-muted/50 rounded-md p-3">
                <p className="text-sm font-medium mb-1">💬 O que falar:</p>
                <p className="text-sm text-muted-foreground italic">
                  {item.guidance}
                </p>
              </div>
              
              {item.subtopics && item.subtopics.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">📌 Subtópicos:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {item.subtopics.map((topic, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
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
                  placeholder="Adicione observações sobre este tópico..."
                  className="text-sm min-h-[60px]"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  );
}

interface OnboardingDetailViewProps {
  checklist: OnboardingChecklist;
  onClose: () => void;
}

function OnboardingDetailView({ checklist, onClose }: OnboardingDetailViewProps) {
  const { items, stats, toggleItem, updateItemNotes, updateChecklistStatus } = useOnboardingItems(checklist.id);
  const [activePhase, setActivePhase] = useState<string | null>(null);

  // Agrupar itens por fase
  const phases = items ? [...new Set(items.map(i => i.phase))] : [];
  const itemsByPhase = items?.reduce((acc, item) => {
    if (!acc[item.phase]) acc[item.phase] = [];
    acc[item.phase].push(item);
    return acc;
  }, {} as Record<string, OnboardingItem[]>) || {};

  const getPhaseIcon = (phase: string) => {
    const icons: Record<string, string> = {
      "Abertura": "🎯",
      "Níveis": "📈",
      "Ecossistema": "🧱",
      "Marca": "🏷️",
      "Método": "🧠",
      "Treinamento": "🎓",
      "Suporte": "🤝",
      "Marketing": "📣",
      "Sistemas": "⚙️",
      "Jurídico": "⚖️",
      "Produtos": "🧴",
      "Comunidade": "🌐",
      "Expectativas": "🛣️",
      "Presencial": "✈️",
      "Encerramento": "✅"
    };
    return icons[phase] || "📋";
  };

  return (
    <div className="space-y-4">
      {/* Header com status e progresso */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{checklist.licensee?.full_name}</h3>
          <p className="text-sm text-muted-foreground">{checklist.licensee?.email}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select 
            value={checklist.status} 
            onValueChange={(value) => updateChecklistStatus.mutate({ status: value })}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pendente">
                <div className="flex items-center gap-2">
                  <Circle className="h-3 w-3 text-muted-foreground" />
                  Pendente
                </div>
              </SelectItem>
              <SelectItem value="em_andamento">
                <div className="flex items-center gap-2">
                  <Play className="h-3 w-3 text-blue-500" />
                  Em Andamento
                </div>
              </SelectItem>
              <SelectItem value="concluido">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  Concluído
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Progresso geral */}
      {stats && (
        <Card>
          <CardContent className="pt-4">
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
                <span className="text-sm font-medium">Onboarding completo!</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lista de fases */}
      <ScrollArea className="h-[500px] pr-4">
        <div className="space-y-3">
          {phases.map((phase) => {
            const phaseStats = stats?.byPhase[phase];
            const isComplete = phaseStats?.completed === phaseStats?.total;
            const isOpen = activePhase === phase;
            
            return (
              <Collapsible key={phase} open={isOpen} onOpenChange={() => setActivePhase(isOpen ? null : phase)}>
                <CollapsibleTrigger asChild>
                  <Card className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    isComplete && "border-primary/50"
                  )}>
                    <CardHeader className="py-3 px-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getPhaseIcon(phase)}</span>
                          <CardTitle className="text-base">{phase}</CardTitle>
                          {isComplete && (
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="text-xs">
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
                  {itemsByPhase[phase]?.map((item) => (
                    <OnboardingItemRow
                      key={item.id}
                      item={item}
                      onToggle={(id, checked) => toggleItem.mutate({ itemId: id, isCompleted: checked })}
                      onNotesChange={(id, notes) => updateItemNotes.mutate({ itemId: id, notes })}
                    />
                  ))}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

export function LicenseeOnboardingChecklist() {
  const { checklists, licenseesWithoutOnboarding, isLoading, createOnboarding } = useLicenseeOnboarding();
  const [selectedChecklist, setSelectedChecklist] = useState<OnboardingChecklist | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pendente":
        return <Badge variant="secondary">Pendente</Badge>;
      case "em_andamento":
        return <Badge variant="default">Em Andamento</Badge>;
      case "concluido":
        return <Badge className="bg-primary">Concluído</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Onboarding de Licenciados
              </CardTitle>
              <CardDescription>
                Gerencie o processo de integração dos novos licenciados
              </CardDescription>
            </div>
            
            <Button onClick={() => setShowNewDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Novo Onboarding
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {checklists && checklists.length > 0 ? (
            <div className="space-y-2">
              {checklists.map((checklist) => (
                <div
                  key={checklist.id}
                  onClick={() => setSelectedChecklist(checklist)}
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{checklist.licensee?.full_name}</p>
                    <p className="text-sm text-muted-foreground">{checklist.licensee?.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(checklist.status)}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum onboarding iniciado</p>
              <p className="text-sm">Clique em "Novo Onboarding" para começar</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para detalhes do onboarding */}
      <Dialog open={!!selectedChecklist} onOpenChange={() => setSelectedChecklist(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Checklist de Onboarding</DialogTitle>
            <DialogDescription>
              31 etapas para integrar o novo licenciado
            </DialogDescription>
          </DialogHeader>
          
          {selectedChecklist && (
            <OnboardingDetailView 
              checklist={selectedChecklist} 
              onClose={() => setSelectedChecklist(null)} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para criar novo onboarding */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Iniciar Onboarding</DialogTitle>
            <DialogDescription>
              Selecione o licenciado para iniciar o processo de integração
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {licenseesWithoutOnboarding && licenseesWithoutOnboarding.length > 0 ? (
              licenseesWithoutOnboarding.map((licensee) => (
                <div
                  key={licensee.id}
                  onClick={() => {
                    createOnboarding.mutate(licensee.id);
                    setShowNewDialog(false);
                  }}
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{licensee.full_name}</p>
                    <p className="text-sm text-muted-foreground">{licensee.email}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Iniciar
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Todos os licenciados já possuem onboarding</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
