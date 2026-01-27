/**
 * IPROMED - Jornada do Cliente
 * Visualização estruturada das etapas da jornada jurídica preventiva
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Search,
  FileText,
  Clock,
  CheckCircle2,
  Circle,
  CalendarClock,
  RefreshCw,
  Shield,
  FileCheck,
  Users,
  MessageSquare,
  ClipboardCheck,
  AlertTriangle,
  FolderOpen,
  Stethoscope,
  Scale,
  BookOpen,
  Megaphone,
  TrendingUp,
  Download,
} from "lucide-react";

// Interface for journey structure
interface SubDeliverable {
  code: string;
  title: string;
  description: string;
}

interface Deliverable {
  code: number;
  title: string;
  moment: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  subDeliverables: SubDeliverable[];
}

// Complete journey structure based on user specifications
const journeyDeliverables: Deliverable[] = [
  {
    code: 1,
    title: "Ativação inicial do contrato",
    moment: "D0",
    icon: FileCheck,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    subDeliverables: [
      { code: "1.1", title: "Confirmação formal de início da cobertura contratual", description: "Registrar a data exata de início da vigência, confirmar que o plano está ativo e comunicar internamente a liberação do atendimento preventivo" },
      { code: "1.2", title: "Registro do contrato no sistema interno", description: "Inserir contrato assinado no sistema do escritório, classificar como plano preventivo integral e vincular ao responsável interno" },
      { code: "1.3", title: "Vinculação do cliente ao plano preventivo integral", description: "Associar o cliente à categoria correta de atendimento, com prioridade e regras específicas do plano" },
    ],
  },
  {
    code: 2,
    title: "Comunicação de limites contratuais",
    moment: "D0",
    icon: MessageSquare,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    subDeliverables: [
      { code: "2.1", title: "Informação de cobertura apenas para fatos futuros", description: "Explicar de forma clara que o plano cobre apenas fatos ocorridos após a assinatura do contrato" },
      { code: "2.2", title: "Esclarecimento sobre processos anteriores", description: "Informar que processos, sindicâncias ou investigações anteriores não estão incluídos no plano" },
      { code: "2.3", title: "Registro do alinhamento", description: "Formalizar o alinhamento por e-mail ou ata de onboarding para segurança jurídica do escritório" },
    ],
  },
  {
    code: 3,
    title: "Agendamento do onboarding jurídico",
    moment: "D+1",
    icon: CalendarClock,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
    subDeliverables: [
      { code: "3.1", title: "Contato inicial com o médico", description: "Entrar em contato apresentando o próximo passo e reforçando a importância da reunião" },
      { code: "3.2", title: "Definição de data e horário", description: "Ajustar agenda conforme disponibilidade do médico e da equipe jurídica" },
      { code: "3.3", title: "Envio de orientações pré-reunião", description: "Enviar explicação do objetivo do onboarding e solicitar informações básicas prévias" },
    ],
  },
  {
    code: 4,
    title: "Reunião de onboarding jurídico",
    moment: "D+3",
    icon: Users,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    subDeliverables: [
      { code: "4.1", title: "Apresentação do plano preventivo", description: "Explicar como funciona a assessoria, o que está incluso e como o médico deve acionar o escritório" },
      { code: "4.2", title: "Alinhamento de expectativas", description: "Ajustar expectativas quanto a prazos, tipo de suporte e papel de cada parte" },
      { code: "4.3", title: "Explicação dos canais de atendimento", description: "Informar quais canais podem ser usados, horários e forma correta de solicitação" },
    ],
  },
  {
    code: 5,
    title: "Mapeamento da atuação profissional",
    moment: "D+3",
    icon: Stethoscope,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    subDeliverables: [
      { code: "5.1", title: "Identificação da especialidade médica", description: "Levantar especialidade principal e secundárias do médico" },
      { code: "5.2", title: "Levantamento de procedimentos realizados", description: "Identificar todos os procedimentos clínicos e cirúrgicos executados" },
      { code: "5.3", title: "Análise da rotina profissional", description: "Entender como o médico atua no dia a dia, fluxo de pacientes e decisões críticas" },
      { code: "5.4", title: "Verificação de locais de atuação", description: "Identificar se atua em clínica própria, terceirizada ou ambas" },
    ],
  },
  {
    code: 6,
    title: "Mapeamento de riscos jurídicos",
    moment: "D+3",
    icon: AlertTriangle,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    subDeliverables: [
      { code: "6.1", title: "Riscos éticos perante o CRM", description: "Avaliar riscos relacionados à publicidade, conduta profissional e documentação" },
      { code: "6.2", title: "Riscos cíveis e consumeristas", description: "Identificar exposição a ações indenizatórias e reclamações de pacientes" },
      { code: "6.3", title: "Riscos criminais", description: "Avaliar riscos penais relacionados a procedimentos e condutas" },
    ],
  },
  {
    code: 7,
    title: "Levantamento de passivos jurídicos",
    moment: "D+3",
    icon: Scale,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    subDeliverables: [
      { code: "7.1", title: "Processos judiciais em andamento", description: "Verificar se existem ações cíveis ou criminais em curso" },
      { code: "7.2", title: "Sindicâncias ou processos ético-profissionais", description: "Identificar procedimentos ativos no CRM ou CFM" },
      { code: "7.3", title: "Notificações administrativas", description: "Levantar notificações da vigilância sanitária ou outros órgãos" },
    ],
  },
  {
    code: 8,
    title: "Tratamento de demandas anteriores",
    moment: "D+3",
    icon: ClipboardCheck,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    subDeliverables: [
      { code: "8.1", title: "Reforço da não cobertura", description: "Reafirmar que demandas anteriores não fazem parte do plano" },
      { code: "8.2", title: "Oferta de honorários diferenciados", description: "Apresentar proposta com valores reduzidos para processos antigos" },
      { code: "8.3", title: "Definição de escopo específico", description: "Caso aceite, delimitar claramente o que será feito e os limites da atuação" },
    ],
  },
  {
    code: 9,
    title: "Abertura de dossiê jurídico",
    moment: "D+7",
    icon: FolderOpen,
    color: "text-teal-600",
    bgColor: "bg-teal-50 dark:bg-teal-950/30",
    subDeliverables: [
      { code: "9.1", title: "Consolidação das informações", description: "Organizar todas as informações coletadas em um único dossiê" },
      { code: "9.2", title: "Classificação do perfil de risco", description: "Classificar o médico como baixo, médio ou alto risco" },
      { code: "9.3", title: "Registro interno", description: "Registrar o dossiê no sistema do escritório para acompanhamento" },
    ],
  },
  {
    code: 10,
    title: "Diagnóstico jurídico preventivo",
    moment: "D+7",
    icon: Search,
    color: "text-teal-600",
    bgColor: "bg-teal-50 dark:bg-teal-950/30",
    subDeliverables: [
      { code: "10.1", title: "Consolidação dos riscos", description: "Listar riscos identificados de forma estruturada" },
      { code: "10.2", title: "Definição de prioridades", description: "Definir o que deve ser tratado primeiro" },
      { code: "10.3", title: "Recomendações iniciais", description: "Indicar medidas preventivas imediatas" },
    ],
  },
  {
    code: 11,
    title: "Plano jurídico preventivo",
    moment: "D+7",
    icon: FileText,
    color: "text-teal-600",
    bgColor: "bg-teal-50 dark:bg-teal-950/30",
    subDeliverables: [
      { code: "11.1", title: "Frentes de atuação", description: "Definir quais áreas jurídicas serão priorizadas" },
      { code: "11.2", title: "Ações de curto prazo", description: "Planejar ações imediatas de proteção" },
      { code: "11.3", title: "Ações de médio prazo", description: "Planejar adequações estruturais e estratégicas" },
    ],
  },
  {
    code: 12,
    title: "Consultoria preventiva contínua",
    moment: "Contínuo",
    icon: RefreshCw,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    subDeliverables: [
      { code: "12.1", title: "Atendimento ilimitado", description: "Disponibilizar atendimento contínuo para dúvidas e orientações" },
      { code: "12.2", title: "Orientações estratégicas", description: "Atuar preventivamente conforme decisões do médico" },
      { code: "12.3", title: "Atualizações periódicas", description: "Ajustar orientações conforme mudança de cenário" },
    ],
  },
  {
    code: 13,
    title: "Documentação jurídica preventiva",
    moment: "D+15",
    icon: BookOpen,
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    subDeliverables: [
      { code: "13.1", title: "Elaboração de políticas e formulários", description: "Criar documentos internos conforme a prática do médico" },
      { code: "13.2", title: "Elaboração de contratos e termos", description: "Produzir contratos e TCLEs personalizados" },
      { code: "13.3", title: "Personalização por especialidade", description: "Adequar linguagem e conteúdo à atuação específica" },
    ],
  },
  {
    code: 14,
    title: "Entrega e orientação documental",
    moment: "D+15",
    icon: FileCheck,
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    subDeliverables: [
      { code: "14.1", title: "Entrega organizada", description: "Entregar documentos de forma estruturada e acessível" },
      { code: "14.2", title: "Explicação de uso", description: "Explicar quando e como usar cada documento" },
      { code: "14.3", title: "Orientação de guarda", description: "Orientar sobre arquivamento e controle dos documentos" },
    ],
  },
  {
    code: 15,
    title: "Revisão de publicidade médica",
    moment: "D+30",
    icon: Megaphone,
    color: "text-rose-600",
    bgColor: "bg-rose-50 dark:bg-rose-950/30",
    subDeliverables: [
      { code: "15.1", title: "Análise de materiais", description: "Avaliar redes sociais e materiais de divulgação" },
      { code: "15.2", title: "Identificação de riscos", description: "Apontar práticas que geram risco ético" },
      { code: "15.3", title: "Recomendações de adequação", description: "Sugerir ajustes permitidos pelas normas" },
    ],
  },
  {
    code: 16,
    title: "Compliance e atuação ética",
    moment: "D+30",
    icon: Shield,
    color: "text-rose-600",
    bgColor: "bg-rose-50 dark:bg-rose-950/30",
    subDeliverables: [
      { code: "16.1", title: "Avaliação de conformidade", description: "Verificar aderência às normas legais e éticas" },
      { code: "16.2", title: "Orientações preventivas", description: "Orientar condutas para evitar autuações" },
      { code: "16.3", title: "Ajustes estratégicos", description: "Propor melhorias estruturais" },
    ],
  },
  {
    code: 17,
    title: "Acompanhamento preventivo",
    moment: "Contínuo",
    icon: TrendingUp,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    subDeliverables: [
      { code: "17.1", title: "Revisões periódicas", description: "Reavaliar riscos ao longo do tempo" },
      { code: "17.2", title: "Atualização do plano", description: "Ajustar o plano jurídico conforme evolução do médico" },
      { code: "17.3", title: "Suporte ao crescimento", description: "Apoiar juridicamente a expansão da atuação profissional" },
    ],
  },
];

// Group deliverables by moment
const momentGroups = [
  { moment: "D0", label: "Dia 0 - Ativação", color: "bg-blue-500", items: [1, 2] },
  { moment: "D+1", label: "Dia 1 - Agendamento", color: "bg-indigo-500", items: [3] },
  { moment: "D+3", label: "Dia 3 - Onboarding e Mapeamento", color: "bg-purple-500", items: [4, 5, 6, 7, 8] },
  { moment: "D+7", label: "Dia 7 - Dossiê e Diagnóstico", color: "bg-teal-500", items: [9, 10, 11] },
  { moment: "D+15", label: "Dia 15 - Documentação", color: "bg-amber-500", items: [13, 14] },
  { moment: "D+30", label: "Dia 30 - Compliance", color: "bg-rose-500", items: [15, 16] },
  { moment: "Contínuo", label: "Contínuo - Acompanhamento", color: "bg-emerald-500", items: [12, 17] },
];

export default function IpromedJourney() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedItems, setExpandedItems] = useState<number[]>([1, 2, 3]);
  const [selectedMoment, setSelectedMoment] = useState<string | null>(null);

  const toggleExpanded = (code: number) => {
    setExpandedItems(prev => 
      prev.includes(code) 
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  const expandAll = () => {
    setExpandedItems(journeyDeliverables.map(d => d.code));
  };

  const collapseAll = () => {
    setExpandedItems([]);
  };

  const filteredDeliverables = journeyDeliverables.filter(d => {
    const matchesSearch = 
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.subDeliverables.some(s => 
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesMoment = !selectedMoment || d.moment === selectedMoment;
    return matchesSearch && matchesMoment;
  });

  const getMomentBadgeColor = (moment: string) => {
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/ipromed')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          IPROMED
        </Button>
        <span className="text-muted-foreground">/</span>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="font-medium">Jornada do Cliente</span>
        </div>
      </div>

      {/* Title */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Jornada do Cliente Jurídico</h1>
          <p className="text-muted-foreground">17 entregáveis • 51 subentregáveis • Plano Preventivo Integral</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            Expandir Tudo
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            Recolher Tudo
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Timeline Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Timeline da Jornada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedMoment === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedMoment(null)}
            >
              Todos
            </Button>
            {momentGroups.map(group => (
              <Button
                key={group.moment}
                variant={selectedMoment === group.moment ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedMoment(selectedMoment === group.moment ? null : group.moment)}
                className="gap-2"
              >
                <div className={`w-2 h-2 rounded-full ${group.color}`} />
                {group.label}
                <Badge variant="secondary" className="ml-1 text-xs">
                  {group.items.length}
                </Badge>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar entregáveis, subentregáveis ou descrições..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Deliverables List */}
      <div className="space-y-3">
        {filteredDeliverables.map((deliverable) => (
          <Collapsible
            key={deliverable.code}
            open={expandedItems.includes(deliverable.code)}
            onOpenChange={() => toggleExpanded(deliverable.code)}
          >
            <Card className={`border-l-4 ${deliverable.bgColor} transition-all hover:shadow-md`}
              style={{ borderLeftColor: deliverable.color.replace('text-', '').includes('-') 
                ? `var(--${deliverable.color.replace('text-', '')})` 
                : undefined 
              }}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl ${deliverable.bgColor}`}>
                        <deliverable.icon className={`h-5 w-5 ${deliverable.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="font-mono text-xs">
                            {deliverable.code.toString().padStart(2, '0')}
                          </Badge>
                          <CardTitle className="text-base">{deliverable.title}</CardTitle>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`text-xs ${getMomentBadgeColor(deliverable.moment)}`}>
                            <Clock className="h-3 w-3 mr-1" />
                            {deliverable.moment}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {deliverable.subDeliverables.length} subentregáveis
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {expandedItems.includes(deliverable.code) ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="pt-0 pb-4">
                  <div className="ml-14 space-y-3">
                    {deliverable.subDeliverables.map((sub, idx) => (
                      <div
                        key={sub.code}
                        className="flex gap-4 p-4 rounded-lg bg-background/80 border border-border/50 hover:border-primary/20 transition-colors"
                      >
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <Circle className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="font-mono text-xs">
                              {sub.code}
                            </Badge>
                            <span className="font-medium text-sm">{sub.title}</span>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {sub.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>

      {/* Empty State */}
      {filteredDeliverables.length === 0 && (
        <Card className="py-12">
          <CardContent className="text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum entregável encontrado</h3>
            <p className="text-muted-foreground">
              Tente ajustar os filtros ou o termo de busca
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setSearchTerm("");
                setSelectedMoment(null);
              }}
            >
              Limpar Filtros
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
