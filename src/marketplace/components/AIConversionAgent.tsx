import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, X, ChevronRight, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface Suggestion {
  id: string;
  type: "improvement" | "alert" | "opportunity";
  title: string;
  description: string;
  action?: string;
  actionRoute?: string;
}

interface AIConversionAgentProps {
  suggestions?: Suggestion[];
  className?: string;
}

const defaultSuggestions: Suggestion[] = [
  {
    id: "1",
    type: "improvement",
    title: "Aumente suas avaliações",
    description:
      "Você tem 3 pacientes que concluíram procedimentos esta semana. Que tal enviar uma solicitação de avaliação?",
    action: "Enviar solicitações",
    actionRoute: "/marketplace/reviews",
  },
  {
    id: "2",
    type: "opportunity",
    title: "Leads aguardando contato",
    description:
      "5 novos leads chegaram nas últimas 24h. O tempo médio de resposta ideal é de 2 horas.",
    action: "Ver leads",
    actionRoute: "/marketplace/leads",
  },
  {
    id: "3",
    type: "alert",
    title: "Complete seu perfil",
    description:
      "Perfis completos recebem 40% mais agendamentos. Adicione uma foto e bio para atrair mais pacientes.",
    action: "Completar perfil",
    actionRoute: "/marketplace/professionals",
  },
];

export function AIConversionAgent({
  suggestions = defaultSuggestions,
  className,
}: AIConversionAgentProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [isMinimized, setIsMinimized] = useState(false);

  const visibleSuggestions = suggestions.filter((s) => !dismissedIds.has(s.id));

  if (visibleSuggestions.length === 0) return null;

  const typeConfig = {
    improvement: {
      color: "text-marketplace",
      bgColor: "bg-marketplace/10",
      icon: Sparkles,
    },
    alert: {
      color: "text-marketplace-warning",
      bgColor: "bg-marketplace-warning/10",
      icon: Lightbulb,
    },
    opportunity: {
      color: "text-marketplace-accent",
      bgColor: "bg-marketplace-accent/10",
      icon: Sparkles,
    },
  };

  const currentSuggestion = visibleSuggestions[0];
  const config = typeConfig[currentSuggestion.type];
  const Icon = config.icon;

  if (isMinimized) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "fixed bottom-4 right-4 z-50 shadow-lg border-marketplace",
          className
        )}
        onClick={() => setIsMinimized(false)}
      >
        <Sparkles className="h-4 w-4 text-marketplace mr-2" />
        <span>Dicas do Agente</span>
        <Badge className="ml-2 bg-marketplace text-white">
          {visibleSuggestions.length}
        </Badge>
      </Button>
    );
  }

  return (
    <Card
      className={cn(
        "border-marketplace/30 shadow-md bg-gradient-to-r from-marketplace/5 to-transparent",
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn("p-2 rounded-lg shrink-0", config.bgColor)}>
            <Icon className={cn("h-5 w-5", config.color)} />
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] border-marketplace/30">
                    <Sparkles className="h-3 w-3 mr-1 text-marketplace" />
                    Agente de Conversão
                  </Badge>
                  {visibleSuggestions.length > 1 && (
                    <span className="text-xs text-muted-foreground">
                      1 de {visibleSuggestions.length}
                    </span>
                  )}
                </div>
                <h4 className="font-medium mt-1">{currentSuggestion.title}</h4>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setIsMinimized(true)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() =>
                    setDismissedIds((prev) =>
                      new Set([...prev, currentSuggestion.id])
                    )
                  }
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              {currentSuggestion.description}
            </p>

            {currentSuggestion.action && (
              <Button
                size="sm"
                className="bg-marketplace hover:bg-marketplace/90"
              >
                {currentSuggestion.action}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
