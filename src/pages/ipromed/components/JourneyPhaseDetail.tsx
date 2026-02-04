/**
 * IPROMED - Journey Phase Detail Component
 * Detalhes completos de cada fase da jornada do cliente jurídico
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CheckCircle2,
  Clock,
  Target,
  FileText,
  Users,
  AlertTriangle,
  ArrowRight,
  ListChecks,
  Calendar,
  MessageSquare,
  Lightbulb,
  ClipboardCheck,
  Video,
  Mail,
  Phone,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface PhaseDetail {
  id: string;
  name: string;
  label: string;
  color: string;
  bgColor: string;
  description: string;
  objective: string;
  duration: string;
  deliverables: string[];
  actions: {
    id: string;
    title: string;
    description: string;
    responsible: string;
    channel: 'email' | 'call' | 'meeting' | 'system';
  }[];
  checklist: {
    id: string;
    title: string;
    required: boolean;
  }[];
  tips: string[];
  nextPhase?: string;
}

export const journeyPhasesDetailed: PhaseDetail[] = [
  {
    id: 'Novos',
    name: 'Novos clientes',
    label: 'Novos clientes',
    color: 'text-blue-600',
    bgColor: 'bg-blue-500',
    description: 'Clientes recém-contratados aguardando início do processo de onboarding jurídico.',
    objective: 'Garantir que o cliente compreenda os termos do contrato, os limites da cobertura e saiba que está protegido a partir deste momento.',
    duration: 'Entrada imediata após assinatura',
    deliverables: [
      'Contrato assinado e registrado no sistema',
      'E-mail de boas-vindas enviado',
      'Acesso ao portal do cliente liberado',
      'Documentação de limites contratuais entregue',
    ],
    actions: [
      { id: 'a1', title: 'Confirmar assinatura do contrato', description: 'Verificar se o contrato foi assinado digitalmente e registrar no sistema', responsible: 'Equipe Comercial', channel: 'system' },
      { id: 'a2', title: 'Enviar e-mail de boas-vindas', description: 'Disparar comunicação padrão com informações de acesso e próximos passos', responsible: 'Sistema Automático', channel: 'email' },
      { id: 'a3', title: 'Ligar para confirmação', description: 'Contato telefônico de 5 minutos para confirmar recebimento e tirar dúvidas iniciais', responsible: 'Equipe Jurídica', channel: 'call' },
      { id: 'a4', title: 'Comunicar limites contratuais', description: 'Explicar claramente que fatos anteriores não são cobertos', responsible: 'Equipe Jurídica', channel: 'call' },
    ],
    checklist: [
      { id: 'c1', title: 'Contrato assinado e arquivado', required: true },
      { id: 'c2', title: 'Cliente cadastrado no sistema', required: true },
      { id: 'c3', title: 'E-mail de boas-vindas enviado', required: true },
      { id: 'c4', title: 'Ligação de confirmação realizada', required: true },
      { id: 'c5', title: 'Limites contratuais comunicados', required: true },
      { id: 'c6', title: 'Onboarding agendado', required: false },
    ],
    tips: [
      'Faça o contato de confirmação em até 2 horas após a assinatura',
      'Documente qualquer dúvida do cliente para tratamento no onboarding',
      'Se o cliente mencionar processos anteriores, registre para análise',
    ],
    nextPhase: 'Agendado',
  },
  {
    id: 'Agendado',
    name: 'Onboarding agendado',
    label: 'Onboarding agendado',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-500',
    description: 'Clientes com reunião de onboarding já agendada, aguardando realização.',
    objective: 'Garantir que a reunião de onboarding seja realizada e que o cliente esteja preparado com informações básicas.',
    duration: 'Até realização do onboarding',
    deliverables: [
      'Reunião de onboarding agendada',
      'Convite de calendário enviado',
      'Questionário pré-onboarding enviado',
      'Materiais preparatórios compartilhados',
    ],
    actions: [
      { id: 'a1', title: 'Confirmar agendamento', description: 'Ligar ou enviar WhatsApp para confirmar horário', responsible: 'Equipe Jurídica', channel: 'call' },
      { id: 'a2', title: 'Enviar convite de calendário', description: 'Criar evento com link de videoconferência', responsible: 'Sistema', channel: 'email' },
      { id: 'a3', title: 'Enviar questionário pré-onboarding', description: 'Formulário com perguntas sobre atuação profissional', responsible: 'Sistema Automático', channel: 'email' },
      { id: 'a4', title: 'Compartilhar materiais preparatórios', description: 'Enviar PDF com tópicos que serão abordados', responsible: 'Equipe Jurídica', channel: 'email' },
    ],
    checklist: [
      { id: 'c1', title: 'Data e horário confirmados com o cliente', required: true },
      { id: 'c2', title: 'Convite de calendário enviado', required: true },
      { id: 'c3', title: 'Questionário pré-onboarding enviado', required: true },
      { id: 'c4', title: 'Link de videoconferência gerado', required: true },
      { id: 'c5', title: 'Lembrete 24h antes configurado', required: false },
    ],
    tips: [
      'Confirme 24h antes da reunião',
      'Tenha backup de horário caso precise reagendar',
      'Se o cliente não responder em 24h, tente outro canal',
    ],
    nextPhase: 'Andamento',
  },
  {
    id: 'Andamento',
    name: 'Pacote Jurídico em andamento',
    label: 'Pacote Jurídico em andamento',
    color: 'text-purple-600',
    bgColor: 'bg-purple-500',
    description: 'Elaboração ativa do pacote jurídico preventivo personalizado do cliente.',
    objective: 'Desenvolver toda a documentação jurídica preventiva personalizada para a atuação do médico.',
    duration: 'Até conclusão do pacote jurídico',
    deliverables: [
      'Dossiê jurídico consolidado',
      'Contrato de prestação de serviços médicos',
      'Termo de consentimento livre e esclarecido',
      'Política de cancelamento e reagendamento',
      'Formulários de anamnese específicos',
      'Análise de publicidade médica',
    ],
    actions: [
      { id: 'a1', title: 'Consolidar informações do onboarding', description: 'Reunir todos os dados coletados em documento estruturado', responsible: 'Equipe Jurídica', channel: 'system' },
      { id: 'a2', title: 'Classificar perfil de risco', description: 'Definir se cliente é baixo, médio ou alto risco', responsible: 'Advogado Responsável', channel: 'system' },
      { id: 'a3', title: 'Elaborar documentos jurídicos', description: 'Criar kit documental personalizado baseado na especialidade', responsible: 'Equipe Jurídica', channel: 'system' },
      { id: 'a4', title: 'Analisar publicidade médica', description: 'Revisar redes sociais e materiais de marketing', responsible: 'Equipe Jurídica', channel: 'system' },
      { id: 'a5', title: 'Revisar adequação jurídica', description: 'Verificar conformidade com CFM e legislação vigente', responsible: 'Advogado Responsável', channel: 'system' },
    ],
    checklist: [
      { id: 'c1', title: 'Dossiê completo criado no sistema', required: true },
      { id: 'c2', title: 'Perfil de risco classificado', required: true },
      { id: 'c3', title: 'Contrato de serviços elaborado', required: true },
      { id: 'c4', title: 'TCLE elaborado', required: true },
      { id: 'c5', title: 'Formulários de anamnese prontos', required: true },
      { id: 'c6', title: 'Análise de publicidade concluída', required: true },
      { id: 'c7', title: 'Documentos revisados juridicamente', required: true },
    ],
    tips: [
      'Personalize os documentos com nome e CRM do médico',
      'Clientes de alto risco devem ter acompanhamento mais próximo',
      'Use templates padrão para agilizar a elaboração',
    ],
    nextPhase: 'Apresentacao',
  },
  {
    id: 'Apresentacao',
    name: 'Reunião de apresentação do Pacote Jurídico',
    label: 'Reunião de apresentação do Pacote Jurídico',
    color: 'text-amber-600',
    bgColor: 'bg-amber-500',
    description: 'Reunião final para apresentação e entrega do pacote jurídico completo ao cliente.',
    objective: 'Entregar kit documental completo, apresentar diagnóstico jurídico e orientar sobre uso correto de cada documento.',
    duration: 'Reunião de 60-90 minutos',
    deliverables: [
      'Apresentação do diagnóstico jurídico',
      'Entrega do pacote documental completo',
      'Orientação sobre uso de cada documento',
      'Relatório de adequação de publicidade',
      'Guia de boas práticas',
    ],
    actions: [
      { id: 'a1', title: 'Agendar reunião de apresentação', description: 'Definir data e horário com o cliente', responsible: 'Equipe Jurídica', channel: 'call' },
      { id: 'a2', title: 'Preparar apresentação', description: 'Montar slides ou documento de apresentação', responsible: 'Advogado Responsável', channel: 'system' },
      { id: 'a3', title: 'Realizar reunião de apresentação', description: 'Conduzir reunião apresentando todos os entregáveis', responsible: 'Advogado Responsável', channel: 'meeting' },
      { id: 'a4', title: 'Orientar sobre uso dos documentos', description: 'Explicar quando e como usar cada documento', responsible: 'Advogado Responsável', channel: 'meeting' },
      { id: 'a5', title: 'Coletar feedback do cliente', description: 'Verificar satisfação e dúvidas pendentes', responsible: 'Advogado Responsável', channel: 'meeting' },
    ],
    checklist: [
      { id: 'c1', title: 'Reunião agendada', required: true },
      { id: 'c2', title: 'Material de apresentação preparado', required: true },
      { id: 'c3', title: 'Reunião realizada', required: true },
      { id: 'c4', title: 'Pacote entregue ao cliente', required: true },
      { id: 'c5', title: 'Orientação de uso realizada', required: true },
      { id: 'c6', title: 'Orientação de guarda documental', required: true },
      { id: 'c7', title: 'Ajustes prioritários definidos', required: true },
      { id: 'c8', title: 'NPS coletado', required: false },
    ],
    tips: [
      'Oriente sobre a importância da assinatura do paciente ANTES do procedimento',
      'Use linguagem didática, muitos médicos não conhecem as restrições',
      'Ofereça suporte para implementação dos ajustes de publicidade',
    ],
    nextPhase: 'Continuo',
  },
  {
    id: 'Continuo',
    name: 'Acompanhamento contínuo',
    label: 'Acompanhamento contínuo',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500',
    description: 'Fase contínua de suporte, consultoria e acompanhamento preventivo do cliente.',
    objective: 'Manter relacionamento ativo, prestar consultoria quando solicitado e revisar periodicamente o plano preventivo.',
    duration: 'Contínuo (durante vigência do contrato)',
    deliverables: [
      'Atendimento ilimitado por WhatsApp/telefone',
      'Revisões periódicas do plano (trimestral)',
      'Atualizações sobre mudanças legislativas',
      'Suporte para crescimento profissional',
    ],
    actions: [
      { id: 'a1', title: 'Manter canal aberto', description: 'Responder consultas em até 24h úteis', responsible: 'Equipe Jurídica', channel: 'call' },
      { id: 'a2', title: 'Revisão trimestral', description: 'Agendar call de 30min a cada 3 meses', responsible: 'Advogado Responsável', channel: 'meeting' },
      { id: 'a3', title: 'Enviar atualizações', description: 'Informar sobre mudanças relevantes na legislação', responsible: 'Equipe Jurídica', channel: 'email' },
      { id: 'a4', title: 'Suporte ao crescimento', description: 'Auxiliar em novos projetos (nova clínica, sócio, etc)', responsible: 'Advogado Responsável', channel: 'meeting' },
    ],
    checklist: [
      { id: 'c1', title: 'Primeira revisão trimestral agendada', required: true },
      { id: 'c2', title: 'Cliente sabe como acionar suporte', required: true },
      { id: 'c3', title: 'NPS coletado', required: false },
    ],
    tips: [
      'Mantenha contato mesmo que o cliente não acione',
      'Aproveite revisões trimestrais para identificar novas necessidades',
      'Clientes satisfeitos indicam novos clientes',
    ],
  },
];

interface JourneyPhaseDetailProps {
  phase: PhaseDetail | null;
  open: boolean;
  onClose: () => void;
  clientName?: string;
}

export default function JourneyPhaseDetail({ phase, open, onClose, clientName }: JourneyPhaseDetailProps) {
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  if (!phase) return null;

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'call': return <Phone className="h-4 w-4" />;
      case 'meeting': return <Video className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getChannelLabel = (channel: string) => {
    switch (channel) {
      case 'email': return 'E-mail';
      case 'call': return 'Ligação/WhatsApp';
      case 'meeting': return 'Reunião';
      default: return 'Sistema';
    }
  };

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const checklistProgress = (checkedItems.length / phase.checklist.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className={cn("p-6 text-white", phase.bgColor)}>
          <div className="flex items-center justify-between">
            <div>
              <Badge className="bg-white/20 text-white mb-2">
                {phase.id}
              </Badge>
              <DialogTitle className="text-2xl text-white">
                {phase.label}
              </DialogTitle>
              <DialogDescription className="text-white/80 mt-2">
                {clientName ? `Cliente: ${clientName} • ` : ''}{phase.duration}
              </DialogDescription>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="p-6 space-y-6">
            {/* Objetivo e Descrição */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-none bg-muted/30">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className={cn("p-2 rounded-lg", phase.bgColor.replace('bg-', 'bg-').concat('/20'))}>
                      <Target className={cn("h-5 w-5", phase.color)} />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Objetivo</h4>
                      <p className="text-sm text-muted-foreground">{phase.objective}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-none bg-muted/30">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                      <Lightbulb className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Descrição</h4>
                      <p className="text-sm text-muted-foreground">{phase.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Entregáveis */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Entregáveis desta fase
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {phase.deliverables.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Ações e Fluxo */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  Fluxo de Ações
                </CardTitle>
                <CardDescription>O que precisa ser feito nesta fase</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {phase.actions.map((action, i) => (
                    <div key={action.id} className="flex items-start gap-4 p-3 rounded-lg bg-muted/30">
                      <div className="flex flex-col items-center">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold", phase.bgColor)}>
                          {i + 1}
                        </div>
                        {i < phase.actions.length - 1 && (
                          <div className="w-0.5 h-8 bg-border mt-2" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium">{action.title}</h5>
                          <Badge variant="outline" className="flex items-center gap-1">
                            {getChannelIcon(action.channel)}
                            {getChannelLabel(action.channel)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <Users className="h-3 w-3 inline mr-1" />
                          {action.responsible}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Checklist da Reunião/Fase */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4 text-primary" />
                    Checklist da Fase
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Progress value={checklistProgress} className="w-24 h-2" />
                    <span className="text-sm text-muted-foreground">
                      {checkedItems.length}/{phase.checklist.length}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {phase.checklist.map((item) => (
                    <div 
                      key={item.id} 
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                        checkedItems.includes(item.id) 
                          ? "bg-emerald-50 dark:bg-emerald-950/30" 
                          : "hover:bg-muted/50"
                      )}
                      onClick={() => toggleCheck(item.id)}
                    >
                      <Checkbox 
                        checked={checkedItems.includes(item.id)}
                        onCheckedChange={() => toggleCheck(item.id)}
                      />
                      <span className={cn(
                        "text-sm flex-1",
                        checkedItems.includes(item.id) && "line-through text-muted-foreground"
                      )}>
                        {item.title}
                      </span>
                      {item.required && (
                        <Badge variant="secondary" className="text-[10px]">
                          Obrigatório
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Dicas */}
            <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <Lightbulb className="h-4 w-4" />
                  Dicas Importantes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {phase.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300">
                      <span className="text-amber-500">💡</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Próxima fase */}
            {phase.nextPhase && (
              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <span className="text-sm text-muted-foreground">Próxima fase:</span>
                <Badge className={journeyPhasesDetailed.find(p => p.id === phase.nextPhase)?.bgColor + " text-white"}>
                  {phase.nextPhase} - {journeyPhasesDetailed.find(p => p.id === phase.nextPhase)?.name}
                </Badge>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
