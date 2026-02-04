/**
 * IPROMED - Pauta Oficial de Reunião de Onboarding
 * Formulário completo com 10 seções e 43 campos para registro de novos clientes
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
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
  Users,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import ProcedureSelector from "./ProcedureSelector";
import { cn } from "@/lib/utils";
import { ProcedureVolumeSelector } from "./ProcedureVolumeSelector";
import { YesNoSelector } from "./YesNoSelector";
import { WeeklyScheduleInput, defaultWeeklySchedule, type WeeklySchedule } from "./WeeklyScheduleInput";

// Helper para destacar campos não preenchidos - aplicar no input/select
const getInputHighlight = (value: string | number | boolean | undefined | null | unknown[], hasError?: boolean) => {
  // Se tem erro explícito, destacar em vermelho
  if (hasError) {
    return "bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-500 ring-2 ring-red-500/30";
  }
  // Campos não preenchidos (aviso leve)
  if (value === undefined || value === null || value === "" || value === 0 || 
      (Array.isArray(value) && value.length === 0)) {
    return "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700";
  }
  return "";
};

// Helper para FormItem com erro
const getFormItemError = (hasError?: boolean) => {
  if (hasError) {
    return "animate-pulse";
  }
  return "";
};

// Alias antigo para compatibilidade (não usar mais)
const getFieldHighlight = (_value: string | number | boolean | undefined | null | unknown[]) => {
  return ""; // Desativado - usar getInputHighlight no input
};

// Schema de validação
const onboardingMeetingSchema = z.object({
  // Cliente vinculado (obrigatório)
  clienteId: z.string().min(1, "Selecione um cliente"),
  
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
  horarioSemanal: z.object({
    segunda: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
    terca: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
    quarta: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
    quinta: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
    sexta: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
    sabado: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
    domingo: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
  }).optional(),

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
  
  riscosInstagram: z.array(z.object({
    descricao: z.string().optional(),
    arquivos: z.array(z.object({
      nome: z.string(),
      tipo: z.string(),
    })).default([]),
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
      { name: "contatoPrincipal.nome" as keyof OnboardingMeetingData, label: "Nome do contato principal" },
      { name: "contatoPrincipal.funcao" as keyof OnboardingMeetingData, label: "Função do contato principal" },
      { name: "contatoPrincipal.email" as keyof OnboardingMeetingData, label: "E-mail do contato principal" },
      { name: "contatoPrincipal.whatsapp" as keyof OnboardingMeetingData, label: "WhatsApp do contato principal" },
    ]
  },
  // Seções "Documentos atuais" e "Prazos" removidas - integradas na seção "Documentos que serão entregues"
  { 
    id: "entregas", 
    icon: Upload, 
    title: "Documentos que serão entregues", 
    emoji: "📦", 
    fields: ["4.2.1", "4.2.2"],
    requiredFields: []
  },
  { 
    id: "treinamento", 
    icon: GraduationCap, 
    title: "Treinamento", 
    emoji: "🎓", 
    fields: ["5.2.1", "5.2.2", "5.2.3", "5.2.4", "5.2.5"],
    requiredFields: []
  },
  { 
    id: "instagram", 
    icon: Instagram, 
    title: "Instagram", 
    emoji: "📸", 
    fields: ["6.2.1", "6.2.2", "6.2.3", "6.2.4", "6.2.5", "6.2.6", "6.2.7"],
    requiredFields: []
  },
  { 
    id: "contrato", 
    icon: FileSignature, 
    title: "Contrato", 
    emoji: "📑", 
    fields: ["7.2.1", "7.2.2", "7.2.3", "7.2.4"],
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
  meetingId?: string;
  onSubmit?: (data: OnboardingMeetingData) => void;
  onClose?: () => void;
  initialData?: Partial<OnboardingMeetingData>;
  /** Se true, exibe o componente de forma compacta sem header/footer externos */
  embedded?: boolean;
}

// Gerar chave única para localStorage baseado no clientId
const STORAGE_KEY_PREFIX = "ipromed_onboarding_";

export default function OnboardingMeetingAgenda({
  clientId,
  clientName,
  meetingId,
  onSubmit,
  onClose,
  initialData,
  embedded = false,
}: OnboardingMeetingAgendaProps) {
  const queryClient = useQueryClient();
  // Buscar clientes cadastrados
  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ['ipromed-clients-onboarding'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_legal_clients')
        .select('id, name, email, phone, cpf_cnpj, journey_stage')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Estado do cliente selecionado
  const [selectedClientId, setSelectedClientId] = useState<string>(clientId || "");
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  
  // Cliente selecionado
  const selectedClient = useMemo(() => {
    return clients.find(c => c.id === selectedClientId);
  }, [clients, selectedClientId]);

  // Chave única para este cliente/sessão
  const storageKey = `${STORAGE_KEY_PREFIX}${selectedClientId || 'new'}`;
  
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
  const [fieldsWithError, setFieldsWithError] = useState<string[]>([]);
  
  // Controlar qual seção está expandida (apenas a atual)
  const currentSection = sections[currentSectionIndex];
  const expandedSections = currentSection ? [currentSection.id] : [];

  const form = useForm<OnboardingMeetingData>({
    resolver: zodResolver(onboardingMeetingSchema),
    defaultValues: {
      clienteId: savedCheckpoint?.formData?.clienteId ?? clientId ?? "",
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
      horarioSemanal: savedCheckpoint?.formData?.horarioSemanal ?? defaultWeeklySchedule,
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
      
      riscosInstagram: savedCheckpoint?.formData?.riscosInstagram ?? [],
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

  // Mutation para salvar no banco de dados
  const saveOnboardingMutation = useMutation({
    mutationFn: async (data: OnboardingMeetingData) => {
      const clientIdToSave = selectedClientId || clientId;
      if (!clientIdToSave) throw new Error("Cliente não selecionado");

      const isComplete = completedSections.length === sections.length;
      const progressPercent = Math.round((completedSections.length / sections.length) * 100);

      // 1. Salvar/atualizar na tabela de onboarding
      const { data: existingOnboarding } = await supabase
        .from('ipromed_client_onboarding')
        .select('id')
        .eq('client_id', clientIdToSave)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingOnboarding?.id) {
        // Atualizar existente
        await supabase
          .from('ipromed_client_onboarding')
          .update({
            onboarding_data: data,
            progress_percentage: progressPercent,
            completed_sections: completedSections,
            status: isComplete ? 'completed' : 'in_progress',
            completed_at: isComplete ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingOnboarding.id);
      } else {
        // Criar novo
        await supabase
          .from('ipromed_client_onboarding')
          .insert({
            client_id: clientIdToSave,
            meeting_id: meetingId || null,
            onboarding_data: data,
            progress_percentage: progressPercent,
            completed_sections: completedSections,
            status: isComplete ? 'completed' : 'in_progress',
            completed_at: isComplete ? new Date().toISOString() : null,
          });
      }

      // 2. Atualizar a reunião com os dados do onboarding (se tiver meeting_id)
      if (meetingId) {
        await supabase
          .from('ipromed_client_meetings')
          .update({
            onboarding_data: data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', meetingId);
      }

      // 3. Atualizar o cliente como onboarding completo (se completo)
      if (isComplete) {
        await supabase
          .from('ipromed_legal_clients')
          .update({
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString(),
          })
          .eq('id', clientIdToSave);
      }

      // 4. Registrar atividade no histórico do cliente
      await supabase
        .from('ipromed_client_activities')
        .insert({
          client_id: clientIdToSave,
          action: isComplete ? 'complete' : 'update',
          activity_type: isComplete ? 'onboarding_completed' : 'onboarding_updated',
          title: isComplete ? 'Onboarding concluído' : 'Onboarding atualizado',
          description: isComplete 
            ? `Checklist de onboarding concluído com ${sections.length} seções preenchidas.`
            : `Progresso do onboarding: ${progressPercent}% (${completedSections.length}/${sections.length} seções)`,
          metadata: {
            meeting_id: meetingId,
            progress_percentage: progressPercent,
            completed_sections: completedSections,
          },
        });

      return { isComplete, progressPercent };
    },
    onSuccess: ({ isComplete, progressPercent }) => {
      queryClient.invalidateQueries({ queryKey: ['ipromed-client-onboarding'] });
      queryClient.invalidateQueries({ queryKey: ['ipromed-client-activities'] });
      queryClient.invalidateQueries({ queryKey: ['ipromed-clients'] });
      queryClient.invalidateQueries({ queryKey: ['ipromed-client-meetings'] });
      
      clearCheckpoint();
      
      if (isComplete) {
        toast.success("🎉 Onboarding concluído e salvo!", {
          description: "Todos os dados foram registrados no histórico do cliente.",
        });
      } else {
        toast.success("Progresso salvo!", {
          description: `${progressPercent}% do onboarding foi registrado.`,
        });
      }
      
      onSubmit?.(form.getValues());
      onClose?.();
    },
    onError: (error) => {
      console.error("Erro ao salvar onboarding:", error);
      toast.error("Erro ao salvar onboarding", {
        description: "Tente novamente ou contate o suporte.",
      });
    },
  });

  const handleSubmit = (data: OnboardingMeetingData) => {
    saveOnboardingMutation.mutate(data);
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
    const missingFields: { name: string; label: string }[] = [];

    // Verificar campos obrigatórios (suporta campos aninhados como "contatoPrincipal.nome")
    for (const field of section.requiredFields) {
      const fieldName = field.name as string;
      let value: unknown;
      
      if (fieldName.includes('.')) {
        // Campo aninhado
        const parts = fieldName.split('.');
        value = parts.reduce((obj: any, key) => obj?.[key], formValues);
      } else {
        value = formValues[field.name];
      }
      
      const isEmpty = value === undefined || value === null || value === "" || 
        (Array.isArray(value) && value.length === 0);
      
      if (isEmpty) {
        missingFields.push({ name: fieldName, label: field.label });
      }
    }

    if (missingFields.length > 0) {
      // Marcar campos com erro
      const errorFieldNames = missingFields.map(f => f.name);
      setFieldsWithError(errorFieldNames);

      toast.error("Preencha os campos obrigatórios", {
        description: (
          <div className="mt-2">
            <p className="font-medium mb-1">Campos faltando:</p>
            <ul className="list-disc list-inside text-sm">
              {missingFields.map((field, i) => (
                <li key={i}>{field.label}</li>
              ))}
            </ul>
          </div>
        ),
        duration: 5000,
      });

      // Scroll para o primeiro campo com erro
      setTimeout(() => {
        const firstErrorField = errorFieldNames[0];
        // Tentar encontrar o campo pelo atributo data-field-name ou name
        const fieldElement = document.querySelector(
          `[data-field-name="${firstErrorField}"], [name="${firstErrorField}"], [id="${firstErrorField}"]`
        );
        
        if (fieldElement) {
          fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Focar no campo se for um input
          if (fieldElement instanceof HTMLInputElement || fieldElement instanceof HTMLTextAreaElement) {
            fieldElement.focus();
          }
        }
      }, 100);

      return;
    }

    // Limpar erros ao validar com sucesso
    setFieldsWithError([]);

    // Marcar como concluída
    if (!completedSections.includes(sectionId)) {
      setCompletedSections(prev => [...prev, sectionId]);
    }

    // Avançar para próxima seção
    const currentIndex = sections.findIndex(s => s.id === sectionId);
    if (currentIndex < sections.length - 1) {
      setCurrentSectionIndex(currentIndex + 1);
      
      // Scroll para o topo da próxima seção dentro do ScrollArea
      setTimeout(() => {
        const nextSectionId = sections[currentIndex + 1].id;
        const accordionElement = document.querySelector(`[data-section-id="${nextSectionId}"]`);
        
        if (accordionElement) {
          // Encontrar o container de scroll (ScrollArea viewport)
          const scrollContainer = accordionElement.closest('[data-radix-scroll-area-viewport]');
          
          if (scrollContainer) {
            // Calcular a posição relativa do elemento dentro do container
            const containerRect = scrollContainer.getBoundingClientRect();
            const elementRect = accordionElement.getBoundingClientRect();
            const scrollTop = scrollContainer.scrollTop + (elementRect.top - containerRect.top) - 20;
            
            scrollContainer.scrollTo({
              top: scrollTop,
              behavior: 'smooth'
            });
          } else {
            // Fallback para scrollIntoView
            accordionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }, 150);
      
      toast.success("Seção concluída!", {
        description: `Avançando para: ${sections[currentIndex + 1].title}`,
      });
    } else {
      // Última seção - definir índice para -1 para fechar todas as seções
      setCurrentSectionIndex(-1);
      toast.success("Todas as seções foram concluídas! 🎉", {
        description: "Você pode salvar a pauta agora.",
      });
    }
  }, [form, completedSections]);

  const progress = Math.round((completedSections.length / sections.length) * 100);

  const handlePrint = () => {
    window.print();
    toast.success("Preparando impressão...");
  };

  // Filtrar clientes pela busca
  const filteredClients = useMemo(() => {
    if (!clientSearchTerm) return clients;
    const term = clientSearchTerm.toLowerCase();
    return clients.filter(c => 
      c.name.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.cpf_cnpj?.includes(term)
    );
  }, [clients, clientSearchTerm]);

  // Quando selecionar um cliente, preencher o nome
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find(c => c.id === clientId);
    if (client) {
      form.setValue("clienteId", clientId);
      form.setValue("nomeCompleto", client.name);
      form.setValue("emailPrincipal", client.email || "");
      toast.success(`Cliente "${client.name}" selecionado`);
    }
  };

  return (
    <div className={cn(
      "flex flex-col",
      embedded ? "h-auto max-h-[60vh]" : "h-full max-h-[90vh]"
    )}>
      {/* Header fixo - oculto no modo embedded */}
      {!embedded && (
        <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <FileSignature className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Pauta de Reunião de Onboarding</h2>
              <p className="text-sm text-muted-foreground">
                IPROMED • {selectedClient?.name || "Selecione um cliente"}
              </p>
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
      )}

      {/* Progress bar compacta para modo embedded */}
      {embedded && (
        <div className="flex items-center justify-between p-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{progress}% concluído</span>
          </div>
          <Progress value={progress} className="w-32 h-2" />
        </div>
      )}

      {/* Seletor de Cliente - aparece se não houver cliente selecionado (oculto no modo embedded) */}
      {!selectedClientId && !embedded && (
        <div className="p-4 border-b bg-amber-50 dark:bg-amber-950/20">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-5 w-5 text-amber-600" />
            <h3 className="font-semibold text-amber-800 dark:text-amber-200">
              Selecione o cliente para iniciar o onboarding
            </h3>
          </div>
          
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente por nome, email ou CPF/CNPJ..."
              value={clientSearchTerm}
              onChange={(e) => setClientSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {isLoadingClients ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mr-2" />
              Carregando clientes...
            </div>
          ) : clients.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="font-medium">Nenhum cliente cadastrado</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Cadastre clientes na seção "Clientes" antes de iniciar o onboarding.
                </p>
                <Button variant="outline" onClick={onClose}>
                  Ir para Clientes
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-2 max-h-60 overflow-y-auto">
              {filteredClients.map((client) => (
                <Card 
                  key={client.id}
                  className={cn(
                    "cursor-pointer transition-all hover:border-primary hover:shadow-sm",
                    selectedClientId === client.id && "border-primary bg-primary/5"
                  )}
                  onClick={() => handleClientSelect(client.id)}
                >
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      {client.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{client.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {client.email || client.cpf_cnpj || "Sem email"}
                      </p>
                    </div>
                    {client.journey_stage && (
                      <Badge variant="secondary" className="text-xs">
                        {client.journey_stage}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
              {filteredClients.length === 0 && clientSearchTerm && (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum cliente encontrado para "{clientSearchTerm}"
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Cliente selecionado - mostrar resumo (oculto no modo embedded) */}
      {selectedClientId && selectedClient && !embedded && (
        <div className="p-3 border-b bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-medium">
              {selectedClient.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-emerald-800 dark:text-emerald-200">{selectedClient.name}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                {selectedClient.email || selectedClient.cpf_cnpj}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setSelectedClientId("");
              form.setValue("clienteId", "");
            }}
            className="text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100"
          >
            Trocar cliente
          </Button>
        </div>
      )}

      {/* Conteúdo scrollável - mostra se tiver cliente selecionado OU se está em modo embedded */}
      {(selectedClientId || embedded) && (
        <ScrollArea className="flex-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className={cn("space-y-4", embedded ? "p-3" : "p-4")}>
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
                        <FormItem className={cn(getFormItemError(fieldsWithError.includes("nomeCompleto")))}>
                          <FormLabel>🪪 Nome completo do cliente <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="João da Silva Pereira" 
                              data-field-name="nomeCompleto"
                              className={cn(getInputHighlight(field.value, fieldsWithError.includes("nomeCompleto")))}
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription className="text-xs">Conferir grafia</FormDescription>
                          {fieldsWithError.includes("nomeCompleto") && (
                            <p className="text-sm text-destructive font-medium">⚠️ Campo obrigatório</p>
                          )}
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
                  <div className="space-y-5 pt-2">
                    {/* Horário Preferencial Semanal - Primeiro campo */}
                    <FormField
                      control={form.control}
                      name="horarioSemanal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>🕒 Horário preferencial de contato</FormLabel>
                          <FormControl>
                            <WeeklyScheduleInput 
                              value={field.value as WeeklySchedule} 
                              onChange={field.onChange} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                  </div>

                  {/* Contato Principal (Obrigatório) */}
                  <div className="mt-6 pt-4 border-t">
                    <div className="flex items-center gap-2 mb-3">
                      <UserPlus className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">Contato Principal</span>
                      <span className="text-destructive">*</span>
                      <span className="text-xs text-muted-foreground">(obrigatório)</span>
                    </div>

                    <div className="p-3 border border-primary/30 rounded-lg mb-3 bg-primary/5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-primary">
                          Contato 1 (Obrigatório)
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="contatoPrincipal.nome"
                          render={({ field }) => (
                            <FormItem className={cn(getFormItemError(fieldsWithError.includes("contatoPrincipal.nome")))}>
                              <FormLabel className="text-xs">👤 Nome <span className="text-destructive">*</span></FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="João da Silva" 
                                  data-field-name="contatoPrincipal.nome"
                                  {...field} 
                                  className={cn("h-9", getInputHighlight(field.value, fieldsWithError.includes("contatoPrincipal.nome")))} 
                                />
                              </FormControl>
                              {fieldsWithError.includes("contatoPrincipal.nome") && (
                                <p className="text-xs text-destructive font-medium">⚠️ Obrigatório</p>
                              )}
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="contatoPrincipal.funcao"
                          render={({ field }) => (
                            <FormItem className={cn(getFormItemError(fieldsWithError.includes("contatoPrincipal.funcao")))}>
                              <FormLabel className="text-xs">🧩 Função <span className="text-destructive">*</span></FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Secretária, Sócio, Financeiro..." 
                                  data-field-name="contatoPrincipal.funcao"
                                  {...field} 
                                  className={cn("h-9", getInputHighlight(field.value, fieldsWithError.includes("contatoPrincipal.funcao")))} 
                                />
                              </FormControl>
                              {fieldsWithError.includes("contatoPrincipal.funcao") && (
                                <p className="text-xs text-destructive font-medium">⚠️ Obrigatório</p>
                              )}
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="contatoPrincipal.email"
                          render={({ field }) => (
                            <FormItem className={cn(getFormItemError(fieldsWithError.includes("contatoPrincipal.email")))}>
                              <FormLabel className="text-xs">📧 E-mail <span className="text-destructive">*</span></FormLabel>
                              <FormControl>
                                <Input 
                                  type="email" 
                                  placeholder="email@exemplo.com" 
                                  data-field-name="contatoPrincipal.email"
                                  {...field} 
                                  className={cn("h-9", getInputHighlight(field.value, fieldsWithError.includes("contatoPrincipal.email")))} 
                                />
                              </FormControl>
                              {fieldsWithError.includes("contatoPrincipal.email") && (
                                <p className="text-xs text-destructive font-medium">⚠️ Obrigatório</p>
                              )}
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="contatoPrincipal.whatsapp"
                          render={({ field }) => (
                            <FormItem className={cn(getFormItemError(fieldsWithError.includes("contatoPrincipal.whatsapp")))}>
                              <FormLabel className="text-xs">📱 WhatsApp <span className="text-destructive">*</span></FormLabel>
                              <FormControl>
                                <PhoneInput 
                                  placeholder="(85) 99999-9999" 
                                  data-field-name="contatoPrincipal.whatsapp"
                                  value={field.value}
                                  onChange={field.onChange}
                                  className={cn("h-9", getInputHighlight(field.value, fieldsWithError.includes("contatoPrincipal.whatsapp")))} 
                                />
                              </FormControl>
                              {fieldsWithError.includes("contatoPrincipal.whatsapp") && (
                                <p className="text-xs text-destructive font-medium">⚠️ Obrigatório</p>
                              )}
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
                                  <PhoneInput placeholder="(85) 99999-9999" value={field.value} onChange={field.onChange} className="h-9" />
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

              {/* 4. Documentos que serão entregues */}
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
                      <p className="font-medium">4. Documentos que serão entregues</p>
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
                  <div className="space-y-5 pt-2">
                    {/* Matriz de Documentos Unificada */}
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-muted p-3 border-b">
                        <h4 className="font-medium text-sm">📋 Matriz de Documentos Contratuais IPROMED</h4>
                        <p className="text-xs text-muted-foreground mt-1">Todos os 17 documentos serão entregues (criados ou revisados conforme situação). Marque prioridade para prazo reduzido (10 dias).</p>
                      </div>
                      
                      {/* Tabela responsiva */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-muted/50 text-xs font-medium">
                              <th className="p-3 text-left w-10">#</th>
                              <th className="p-3 text-left">Documento</th>
                              <th className="p-3 text-center w-28">Já possui?</th>
                              <th className="p-3 text-center w-24">Ação</th>
                              <th className="p-3 text-center w-20">
                                <span className="flex items-center justify-center gap-1">
                                  🚨 Prio
                                </span>
                              </th>
                              <th className="p-3 text-center w-28">Prazo</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {documentosContratuais.map((doc, index) => {
                              const documentoKey = doc.replace(/[^a-zA-Z0-9]/g, '_');
                              const statusValue = form.watch(`documentosAtuaisStatus.${documentoKey}`);
                              const jaPossui = statusValue === true;
                              const naoTemDoc = statusValue === false;
                              const naoDefinido = statusValue === undefined;
                              const isPrioridade = (form.watch("documentosPrioritariosSelecionados") || []).includes(doc);
                              const dataPrevistaRevisao = form.watch("dataPrevistaRevisao");
                              const dataPrevistaCriacao = form.watch("dataPrevistaCriacao");
                              
                              return (
                                <tr key={doc} className={cn(
                                  "transition-colors",
                                  isPrioridade 
                                    ? "bg-red-50 dark:bg-red-950/20 border-l-4 border-l-red-500" 
                                    : naoDefinido 
                                      ? "bg-muted/20"
                                      : index % 2 === 0 ? "bg-background" : "bg-muted/10",
                                  jaPossui && !isPrioridade && "bg-amber-50/30 dark:bg-amber-950/10"
                                )}>
                                  <td className={cn(
                                    "p-3 font-medium",
                                    isPrioridade ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                                  )}>{index + 1}</td>
                                  <td className={cn(
                                    "p-3",
                                    isPrioridade && "font-medium text-red-700 dark:text-red-300"
                                  )}>{doc}</td>
                                  <td className="p-3 text-center">
                                    <div className="flex justify-center gap-1">
                                      <Button
                                        type="button"
                                        variant={jaPossui ? "default" : "outline"}
                                        size="sm"
                                        className={cn(
                                          "h-7 text-xs px-2",
                                          jaPossui && "bg-emerald-600 hover:bg-emerald-700"
                                        )}
                                        onClick={() => {
                                          const currentStatus = form.getValues("documentosAtuaisStatus") || {};
                                          form.setValue("documentosAtuaisStatus", {
                                            ...currentStatus,
                                            [documentoKey]: true
                                          });
                                        }}
                                      >
                                        Sim
                                      </Button>
                                      <Button
                                        type="button"
                                        variant={naoTemDoc ? "default" : "outline"}
                                        size="sm"
                                        className={cn(
                                          "h-7 text-xs px-2",
                                          naoTemDoc && "bg-slate-600 hover:bg-slate-700"
                                        )}
                                        onClick={() => {
                                          const currentStatus = form.getValues("documentosAtuaisStatus") || {};
                                          form.setValue("documentosAtuaisStatus", {
                                            ...currentStatus,
                                            [documentoKey]: false
                                          });
                                        }}
                                      >
                                        Não
                                      </Button>
                                    </div>
                                  </td>
                                  <td className="p-3 text-center">
                                    {naoDefinido ? (
                                      <Badge variant="outline" className="text-xs text-muted-foreground">
                                        —
                                      </Badge>
                                    ) : (
                                      <Badge 
                                        variant={jaPossui ? "secondary" : "outline"} 
                                        className={cn(
                                          "text-xs",
                                          jaPossui 
                                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200" 
                                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200"
                                        )}
                                      >
                                        {jaPossui ? "Revisão" : "Criação"}
                                      </Badge>
                                    )}
                                  </td>
                                  <td className="p-3 text-center">
                                    <Checkbox
                                      checked={isPrioridade}
                                      onCheckedChange={(checked) => {
                                        const current = form.getValues("documentosPrioritariosSelecionados") || [];
                                        if (checked) {
                                          form.setValue("documentosPrioritariosSelecionados", [...current, doc]);
                                        } else {
                                          form.setValue("documentosPrioritariosSelecionados", current.filter((d: string) => d !== doc));
                                        }
                                      }}
                                      className={cn(
                                        "h-5 w-5",
                                        isPrioridade && "border-red-500 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                                      )}
                                    />
                                  </td>
                                  <td className="p-3 text-center">
                                    {naoDefinido ? (
                                      <span className="text-xs text-muted-foreground">—</span>
                                    ) : (
                                      <span className={cn(
                                        "text-xs font-medium",
                                        isPrioridade 
                                          ? "text-red-600 dark:text-red-400 font-bold" 
                                          : jaPossui 
                                            ? "text-blue-600 dark:text-blue-400" 
                                            : "text-emerald-600 dark:text-emerald-400"
                                      )}>
                                        {isPrioridade 
                                          ? "🚨 10 dias úteis"
                                          : jaPossui 
                                            ? "20 dias úteis"
                                            : (dataPrevistaCriacao ? new Date(dataPrevistaCriacao + 'T00:00:00').toLocaleDateString('pt-BR') : '—')
                                        }
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                            
                            {/* Documentos adicionais como linhas da tabela */}
                            {(form.watch("documentosAdicionaisEntregues") || []).map((doc, index) => (
                              <tr key={`adicional-${index}`} className="border-b hover:bg-muted/50 bg-blue-50/30 dark:bg-blue-950/10">
                                <td className="p-3 font-medium text-sm text-center text-blue-600 dark:text-blue-400">
                                  +{index + 1}
                                </td>
                                <td className="p-3">
                                  <FormField
                                    control={form.control}
                                    name={`documentosAdicionaisEntregues.${index}.nome`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Input 
                                            placeholder="Nome do documento adicional..." 
                                            {...field} 
                                            className="h-8 text-sm bg-transparent border-dashed" 
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </td>
                                <td className="p-3 text-center">
                                  {/* Célula vazia para manter alinhamento */}
                                </td>
                                <td className="p-3 text-center">
                                  <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200">
                                    Adicional
                                  </Badge>
                                </td>
                                <td className="p-3 text-center">
                                  {/* Célula vazia para manter alinhamento */}
                                </td>
                                <td className="p-3 text-center">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => {
                                      const current = form.getValues("documentosAdicionaisEntregues") || [];
                                      form.setValue("documentosAdicionaisEntregues", current.filter((_, i) => i !== index));
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                            
                            {/* Linha para adicionar novo documento - destacada */}
                            <tr className="bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20 transition-all">
                              <td colSpan={6} className="p-3">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="default"
                                  className="w-full h-12 text-primary font-medium border-2 border-dashed border-primary/40 hover:border-primary hover:bg-primary/10 transition-all shadow-sm"
                                  onClick={() => {
                                    const current = form.getValues("documentosAdicionaisEntregues") || [];
                                    form.setValue("documentosAdicionaisEntregues", [...current, { nome: "" }]);
                                  }}
                                >
                                  <Plus className="h-5 w-5 mr-2" />
                                  Adicionar documento extra
                                </Button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Resumo */}
                      <div className="bg-muted/50 p-3 border-t grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
                        <div className="text-center">
                          <span className="text-muted-foreground">A revisar:</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400 ml-1">
                            {Object.values(form.watch("documentosAtuaisStatus") || {}).filter(Boolean).length}
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="text-muted-foreground">A criar:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 ml-1">
                            {17 - Object.values(form.watch("documentosAtuaisStatus") || {}).filter(Boolean).length}
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="text-muted-foreground">🚨 Prioritários:</span>
                          <span className="font-bold text-red-600 dark:text-red-400 ml-1">
                            {(form.watch("documentosPrioritariosSelecionados") || []).length}
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="text-muted-foreground">Prazo normal:</span>
                          <span className="font-medium text-emerald-600 dark:text-emerald-400 ml-1">
                            20 dias
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="text-muted-foreground">Prazo prioritário:</span>
                          <span className="font-bold text-red-600 dark:text-red-400 ml-1">
                            10 dias
                          </span>
                        </div>
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

              {/* Seção de Prioridades removida - integrada na tabela de documentos */}

              {/* Seção de Prazos removida - integrada na seção "Documentos que serão entregues" */}

              {/* 5. Treinamento */}
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
                      <p className="font-medium">5. Treinamento</p>
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

              {/* 6. Instagram */}
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
                      <p className="font-medium">6. Instagram</p>
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
                      render={({ field }) => {
                        // Limpar @ do início se usuário digitar
                        const handleValue = field.value?.replace(/^@/, '') || '';
                        const instagramUrl = handleValue ? `https://www.instagram.com/${handleValue}` : '';
                        
                        return (
                          <FormItem className={cn(getFieldHighlight(field.value))}>
                            <FormLabel>📲 Link do Instagram</FormLabel>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground whitespace-nowrap">www.instagram.com/</span>
                              <FormControl>
                                <Input 
                                  placeholder="drjoao" 
                                  {...field} 
                                  value={handleValue}
                                  onChange={(e) => field.onChange(e.target.value.replace(/^@/, ''))}
                                  className="flex-1"
                                />
                              </FormControl>
                              {handleValue && (
                                <a 
                                  href={instagramUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary hover:underline whitespace-nowrap"
                                >
                                  Abrir ↗
                                </a>
                              )}
                            </div>
                            {handleValue && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Link completo: <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{instagramUrl}</a>
                              </p>
                            )}
                            <FormMessage />
                          </FormItem>
                        );
                      }}
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

                    {/* Lista de Riscos do Instagram */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <FormLabel className="text-sm font-medium">⚠️ Riscos encontrados no Instagram</FormLabel>
                          <FormDescription className="text-xs">Cada risco com seus prints vinculados</FormDescription>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const current = form.getValues("riscosInstagram") || [];
                            form.setValue("riscosInstagram", [...current, { descricao: "", arquivos: [] }]);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Adicionar risco
                        </Button>
                      </div>

                      {(form.watch("riscosInstagram") || []).length === 0 ? (
                        <div className="p-6 border rounded-lg bg-muted/30 text-center">
                          <p className="text-sm text-muted-foreground">
                            Nenhum risco cadastrado. Clique em "Adicionar risco" para registrar.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {(form.watch("riscosInstagram") || []).map((risco, riscoIndex) => (
                            <div key={riscoIndex} className="p-4 border rounded-lg bg-muted/30 space-y-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-destructive/10 text-destructive font-medium text-xs">
                                    {riscoIndex + 1}
                                  </span>
                                  <span className="text-sm font-medium">Risco #{riscoIndex + 1}</span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  onClick={() => {
                                    const current = form.getValues("riscosInstagram") || [];
                                    form.setValue("riscosInstagram", current.filter((_, i) => i !== riscoIndex));
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              {/* Descrição do risco */}
                              <FormField
                                control={form.control}
                                name={`riscosInstagram.${riscoIndex}.descricao`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">Descrição do risco</FormLabel>
                                    <FormControl>
                                      <Textarea
                                        placeholder="Descreva o risco encontrado: antes e depois, promessas, etc..."
                                        className="min-h-[60px]"
                                        {...field}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />

                              {/* Anexos do risco específico */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <FormLabel className="text-xs">📎 Prints deste risco</FormLabel>
                                  <label htmlFor={`risco-file-upload-${riscoIndex}`}>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs cursor-pointer"
                                      onClick={() => document.getElementById(`risco-file-upload-${riscoIndex}`)?.click()}
                                    >
                                      <Upload className="h-3 w-3 mr-1" />
                                      Anexar print
                                    </Button>
                                  </label>
                                  <input
                                    id={`risco-file-upload-${riscoIndex}`}
                                    type="file"
                                    accept="image/*,.pdf"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => {
                                      const files = e.target.files;
                                      if (files) {
                                        const currentRiscos = form.getValues("riscosInstagram") || [];
                                        const currentArquivos = currentRiscos[riscoIndex]?.arquivos || [];
                                        const newFiles = Array.from(files).map(f => ({
                                          nome: f.name,
                                          tipo: f.type,
                                        }));
                                        const updatedRiscos = [...currentRiscos];
                                        updatedRiscos[riscoIndex] = {
                                          ...updatedRiscos[riscoIndex],
                                          arquivos: [...currentArquivos, ...newFiles],
                                        };
                                        form.setValue("riscosInstagram", updatedRiscos);
                                      }
                                      e.target.value = '';
                                    }}
                                  />
                                </div>

                                {(risco.arquivos || []).length === 0 ? (
                                  <p className="text-xs text-muted-foreground text-center py-2 bg-background rounded">
                                    Nenhum print anexado
                                  </p>
                                ) : (
                                  <div className="space-y-1">
                                    {(risco.arquivos || []).map((arquivo, arquivoIndex) => (
                                      <div key={arquivoIndex} className="flex items-center gap-2 p-2 bg-background rounded border text-xs">
                                        <FileText className="h-3 w-3 text-muted-foreground" />
                                        <span className="flex-1 truncate">{arquivo.nome}</span>
                                        <Badge variant="outline" className="text-[10px] h-5">
                                          {arquivo.tipo?.includes('pdf') ? 'PDF' : 'IMG'}
                                        </Badge>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                                          onClick={() => {
                                            const currentRiscos = form.getValues("riscosInstagram") || [];
                                            const updatedRiscos = [...currentRiscos];
                                            updatedRiscos[riscoIndex] = {
                                              ...updatedRiscos[riscoIndex],
                                              arquivos: (updatedRiscos[riscoIndex].arquivos || []).filter((_, i) => i !== arquivoIndex),
                                            };
                                            form.setValue("riscosInstagram", updatedRiscos);
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
                          ))}
                        </div>
                      )}
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

              {/* 7. Contrato */}
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
                      <p className="font-medium">7. Contrato</p>
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

            {/* Footer Actions - simplificado no modo embedded */}
            {embedded ? (
              <div className="sticky bottom-0 bg-background border-t pt-3 mt-4 flex items-center justify-end">
                <Button type="submit" size="sm" className="gap-2">
                  <Save className="h-4 w-4" />
                  Salvar
                </Button>
              </div>
            ) : (
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
            )}
          </form>
        </Form>
      </ScrollArea>
      )}
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
