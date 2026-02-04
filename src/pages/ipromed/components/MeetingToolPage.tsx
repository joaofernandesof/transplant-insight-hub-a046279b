/**
 * CPG Advocacia Médica - Meeting Tool
 * Ferramenta completa para reuniões com checklists jurídicos
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Users,
  ClipboardList,
  CheckCircle2,
  Clock,
  Scale,
  FileText,
  Plus,
  Calendar,
  Building,
  User,
  AlertTriangle,
  Gavel,
  Video,
  Loader2,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

// Legal matters for medical professionals
const legalMatters = [
  { id: 'civel', label: 'Cível', color: 'bg-blue-100 text-blue-700' },
  { id: 'penal', label: 'Criminal/Penal', color: 'bg-red-100 text-red-700' },
  { id: 'trabalho', label: 'Trabalhista', color: 'bg-amber-100 text-amber-700' },
  { id: 'consumidor', label: 'Consumidor', color: 'bg-green-100 text-green-700' },
  { id: 'etico', label: 'Ético-Disciplinar', color: 'bg-purple-100 text-purple-700' },
  { id: 'administrativo', label: 'Administrativo', color: 'bg-gray-100 text-gray-700' },
];

// Legal moments/milestones for medical professionals
const legalMoments = [
  { 
    id: 'onboarding', 
    label: 'Onboarding do Cliente', 
    icon: Users,
    description: 'Primeira reunião e coleta de informações',
    checklist: [
      'Apresentação da equipe e metodologia CPG Advocacia Médica',
      'Coleta de documentos pessoais e profissionais',
      'Mapeamento de exposição atual (clínicas, hospitais)',
      'Levantamento de processos existentes',
      'Análise de contratos vigentes',
      'Identificação de riscos imediatos',
      'Definição de prioridades',
      'Agendamento das próximas etapas',
    ]
  },
  { 
    id: 'pre-pep', 
    label: 'Alinhamento Pré-PEP', 
    icon: FileText,
    description: 'Preparação para Prova Emprestada/Perícia',
    checklist: [
      'Revisar prontuário médico completo',
      'Analisar evolução clínica do paciente',
      'Preparar cronologia dos atendimentos',
      'Identificar pontos de atenção na documentação',
      'Alinhar narrativa técnica com o médico',
      'Preparar resposta aos quesitos',
      'Simular possíveis perguntas',
      'Orientar postura e comunicação',
    ]
  },
  { 
    id: 'pre-tac', 
    label: 'Alinhamento Pré-TAC', 
    icon: Scale,
    description: 'Preparação para Termo de Ajustamento de Conduta',
    checklist: [
      'Analisar proposta de TAC recebida',
      'Avaliar riscos e benefícios do acordo',
      'Definir limites de negociação',
      'Preparar contraproposta se necessário',
      'Alinhar expectativas com o cliente',
      'Revisar implicações futuras do TAC',
      'Orientar sobre cumprimento das obrigações',
      'Definir estratégia de comunicação',
    ]
  },
  { 
    id: 'pre-audiencia-instrucao', 
    label: 'Alinhamento Pré-Audiência de Instrução', 
    icon: Gavel,
    description: 'Preparação para audiência de instrução e julgamento',
    checklist: [
      'Revisar petição inicial e contestação',
      'Analisar provas documentais produzidas',
      'Preparar rol de testemunhas',
      'Alinhar depoimento do cliente',
      'Simular perguntas da parte contrária',
      'Orientar sobre comportamento na audiência',
      'Revisar perícia médica se houver',
      'Preparar argumentos para alegações finais',
    ]
  },
  { 
    id: 'pre-audiencia-julgamento', 
    label: 'Alinhamento Pré-Audiência de Julgamento', 
    icon: Gavel,
    description: 'Preparação para sessão de julgamento',
    checklist: [
      'Revisar alegações finais apresentadas',
      'Analisar parecer do MP se aplicável',
      'Preparar sustentação oral',
      'Orientar cliente sobre possíveis resultados',
      'Definir estratégia para recursos',
      'Alinhar comunicação pós-julgamento',
      'Preparar nota técnica se necessário',
      'Orientar sobre execução em caso de condenação',
    ]
  },
  { 
    id: 'pre-conciliacao', 
    label: 'Alinhamento Pré-Conciliação', 
    icon: Users,
    description: 'Preparação para audiência de conciliação',
    checklist: [
      'Analisar pedidos da parte contrária',
      'Calcular valor máximo para acordo',
      'Definir estratégia de negociação',
      'Preparar argumentos para redução de valores',
      'Orientar cliente sobre postura conciliatória',
      'Avaliar riscos de não acordo',
      'Preparar contraproposta',
      'Definir condições mínimas para acordo',
    ]
  },
  { 
    id: 'pre-pericia', 
    label: 'Alinhamento Pré-Perícia', 
    icon: FileText,
    description: 'Preparação para perícia médica judicial',
    checklist: [
      'Revisar quesitos das partes',
      'Preparar quesitos suplementares',
      'Analisar documentação médica completa',
      'Preparar manifestação sobre perito',
      'Orientar médico sobre postura na perícia',
      'Revisar literatura médica aplicável',
      'Preparar defesa técnica prévia',
      'Acompanhar médico assistente se houver',
    ]
  },
  { 
    id: 'pre-depoimento-crm', 
    label: 'Alinhamento Pré-Depoimento CRM', 
    icon: AlertTriangle,
    description: 'Preparação para sindicância/processo ético',
    checklist: [
      'Revisar denúncia ou sindicância',
      'Analisar Código de Ética Médica aplicável',
      'Preparar defesa técnica',
      'Simular perguntas do conselheiro',
      'Orientar sobre postura e tom',
      'Revisar precedentes do CRM local',
      'Preparar documentação de suporte',
      'Alinhar estratégia de defesa',
    ]
  },
  { 
    id: 'follow-up', 
    label: 'Follow-up Periódico', 
    icon: Calendar,
    description: 'Reunião de acompanhamento regular',
    checklist: [
      'Atualizar status dos processos em andamento',
      'Revisar prazos pendentes',
      'Analisar novos riscos identificados',
      'Atualizar documentação preventiva',
      'Revisar contratos vencendo',
      'Orientar sobre novidades regulatórias',
      'Planejar próximas ações',
      'Coletar feedback do cliente',
    ]
  },
];

interface MeetingAgenda {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface CaseInfo {
  materia: string;
  assunto: string;
  parteAutora: string;
  parteRe: string;
  numeroProcesso: string;
  orgaoVara: string;
  sistema: string;
  objeto: string;
  situacaoAtual: string;
  dataPrazo: string;
  acaoFazer: string;
  ultimaAtualizacao: string;
}

export default function MeetingToolPage() {
  const [selectedMoment, setSelectedMoment] = useState('onboarding');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);
  const [meetingNotes, setMeetingNotes] = useState('');
  const [agendaItems, setAgendaItems] = useState<MeetingAgenda[]>([]);
  const [newAgendaItem, setNewAgendaItem] = useState('');
  
  const [caseInfo, setCaseInfo] = useState<CaseInfo>({
    materia: '',
    assunto: '',
    parteAutora: '',
    parteRe: '',
    numeroProcesso: '',
    orgaoVara: '',
    sistema: '',
    objeto: '',
    situacaoAtual: '',
    dataPrazo: '',
    acaoFazer: '',
    ultimaAtualizacao: '',
  });

  const queryClient = useQueryClient();

  // Fetch clients for dropdown
  const { data: clients = [] } = useQuery({
    queryKey: ['ipromed-clients-meeting'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_legal_clients')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const currentMoment = legalMoments.find(m => m.id === selectedMoment);
  const checklist = currentMoment?.checklist || [];
  const completedCount = checklist.filter((_, idx) => checkedItems[`${selectedMoment}-${idx}`]).length;
  const progress = checklist.length > 0 ? (completedCount / checklist.length) * 100 : 0;

  const toggleCheckItem = (idx: number) => {
    const key = `${selectedMoment}-${idx}`;
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const addAgendaItem = () => {
    if (!newAgendaItem.trim()) return;
    setAgendaItems(prev => [...prev, {
      id: Date.now().toString(),
      title: newAgendaItem,
      description: '',
      completed: false,
    }]);
    setNewAgendaItem('');
  };

  const toggleAgendaItem = (id: string) => {
    setAgendaItems(prev => prev.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const saveMeetingNotes = () => {
    toast.success('Notas da reunião salvas');
  };

  return (
    <div className="space-y-6 px-4 lg:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Ferramenta de Reuniões
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Organize suas reuniões com checklists e pautas específicas para Direito Médico
          </p>
        </div>
        <Dialog open={isCreatingMeeting} onOpenChange={setIsCreatingMeeting}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Reunião
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Nova Reunião</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Título da Reunião</Label>
                  <Input placeholder="Ex: Alinhamento Dr. João Silva" />
                </div>
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="space-y-2">
                  <Label>Hora</Label>
                  <Input type="time" defaultValue="09:00" />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Reunião</Label>
                  <Select defaultValue="onboarding">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {legalMoments.map(moment => (
                        <SelectItem key={moment.id} value={moment.id}>
                          {moment.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreatingMeeting(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => {
                  setIsCreatingMeeting(false);
                  toast.success('Reunião criada com sucesso!');
                }}>
                  Criar Reunião
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Left Column - Moments Selection */}
        <div className="space-y-4">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                Momentos Jurídicos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-1">
                {legalMoments.map(moment => {
                  const Icon = moment.icon;
                  const isSelected = selectedMoment === moment.id;
                  
                  return (
                    <button
                      key={moment.id}
                      onClick={() => setSelectedMoment(moment.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                        isSelected 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-muted'
                      }`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{moment.label}</div>
                        <div className={`text-xs truncate ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {moment.description}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center Column - Checklist */}
        <div className="space-y-4">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Checklist: {currentMoment?.label}
                </CardTitle>
                <Badge variant={progress === 100 ? 'default' : 'secondary'}>
                  {completedCount}/{checklist.length}
                </Badge>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {checklist.map((item, idx) => {
                  const isChecked = checkedItems[`${selectedMoment}-${idx}`] || false;
                  
                  return (
                    <label
                      key={idx}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        isChecked 
                          ? 'bg-primary/5 border-primary/30' 
                          : 'hover:bg-muted'
                      }`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleCheckItem(idx)}
                      />
                      <span className={`text-sm ${isChecked ? 'line-through text-muted-foreground' : ''}`}>
                        {item}
                      </span>
                    </label>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Custom Agenda Items */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Pauta Personalizada
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={newAgendaItem}
                  onChange={(e) => setNewAgendaItem(e.target.value)}
                  placeholder="Adicionar item à pauta..."
                  onKeyPress={(e) => e.key === 'Enter' && addAgendaItem()}
                />
                <Button onClick={addAgendaItem} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {agendaItems.map(item => (
                <label
                  key={item.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer ${
                    item.completed ? 'bg-muted/50' : ''
                  }`}
                >
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={() => toggleAgendaItem(item.id)}
                  />
                  <span className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                    {item.title}
                  </span>
                </label>
              ))}
              {agendaItems.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum item na pauta personalizada
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Case Info & Notes */}
        <div className="space-y-4">
          {/* Case Information */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                Informações do Processo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Accordion type="single" collapsible className="space-y-2">
                <AccordionItem value="basic" className="border rounded-lg">
                  <AccordionTrigger className="px-3">Dados Básicos</AccordionTrigger>
                  <AccordionContent className="px-3 pb-3 space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Matéria</Label>
                      <Select 
                        value={caseInfo.materia}
                        onValueChange={(v) => setCaseInfo(prev => ({ ...prev, materia: v }))}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {legalMatters.map(m => (
                            <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Assunto</Label>
                      <Input 
                        className="h-8" 
                        value={caseInfo.assunto}
                        onChange={(e) => setCaseInfo(prev => ({ ...prev, assunto: e.target.value }))}
                        placeholder="Ex: Erro médico"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Objeto</Label>
                      <Input 
                        className="h-8" 
                        value={caseInfo.objeto}
                        onChange={(e) => setCaseInfo(prev => ({ ...prev, objeto: e.target.value }))}
                        placeholder="Indenização por danos..."
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="parties" className="border rounded-lg">
                  <AccordionTrigger className="px-3">Partes</AccordionTrigger>
                  <AccordionContent className="px-3 pb-3 space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Parte Autora</Label>
                      <Input 
                        className="h-8" 
                        value={caseInfo.parteAutora}
                        onChange={(e) => setCaseInfo(prev => ({ ...prev, parteAutora: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Parte Ré</Label>
                      <Input 
                        className="h-8" 
                        value={caseInfo.parteRe}
                        onChange={(e) => setCaseInfo(prev => ({ ...prev, parteRe: e.target.value }))}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="process" className="border rounded-lg">
                  <AccordionTrigger className="px-3">Processo</AccordionTrigger>
                  <AccordionContent className="px-3 pb-3 space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Número do Processo</Label>
                      <Input 
                        className="h-8 font-mono" 
                        value={caseInfo.numeroProcesso}
                        onChange={(e) => setCaseInfo(prev => ({ ...prev, numeroProcesso: e.target.value }))}
                        placeholder="0000000-00.0000.0.00.0000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Órgão / Vara</Label>
                      <Input 
                        className="h-8" 
                        value={caseInfo.orgaoVara}
                        onChange={(e) => setCaseInfo(prev => ({ ...prev, orgaoVara: e.target.value }))}
                        placeholder="Ex: 1ª Vara Cível"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Sistema</Label>
                      <Select 
                        value={caseInfo.sistema}
                        onValueChange={(v) => setCaseInfo(prev => ({ ...prev, sistema: v }))}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pje">PJe</SelectItem>
                          <SelectItem value="esaj">e-SAJ</SelectItem>
                          <SelectItem value="projudi">PROJUDI</SelectItem>
                          <SelectItem value="eproc">e-Proc</SelectItem>
                          <SelectItem value="sei">SEI</SelectItem>
                          <SelectItem value="fisico">Físico</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="status" className="border rounded-lg">
                  <AccordionTrigger className="px-3">Status e Ações</AccordionTrigger>
                  <AccordionContent className="px-3 pb-3 space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Situação Atual</Label>
                      <Input 
                        className="h-8" 
                        value={caseInfo.situacaoAtual}
                        onChange={(e) => setCaseInfo(prev => ({ ...prev, situacaoAtual: e.target.value }))}
                        placeholder="Aguardando perícia..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Data do Prazo</Label>
                      <Input 
                        type="date"
                        className="h-8" 
                        value={caseInfo.dataPrazo}
                        onChange={(e) => setCaseInfo(prev => ({ ...prev, dataPrazo: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Ação a ser Feita</Label>
                      <Textarea 
                        className="min-h-[60px]" 
                        value={caseInfo.acaoFazer}
                        onChange={(e) => setCaseInfo(prev => ({ ...prev, acaoFazer: e.target.value }))}
                        placeholder="Próximas providências..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Última Atualização</Label>
                      <Input 
                        type="date"
                        className="h-8" 
                        value={caseInfo.ultimaAtualizacao}
                        onChange={(e) => setCaseInfo(prev => ({ ...prev, ultimaAtualizacao: e.target.value }))}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Meeting Notes */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Notas da Reunião
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
                placeholder="Registre os pontos discutidos, decisões tomadas e próximos passos..."
                className="min-h-[200px]"
              />
              <Button onClick={saveMeetingNotes} className="w-full">
                Salvar Notas
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
