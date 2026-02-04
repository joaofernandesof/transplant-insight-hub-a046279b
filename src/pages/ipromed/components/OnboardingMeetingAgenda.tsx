/**
 * IPROMED - Pauta Oficial de Reunião de Onboarding
 * Formulário completo com 10 seções e 43 campos para registro de novos clientes
 */

import { useState } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Schema de validação
const onboardingMeetingSchema = z.object({
  // 1. Boas-vindas e abertura
  nomeCompleto: z.string().min(1, "Nome completo é obrigatório"),
  nomePreferencia: z.string().optional(),
  cargoFuncao: z.string().optional(),
  clinicaEmpresa: z.string().optional(),
  cidadeEstado: z.string().optional(),
  objetivoPrincipal: z.string().optional(),

  // 2. Perfil profissional
  areaAtuacao: z.string().optional(),
  possuiRQE: z.boolean().default(false),
  numeroRQE: z.string().optional(),
  tempoAtuacao: z.coerce.number().optional(),
  formatoAtendimento: z.array(z.string()).default([]),
  estruturaPrincipal: z.string().optional(),
  tamanhoEquipe: z.coerce.number().optional(),
  procedimentosRealizados: z.string().optional(),
  procedimentosMaiorVolume: z.string().optional(),

  // 3. Comunicação
  canalOficial: z.string().optional(),
  emailPrincipal: z.string().email("Email inválido").optional().or(z.literal("")),
  whatsappPrincipal: z.string().optional(),
  responsavelOperacional: z.string().optional(),
  horarioPreferencial: z.string().optional(),
  regraUrgencia: z.string().optional(),

  // 4. Documentos atuais
  usaDocumentosHoje: z.boolean().default(false),
  documentosExistentes: z.array(z.string()).default([]),
  armazenamentoAtual: z.string().optional(),
  quemPreenche: z.string().optional(),
  usaAssinaturaDigital: z.boolean().default(false),
  ferramentaAssinatura: z.string().optional(),

  // 5. Envio para análise
  formaEnvio: z.string().optional(),
  linkDrive: z.string().optional(),
  dataPrometidaEnvio: z.string().optional(),
  statusRecebimento: z.string().default("Pendente"),

  // 6. Prioridades
  criterioPrioridade: z.string().optional(),
  prioridade1: z.string().optional(),
  prioridade2: z.string().optional(),
  prioridade3: z.string().optional(),
  jaTeveProblemAnterior: z.boolean().default(false),
  descricaoProblema: z.string().optional(),

  // 7. Prazos
  cenarioCliente: z.string().optional(),
  dataRecebimentoCompleto: z.string().optional(),
  prazoPadraoInformado: z.coerce.number().default(20),
  dataPrevistaEntrega: z.string().optional(),

  // 8. Treinamento
  necessitaTreinamento: z.boolean().default(false),
  quemSeraTreinado: z.string().optional(),
  formatoTreinamento: z.string().optional(),
  dataSugeridaTreinamento: z.string().optional(),
  duvidasPrincipais: z.string().optional(),

  // 9. Instagram
  instagramHandle: z.string().optional(),
  responsavelPerfil: z.string().optional(),
  fazAnuncios: z.boolean().default(false),
  canalPrincipalLeads: z.string().optional(),
  riscosEncontrados: z.string().optional(),
  orientacoesDadas: z.string().optional(),
  acoesImediatas: z.string().optional(),

  // 10. Contrato
  leituraConcluida: z.boolean().default(false),
  duvidasRegistradas: z.string().optional(),
  ajustesSolicitados: z.string().optional(),
  aceiteContrato: z.boolean().default(false),
});

type OnboardingMeetingData = z.infer<typeof onboardingMeetingSchema>;

interface Section {
  id: string;
  icon: React.ElementType;
  title: string;
  emoji: string;
  fields: string[];
}

const sections: Section[] = [
  { id: "boas-vindas", icon: HandMetal, title: "Boas-vindas e abertura", emoji: "👋", fields: ["1.2.1", "1.2.2", "1.2.3", "1.2.4", "1.2.5", "1.2.6"] },
  { id: "perfil", icon: Stethoscope, title: "Perfil profissional", emoji: "🩺", fields: ["2.2.1", "2.2.2", "2.2.3", "2.2.4", "2.2.5", "2.2.6", "2.2.7", "2.2.8", "2.2.9"] },
  { id: "comunicacao", icon: MessageSquare, title: "Comunicação", emoji: "📲", fields: ["3.2.1", "3.2.2", "3.2.3", "3.2.4", "3.2.5", "3.2.6"] },
  { id: "documentos", icon: FileText, title: "Documentos atuais", emoji: "📄", fields: ["4.2.1", "4.2.2", "4.2.3", "4.2.4", "4.2.5", "4.2.6"] },
  { id: "envio", icon: Upload, title: "Envio para análise", emoji: "📤", fields: ["5.2.1", "5.2.2", "5.2.3", "5.2.4"] },
  { id: "prioridades", icon: Target, title: "Prioridades", emoji: "🎯", fields: ["6.2.1", "6.2.2", "6.2.3", "6.2.4", "6.2.5", "6.2.6"] },
  { id: "prazos", icon: Calendar, title: "Prazos", emoji: "🗓️", fields: ["7.2.1", "7.2.2", "7.2.3", "7.2.4"] },
  { id: "treinamento", icon: GraduationCap, title: "Treinamento", emoji: "🎓", fields: ["8.2.1", "8.2.2", "8.2.3", "8.2.4", "8.2.5"] },
  { id: "instagram", icon: Instagram, title: "Instagram", emoji: "📸", fields: ["9.2.1", "9.2.2", "9.2.3", "9.2.4", "9.2.5", "9.2.6", "9.2.7"] },
  { id: "contrato", icon: FileSignature, title: "Contrato", emoji: "📑", fields: ["10.2.1", "10.2.2", "10.2.3", "10.2.4"] },
];

// Opções de listas suspensas
const cargoOptions = ["Médico", "Gestor", "Sócio", "Outro"];
const formatoAtendimentoOptions = ["Clínica própria", "Terceiros", "Hospital", "Consultório", "Teleconsulta"];
const estruturaOptions = ["Clínica própria", "Consultório alugado", "Hospital", "Coworking médico"];
const canalOficialOptions = ["WhatsApp", "E-mail", "Telefone", "Telegram"];
const regraUrgenciaOptions = ["Ligar para sócias", "Enviar WhatsApp", "E-mail prioritário", "Aguardar horário comercial"];
const documentosOptions = ["TCLE", "Contrato de prestação", "Termo de imagem", "Anamnese", "Prontuário", "Política de agendamento"];
const armazenamentoOptions = ["Google Drive", "OneDrive", "Pasta local", "Sistema próprio", "Não possui"];
const quemPreencheOptions = ["Secretária", "Médico", "Recepção", "Equipe administrativa"];
const formaEnvioOptions = ["Google Drive", "OneDrive", "E-mail", "WeTransfer", "WhatsApp"];
const statusRecebimentoOptions = ["Pendente", "Recebido parcial", "Recebido completo"];
const criterioPrioridadeOptions = ["Risco jurídico", "Frequência de uso", "Urgência comercial", "Volume de atendimentos"];
const cenarioClienteOptions = ["Tem documentos", "Sem documentos", "Documentos parciais"];
const formatoTreinamentoOptions = ["Online", "Presencial", "Híbrido"];
const responsavelPerfilOptions = ["Equipe", "Cliente", "Agência", "Social media"];
const canalLeadsOptions = ["WhatsApp", "Direct", "Link na bio", "Telefone"];

interface OnboardingMeetingAgendaProps {
  clientId?: string;
  clientName?: string;
  onSubmit?: (data: OnboardingMeetingData) => void;
  onClose?: () => void;
  initialData?: Partial<OnboardingMeetingData>;
}

export default function OnboardingMeetingAgenda({
  clientId,
  clientName = "Novo Cliente",
  onSubmit,
  onClose,
  initialData,
}: OnboardingMeetingAgendaProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(["boas-vindas"]);
  const [completedSections, setCompletedSections] = useState<string[]>([]);

  const form = useForm<OnboardingMeetingData>({
    resolver: zodResolver(onboardingMeetingSchema),
    defaultValues: {
      nomeCompleto: clientName || "",
      nomePreferencia: "",
      cargoFuncao: "",
      clinicaEmpresa: "",
      cidadeEstado: "",
      objetivoPrincipal: "",
      areaAtuacao: "",
      possuiRQE: false,
      numeroRQE: "",
      tempoAtuacao: 0,
      formatoAtendimento: [],
      estruturaPrincipal: "",
      tamanhoEquipe: 0,
      procedimentosRealizados: "",
      procedimentosMaiorVolume: "",
      canalOficial: "",
      emailPrincipal: "",
      whatsappPrincipal: "",
      responsavelOperacional: "",
      horarioPreferencial: "",
      regraUrgencia: "",
      usaDocumentosHoje: false,
      documentosExistentes: [],
      armazenamentoAtual: "",
      quemPreenche: "",
      usaAssinaturaDigital: false,
      ferramentaAssinatura: "",
      formaEnvio: "",
      linkDrive: "",
      dataPrometidaEnvio: "",
      statusRecebimento: "Pendente",
      criterioPrioridade: "",
      prioridade1: "",
      prioridade2: "",
      prioridade3: "",
      jaTeveProblemAnterior: false,
      descricaoProblema: "",
      cenarioCliente: "",
      dataRecebimentoCompleto: "",
      prazoPadraoInformado: 20,
      dataPrevistaEntrega: "",
      necessitaTreinamento: false,
      quemSeraTreinado: "",
      formatoTreinamento: "",
      dataSugeridaTreinamento: "",
      duvidasPrincipais: "",
      instagramHandle: "",
      responsavelPerfil: "",
      fazAnuncios: false,
      canalPrincipalLeads: "",
      riscosEncontrados: "",
      orientacoesDadas: "",
      acoesImediatas: "",
      leituraConcluida: false,
      duvidasRegistradas: "",
      ajustesSolicitados: "",
      aceiteContrato: false,
      ...initialData,
    },
  });

  const handleSubmit = (data: OnboardingMeetingData) => {
    onSubmit?.(data);
    toast.success("Pauta de onboarding salva com sucesso!", {
      description: "Todos os dados da reunião foram registrados.",
    });
    onClose?.();
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(s => s !== sectionId)
        : [...prev, sectionId]
    );
  };

  const markSectionComplete = (sectionId: string) => {
    if (!completedSections.includes(sectionId)) {
      setCompletedSections(prev => [...prev, sectionId]);
    }
  };

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
              type="multiple" 
              value={expandedSections}
              className="space-y-3"
            >
              {/* 1. Boas-vindas e abertura */}
              <AccordionItem value="boas-vindas" className="border rounded-lg overflow-hidden">
                <AccordionTrigger 
                  className={cn(
                    "px-4 py-3 hover:no-underline",
                    completedSections.includes("boas-vindas") && "bg-emerald-50 dark:bg-emerald-950/20"
                  )}
                  onClick={() => toggleSection("boas-vindas")}
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
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <FormField
                      control={form.control}
                      name="nomeCompleto"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>🪪 Nome completo do cliente *</FormLabel>
                          <FormControl>
                            <Input placeholder="João da Silva Pereira" {...field} />
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
                        <FormItem>
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
                        <FormItem>
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
                      name="clinicaEmpresa"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>🏥 Clínica ou empresa</FormLabel>
                          <FormControl>
                            <Input placeholder="Clínica X" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cidadeEstado"
                      render={({ field }) => (
                        <FormItem>
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
                      name="objetivoPrincipal"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
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
                      variant="outline" 
                      size="sm"
                      onClick={() => markSectionComplete("boas-vindas")}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Marcar como concluído
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 2. Perfil profissional */}
              <AccordionItem value="perfil" className="border rounded-lg overflow-hidden">
                <AccordionTrigger 
                  className={cn(
                    "px-4 py-3 hover:no-underline",
                    completedSections.includes("perfil") && "bg-emerald-50 dark:bg-emerald-950/20"
                  )}
                  onClick={() => toggleSection("perfil")}
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
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                    <FormField
                      control={form.control}
                      name="areaAtuacao"
                      render={({ field }) => (
                        <FormItem>
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
                        <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-3">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel className="font-normal">🏷️ Possui RQE</FormLabel>
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
                            <Input type="number" min="0" placeholder="7" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="estruturaPrincipal"
                      render={({ field }) => (
                        <FormItem>
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
                            <Input type="number" min="0" placeholder="6" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="procedimentosRealizados"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2 lg:col-span-3">
                          <FormLabel>⚙️ Procedimentos realizados</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Transplante capilar, Botox, Preenchimento..." 
                              className="min-h-[60px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription className="text-xs">Lista separada por vírgula</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="procedimentosMaiorVolume"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2 lg:col-span-3">
                          <FormLabel>📈 Procedimentos de maior volume</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="1. Transplante capilar, 2. Consulta..." 
                              className="min-h-[60px]"
                              {...field} 
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
                      variant="outline" 
                      size="sm"
                      onClick={() => markSectionComplete("perfil")}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Marcar como concluído
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 3. Comunicação */}
              <AccordionItem value="comunicacao" className="border rounded-lg overflow-hidden">
                <AccordionTrigger 
                  className={cn(
                    "px-4 py-3 hover:no-underline",
                    completedSections.includes("comunicacao") && "bg-emerald-50 dark:bg-emerald-950/20"
                  )}
                  onClick={() => toggleSection("comunicacao")}
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
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <FormField
                      control={form.control}
                      name="canalOficial"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>💬 Canal oficial</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {canalOficialOptions.map(opt => (
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
                      name="emailPrincipal"
                      render={({ field }) => (
                        <FormItem>
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
                      name="whatsappPrincipal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>📱 WhatsApp principal</FormLabel>
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
                        <FormItem>
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
                        <FormItem>
                          <FormLabel>🕒 Horário preferencial</FormLabel>
                          <FormControl>
                            <Input placeholder="14h às 18h" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="regraUrgencia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>🚨 Regra de urgência *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {regraUrgenciaOptions.map(opt => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => markSectionComplete("comunicacao")}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Marcar como concluído
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 4. Documentos atuais */}
              <AccordionItem value="documentos" className="border rounded-lg overflow-hidden">
                <AccordionTrigger 
                  className={cn(
                    "px-4 py-3 hover:no-underline",
                    completedSections.includes("documentos") && "bg-emerald-50 dark:bg-emerald-950/20"
                  )}
                  onClick={() => toggleSection("documentos")}
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
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <FormField
                      control={form.control}
                      name="usaDocumentosHoje"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-3">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel className="font-normal">🧩 Usa documentos próprios hoje</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="armazenamentoAtual"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>📍 Armazenamento atual</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {armazenamentoOptions.map(opt => (
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
                        <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-3">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel className="font-normal">🔒 Usa assinatura digital</FormLabel>
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

                    <div className="md:col-span-2">
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
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => markSectionComplete("documentos")}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Marcar como concluído
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 5. Envio para análise */}
              <AccordionItem value="envio" className="border rounded-lg overflow-hidden">
                <AccordionTrigger 
                  className={cn(
                    "px-4 py-3 hover:no-underline",
                    completedSections.includes("envio") && "bg-emerald-50 dark:bg-emerald-950/20"
                  )}
                  onClick={() => toggleSection("envio")}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📤</span>
                    <div className="text-left">
                      <p className="font-medium">5. Envio para análise</p>
                      <p className="text-xs text-muted-foreground">4 campos • Recebimento de materiais</p>
                    </div>
                    {completedSections.includes("envio") && (
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 ml-2">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Concluído
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <FormField
                      control={form.control}
                      name="formaEnvio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>📬 Forma de envio</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {formaEnvioOptions.map(opt => (
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
                      name="linkDrive"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>🔗 Link do drive</FormLabel>
                          <FormControl>
                            <Input placeholder="https://drive.google.com/..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dataPrometidaEnvio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>🗓️ Data prometida de envio</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormDescription className="text-xs">Gera tarefa de cobrança</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="statusRecebimento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>✅ Status de recebimento</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {statusRecebimentoOptions.map(opt => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => markSectionComplete("envio")}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Marcar como concluído
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 6. Prioridades */}
              <AccordionItem value="prioridades" className="border rounded-lg overflow-hidden">
                <AccordionTrigger 
                  className={cn(
                    "px-4 py-3 hover:no-underline",
                    completedSections.includes("prioridades") && "bg-emerald-50 dark:bg-emerald-950/20"
                  )}
                  onClick={() => toggleSection("prioridades")}
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
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <FormField
                      control={form.control}
                      name="criterioPrioridade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>⚠️ Critério de prioridade</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {criterioPrioridadeOptions.map(opt => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div /> {/* Spacer */}

                    <FormField
                      control={form.control}
                      name="prioridade1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>🥇 Prioridade 1</FormLabel>
                          <FormControl>
                            <Input placeholder="TCLE transplante capilar" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="prioridade2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>🥈 Prioridade 2</FormLabel>
                          <FormControl>
                            <Input placeholder="Termo de imagem" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="prioridade3"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>🥉 Prioridade 3</FormLabel>
                          <FormControl>
                            <Input placeholder="Contrato de prestação" {...field} />
                          </FormControl>
                          <FormDescription className="text-xs">Opcional</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="jaTeveProblemAnterior"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-3">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel className="font-normal">🧨 Já teve problema anterior</FormLabel>
                        </FormItem>
                      )}
                    />

                    {form.watch("jaTeveProblemAnterior") && (
                      <FormField
                        control={form.control}
                        name="descricaoProblema"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>📝 Descrição do problema</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Reclamação por foto antes e depois..." 
                                className="min-h-[80px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription className="text-xs">Sem dados sensíveis desnecessários</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => markSectionComplete("prioridades")}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Marcar como concluído
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 7. Prazos */}
              <AccordionItem value="prazos" className="border rounded-lg overflow-hidden">
                <AccordionTrigger 
                  className={cn(
                    "px-4 py-3 hover:no-underline",
                    completedSections.includes("prazos") && "bg-emerald-50 dark:bg-emerald-950/20"
                  )}
                  onClick={() => toggleSection("prazos")}
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
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <FormField
                      control={form.control}
                      name="cenarioCliente"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>🧩 Cenário do cliente</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {cenarioClienteOptions.map(opt => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription className="text-xs">Define contagem de prazo</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dataRecebimentoCompleto"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>📅 Data de recebimento completo</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormDescription className="text-xs">Prazo começa aqui</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="prazoPadraoInformado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>⏳ Prazo padrão (dias úteis)</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dataPrevistaEntrega"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>🗓️ Data prevista de entrega</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormDescription className="text-xs">Calculada com base em dias úteis</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => markSectionComplete("prazos")}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Marcar como concluído
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 8. Treinamento */}
              <AccordionItem value="treinamento" className="border rounded-lg overflow-hidden">
                <AccordionTrigger 
                  className={cn(
                    "px-4 py-3 hover:no-underline",
                    completedSections.includes("treinamento") && "bg-emerald-50 dark:bg-emerald-950/20"
                  )}
                  onClick={() => toggleSection("treinamento")}
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
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <FormField
                      control={form.control}
                      name="necessitaTreinamento"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-3">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel className="font-normal">❓ Necessita treinamento</FormLabel>
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
                              <FormLabel>🗓️ Data sugerida</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="duvidasPrincipais"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
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
                      variant="outline" 
                      size="sm"
                      onClick={() => markSectionComplete("treinamento")}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Marcar como concluído
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 9. Instagram */}
              <AccordionItem value="instagram" className="border rounded-lg overflow-hidden">
                <AccordionTrigger 
                  className={cn(
                    "px-4 py-3 hover:no-underline",
                    completedSections.includes("instagram") && "bg-emerald-50 dark:bg-emerald-950/20"
                  )}
                  onClick={() => toggleSection("instagram")}
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
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <FormField
                      control={form.control}
                      name="instagramHandle"
                      render={({ field }) => (
                        <FormItem>
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
                        <FormItem>
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
                        <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-3">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel className="font-normal">📣 Faz anúncios</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="canalPrincipalLeads"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>📩 Canal principal de leads</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {canalLeadsOptions.map(opt => (
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
                      name="riscosEncontrados"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>⚠️ Riscos encontrados</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Antes e depois, promessas..." 
                              className="min-h-[60px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription className="text-xs">Preenchido pela advogada</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="orientacoesDadas"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
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

                    <FormField
                      control={form.control}
                      name="acoesImediatas"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>📌 Ações imediatas</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Pausar anúncios até ajuste..." 
                              className="min-h-[60px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription className="text-xs">Gerar tarefa interna</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => markSectionComplete("instagram")}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Marcar como concluído
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 10. Contrato */}
              <AccordionItem value="contrato" className="border rounded-lg overflow-hidden">
                <AccordionTrigger 
                  className={cn(
                    "px-4 py-3 hover:no-underline",
                    completedSections.includes("contrato") && "bg-emerald-50 dark:bg-emerald-950/20"
                  )}
                  onClick={() => toggleSection("contrato")}
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
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <FormField
                      control={form.control}
                      name="leituraConcluida"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-3">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel className="font-normal">✅ Leitura do contrato concluída</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="aceiteContrato"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-3 bg-primary/5">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel className="font-normal font-medium">🤝 Aceite do contrato</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="duvidasRegistradas"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>❓ Dúvidas registradas</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Dúvida sobre prazo, forma de pagamento..." 
                              className="min-h-[60px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription className="text-xs">Registrar por tópicos</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ajustesSolicitados"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
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
                      variant="outline" 
                      size="sm"
                      onClick={() => markSectionComplete("contrato")}
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
