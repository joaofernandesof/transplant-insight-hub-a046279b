/**
 * IPROMED - Client Journey Tracker Component
 * Tracks individual client progress through the 17-step legal journey
 */

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle2,
  Circle,
  AlertTriangle,
  CalendarClock,
} from "lucide-react";

interface JourneyStep {
  code: number;
  title: string;
  moment: string;
  subSteps: { code: string; title: string; completed: boolean }[];
}

interface ClientJourneyTrackerProps {
  clientId: string;
  clientName: string;
  startDate: string;
  journeyProgress?: JourneyStep[];
  onStepComplete?: (stepCode: string, completed: boolean) => void;
}

// Default journey steps based on IPROMED structure
const defaultJourneySteps: JourneyStep[] = [
  {
    code: 1,
    title: "Ativação inicial do contrato",
    moment: "D0",
    subSteps: [
      { code: "1.1", title: "Confirmação formal de início da cobertura", completed: false },
      { code: "1.2", title: "Registro do contrato no sistema", completed: false },
      { code: "1.3", title: "Vinculação ao plano preventivo", completed: false },
    ],
  },
  {
    code: 2,
    title: "Comunicação de limites contratuais",
    moment: "D0",
    subSteps: [
      { code: "2.1", title: "Informação sobre fatos futuros", completed: false },
      { code: "2.2", title: "Esclarecimento sobre processos anteriores", completed: false },
      { code: "2.3", title: "Registro do alinhamento", completed: false },
    ],
  },
  {
    code: 3,
    title: "Agendamento do onboarding jurídico",
    moment: "D+1",
    subSteps: [
      { code: "3.1", title: "Contato inicial com o médico", completed: false },
      { code: "3.2", title: "Definição de data e horário", completed: false },
      { code: "3.3", title: "Envio de orientações pré-reunião", completed: false },
    ],
  },
  {
    code: 4,
    title: "Reunião de onboarding jurídico",
    moment: "D+3",
    subSteps: [
      { code: "4.1", title: "Apresentação do plano preventivo", completed: false },
      { code: "4.2", title: "Alinhamento de expectativas", completed: false },
      { code: "4.3", title: "Explicação dos canais de atendimento", completed: false },
    ],
  },
  {
    code: 5,
    title: "Mapeamento da atuação profissional",
    moment: "D+3",
    subSteps: [
      { code: "5.1", title: "Identificação da especialidade médica", completed: false },
      { code: "5.2", title: "Levantamento de procedimentos", completed: false },
      { code: "5.3", title: "Análise da rotina profissional", completed: false },
      { code: "5.4", title: "Verificação de locais de atuação", completed: false },
    ],
  },
  {
    code: 6,
    title: "Mapeamento de riscos jurídicos",
    moment: "D+3",
    subSteps: [
      { code: "6.1", title: "Riscos éticos perante o CRM", completed: false },
      { code: "6.2", title: "Riscos cíveis e consumeristas", completed: false },
      { code: "6.3", title: "Riscos criminais", completed: false },
    ],
  },
  {
    code: 7,
    title: "Levantamento de passivos jurídicos",
    moment: "D+3",
    subSteps: [
      { code: "7.1", title: "Processos judiciais em andamento", completed: false },
      { code: "7.2", title: "Sindicâncias ou processos ético-profissionais", completed: false },
      { code: "7.3", title: "Notificações administrativas", completed: false },
    ],
  },
  {
    code: 8,
    title: "Tratamento de demandas anteriores",
    moment: "D+3",
    subSteps: [
      { code: "8.1", title: "Reforço da não cobertura", completed: false },
      { code: "8.2", title: "Oferta de honorários diferenciados", completed: false },
      { code: "8.3", title: "Definição de escopo específico", completed: false },
    ],
  },
  {
    code: 9,
    title: "Abertura de dossiê jurídico",
    moment: "D+7",
    subSteps: [
      { code: "9.1", title: "Consolidação das informações", completed: false },
      { code: "9.2", title: "Classificação do perfil de risco", completed: false },
      { code: "9.3", title: "Registro interno", completed: false },
    ],
  },
  {
    code: 10,
    title: "Diagnóstico jurídico preventivo",
    moment: "D+7",
    subSteps: [
      { code: "10.1", title: "Consolidação dos riscos", completed: false },
      { code: "10.2", title: "Definição de prioridades", completed: false },
      { code: "10.3", title: "Recomendações iniciais", completed: false },
    ],
  },
  {
    code: 11,
    title: "Plano jurídico preventivo",
    moment: "D+7",
    subSteps: [
      { code: "11.1", title: "Frentes de atuação", completed: false },
      { code: "11.2", title: "Ações de curto prazo", completed: false },
      { code: "11.3", title: "Ações de médio prazo", completed: false },
    ],
  },
  {
    code: 12,
    title: "Consultoria preventiva contínua",
    moment: "Contínuo",
    subSteps: [
      { code: "12.1", title: "Atendimento ilimitado", completed: false },
      { code: "12.2", title: "Orientações estratégicas", completed: false },
      { code: "12.3", title: "Atualizações periódicas", completed: false },
    ],
  },
  {
    code: 13,
    title: "Documentação jurídica preventiva",
    moment: "D+15",
    subSteps: [
      { code: "13.1", title: "Elaboração de políticas e formulários", completed: false },
      { code: "13.2", title: "Elaboração de contratos e termos", completed: false },
      { code: "13.3", title: "Personalização por especialidade", completed: false },
    ],
  },
  {
    code: 14,
    title: "Entrega e orientação documental",
    moment: "D+15",
    subSteps: [
      { code: "14.1", title: "Entrega organizada", completed: false },
      { code: "14.2", title: "Explicação de uso", completed: false },
      { code: "14.3", title: "Orientação de guarda", completed: false },
    ],
  },
  {
    code: 15,
    title: "Revisão de publicidade médica",
    moment: "D+30",
    subSteps: [
      { code: "15.1", title: "Análise de materiais", completed: false },
      { code: "15.2", title: "Identificação de riscos", completed: false },
      { code: "15.3", title: "Recomendações de adequação", completed: false },
    ],
  },
  {
    code: 16,
    title: "Compliance e atuação ética",
    moment: "D+30",
    subSteps: [
      { code: "16.1", title: "Avaliação de conformidade", completed: false },
      { code: "16.2", title: "Orientações preventivas", completed: false },
      { code: "16.3", title: "Ajustes estratégicos", completed: false },
    ],
  },
  {
    code: 17,
    title: "Acompanhamento preventivo",
    moment: "Contínuo",
    subSteps: [
      { code: "17.1", title: "Revisões periódicas", completed: false },
      { code: "17.2", title: "Atualização do plano", completed: false },
      { code: "17.3", title: "Suporte ao crescimento", completed: false },
    ],
  },
];

export default function ClientJourneyTracker({
  clientId,
  clientName,
  startDate,
  journeyProgress = defaultJourneySteps,
  onStepComplete,
}: ClientJourneyTrackerProps) {
  const [expandedSteps, setExpandedSteps] = useState<number[]>([1, 2, 3]);
  const [steps, setSteps] = useState<JourneyStep[]>(journeyProgress);

  const toggleStep = (code: number) => {
    setExpandedSteps(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleSubStepToggle = (stepCode: number, subStepCode: string) => {
    setSteps(prev =>
      prev.map(step =>
        step.code === stepCode
          ? {
              ...step,
              subSteps: step.subSteps.map(sub =>
                sub.code === subStepCode ? { ...sub, completed: !sub.completed } : sub
              ),
            }
          : step
      )
    );
    const subStep = steps.find(s => s.code === stepCode)?.subSteps.find(sub => sub.code === subStepCode);
    onStepComplete?.(subStepCode, !subStep?.completed);
  };

  const calculateProgress = () => {
    const totalSubSteps = steps.reduce((acc, step) => acc + step.subSteps.length, 0);
    const completedSubSteps = steps.reduce(
      (acc, step) => acc + step.subSteps.filter(sub => sub.completed).length,
      0
    );
    return Math.round((completedSubSteps / totalSubSteps) * 100);
  };

  const getStepStatus = (step: JourneyStep) => {
    const completed = step.subSteps.filter(s => s.completed).length;
    const total = step.subSteps.length;
    if (completed === total) return "completed";
    if (completed > 0) return "in-progress";
    return "pending";
  };

  const getDueDate = (moment: string, startDate: string) => {
    const start = new Date(startDate);
    if (moment === "D0") return start;
    if (moment === "Contínuo") return null;
    const days = parseInt(moment.replace("D+", ""));
    const dueDate = new Date(start);
    dueDate.setDate(dueDate.getDate() + days);
    return dueDate;
  };

  const isOverdue = (moment: string, startDate: string, status: string) => {
    if (status === "completed" || moment === "Contínuo") return false;
    const dueDate = getDueDate(moment, startDate);
    if (!dueDate) return false;
    return new Date() > dueDate;
  };

  const progress = calculateProgress();

  const getMomentColor = (moment: string) => {
    switch (moment) {
      case "D0": return "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300";
      case "D+1": return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300";
      case "D+3": return "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300";
      case "D+7": return "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300";
      case "D+15": return "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300";
      case "D+30": return "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300";
      case "Contínuo": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Jornada de {clientName}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Início: {new Date(startDate).toLocaleDateString("pt-BR")}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{progress}%</div>
            <p className="text-xs text-muted-foreground">concluído</p>
          </div>
        </div>
        <Progress value={progress} className="h-2 mt-2" />
      </CardHeader>
      <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
        {steps.map(step => {
          const status = getStepStatus(step);
          const overdue = isOverdue(step.moment, startDate, status);
          const completedCount = step.subSteps.filter(s => s.completed).length;

          return (
            <Collapsible
              key={step.code}
              open={expandedSteps.includes(step.code)}
              onOpenChange={() => toggleStep(step.code)}
            >
              <CollapsibleTrigger asChild>
                <div
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    status === "completed"
                      ? "bg-emerald-50 dark:bg-emerald-950/30"
                      : overdue
                      ? "bg-rose-50 dark:bg-rose-950/30"
                      : "bg-muted/30 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex-shrink-0">
                    {status === "completed" ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : overdue ? (
                      <AlertTriangle className="h-5 w-5 text-rose-600" />
                    ) : status === "in-progress" ? (
                      <Clock className="h-5 w-5 text-amber-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {step.code.toString().padStart(2, "0")}
                      </Badge>
                      <span className="font-medium text-sm truncate">{step.title}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`text-xs ${getMomentColor(step.moment)}`}>
                        <CalendarClock className="h-3 w-3 mr-1" />
                        {step.moment}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {completedCount}/{step.subSteps.length}
                      </span>
                    </div>
                  </div>
                  {expandedSteps.includes(step.code) ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="ml-8 mt-2 space-y-2">
                  {step.subSteps.map(subStep => (
                    <div
                      key={subStep.code}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/30"
                    >
                      <Checkbox
                        checked={subStep.completed}
                        onCheckedChange={() => handleSubStepToggle(step.code, subStep.code)}
                      />
                      <Badge variant="secondary" className="font-mono text-xs">
                        {subStep.code}
                      </Badge>
                      <span
                        className={`text-sm ${
                          subStep.completed ? "text-muted-foreground line-through" : ""
                        }`}
                      >
                        {subStep.title}
                      </span>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
}
