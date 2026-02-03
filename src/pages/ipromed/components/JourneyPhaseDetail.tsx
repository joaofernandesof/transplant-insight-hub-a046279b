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
    id: 'D0',
    name: 'Ativação',
    label: 'Ativação do Contrato',
    color: 'text-blue-600',
    bgColor: 'bg-blue-500',
    description: 'Momento inicial onde o contrato é formalizado e o cliente recebe a confirmação de início da cobertura jurídica.',
    objective: 'Garantir que o cliente compreenda os termos do contrato, os limites da cobertura e saiba que está protegido a partir deste momento.',
    duration: 'Dia 0 (mesmo dia da assinatura)',
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
    nextPhase: 'D+1',
  },
  {
    id: 'D+1',
    name: 'Agendamento',
    label: 'Agendamento do Onboarding',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-500',
    description: 'Fase de preparação onde agendamos a reunião de onboarding e preparamos o cliente para a imersão jurídica.',
    objective: 'Garantir que a reunião de onboarding seja agendada e que o cliente esteja preparado com informações básicas.',
    duration: 'D+1 (até 24 horas após ativação)',
    deliverables: [
      'Reunião de onboarding agendada',
      'Convite de calendário enviado',
      'Questionário pré-onboarding enviado',
      'Materiais preparatórios compartilhados',
    ],
    actions: [
      { id: 'a1', title: 'Entrar em contato para agendar', description: 'Ligar ou enviar WhatsApp para definir melhor horário', responsible: 'Equipe Jurídica', channel: 'call' },
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
      'Ofereça pelo menos 3 opções de horário',
      'Prefira agendamentos entre D+3 e D+5 para dar tempo de preparação',
      'Se o cliente não responder em 24h, tente outro canal',
    ],
    nextPhase: 'D+3',
  },
  {
    id: 'D+3',
    name: 'Onboarding',
    label: 'Reunião de Onboarding Jurídico',
    color: 'text-purple-600',
    bgColor: 'bg-purple-500',
    description: 'Reunião principal onde conhecemos profundamente o cliente, sua atuação e mapeamos todos os riscos jurídicos.',
    objective: 'Realizar imersão completa na realidade profissional do cliente, identificar riscos e passivos, e definir estratégia preventiva.',
    duration: 'D+3 a D+5 (reunião de 60-90 minutos)',
    deliverables: [
      'Mapeamento da atuação profissional completo',
      'Mapeamento de riscos jurídicos identificados',
      'Levantamento de passivos judiciais existentes',
      'Ata de reunião com principais pontos',
      'Próximos passos definidos',
    ],
    actions: [
      { id: 'a1', title: 'Realizar reunião de onboarding', description: 'Conduzir reunião seguindo roteiro padrão', responsible: 'Advogado Responsável', channel: 'meeting' },
      { id: 'a2', title: 'Mapear atuação profissional', description: 'Identificar especialidade, procedimentos, locais de atuação', responsible: 'Advogado Responsável', channel: 'meeting' },
      { id: 'a3', title: 'Mapear riscos jurídicos', description: 'Analisar riscos éticos, cíveis e criminais potenciais', responsible: 'Advogado Responsável', channel: 'meeting' },
      { id: 'a4', title: 'Levantar passivos existentes', description: 'Verificar processos em andamento e notificações', responsible: 'Advogado Responsável', channel: 'meeting' },
      { id: 'a5', title: 'Enviar ata de reunião', description: 'Documentar principais pontos e enviar ao cliente', responsible: 'Equipe Jurídica', channel: 'email' },
    ],
    checklist: [
      { id: 'c1', title: 'Questionário pré-onboarding analisado', required: true },
      { id: 'c2', title: 'Reunião realizada no horário', required: true },
      { id: 'c3', title: 'Especialidade médica identificada', required: true },
      { id: 'c4', title: 'Procedimentos realizados mapeados', required: true },
      { id: 'c5', title: 'Locais de atuação listados', required: true },
      { id: 'c6', title: 'Riscos éticos (CRM) avaliados', required: true },
      { id: 'c7', title: 'Riscos cíveis avaliados', required: true },
      { id: 'c8', title: 'Riscos criminais avaliados', required: true },
      { id: 'c9', title: 'Processos anteriores levantados', required: true },
      { id: 'c10', title: 'Sindicâncias/PEPs verificados', required: true },
      { id: 'c11', title: 'Ata de reunião enviada', required: true },
    ],
    tips: [
      'Grave a reunião (com autorização) para consulta posterior',
      'Use o roteiro padrão mas adapte ao perfil do médico',
      'Preste atenção especial em cirurgiões plásticos e obstetras (alto risco)',
      'Se identificar processo anterior não coberto, já apresente opção de honorários diferenciados',
    ],
    nextPhase: 'D+7',
  },
  {
    id: 'D+7',
    name: 'Dossiê',
    label: 'Abertura do Dossiê Jurídico',
    color: 'text-teal-600',
    bgColor: 'bg-teal-500',
    description: 'Consolidação de todas as informações coletadas e elaboração do diagnóstico jurídico preventivo personalizado.',
    objective: 'Criar dossiê completo do cliente com classificação de risco e plano jurídico preventivo estruturado.',
    duration: 'D+7 (até 7 dias após onboarding)',
    deliverables: [
      'Dossiê jurídico consolidado',
      'Classificação de perfil de risco',
      'Diagnóstico jurídico preventivo',
      'Plano jurídico preventivo personalizado',
    ],
    actions: [
      { id: 'a1', title: 'Consolidar informações', description: 'Reunir todos os dados do onboarding em documento estruturado', responsible: 'Equipe Jurídica', channel: 'system' },
      { id: 'a2', title: 'Classificar perfil de risco', description: 'Definir se cliente é baixo, médio ou alto risco', responsible: 'Advogado Responsável', channel: 'system' },
      { id: 'a3', title: 'Elaborar diagnóstico preventivo', description: 'Documento com riscos prioritários e recomendações', responsible: 'Advogado Responsável', channel: 'system' },
      { id: 'a4', title: 'Criar plano preventivo', description: 'Definir ações de curto e médio prazo', responsible: 'Advogado Responsável', channel: 'system' },
      { id: 'a5', title: 'Apresentar ao cliente', description: 'Agendar call de 30min para apresentar diagnóstico', responsible: 'Advogado Responsável', channel: 'meeting' },
    ],
    checklist: [
      { id: 'c1', title: 'Dossiê completo criado no sistema', required: true },
      { id: 'c2', title: 'Perfil de risco classificado', required: true },
      { id: 'c3', title: 'Riscos prioritários definidos', required: true },
      { id: 'c4', title: 'Recomendações elaboradas', required: true },
      { id: 'c5', title: 'Plano de ações curto prazo definido', required: true },
      { id: 'c6', title: 'Plano de ações médio prazo definido', required: true },
      { id: 'c7', title: 'Diagnóstico apresentado ao cliente', required: true },
    ],
    tips: [
      'Clientes de alto risco devem ter acompanhamento mais próximo',
      'Documente tudo de forma que outro advogado possa assumir se necessário',
      'Use templates padrão para agilizar a elaboração',
    ],
    nextPhase: 'D+15',
  },
  {
    id: 'D+15',
    name: 'Documentação',
    label: 'Documentação Jurídica Preventiva',
    color: 'text-amber-600',
    bgColor: 'bg-amber-500',
    description: 'Elaboração e entrega de toda a documentação jurídica preventiva personalizada para a atuação do médico.',
    objective: 'Entregar kit documental completo com contratos, termos, políticas e formulários personalizados.',
    duration: 'D+15 (até 15 dias após início)',
    deliverables: [
      'Contrato de prestação de serviços médicos',
      'Termo de consentimento livre e esclarecido',
      'Política de cancelamento e reagendamento',
      'Formulários de anamnese específicos',
      'Termos complementares por procedimento',
    ],
    actions: [
      { id: 'a1', title: 'Elaborar documentos', description: 'Criar kit documental personalizado baseado na especialidade', responsible: 'Equipe Jurídica', channel: 'system' },
      { id: 'a2', title: 'Revisar adequação', description: 'Verificar conformidade com CFM e legislação vigente', responsible: 'Advogado Responsável', channel: 'system' },
      { id: 'a3', title: 'Entregar documentação', description: 'Enviar pacote organizado por e-mail com instruções', responsible: 'Equipe Jurídica', channel: 'email' },
      { id: 'a4', title: 'Orientar sobre uso', description: 'Call de 30min explicando quando e como usar cada documento', responsible: 'Advogado Responsável', channel: 'meeting' },
    ],
    checklist: [
      { id: 'c1', title: 'Contrato de serviços elaborado', required: true },
      { id: 'c2', title: 'TCLE elaborado', required: true },
      { id: 'c3', title: 'Política de cancelamento criada', required: true },
      { id: 'c4', title: 'Formulários de anamnese prontos', required: true },
      { id: 'c5', title: 'Documentos revisados juridicamente', required: true },
      { id: 'c6', title: 'Kit entregue ao cliente', required: true },
      { id: 'c7', title: 'Orientação de uso realizada', required: true },
      { id: 'c8', title: 'Orientação de guarda documental', required: true },
    ],
    tips: [
      'Personalize os documentos com nome e CRM do médico',
      'Inclua instruções claras de preenchimento',
      'Oriente sobre a importância da assinatura do paciente ANTES do procedimento',
    ],
    nextPhase: 'D+30',
  },
  {
    id: 'D+30',
    name: 'Compliance',
    label: 'Compliance e Publicidade',
    color: 'text-rose-600',
    bgColor: 'bg-rose-500',
    description: 'Análise de conformidade da publicidade médica e orientações finais sobre atuação ética.',
    objective: 'Revisar toda a presença digital do médico e garantir conformidade com normas do CFM.',
    duration: 'D+30 (até 30 dias após início)',
    deliverables: [
      'Análise de publicidade médica',
      'Relatório de adequação digital',
      'Recomendações de ajustes',
      'Guia de boas práticas em redes sociais',
    ],
    actions: [
      { id: 'a1', title: 'Analisar redes sociais', description: 'Revisar Instagram, Facebook, TikTok e LinkedIn do médico', responsible: 'Equipe Jurídica', channel: 'system' },
      { id: 'a2', title: 'Analisar site e materiais', description: 'Verificar site, cartões, folders e anúncios', responsible: 'Equipe Jurídica', channel: 'system' },
      { id: 'a3', title: 'Identificar riscos publicitários', description: 'Listar posts e materiais que podem gerar problemas', responsible: 'Advogado Responsável', channel: 'system' },
      { id: 'a4', title: 'Elaborar recomendações', description: 'Criar documento com ajustes necessários', responsible: 'Advogado Responsável', channel: 'system' },
      { id: 'a5', title: 'Apresentar análise', description: 'Reunião para apresentar achados e orientações', responsible: 'Advogado Responsável', channel: 'meeting' },
    ],
    checklist: [
      { id: 'c1', title: 'Instagram analisado', required: true },
      { id: 'c2', title: 'Site analisado', required: true },
      { id: 'c3', title: 'Materiais impressos revisados', required: false },
      { id: 'c4', title: 'Riscos identificados e documentados', required: true },
      { id: 'c5', title: 'Recomendações elaboradas', required: true },
      { id: 'c6', title: 'Análise apresentada ao cliente', required: true },
      { id: 'c7', title: 'Ajustes prioritários definidos', required: true },
    ],
    tips: [
      'Foque primeiro nos riscos mais graves (antes/depois sem autorização, promessas de resultado)',
      'Use linguagem didática, muitos médicos não conhecem as restrições',
      'Ofereça suporte para implementação dos ajustes',
    ],
    nextPhase: 'Contínuo',
  },
  {
    id: 'Contínuo',
    name: 'Acompanhamento',
    label: 'Acompanhamento Preventivo',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500',
    description: 'Fase contínua de suporte, consultoria e acompanhamento do cliente.',
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
