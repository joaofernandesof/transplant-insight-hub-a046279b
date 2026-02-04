/**
 * IPROMED - Pauta Oficial de Reunião de Onboarding
 * Formulário completo com 10 seções e 43 campos para registro de novos clientes
 */

import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  HandMetal,
  Stethoscope,
  MessageSquare,
  FileText,
  Upload,
  Target,
  Calendar,
  GraduationCap,
  Instagram,
  FileSignature,
  Save,
  CheckCircle2,
  ChevronRight,
  Printer,
  Download,
  Eye,
  Plus,
  Trash2,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import ProcedureSelector from "./ProcedureSelector";
import { cn } from "@/lib/utils";
import { ProcedureVolumeSelector } from "./ProcedureVolumeSelector";
import { YesNoSelector } from "./YesNoSelector";

// Helper para destacar campos não preenchidos - aplicar no input/select
const getInputHighlight = (value: string | number | boolean | undefined | null | unknown[]) => {
  if (value === undefined || value === null || value === "" || value === 0 || 
      (Array.isArray(value) && value.length === 0)) {
    return "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700";
  }
  return "";
};

// Alias antigo para compatibilidade (não usar mais)
const getFieldHighlight = (_value: string | number | boolean | undefined | null | unknown[]) => {
  return ""; // Desativado - usar getInputHighlight no input
};

// Schema de validação
const onboardingMeetingSchema = z.object({
  // 1. Boas-vindas e abertura
  nomeCompleto: z.string().min(1, "Nome completo é obrigatório"),
  nomePreferencia: z.string().optional(),
  cargoFuncao: z.string().optional(),
  possuiClinica: z.boolean().optional(),
  clinicaNome: z.string().optional(),
  clinicaEndereco: z.string().optional(),
  clinicaCNPJ: z.string().optional(),
  clinicaCRM: z.string().optional(),
  cidadeEstado: z.string().optional(),
  emailPrincipal: z.string().email("Email inválido").optional().or(z.literal("")),
  objetivoPrincipal: z.string().optional(),

  // 2. Perfil profissional
  areaAtuacao: z.string().optional(),
  possuiRQE: z.boolean().optional(),
  numeroRQE: z.string().optional(),
  tempoAtuacao: z.coerce.number().optional(),
  formatoAtendimento: z.array(z.string()).default([]),
  estruturaPrincipal: z.string().optional(),
  tamanhoEquipe: z.coerce.number().optional(),
  procedimentosRealizados: z.array(z.string()).default([]),
  procedimentosMaiorVolume: z.array(z.string()).default([]),

  // 3. Comunicação
  whatsappPrincipal: z.string().optional(),
  responsavelOperacional: z.string().optional(),
  contatoPrincipal: z.object({
    nome: z.string().optional(),
    email: z.string().optional(),
    whatsapp: z.string().optional(),
    funcao: z.string().optional(),
  }).default({ nome: "", email: "", whatsapp: "", funcao: "" }),
  contatosAdicionais: z.array(z.object({
    nome: z.string().optional(),
    email: z.string().optional(),
    whatsapp: z.string().optional(),
    funcao: z.string().optional(),
  })).default([]),
  horarioPreferencial: z.string().optional(),

  // 4. Documentos atuais
  usaDocumentosHoje: z.boolean().optional(),
  documentosExistentes: z.array(z.string()).default([]),
  quemPreenche: z.string().optional(),
  usaAssinaturaDigital: z.boolean().optional(),
  ferramentaAssinatura: z.string().optional(),

  // 5. Documentos que serão entregues
  documentosEntregues: z.array(z.string()).default([]),
  documentosAdicionaisEntregues: z.array(z.object({
    nome: z.string().optional(),
  })).default([]),

  // 6. Prioridades (renumerado)
  possuiPrioridade: z.boolean().optional(),
  documentosPrioritariosSelecionados: z.array(z.string()).default([]),
  documentosPrioritarios: z.array(z.object({
    nome: z.string().optional(),
  })).default([]),
  jaTeveProblemAnterior: z.boolean().optional(),
  problemasAnteriores: z.array(z.object({
    titulo: z.string().optional(),
    descricao: z.string().optional(),
  })).default([]),

  // 7. Prazos - Documentos Atuais e Novos
  dataOnboarding: z.string().optional(), // Data de hoje (onboarding)
  dataRecebimentoDocsAtuais: z.string().optional(), // Data prevista de recebimento dos docs atuais
  prazoPadraoRevisao: z.coerce.number().default(20), // Prazo padrão em dias úteis para revisão
  prazoPadraoCriacao: z.coerce.number().default(20), // Prazo padrão em dias úteis para criação
  dataPrevistaRevisao: z.string().optional(), // Calculada automaticamente
  dataPrevistaCriacao: z.string().optional(), // Calculada automaticamente
  documentosAtuaisStatus: z.record(z.boolean()).default({}), // Matriz de documentos atuais (tem/não tem)

  // 8. Treinamento
  necessitaTreinamento: z.boolean().optional(),
  quemSeraTreinado: z.string().optional(),
  formatoTreinamento: z.string().optional(),
  dataSugeridaTreinamento: z.string().optional(),
  duvidasPrincipais: z.string().optional(),

  // 9. Instagram
  instagramHandle: z.string().optional(),
  responsavelPerfil: z.string().optional(),
  fazAnuncios: z.boolean().optional(),
  
  riscosEncontrados: z.string().optional(),
  riscosArquivos: z.array(z.object({
    nome: z.string(),
    tipo: z.string(),
  })).default([]),
  orientacoesDadas: z.string().optional(),

  // 10. Contrato
  leituraConcluida: z.boolean().optional(),
  duvidasRespostas: z.array(z.object({
    duvida: z.string().optional(),
    resposta: z.string().optional(),
  })).default([]),
  ajustesSolicitados: z.string().optional(),
  aceiteContrato: z.boolean().optional(),
});

type OnboardingMeetingData = z.infer<typeof onboardingMeetingSchema>;

// Lista de documentos contratuais do IPROMED
const documentosContratuais = [
  "Formulário de Pré-Anamnese Guiado",
  "Política de Agendamento de Consulta",
  "Política de Prontuário Médico",
  "Contrato de Prestação de Serviços de Transplante Capilar FUE",
  "Distrato ao Contrato de Transplante Capilar FUE",
  "Contrato de Prestação de Serviço de Mesoterapia",
  "Contrato de Prestação de Serviço de Equipe de Instrumentação Cirúrgica",
  "Termo de Cessão de Uso de Imagem do Paciente",
  "Termo de Sigilo Médico-Paciente",
  "Termo de Validação de Tricotomia",
  "TCLE para Teleconsulta",
  "Termo de Recusa de Tratamento",
  "Notificação de Renúncia de Médico",
  "Orientações Pré-Procedimento de Transplante Capilar FUE",
  "Orientações Pós-Procedimento de Transplante Capilar FUE",
  "TCLE Específicos para Transplante Capilar FUE",
  "Manual de Publicidade Médica",
];

// Definição das seções com campos obrigatórios
interface SectionConfig {
  id: string;
  icon: React.ElementType;
  title: string;
  emoji: string;
  fields: string[];
  requiredFields: { name: keyof OnboardingMeetingData; label: string }[];
}

const sections: SectionConfig[] = [
  { 
    id: "boas-vindas", 
    icon: HandMetal, 
    title: "Boas-vindas e abertura", 
    emoji: "👋", 
    fields: ["1.2.1", "1.2.2", "1.2.3", "1.2.4", "1.2.5", "1.2.6"],
    requiredFields: [
      { name: "nomeCompleto", label: "Nome completo do cliente" },
    ]
  },
  { 
    id: "perfil", 
    icon: Stethoscope, 
    title: "Perfil profissional", 
    emoji: "🩺", 
    fields: ["2.2.1", "2.2.2", "2.2.3", "2.2.4", "2.2.5", "2.2.6", "2.2.7", "2.2.8", "2.2.9"],
    requiredFields: []
  },
  { 
    id: "comunicacao", 
    icon: MessageSquare, 
    title: "Comunicação", 
    emoji: "📲", 
    fields: ["3.2.1", "3.2.2", "3.2.3", "3.2.4", "3.2.5", "3.2.6"],
    requiredFields: [
      { name: "whatsappPrincipal", label: "WhatsApp principal" },
    ]
  },
  { 
    id: "documentos", 
    icon: FileText, 
    title: "Documentos atuais", 
    emoji: "📄", 
    fields: ["4.2.1", "4.2.2", "4.2.3", "4.2.4", "4.2.5", "4.2.6"],
    requiredFields: []
  },
  { 
    id: "entregas", 
    icon: Upload, 
    title: "Documentos que serão entregues", 
    emoji: "📦", 
    fields: ["5.2.1", "5.2.2"],
    requiredFields: []
  },
  { 
    id: "prioridades", 
    icon: Target, 
    title: "Prioridades", 
    emoji: "🎯", 
    fields: ["6.2.1", "6.2.2", "6.2.3", "6.2.4", "6.2.5", "6.2.6"],
    requiredFields: []
  },
  { 
    id: "prazos", 
    icon: Calendar, 
    title: "Prazos", 
    emoji: "🗓️", 
    fields: ["6.2.1", "6.2.2", "6.2.3", "6.2.4"],
    requiredFields: []
  },
  { 
    id: "treinamento", 
    icon: GraduationCap, 
    title: "Treinamento", 
    emoji: "🎓", 
    fields: ["8.2.1", "8.2.2", "8.2.3", "8.2.4", "8.2.5"],
    requiredFields: []
  },
  { 
    id: "instagram", 
    icon: Instagram, 
    title: "Instagram", 
    emoji: "📸", 
    fields: ["9.2.1", "9.2.2", "9.2.3", "9.2.4", "9.2.5", "9.2.6", "9.2.7"],
    requiredFields: []
  },
  { 
    id: "contrato", 
    icon: FileSignature, 
    title: "Contrato", 
    emoji: "📑", 
    fields: ["10.2.1", "10.2.2", "10.2.3", "10.2.4"],
    requiredFields: []
  },
];

// Opções de listas suspensas
const cargoOptions = ["Médico", "Gestor", "Sócio", "Outro"];
const formatoAtendimentoOptions = ["Clínica própria", "Terceiros", "Hospital", "Consultório", "Teleconsulta"];
const estruturaOptions = ["Clínica própria", "Consultório alugado", "Hospital", "Coworking médico"];
const documentosOptions = ["TCLE", "Contrato de prestação", "Termo de imagem", "Anamnese", "Prontuário", "Política de agendamento"];
const quemPreencheOptions = ["Secretária", "Médico", "Recepção", "Equipe administrativa"];

const cenarioClienteOptions = ["Já possui todos os documentos que vamos entregar", "Possui parcialmente os documentos", "Não possui documentos"];
const formatoTreinamentoOptions = ["Online", "Presencial", "Híbrido"];
const responsavelPerfilOptions = ["Equipe", "Cliente", "Agência", "Social media"];


interface OnboardingMeetingAgendaProps {
  clientId?: string;
  clientName?: string;
  onSubmit?: (data: OnboardingMeetingData) => void;
  onClose?: () => void;
  initialData?: Partial<OnboardingMeetingData>;
}

// Gerar chave única para localStorage baseado no clientId
const STORAGE_KEY_PREFIX = "ipromed_onboarding_";

export default function OnboardingMeetingAgenda({
  clientId,
  clientName,
  onSubmit,
  onClose,
  initialData,
}: OnboardingMeetingAgendaProps) {
  // Chave única para este cliente/sessão
  const storageKey = `${STORAGE_KEY_PREFIX}${clientId || 'new'}`;
  
  // Tentar carregar dados salvos do localStorage
  const getSavedData = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Erro ao carregar checkpoint:", e);
    }
    return null;
  }, [storageKey]);

  const savedCheckpoint = getSavedData();
  
  const [currentSectionIndex, setCurrentSectionIndex] = useState(() => {
    return savedCheckpoint?.currentSectionIndex ?? 0;
  });
  const [completedSections, setCompletedSections] = useState<string[]>(() => {
    return savedCheckpoint?.completedSections ?? [];
  });
  const [isRestored, setIsRestored] = useState(false);
  
  // Controlar qual seção está expandida (apenas a atual)
  const currentSection = sections[currentSectionIndex];
  const expandedSections = currentSection ? [currentSection.id] : [];

  const form = useForm<OnboardingMeetingData>({
    resolver: zodResolver(onboardingMeetingSchema),
    defaultValues: {
      nomeCompleto: savedCheckpoint?.formData?.nomeCompleto ?? clientName ?? "",
      nomePreferencia: savedCheckpoint?.formData?.nomePreferencia ?? "",
      cargoFuncao: savedCheckpoint?.formData?.cargoFuncao ?? "",
      possuiClinica: savedCheckpoint?.formData?.possuiClinica ?? undefined,
      clinicaNome: savedCheckpoint?.formData?.clinicaNome ?? "",
      clinicaEndereco: savedCheckpoint?.formData?.clinicaEndereco ?? "",
      clinicaCNPJ: savedCheckpoint?.formData?.clinicaCNPJ ?? "",
      clinicaCRM: savedCheckpoint?.formData?.clinicaCRM ?? "",
      cidadeEstado: savedCheckpoint?.formData?.cidadeEstado ?? "",
      emailPrincipal: savedCheckpoint?.formData?.emailPrincipal ?? "",
      objetivoPrincipal: savedCheckpoint?.formData?.objetivoPrincipal ?? "",
      areaAtuacao: savedCheckpoint?.formData?.areaAtuacao ?? "",
      possuiRQE: savedCheckpoint?.formData?.possuiRQE ?? undefined,
      numeroRQE: savedCheckpoint?.formData?.numeroRQE ?? "",
      tempoAtuacao: savedCheckpoint?.formData?.tempoAtuacao ?? undefined,
      formatoAtendimento: savedCheckpoint?.formData?.formatoAtendimento ?? [],
      estruturaPrincipal: savedCheckpoint?.formData?.estruturaPrincipal ?? "",
      tamanhoEquipe: savedCheckpoint?.formData?.tamanhoEquipe ?? undefined,
      procedimentosRealizados: savedCheckpoint?.formData?.procedimentosRealizados ?? [],
      procedimentosMaiorVolume: savedCheckpoint?.formData?.procedimentosMaiorVolume ?? [],
      whatsappPrincipal: savedCheckpoint?.formData?.whatsappPrincipal ?? "",
      responsavelOperacional: savedCheckpoint?.formData?.responsavelOperacional ?? "",
      contatoPrincipal: savedCheckpoint?.formData?.contatoPrincipal ?? { nome: "", email: "", whatsapp: "", funcao: "" },
      contatosAdicionais: savedCheckpoint?.formData?.contatosAdicionais ?? [],
      horarioPreferencial: savedCheckpoint?.formData?.horarioPreferencial ?? "",
      usaDocumentosHoje: savedCheckpoint?.formData?.usaDocumentosHoje ?? undefined,
      documentosExistentes: savedCheckpoint?.formData?.documentosExistentes ?? [],
      quemPreenche: savedCheckpoint?.formData?.quemPreenche ?? "",
      usaAssinaturaDigital: savedCheckpoint?.formData?.usaAssinaturaDigital ?? undefined,
      ferramentaAssinatura: savedCheckpoint?.formData?.ferramentaAssinatura ?? "",
      documentosEntregues: savedCheckpoint?.formData?.documentosEntregues ?? [],
      documentosAdicionaisEntregues: savedCheckpoint?.formData?.documentosAdicionaisEntregues ?? [],
      possuiPrioridade: savedCheckpoint?.formData?.possuiPrioridade ?? undefined,
      documentosPrioritariosSelecionados: savedCheckpoint?.formData?.documentosPrioritariosSelecionados ?? [],
      documentosPrioritarios: savedCheckpoint?.formData?.documentosPrioritarios ?? [],
      jaTeveProblemAnterior: savedCheckpoint?.formData?.jaTeveProblemAnterior ?? undefined,
      problemasAnteriores: savedCheckpoint?.formData?.problemasAnteriores ?? [],
      dataOnboarding: savedCheckpoint?.formData?.dataOnboarding ?? new Date().toISOString().split('T')[0],
      dataRecebimentoDocsAtuais: savedCheckpoint?.formData?.dataRecebimentoDocsAtuais ?? "",
      prazoPadraoRevisao: savedCheckpoint?.formData?.prazoPadraoRevisao ?? 20,
      prazoPadraoCriacao: savedCheckpoint?.formData?.prazoPadraoCriacao ?? 20,
      dataPrevistaRevisao: savedCheckpoint?.formData?.dataPrevistaRevisao ?? "",
      dataPrevistaCriacao: savedCheckpoint?.formData?.dataPrevistaCriacao ?? "",
      documentosAtuaisStatus: savedCheckpoint?.formData?.documentosAtuaisStatus ?? {},
      necessitaTreinamento: savedCheckpoint?.formData?.necessitaTreinamento ?? undefined,
      quemSeraTreinado: savedCheckpoint?.formData?.quemSeraTreinado ?? "",
      formatoTreinamento: savedCheckpoint?.formData?.formatoTreinamento ?? "",
      dataSugeridaTreinamento: savedCheckpoint?.formData?.dataSugeridaTreinamento ?? "",
      duvidasPrincipais: savedCheckpoint?.formData?.duvidasPrincipais ?? "",
      instagramHandle: savedCheckpoint?.formData?.instagramHandle ?? "",
      responsavelPerfil: savedCheckpoint?.formData?.responsavelPerfil ?? "",
      fazAnuncios: savedCheckpoint?.formData?.fazAnuncios ?? undefined,
      
      riscosEncontrados: savedCheckpoint?.formData?.riscosEncontrados ?? "",
      riscosArquivos: savedCheckpoint?.formData?.riscosArquivos ?? [],
      orientacoesDadas: savedCheckpoint?.formData?.orientacoesDadas ?? "",
      leituraConcluida: savedCheckpoint?.formData?.leituraConcluida ?? undefined,
      duvidasRespostas: savedCheckpoint?.formData?.duvidasRespostas ?? [],
      ajustesSolicitados: savedCheckpoint?.formData?.ajustesSolicitados ?? "",
      aceiteContrato: savedCheckpoint?.formData?.aceiteContrato ?? undefined,
      ...initialData,
    },
  });

  // Salvar checkpoint no localStorage quando o formulário muda
  const saveCheckpoint = useCallback(() => {
    try {
      const checkpoint = {
        formData: form.getValues(),
        currentSectionIndex,
        completedSections,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(checkpoint));
    } catch (e) {
      console.error("Erro ao salvar checkpoint:", e);
    }
  }, [form, currentSectionIndex, completedSections, storageKey]);

  // Auto-save quando dados mudam (debounced)
  useEffect(() => {
    const subscription = form.watch(() => {
      // Debounce para não salvar a cada keystroke
      const timeoutId = setTimeout(() => {
        saveCheckpoint();
      }, 500);
      return () => clearTimeout(timeoutId);
    });
    return () => subscription.unsubscribe();
  }, [form, saveCheckpoint]);

  // Salvar quando seções mudam
  useEffect(() => {
    saveCheckpoint();
  }, [currentSectionIndex, completedSections, saveCheckpoint]);

  // Mostrar notificação de restauração
  useEffect(() => {
    if (savedCheckpoint && !isRestored) {
      setIsRestored(true);
      const savedDate = savedCheckpoint.savedAt 
        ? new Date(savedCheckpoint.savedAt).toLocaleString('pt-BR')
        : 'desconhecida';
      toast.info("Progresso restaurado!", {
        description: `Voltando para onde você parou. Último checkpoint: ${savedDate}`,
        duration: 4000,
      });
    }
  }, [savedCheckpoint, isRestored]);

  // Limpar checkpoint quando o formulário é submetido com sucesso
  const clearCheckpoint = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {
      console.error("Erro ao limpar checkpoint:", e);
    }
  }, [storageKey]);

  const handleSubmit = (data: OnboardingMeetingData) => {
    onSubmit?.(data);
    clearCheckpoint(); // Limpar checkpoint após salvar com sucesso
    toast.success("Pauta de onboarding salva com sucesso!", {
      description: "Todos os dados da reunião foram registrados.",
    });
    onClose?.();
  };

  // Verificar se uma seção está acessível (completada ou é a atual)
  const isSectionAccessible = useCallback((sectionId: string) => {
    const sectionIndex = sections.findIndex(s => s.id === sectionId);
    return sectionIndex <= currentSectionIndex || completedSections.includes(sectionId);
  }, [currentSectionIndex, completedSections]);

  // Alternar seção (só permite se acessível)
  const toggleSection = useCallback((sectionId: string) => {
    if (isSectionAccessible(sectionId)) {
      const sectionIndex = sections.findIndex(s => s.id === sectionId);
      if (sectionIndex !== -1) {
        setCurrentSectionIndex(sectionIndex);
      }
    } else {
      toast.error("Complete a seção atual antes de avançar", {
        description: "Preencha os campos obrigatórios e clique em 'Marcar como concluído'",
      });
    }
  }, [isSectionAccessible]);

  // Validar e marcar seção como concluída
  const validateAndCompleteSection = useCallback((sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const formValues = form.getValues();
    const missingFields: string[] = [];

    // Verificar campos obrigatórios
    for (const field of section.requiredFields) {
      const value = formValues[field.name];
      const isEmpty = value === undefined || value === null || value === "" || 
        (Array.isArray(value) && value.length === 0);
      
      if (isEmpty) {
        missingFields.push(field.label);
      }
    }

    if (missingFields.length > 0) {
      toast.error("Preencha os campos obrigatórios", {
        description: (
          <div className="mt-2">
            <p className="font-medium mb-1">Campos faltando:</p>
            <ul className="list-disc list-inside text-sm">
              {missingFields.map((field, i) => (
                <li key={i}>{field}</li>
              ))}
            </ul>
          </div>
        ),
        duration: 5000,
      });
      return;
    }

    // Marcar como concluída
    if (!completedSections.includes(sectionId)) {
      setCompletedSections(prev => [...prev, sectionId]);
    }

    // Avançar para próxima seção
    const currentIndex = sections.findIndex(s => s.id === sectionId);
    if (currentIndex < sections.length - 1) {
      setCurrentSectionIndex(currentIndex + 1);
      
      // Scroll para o topo da próxima seção
      setTimeout(() => {
        const accordionElement = document.querySelector(`[data-section-id="${sections[currentIndex + 1].id}"]`);
        if (accordionElement) {
          accordionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          // Fallback: scroll para o topo do container
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
      
      toast.success("Seção concluída!", {
        description: `Avançando para: ${sections[currentIndex + 1].title}`,
      });
    } else {
      toast.success("Todas as seções foram concluídas!", {
        description: "Você pode salvar a pauta agora.",
      });
    }
  }, [form, completedSections]);

  const progress = Math.round((completedSections.length / sections.length) * 100);

  const handlePrint = () => {
    window.print();
    toast.success("Preparando impressão...");
  };

  return (
    <div className="flex flex-col h-full max-h-[90vh]">
      {/* Header fixo */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <FileSignature className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Pauta de Reunião de Onboarding</h2>
            <p className="text-sm text-muted-foreground">IPROMED • {clientName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right mr-4">
            <p className="text-sm font-medium">{progress}% concluído</p>
            <Progress value={progress} className="w-24 h-2" />
          </div>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Conteúdo scrollável */}
      <ScrollArea className="flex-1">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="p-4 space-y-4">
            <Accordion 
              type="single" 
              value={expandedSections[0] || ""}
              className="space-y-3"
            >
              {/* 1. Boas-vindas e abertura */}
              <AccordionItem 
                value="boas-vindas" 
                data-section-id="boas-vindas"
                className={cn(
                  "border rounded-lg overflow-hidden transition-opacity",
                  !isSectionAccessible("boas-vindas") && "opacity-50 pointer-events-none"
                )}
              >
                <AccordionTrigger 
                  className={cn(
                    "px-4 py-3 hover:no-underline",
                    completedSections.includes("boas-vindas") && "bg-emerald-50 dark:bg-emerald-950/20"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleSection("boas-vindas");
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">👋</span>
                    <div className="text-left">
                      <p className="font-medium">1. Boas-vindas e abertura</p>
                      <p className="text-xs text-muted-foreground">6 campos • Identificação do cliente</p>
                    </div>
                    {completedSections.includes("boas-vindas") && (
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 ml-2">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Concluído
                      </Badge>
                    )}
                    {!isSectionAccessible("boas-vindas") && (
                      <Badge variant="outline" className="ml-2">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Bloqueado
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-5 pt-2 max-w-2xl">
                    <FormField
                      control={form.control}
                      name="nomeCompleto"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>🪪 Nome completo do cliente <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="João da Silva Pereira" 
                              className={cn(getInputHighlight(field.value))}
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription className="text-xs">Conferir grafia</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nomePreferencia"
                      render={({ field }) => (
                        <FormItem className={cn(getFieldHighlight(field.value))}>
                          <FormLabel>🙂 Nome de preferência</FormLabel>
                          <FormControl>
                            <Input placeholder="Dr. João" {...field} />
                          </FormControl>
                          <FormDescription className="text-xs">Usar em toda comunicação</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cargoFuncao"
                      render={({ field }) => (
                        <FormItem className={cn(getFieldHighlight(field.value))}>
                          <FormLabel>🧩 Cargo ou função</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {cargoOptions.map(opt => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="possuiClinica"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <YesNoSelector
                              value={field.value}
                              onChange={field.onChange}
                              label="🏥 Possui clínica?"
                            />
                          </FormControl>
                          <FormDescription className="text-xs ml-1">Marque se o cliente possui clínica própria</FormDescription>
                        </FormItem>
                      )}
                    />

                    {form.watch("possuiClinica") && (
                      <>
                        <FormField
                          control={form.control}
                          name="clinicaNome"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome da clínica</FormLabel>
                              <FormControl>
                                <Input placeholder="Clínica Exemplo" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="clinicaEndereco"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Endereço da clínica</FormLabel>
                              <FormControl>
                                <Input placeholder="Rua Exemplo, 123" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="clinicaCNPJ"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CNPJ da clínica</FormLabel>
                              <FormControl>
                                <Input placeholder="00.000.000/0000-00" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="clinicaCRM"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Registro CRM da clínica</FormLabel>
                              <FormControl>
                                <Input placeholder="CRM-XX 00000" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    <FormField
                      control={form.control}
                      name="cidadeEstado"
                      render={({ field }) => (
                        <FormItem className={cn(getFieldHighlight(field.value))}>
                          <FormLabel>📍 Cidade e estado</FormLabel>
                          <FormControl>
                            <Input placeholder="Fortaleza, CE" {...field} />
                          </FormControl>
                          <FormDescription className="text-xs">Importante para contexto regulatório</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="emailPrincipal"
                      render={({ field }) => (
                        <FormItem className={cn(getFieldHighlight(field.value))}>
                          <FormLabel>📧 E-mail principal</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="financeiro@clinica.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="objetivoPrincipal"
                      render={({ field }) => (
                        <FormItem className={cn(getFieldHighlight(field.value))}>
                          <FormLabel>🎯 Objetivo principal</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Blindar publicidade e documentos..." 
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription className="text-xs">Deve orientar prioridade do plano</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button 
                      type="button" 
                      variant="default" 
                      size="sm"
                      onClick={() => validateAndCompleteSection("boas-vindas")}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Marcar como concluído
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 2. Perfil profissional */}
              <AccordionItem 
                value="perfil" 
                data-section-id="perfil"
                className={cn(
                  "border rounded-lg overflow-hidden transition-opacity",
                  !isSectionAccessible("perfil") && "opacity-50"
                )}
              >
                <AccordionTrigger 
                  className={cn(
                    "px-4 py-3 hover:no-underline",
                    completedSections.includes("perfil") && "bg-emerald-50 dark:bg-emerald-950/20"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleSection("perfil");
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🩺</span>
                    <div className="text-left">
                      <p className="font-medium">2. Perfil profissional</p>
                      <p className="text-xs text-muted-foreground">9 campos • Especialidade e atuação</p>
                    </div>
                    {completedSections.includes("perfil") && (
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 ml-2">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Concluído
                      </Badge>
                    )}
                    {!isSectionAccessible("perfil") && (
                      <Badge variant="outline" className="ml-2">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Bloqueado
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-5 pt-2 max-w-2xl">
                    <FormField
                      control={form.control}
                      name="areaAtuacao"
                      render={({ field }) => (
                        <FormItem className={cn(getFieldHighlight(field.value))}>
                          <FormLabel>🧠 Área principal de atuação</FormLabel>
                          <FormControl>
                            <Input placeholder="Dermatologia" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="possuiRQE"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <YesNoSelector
                              value={field.value}
                              onChange={field.onChange}
                              label="🏷️ Possui RQE"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {form.watch("possuiRQE") && (
                      <FormField
                        control={form.control}
                        name="numeroRQE"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>🧾 Número do RQE</FormLabel>
                            <FormControl>
                              <Input placeholder="12345" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="tempoAtuacao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>⏳ Tempo de atuação (anos)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              placeholder="Ex: 7"
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="estruturaPrincipal"
                      render={({ field }) => (
                        <FormItem className={cn(getFieldHighlight(field.value))}>
                          <FormLabel>🧱 Estrutura principal</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {estruturaOptions.map(opt => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tamanhoEquipe"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>👥 Tamanho da equipe fixa</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              placeholder="Ex: 6"
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="procedimentosRealizados"
                      render={({ field }) => (
                        <FormItem className={cn(getFieldHighlight(field.value))}>
                          <FormLabel>⚙️ Procedimentos realizados</FormLabel>
                          <FormControl>
                            <ProcedureSelector
                              value={field.value || []}
                              onChange={field.onChange}
                              placeholder="Buscar ou adicionar procedimento..."
                            />
                          </FormControl>
                          <FormDescription className="text-xs">Selecione da lista ou adicione manualmente</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="procedimentosMaiorVolume"
                      render={({ field }) => (
                        <FormItem className={cn(getFieldHighlight(field.value))}>
                          <FormLabel>📈 Procedimentos de maior volume</FormLabel>
                          <FormControl>
                            <ProcedureVolumeSelector
                              availableProcedures={form.watch("procedimentosRealizados") || []}
                              value={field.value || []}
                              onChange={field.onChange}
                              placeholder="Selecionar e ordenar por volume..."
                            />
                          </FormControl>
                          <FormDescription className="text-xs">Ordem do maior para menor</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button 
                      type="button" 
                      variant="default" 
                      size="sm"
                      onClick={() => validateAndCompleteSection("perfil")}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Marcar como concluído
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 3. Comunicação */}
              <AccordionItem 
                value="comunicacao" 
                data-section-id="comunicacao"
                className={cn(
                  "border rounded-lg overflow-hidden transition-opacity",
                  !isSectionAccessible("comunicacao") && "opacity-50"
                )}
              >
                <AccordionTrigger 
                  className={cn(
                    "px-4 py-3 hover:no-underline",
                    completedSections.includes("comunicacao") && "bg-emerald-50 dark:bg-emerald-950/20"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleSection("comunicacao");
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📲</span>
                    <div className="text-left">
                      <p className="font-medium">3. Comunicação</p>
                      <p className="text-xs text-muted-foreground">6 campos • Canais e contatos</p>
                    </div>
                    {completedSections.includes("comunicacao") && (
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 ml-2">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Concluído
                      </Badge>
                    )}
                    {!isSectionAccessible("comunicacao") && (
                      <Badge variant="outline" className="ml-2">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Bloqueado
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-5 pt-2 max-w-2xl">

                    <FormField
                      control={form.control}
                      name="whatsappPrincipal"
                      render={({ field }) => (
                        <FormItem className={cn(getFieldHighlight(field.value))}>
                          <FormLabel>📱 WhatsApp principal <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="+55 85 99999-9999" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="responsavelOperacional"
                      render={({ field }) => (
                        <FormItem className={cn(getFieldHighlight(field.value))}>
                          <FormLabel>👤 Responsável operacional</FormLabel>
                          <FormControl>
                            <Input placeholder="Maria, secretária" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="horarioPreferencial"
                      render={({ field }) => (
                        <FormItem className={cn(getFieldHighlight(field.value))}>
                          <FormLabel>🕒 Horário preferencial</FormLabel>
                          <FormControl>
                            <Input placeholder="14h às 18h" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                  </div>

                  {/* Contato Principal (Fixo) */}
                  <div className="mt-6 pt-4 border-t">
                    <div className="flex items-center gap-2 mb-3">
                      <UserPlus className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">Contato Principal</span>
                      <span className="text-xs text-muted-foreground">(contato principal do cliente)</span>
                    </div>

                    <div className="p-3 border rounded-lg mb-3 bg-muted/30">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-muted-foreground">
                          Contato 1 (Fixo)
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="contatoPrincipal.nome"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">👤 Nome</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="João da Silva" 
                                  {...field} 
                                  className={cn("h-9", getInputHighlight(field.value))} 
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="contatoPrincipal.funcao"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">🧩 Função</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Secretária, Sócio, Financeiro..." 
                                  {...field} 
                                  className={cn("h-9", getInputHighlight(field.value))} 
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="contatoPrincipal.email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">📧 E-mail</FormLabel>
                              <FormControl>
                                <Input 
                                  type="email" 
                                  placeholder="email@exemplo.com" 
                                  {...field} 
                                  className={cn("h-9", getInputHighlight(field.value))} 
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="contatoPrincipal.whatsapp"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">📱 WhatsApp</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="+55 85 99999-9999" 
                                  {...field} 
                                  className={cn("h-9", getInputHighlight(field.value))} 
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contatos Adicionais */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">Contatos Adicionais</span>
                        <span className="text-xs text-muted-foreground">(outros e-mails, WhatsApps, responsáveis)</span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const currentContatos = form.getValues("contatosAdicionais") || [];
                          form.setValue("contatosAdicionais", [
                            ...currentContatos,
                            { nome: "", email: "", whatsapp: "", funcao: "" }
                          ]);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar Contato
                      </Button>
                    </div>

                    {form.watch("contatosAdicionais")?.map((_, index) => (
                      <div key={index} className="p-3 border rounded-lg mb-3 bg-muted/30">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-muted-foreground">
                            Contato {index + 2}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              const currentContatos = form.getValues("contatosAdicionais") || [];
                              form.setValue(
                                "contatosAdicionais",
                                currentContatos.filter((_, i) => i !== index)
                              );
                            }}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remover
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <FormField
                            control={form.control}
                            name={`contatosAdicionais.${index}.nome`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">👤 Nome</FormLabel>
                                <FormControl>
                                  <Input placeholder="João da Silva" {...field} className="h-9" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`contatosAdicionais.${index}.funcao`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">🧩 Função</FormLabel>
                                <FormControl>
                                  <Input placeholder="Secretária, Sócio, Financeiro..." {...field} className="h-9" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`contatosAdicionais.${index}.email`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">📧 E-mail</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="email@exemplo.com" {...field} className="h-9" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`contatosAdicionais.${index}.whatsapp`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">📱 WhatsApp</FormLabel>
                                <FormControl>
                                  <Input placeholder="+55 85 99999-9999" {...field} className="h-9" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}

                    {(!form.watch("contatosAdicionais") || form.watch("contatosAdicionais").length === 0) && (
                      <p className="text-xs text-muted-foreground text-center py-4 border rounded-lg border-dashed">
                        Nenhum contato adicional. Clique em "Adicionar Contato" para incluir outros responsáveis.
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button 
                      type="button" 
                      variant="default" 
                      size="sm"
                      onClick={() => validateAndCompleteSection("comunicacao")}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Marcar como concluído
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 4. Documentos atuais */}
              <AccordionItem 
                value="documentos" 
                data-section-id="documentos"
                className={cn(
                  "border rounded-lg overflow-hidden transition-opacity",
                  !isSectionAccessible("documentos") && "opacity-50"
                )}
              >
                <AccordionTrigger 
                  className={cn(
                    "px-4 py-3 hover:no-underline",
                    completedSections.includes("documentos") && "bg-emerald-50 dark:bg-emerald-950/20"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleSection("documentos");
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📄</span>
                    <div className="text-left">
                      <p className="font-medium">4. Documentos atuais</p>
                      <p className="text-xs text-muted-foreground">6 campos • Situação documental</p>
                    </div>
                    {completedSections.includes("documentos") && (
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 ml-2">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Concluído
                      </Badge>
                    )}
                    {!isSectionAccessible("documentos") && (
                      <Badge variant="outline" className="ml-2">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Bloqueado
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-5 pt-2 max-w-2xl">
                    <FormField
                      control={form.control}
                      name="usaDocumentosHoje"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <YesNoSelector
                              value={field.value}
                              onChange={field.onChange}
                              label="🧩 Usa documentos próprios hoje"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {form.watch("usaDocumentosHoje") && (
                      <div className="p-3 border rounded-lg bg-muted/30">
                        <FormLabel className="text-sm font-medium">📋 Documentos existentes</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                          {documentosOptions.map(doc => (
                            <FormField
                              key={doc}
                              control={form.control}
                              name="documentosExistentes"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(doc)}
                                      onCheckedChange={(checked) => {
                                        const newValue = checked
                                          ? [...(field.value || []), doc]
                                          : field.value?.filter((v: string) => v !== doc) || [];
                                        field.onChange(newValue);
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">{doc}</FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        
                        {/* Documentos adicionais personalizados */}
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-muted-foreground">Outros documentos:</span>
                          </div>
                          {form.watch("documentosExistentes")?.filter((d: string) => !documentosOptions.includes(d)).map((customDoc: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary" className="gap-1">
                                {customDoc}
                                <button
                                  type="button"
                                  className="ml-1 hover:text-destructive"
                                  onClick={() => {
                                    const current = form.getValues("documentosExistentes") || [];
                                    form.setValue("documentosExistentes", current.filter((d: string) => d !== customDoc));
                                  }}
                                >
                                  ×
                                </button>
                              </Badge>
                            </div>
                          ))}
                          <div className="flex gap-2">
                            <Input
                              placeholder="Digite o nome do documento..."
                              className="h-8 text-sm flex-1"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  const input = e.currentTarget;
                                  const value = input.value.trim();
                                  if (value) {
                                    const current = form.getValues("documentosExistentes") || [];
                                    if (!current.includes(value)) {
                                      form.setValue("documentosExistentes", [...current, value]);
                                    }
                                    input.value = "";
                                  }
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8"
                              onClick={(e) => {
                                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                const value = input?.value.trim();
                                if (value) {
                                  const current = form.getValues("documentosExistentes") || [];
                                  if (!current.includes(value)) {
                                    form.setValue("documentosExistentes", [...current, value]);
                                  }
                                  input.value = "";
                                }
                              }}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Adicionar
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="quemPreenche"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>👤 Quem preenche</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {quemPreencheOptions.map(opt => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="usaAssinaturaDigital"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <YesNoSelector
                              value={field.value}
                              onChange={field.onChange}
                              label="🔒 Usa assinatura digital"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {form.watch("usaAssinaturaDigital") && (
                      <FormField
                        control={form.control}
                        name="ferramentaAssinatura"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>🧾 Ferramenta de assinatura</FormLabel>
                            <FormControl>
                              <Input placeholder="Clicksign, DocuSign..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button 
                      type="button" 
                      variant="default" 
                      size="sm"
                      onClick={() => validateAndCompleteSection("documentos")}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Marcar como concluído
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>


              {/* 5. Documentos que serão entregues */}
              <AccordionItem 
                value="entregas" 
                data-section-id="entregas"
                className={cn(
                  "border rounded-lg overflow-hidden transition-opacity",
                  !isSectionAccessible("entregas") && "opacity-50"
                )}
              >
                <AccordionTrigger 
                  className={cn(
                    "px-4 py-3 hover:no-underline",
                    completedSections.includes("entregas") && "bg-emerald-50 dark:bg-emerald-950/20"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleSection("entregas");
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📦</span>
                    <div className="text-left">
                      <p className="font-medium">5. Documentos que serão entregues</p>
                      <p className="text-xs text-muted-foreground">17 documentos contratuais + adicionais</p>
                    </div>
                    {completedSections.includes("entregas") && (
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 ml-2">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Concluído
                      </Badge>
                    )}
                    {!isSectionAccessible("entregas") && (
                      <Badge variant="outline" className="ml-2">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Bloqueado
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-5 pt-2 max-w-2xl">
                    <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
                      <FormLabel className="text-sm font-medium">📄 Documentos contratuais do IPROMED</FormLabel>
                      <FormDescription className="text-xs">Selecione os documentos que serão entregues ao cliente</FormDescription>
                      
                      <FormField
                        control={form.control}
                        name="documentosEntregues"
                        render={({ field }) => (
                          <FormItem>
                            <div className="grid grid-cols-1 gap-2 mt-2">
                              {documentosContratuais.map((doc, index) => (
                                <div
                                  key={doc}
                                  className="flex items-center space-x-2 space-y-0"
                                >
                                  <Checkbox
                                    checked={field.value?.includes(doc)}
                                    onCheckedChange={(checked) => {
                                      const current = field.value || [];
                                      if (checked) {
                                        field.onChange([...current, doc]);
                                      } else {
                                        field.onChange(current.filter((d: string) => d !== doc));
                                      }
                                    }}
                                  />
                                  <label className="text-sm font-normal cursor-pointer">
                                    {index + 1}. {doc}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </FormItem>
                        )}
                      />

                      {/* Documentos adicionais */}
                      <div className="border-t pt-4 mt-4">
                        <div className="flex items-center justify-between mb-3">
                          <FormLabel className="text-sm font-medium">📝 Documentos adicionais combinados</FormLabel>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const current = form.getValues("documentosAdicionaisEntregues") || [];
                              form.setValue("documentosAdicionaisEntregues", [...current, { nome: "" }]);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Adicionar documento
                          </Button>
                        </div>
                        
                        {(form.watch("documentosAdicionaisEntregues") || []).length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-2">
                            Clique em "Adicionar documento" para incluir documentos extras combinados
                          </p>
                        )}

                        {(form.watch("documentosAdicionaisEntregues") || []).map((_, index) => (
                          <div key={index} className="flex items-center gap-2 mb-2">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-secondary-foreground font-medium text-xs">
                              +{index + 1}
                            </div>
                            <FormField
                              control={form.control}
                              name={`documentosAdicionaisEntregues.${index}.nome`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Input placeholder="Nome do documento adicional..." {...field} className="h-9" />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              onClick={() => {
                                const current = form.getValues("documentosAdicionaisEntregues") || [];
                                form.setValue("documentosAdicionaisEntregues", current.filter((_, i) => i !== index));
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button 
                      type="button" 
                      variant="default" 
                      size="sm"
                      onClick={() => validateAndCompleteSection("entregas")}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Marcar como concluído
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 6. Prioridades */}
              <AccordionItem 
                value="prioridades" 
                data-section-id="prioridades"
                className={cn(
                  "border rounded-lg overflow-hidden transition-opacity",
                  !isSectionAccessible("prioridades") && "opacity-50"
                )}
              >
                <AccordionTrigger 
                  className={cn(
                    "px-4 py-3 hover:no-underline",
                    completedSections.includes("prioridades") && "bg-emerald-50 dark:bg-emerald-950/20"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleSection("prioridades");
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🎯</span>
                    <div className="text-left">
                      <p className="font-medium">6. Prioridades</p>
                      <p className="text-xs text-muted-foreground">6 campos • Foco e histórico</p>
                    </div>
                    {completedSections.includes("prioridades") && (
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 ml-2">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Concluído
                      </Badge>
                    )}
                    {!isSectionAccessible("prioridades") && (
                      <Badge variant="outline" className="ml-2">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Bloqueado
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-5 pt-2 max-w-2xl">
                    <FormField
                      control={form.control}
                      name="possuiPrioridade"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <YesNoSelector
                              value={field.value}
                              onChange={field.onChange}
                              label="📌 Possui prioridade em algum ou alguns documentos?"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {form.watch("possuiPrioridade") && (
                      <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
                        <FormLabel className="text-sm font-medium">📄 Documentos contratuais prioritários</FormLabel>
                        <FormDescription className="text-xs">Selecione os documentos que são prioridade para este cliente</FormDescription>
                        
                        <FormField
                          control={form.control}
                          name="documentosPrioritariosSelecionados"
                          render={({ field }) => (
                            <FormItem>
                              <div className="grid grid-cols-1 gap-2 mt-2">
                                {documentosContratuais.map((doc, index) => (
                                  <div
                                    key={doc}
                                    className="flex items-center space-x-2 space-y-0"
                                  >
                                    <Checkbox
                                      checked={field.value?.includes(doc)}
                                      onCheckedChange={(checked) => {
                                        const current = field.value || [];
                                        if (checked) {
                                          field.onChange([...current, doc]);
                                        } else {
                                          field.onChange(current.filter((d: string) => d !== doc));
                                        }
                                      }}
                                    />
                                    <label className="text-sm font-normal cursor-pointer">
                                      {index + 1}. {doc}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </FormItem>
                          )}
                        />

                        {/* Documentos adicionais personalizados */}
                        <div className="border-t pt-4 mt-4">
                          <div className="flex items-center justify-between mb-3">
                            <FormLabel className="text-sm font-medium">📝 Documentos adicionais</FormLabel>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const current = form.getValues("documentosPrioritarios") || [];
                                form.setValue("documentosPrioritarios", [...current, { nome: "" }]);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Adicionar documento
                            </Button>
                          </div>
                          
                          {(form.watch("documentosPrioritarios") || []).length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-2">
                              Clique em "Adicionar documento" para registrar documentos fora do escopo padrão
                            </p>
                          )}

                          {(form.watch("documentosPrioritarios") || []).map((_, index) => (
                            <div key={index} className="flex items-center gap-2 mb-2">
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-secondary-foreground font-medium text-xs">
                                +{index + 1}
                              </div>
                              <FormField
                                control={form.control}
                                name={`documentosPrioritarios.${index}.nome`}
                                render={({ field }) => (
                                  <FormItem className="flex-1">
                                    <FormControl>
                                      <Input placeholder="Nome do documento adicional..." {...field} className="h-9" />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={() => {
                                  const current = form.getValues("documentosPrioritarios") || [];
                                  form.setValue("documentosPrioritarios", current.filter((_, i) => i !== index));
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="jaTeveProblemAnterior"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <YesNoSelector
                              value={field.value}
                              onChange={field.onChange}
                              label="🧨 Já teve problema anterior"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {form.watch("jaTeveProblemAnterior") && (
                      <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-sm font-medium">📝 Problemas anteriores</FormLabel>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const current = form.getValues("problemasAnteriores") || [];
                              form.setValue("problemasAnteriores", [...current, { titulo: "", descricao: "" }]);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Adicionar problema
                          </Button>
                        </div>
                        
                        {(form.watch("problemasAnteriores") || []).length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Clique em "Adicionar problema" para registrar um problema anterior
                          </p>
                        )}

                        {(form.watch("problemasAnteriores") || []).map((_, index) => (
                          <div key={index} className="p-3 border rounded-lg bg-background space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Problema {index + 1}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={() => {
                                  const current = form.getValues("problemasAnteriores") || [];
                                  form.setValue("problemasAnteriores", current.filter((_, i) => i !== index));
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <FormField
                              control={form.control}
                              name={`problemasAnteriores.${index}.titulo`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Título do problema</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Ex: Reclamação de paciente" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`problemasAnteriores.${index}.descricao`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Descrição</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Descreva o problema sem dados sensíveis..." 
                                      className="min-h-[60px]"
                                      {...field} 
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        ))}
                        
                        <p className="text-xs text-muted-foreground">Sem dados sensíveis desnecessários</p>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button 
                      type="button" 
                      variant="default" 
                      size="sm"
                      onClick={() => validateAndCompleteSection("prioridades")}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Marcar como concluído
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 7. Prazos */}
              <AccordionItem 
                value="prazos" 
                data-section-id="prazos"
                className={cn(
                  "border rounded-lg overflow-hidden transition-opacity",
                  !isSectionAccessible("prazos") && "opacity-50"
                )}
              >
                <AccordionTrigger 
                  className={cn(
                    "px-4 py-3 hover:no-underline",
                    completedSections.includes("prazos") && "bg-emerald-50 dark:bg-emerald-950/20"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleSection("prazos");
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🗓️</span>
                    <div className="text-left">
                      <p className="font-medium">7. Prazos</p>
                      <p className="text-xs text-muted-foreground">4 campos • Cronograma de entregas</p>
                    </div>
                    {completedSections.includes("prazos") && (
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 ml-2">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Concluído
                      </Badge>
                    )}
                    {!isSectionAccessible("prazos") && (
                      <Badge variant="outline" className="ml-2">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Bloqueado
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-6 pt-2">
                    {/* Seção: Datas Base */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/30">
                      <FormField
                        control={form.control}
                        name="dataOnboarding"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>📅 Data do Onboarding (hoje)</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} value={field.value ?? ""} />
                            </FormControl>
                            <FormDescription className="text-xs">Base para documentos novos</FormDescription>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="dataRecebimentoDocsAtuais"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>📥 Data prevista de recebimento dos docs atuais</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} value={field.value ?? ""} />
                            </FormControl>
                            <FormDescription className="text-xs">Base para revisão de documentos</FormDescription>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Seção: Prazos Padrão */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/30">
                      <FormField
                        control={form.control}
                        name="prazoPadraoRevisao"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>⏳ Prazo para revisão (dias úteis)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                placeholder="Ex: 20"
                                value={field.value ?? 20}
                                onChange={(e) => field.onChange(Number(e.target.value) || 20)}
                              />
                            </FormControl>
                            <FormDescription className="text-xs">Documentos atuais enviados pelo cliente</FormDescription>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="prazoPadraoCriacao"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>⏳ Prazo para criação (dias úteis)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                placeholder="Ex: 20"
                                value={field.value ?? 20}
                                onChange={(e) => field.onChange(Number(e.target.value) || 20)}
                              />
                            </FormControl>
                            <FormDescription className="text-xs">Documentos novos do IPROMED</FormDescription>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Seção: Datas Calculadas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-secondary/30">
                      <FormField
                        control={form.control}
                        name="dataPrevistaRevisao"
                        render={({ field }) => {
                          // Cálculo automático: dataRecebimento + prazoPadraoRevisao dias úteis
                          const dataRecebimento = form.watch("dataRecebimentoDocsAtuais");
                          const prazo = form.watch("prazoPadraoRevisao") || 20;
                          
                          const calcularDataUtil = (dataInicio: string, diasUteis: number) => {
                            if (!dataInicio) return "";
                            const data = new Date(dataInicio);
                            let diasAdicionados = 0;
                            while (diasAdicionados < diasUteis) {
                              data.setDate(data.getDate() + 1);
                              const diaSemana = data.getDay();
                              if (diaSemana !== 0 && diaSemana !== 6) {
                                diasAdicionados++;
                              }
                            }
                            return data.toISOString().split('T')[0];
                          };
                          
                          const dataCalculada = calcularDataUtil(dataRecebimento || "", prazo);
                          
                          // Auto-preencher se vazio ou diferente
                          if (dataCalculada && field.value !== dataCalculada) {
                            setTimeout(() => field.onChange(dataCalculada), 0);
                          }
                          
                          return (
                            <FormItem>
                              <FormLabel>🗓️ Data prevista de revisão</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date" 
                                  {...field} 
                                  value={field.value ?? dataCalculada}
                                  className="bg-background"
                                />
                              </FormControl>
                              <FormDescription className="text-xs text-emerald-600 dark:text-emerald-400">
                                Calculada: recebimento + {prazo} dias úteis
                              </FormDescription>
                            </FormItem>
                          );
                        }}
                      />
                      <FormField
                        control={form.control}
                        name="dataPrevistaCriacao"
                        render={({ field }) => {
                          // Cálculo automático: dataOnboarding + prazoPadraoCriacao dias úteis
                          const dataOnboarding = form.watch("dataOnboarding");
                          const prazo = form.watch("prazoPadraoCriacao") || 20;
                          
                          const calcularDataUtil = (dataInicio: string, diasUteis: number) => {
                            if (!dataInicio) return "";
                            const data = new Date(dataInicio);
                            let diasAdicionados = 0;
                            while (diasAdicionados < diasUteis) {
                              data.setDate(data.getDate() + 1);
                              const diaSemana = data.getDay();
                              if (diaSemana !== 0 && diaSemana !== 6) {
                                diasAdicionados++;
                              }
                            }
                            return data.toISOString().split('T')[0];
                          };
                          
                          const dataCalculada = calcularDataUtil(dataOnboarding || "", prazo);
                          
                          // Auto-preencher se vazio ou diferente
                          if (dataCalculada && field.value !== dataCalculada) {
                            setTimeout(() => field.onChange(dataCalculada), 0);
                          }
                          
                          return (
                            <FormItem>
                              <FormLabel>🗓️ Data prevista de criação</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date" 
                                  {...field} 
                                  value={field.value ?? dataCalculada}
                                  className="bg-background"
                                />
                              </FormControl>
                              <FormDescription className="text-xs text-emerald-600 dark:text-emerald-400">
                                Calculada: onboarding + {prazo} dias úteis
                              </FormDescription>
                            </FormItem>
                          );
                        }}
                      />
                    </div>

                    {/* Matriz de Documentos */}
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-muted p-3 border-b">
                        <h4 className="font-medium text-sm">📋 Matriz de Documentos e Prazos</h4>
                        <p className="text-xs text-muted-foreground mt-1">Marque os documentos que o cliente já possui e veja os prazos automaticamente</p>
                      </div>
                      
                      <div className="divide-y">
                        {/* Cabeçalho */}
                        <div className="grid grid-cols-12 gap-2 p-3 bg-muted/50 text-xs font-medium">
                          <div className="col-span-6">Documento</div>
                          <div className="col-span-2 text-center">Já possui?</div>
                          <div className="col-span-2 text-center">Tipo</div>
                          <div className="col-span-2 text-center">Prazo</div>
                        </div>
                        
                        {/* Lista de documentos */}
                        {documentosContratuais.map((doc, index) => {
                          const documentoKey = doc.replace(/[^a-zA-Z0-9]/g, '_');
                          const jaPossui = form.watch(`documentosAtuaisStatus.${documentoKey}`) || false;
                          const dataPrevistaRevisao = form.watch("dataPrevistaRevisao");
                          const dataPrevistaCriacao = form.watch("dataPrevistaCriacao");
                          
                          return (
                            <div key={doc} className={cn(
                              "grid grid-cols-12 gap-2 p-3 items-center text-sm",
                              index % 2 === 0 ? "bg-background" : "bg-muted/20"
                            )}>
                              <div className="col-span-6 flex items-center gap-2">
                                <span className="text-xs text-muted-foreground w-5">{index + 1}.</span>
                                <span className="text-sm">{doc}</span>
                              </div>
                              <div className="col-span-2 flex justify-center">
                                <Checkbox
                                  checked={jaPossui}
                                  onCheckedChange={(checked) => {
                                    const currentStatus = form.getValues("documentosAtuaisStatus") || {};
                                    form.setValue("documentosAtuaisStatus", {
                                      ...currentStatus,
                                      [documentoKey]: checked === true
                                    });
                                  }}
                                />
                              </div>
                              <div className="col-span-2 text-center">
                                <Badge variant={jaPossui ? "secondary" : "outline"} className="text-xs">
                                  {jaPossui ? "Revisão" : "Criação"}
                                </Badge>
                              </div>
                              <div className="col-span-2 text-center">
                                <span className={cn(
                                  "text-xs font-medium",
                                  jaPossui ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                                )}>
                                  {jaPossui 
                                    ? (dataPrevistaRevisao ? new Date(dataPrevistaRevisao + 'T00:00:00').toLocaleDateString('pt-BR') : '-')
                                    : (dataPrevistaCriacao ? new Date(dataPrevistaCriacao + 'T00:00:00').toLocaleDateString('pt-BR') : '-')
                                  }
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Resumo */}
                      <div className="bg-muted/50 p-3 border-t flex justify-between text-xs">
                        <span>
                          <strong>Documentos existentes:</strong> {Object.values(form.watch("documentosAtuaisStatus") || {}).filter(Boolean).length} (revisão)
                        </span>
                        <span>
                          <strong>Documentos novos:</strong> {17 - Object.values(form.watch("documentosAtuaisStatus") || {}).filter(Boolean).length} (criação)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button 
                      type="button" 
                      variant="default" 
                      size="sm"
                      onClick={() => validateAndCompleteSection("prazos")}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Marcar como concluído
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 8. Treinamento */}
              <AccordionItem 
                value="treinamento" 
                data-section-id="treinamento"
                className={cn(
                  "border rounded-lg overflow-hidden transition-opacity",
                  !isSectionAccessible("treinamento") && "opacity-50"
                )}
              >
                <AccordionTrigger 
                  className={cn(
                    "px-4 py-3 hover:no-underline",
                    completedSections.includes("treinamento") && "bg-emerald-50 dark:bg-emerald-950/20"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleSection("treinamento");
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🎓</span>
                    <div className="text-left">
                      <p className="font-medium">8. Treinamento</p>
                      <p className="text-xs text-muted-foreground">5 campos • Capacitação da equipe</p>
                    </div>
                    {completedSections.includes("treinamento") && (
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 ml-2">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Concluído
                      </Badge>
                    )}
                    {!isSectionAccessible("treinamento") && (
                      <Badge variant="outline" className="ml-2">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Bloqueado
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-5 pt-2 max-w-2xl">
                    <FormField
                      control={form.control}
                      name="necessitaTreinamento"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <YesNoSelector
                              value={field.value}
                              onChange={field.onChange}
                              label="❓ Necessita treinamento"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {form.watch("necessitaTreinamento") && (
                      <>
                        <FormField
                          control={form.control}
                          name="quemSeraTreinado"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>👤 Quem será treinado</FormLabel>
                              <FormControl>
                                <Input placeholder="Secretária e recepção" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="formatoTreinamento"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>📍 Formato do treinamento</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {formatoTreinamentoOptions.map(opt => (
                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="dataSugeridaTreinamento"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>🗓️ Data do treinamento</FormLabel>
                              <FormControl>
                                <Input type="datetime-local" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="duvidasPrincipais"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>📝 Dúvidas principais</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Como assinar e arquivar..." 
                                  className="min-h-[60px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription className="text-xs">Direciona pauta do treinamento</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button 
                      type="button" 
                      variant="default" 
                      size="sm"
                      onClick={() => validateAndCompleteSection("treinamento")}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Marcar como concluído
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 9. Instagram */}
              <AccordionItem 
                value="instagram" 
                data-section-id="instagram"
                className={cn(
                  "border rounded-lg overflow-hidden transition-opacity",
                  !isSectionAccessible("instagram") && "opacity-50"
                )}
              >
                <AccordionTrigger 
                  className={cn(
                    "px-4 py-3 hover:no-underline",
                    completedSections.includes("instagram") && "bg-emerald-50 dark:bg-emerald-950/20"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleSection("instagram");
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📸</span>
                    <div className="text-left">
                      <p className="font-medium">9. Instagram</p>
                      <p className="text-xs text-muted-foreground">7 campos • Análise de perfil</p>
                    </div>
                    {completedSections.includes("instagram") && (
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 ml-2">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Concluído
                      </Badge>
                    )}
                    {!isSectionAccessible("instagram") && (
                      <Badge variant="outline" className="ml-2">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Bloqueado
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-5 pt-2 max-w-2xl">
                    <FormField
                      control={form.control}
                      name="instagramHandle"
                      render={({ field }) => (
                        <FormItem className={cn(getFieldHighlight(field.value))}>
                          <FormLabel>📲 @ do Instagram</FormLabel>
                          <FormControl>
                            <Input placeholder="@drjoao" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="responsavelPerfil"
                      render={({ field }) => (
                        <FormItem className={cn(getFieldHighlight(field.value))}>
                          <FormLabel>👤 Responsável pelo perfil</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {responsavelPerfilOptions.map(opt => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fazAnuncios"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <YesNoSelector
                              value={field.value}
                              onChange={field.onChange}
                              label="📣 Faz anúncios"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />


                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="riscosEncontrados"
                        render={({ field }) => (
                          <FormItem className={cn(getFieldHighlight(field.value))}>
                            <FormLabel>⚠️ Riscos encontrados</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Descreva os riscos encontrados: antes e depois, promessas, etc..." 
                                className="min-h-[80px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription className="text-xs">Preenchido pela advogada</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-sm font-medium">📎 Anexos (prints ou PDFs)</FormLabel>
                          <label htmlFor="riscos-file-upload">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="cursor-pointer"
                              onClick={() => document.getElementById('riscos-file-upload')?.click()}
                            >
                              <Upload className="h-4 w-4 mr-1" />
                              Adicionar arquivo
                            </Button>
                          </label>
                          <input
                            id="riscos-file-upload"
                            type="file"
                            accept="image/*,.pdf"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              const files = e.target.files;
                              if (files) {
                                const current = form.getValues("riscosArquivos") || [];
                                const newFiles = Array.from(files).map(f => ({
                                  nome: f.name,
                                  tipo: f.type,
                                }));
                                form.setValue("riscosArquivos", [...current, ...newFiles]);
                              }
                              e.target.value = '';
                            }}
                          />
                        </div>

                        {(form.watch("riscosArquivos") || []).length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-3">
                            Nenhum arquivo anexado. Adicione prints ou PDFs para ilustrar os riscos.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {(form.watch("riscosArquivos") || []).map((arquivo, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-background rounded border">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm flex-1 truncate">{arquivo.nome}</span>
                                <Badge variant="outline" className="text-xs">
                                  {arquivo.tipo.includes('pdf') ? 'PDF' : 'Imagem'}
                                </Badge>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                  onClick={() => {
                                    const current = form.getValues("riscosArquivos") || [];
                                    form.setValue("riscosArquivos", current.filter((_, i) => i !== index));
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="orientacoesDadas"
                      render={({ field }) => (
                        <FormItem className={cn(getFieldHighlight(field.value))}>
                          <FormLabel>✅ Orientações dadas</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Ajustar bio e legendas..." 
                              className="min-h-[60px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription className="text-xs">Preenchido pela advogada</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button 
                      type="button" 
                      variant="default" 
                      size="sm"
                      onClick={() => validateAndCompleteSection("instagram")}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Marcar como concluído
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 10. Contrato */}
              <AccordionItem 
                value="contrato" 
                data-section-id="contrato"
                className={cn(
                  "border rounded-lg overflow-hidden transition-opacity",
                  !isSectionAccessible("contrato") && "opacity-50"
                )}
              >
                <AccordionTrigger 
                  className={cn(
                    "px-4 py-3 hover:no-underline",
                    completedSections.includes("contrato") && "bg-emerald-50 dark:bg-emerald-950/20"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleSection("contrato");
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📑</span>
                    <div className="text-left">
                      <p className="font-medium">10. Contrato</p>
                      <p className="text-xs text-muted-foreground">4 campos • Aceite e dúvidas</p>
                    </div>
                    {completedSections.includes("contrato") && (
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 ml-2">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Concluído
                      </Badge>
                    )}
                    {!isSectionAccessible("contrato") && (
                      <Badge variant="outline" className="ml-2">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Bloqueado
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-5 pt-2 max-w-2xl">
                    <FormField
                      control={form.control}
                      name="leituraConcluida"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <YesNoSelector
                              value={field.value}
                              onChange={field.onChange}
                              label="✅ Leitura do contrato concluída"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="aceiteContrato"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <YesNoSelector
                              value={field.value}
                              onChange={field.onChange}
                              label="🤝 Aceite do contrato"
                              className="bg-primary/5"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-sm font-medium">❓ Dúvidas e Respostas</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const current = form.getValues("duvidasRespostas") || [];
                            form.setValue("duvidasRespostas", [...current, { duvida: "", resposta: "" }]);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Adicionar dúvida
                        </Button>
                      </div>
                      
                      {(form.watch("duvidasRespostas") || []).length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Clique em "Adicionar dúvida" para registrar uma dúvida e sua resposta
                        </p>
                      )}

                      {(form.watch("duvidasRespostas") || []).map((_, index) => (
                        <div key={index} className="p-3 border rounded-lg bg-background space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Dúvida {index + 1}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              onClick={() => {
                                const current = form.getValues("duvidasRespostas") || [];
                                form.setValue("duvidasRespostas", current.filter((_, i) => i !== index));
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <FormField
                            control={form.control}
                            name={`duvidasRespostas.${index}.duvida`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">❓ Dúvida</FormLabel>
                                <FormControl>
                                  <Input placeholder="Qual a dúvida do cliente?" {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`duvidasRespostas.${index}.resposta`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">✅ Resposta dada</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Qual foi a resposta dada?" 
                                    className="min-h-[60px]"
                                    {...field} 
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      ))}
                    </div>

                    <FormField
                      control={form.control}
                      name="ajustesSolicitados"
                      render={({ field }) => (
                        <FormItem className={cn(getFieldHighlight(field.value))}>
                          <FormLabel>🛠️ Ajustes solicitados</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Ajustar forma de pagamento..." 
                              className="min-h-[60px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription className="text-xs">Se houver, abrir tarefa jurídica</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button 
                      type="button" 
                      variant="default" 
                      size="sm"
                      onClick={() => validateAndCompleteSection("contrato")}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Marcar como concluído
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-background border-t pt-4 mt-6 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {completedSections.length} de {sections.length} seções concluídas
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" className="gap-2">
                  <Save className="h-4 w-4" />
                  Salvar Pauta
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </ScrollArea>
    </div>
  );
}

// Componente wrapper para abrir como Dialog
export function OnboardingMeetingDialog({
  trigger,
  clientId,
  clientName,
  onSubmit,
}: {
  trigger?: React.ReactNode;
  clientId?: string;
  clientName?: string;
  onSubmit?: (data: OnboardingMeetingData) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Reunião de Onboarding
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[95vh] p-0">
        <OnboardingMeetingAgenda
          clientId={clientId}
          clientName={clientName}
          onSubmit={(data) => {
            onSubmit?.(data);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
