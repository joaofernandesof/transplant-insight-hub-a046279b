/**
 * IPROMED - Jornada do Cliente Interativa
 * Visualização por cliente com tracking real das etapas D0 a D+30
 * Com Kanban de clientes, detalhes de fase e checklists
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowLeft,
  Search,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  ChevronRight,
  Download,
  Info,
  GripVertical,
  Plus,
  Eye,
  FileSignature,
} from "lucide-react";
import { format, differenceInDays, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import ClientJourneyTracker from "./components/ClientJourneyTracker";
import JourneyPhaseDetail, { journeyPhasesDetailed, PhaseDetail } from "./components/JourneyPhaseDetail";
import { OnboardingMeetingDialog } from "./components/OnboardingMeetingAgenda";
import { cn } from "@/lib/utils";

// Journey phases with colors - mapped to detailed phases
const journeyPhases = journeyPhasesDetailed.map(p => ({
  id: p.id,
  label: p.name,
  fullLabel: p.label,
  color: p.bgColor,
  description: p.description,
  deliverables: p.deliverables.length,
}));

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  journey_stage: string;
  created_at: string;
  metadata: {
    journey_phase?: string;
    journey_start_date?: string;
    journey_progress?: number;
    risk_level?: string;
  } | null;
}

// Mock clients for demonstration
const mockClients: Client[] = [
  // Novos clientes
  {
    id: 'mock-1',
    name: 'Maria Fernanda Costa',
    email: 'maria.costa@empresa.com.br',
    phone: '(11) 99876-5432',
    status: 'ativo',
    journey_stage: 'Novos',
    created_at: new Date().toISOString(),
    metadata: { journey_phase: 'Novos', journey_progress: 5, risk_level: 'baixo' }
  },
  {
    id: 'mock-2',
    name: 'Tech Solutions Ltda',
    email: 'juridico@techsolutions.com.br',
    phone: '(11) 3456-7890',
    status: 'ativo',
    journey_stage: 'Novos',
    created_at: new Date().toISOString(),
    metadata: { journey_phase: 'Novos', journey_progress: 8, risk_level: 'medio' }
  },
  {
    id: 'mock-3',
    name: 'Carlos Eduardo Silva',
    email: 'carlos.silva@gmail.com',
    phone: '(21) 98765-4321',
    status: 'ativo',
    journey_stage: 'Novos',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: { journey_phase: 'Novos', journey_progress: 10, risk_level: 'baixo' }
  },
  // Onboarding agendado
  {
    id: 'mock-4',
    name: 'Indústria Metalúrgica ABC',
    email: 'contato@metalurgicaabc.com.br',
    phone: '(31) 3333-4444',
    status: 'ativo',
    journey_stage: 'Agendado',
    created_at: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: { journey_phase: 'Agendado', journey_progress: 20, risk_level: 'baixo' }
  },
  {
    id: 'mock-5',
    name: 'Ana Paula Rodrigues',
    email: 'ana.rodrigues@clinica.com.br',
    phone: '(11) 97777-8888',
    status: 'ativo',
    journey_stage: 'Agendado',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: { journey_phase: 'Agendado', journey_progress: 25, risk_level: 'baixo' }
  },
  {
    id: 'mock-6',
    name: 'Construtora Norte Sul',
    email: 'juridico@nortesul.com.br',
    phone: '(41) 3030-4040',
    status: 'ativo',
    journey_stage: 'Agendado',
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: { journey_phase: 'Agendado', journey_progress: 30, risk_level: 'alto' }
  },
  // Pacote Jurídico em andamento
  {
    id: 'mock-7',
    name: 'Roberto Mendes Filho',
    email: 'roberto.mendes@hotmail.com',
    phone: '(85) 99999-1111',
    status: 'ativo',
    journey_stage: 'Andamento',
    created_at: new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: { journey_phase: 'Andamento', journey_progress: 45, risk_level: 'medio' }
  },
  {
    id: 'mock-8',
    name: 'Farmácia Popular Express',
    email: 'gerencia@farmaciapopular.com.br',
    phone: '(71) 3222-5555',
    status: 'ativo',
    journey_stage: 'Andamento',
    created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: { journey_phase: 'Andamento', journey_progress: 55, risk_level: 'baixo' }
  },
  {
    id: 'mock-9',
    name: 'Juliana Campos Oliveira',
    email: 'juliana.oliveira@advocacia.com.br',
    phone: '(61) 98888-2222',
    status: 'ativo',
    journey_stage: 'Andamento',
    created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: { journey_phase: 'Andamento', journey_progress: 60, risk_level: 'medio' }
  },
  {
    id: 'mock-10',
    name: 'Grupo Empresarial Delta',
    email: 'legal@grupodelta.com.br',
    phone: '(11) 2222-3333',
    status: 'ativo',
    journey_stage: 'Andamento',
    created_at: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: { journey_phase: 'Andamento', journey_progress: 70, risk_level: 'baixo' }
  },
  // Reunião de apresentação do Pacote Jurídico
  {
    id: 'mock-11',
    name: 'Patrícia Lima Santos',
    email: 'patricia.santos@email.com',
    phone: '(19) 99666-5555',
    status: 'ativo',
    journey_stage: 'Apresentacao',
    created_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: { journey_phase: 'Apresentacao', journey_progress: 85, risk_level: 'alto' }
  },
  {
    id: 'mock-12',
    name: 'Hospital Santa Clara',
    email: 'juridico@santaclara.org.br',
    phone: '(51) 3344-5566',
    status: 'ativo',
    journey_stage: 'Apresentacao',
    created_at: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: { journey_phase: 'Apresentacao', journey_progress: 90, risk_level: 'baixo' }
  },
  // Acompanhamento contínuo
  {
    id: 'mock-13',
    name: 'Fernando Gomes Almeida',
    email: 'fernando.almeida@empresa.com',
    phone: '(27) 99777-4444',
    status: 'ativo',
    journey_stage: 'Continuo',
    created_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: { journey_phase: 'Continuo', journey_progress: 100, risk_level: 'baixo' }
  },
  {
    id: 'mock-14',
    name: 'Supermercado Bom Preço',
    email: 'contabil@bompreco.com.br',
    phone: '(81) 3456-7890',
    status: 'ativo',
    journey_stage: 'Continuo',
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: { journey_phase: 'Continuo', journey_progress: 100, risk_level: 'baixo' }
  },
  {
    id: 'mock-15',
    name: 'Clínica Odontológica Sorriso',
    email: 'admin@clinicasorriso.com.br',
    phone: '(47) 3333-2222',
    status: 'ativo',
    journey_stage: 'Continuo',
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: { journey_phase: 'Continuo', journey_progress: 100, risk_level: 'baixo' }
  },
  {
    id: 'mock-16',
    name: 'Marcelo Ribeiro Costa',
    email: 'marcelo.costa@gmail.com',
    phone: '(11) 98765-1234',
    status: 'ativo',
    journey_stage: 'Continuo',
    created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: { journey_phase: 'Continuo', journey_progress: 100, risk_level: 'baixo' }
  },
];

export default function IpromedJourney() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState("pipeline");
  const [phaseDetailOpen, setPhaseDetailOpen] = useState(false);
  const [selectedPhaseDetail, setSelectedPhaseDetail] = useState<PhaseDetail | null>(null);

  // Fetch clients with journey data - combined with mocks for demo
  const { data: dbClients = [], isLoading } = useQuery({
    queryKey: ['ipromed-journey-clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_legal_clients')
        .select('*')
        .eq('status', 'ativo')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Client[];
    },
  });

  // Combine real DB clients with mock data for demonstration
  const clients = [...mockClients, ...dbClients];

  // Calculate client's current phase based on contract date
  const getClientPhase = (client: Client) => {
    const meta = client.metadata as any;
    if (meta?.journey_phase) return meta.journey_phase;
    
    // Fallback logic for clients without explicit phase
    const startDate = meta?.journey_start_date || client.created_at;
    const daysSinceStart = differenceInDays(new Date(), new Date(startDate));
    
    if (daysSinceStart >= 30) return 'Continuo';
    if (daysSinceStart >= 20) return 'Apresentacao';
    if (daysSinceStart >= 7) return 'Andamento';
    if (daysSinceStart >= 2) return 'Agendado';
    return 'Novos';
  };

  // Get phase color
  const getPhaseColor = (phase: string) => {
    const found = journeyPhases.find(p => p.id === phase);
    return found?.color || 'bg-gray-500';
  };

  // Filter clients
  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const clientPhase = getClientPhase(c);
    const matchesPhase = !selectedPhase || clientPhase === selectedPhase;
    return matchesSearch && matchesPhase;
  });

  // Group clients by phase
  const clientsByPhase = journeyPhases.reduce((acc, phase) => {
    acc[phase.id] = clients.filter(c => getClientPhase(c) === phase.id);
    return acc;
  }, {} as Record<string, Client[]>);

  // Calculate due date for current phase
  const getPhaseDueDate = (client: Client) => {
    const meta = client.metadata as any;
    const startDate = new Date(meta?.journey_start_date || client.created_at);
    const phase = getClientPhase(client);
    
    const daysMap: Record<string, number> = {
      'Novos': 2,
      'Agendado': 7,
      'Andamento': 20,
      'Apresentacao': 30,
      'Continuo': 90,
    };
    
    return addDays(startDate, daysMap[phase] || 0);
  };

  // Check if client is overdue
  const isOverdue = (client: Client) => {
    const phase = getClientPhase(client);
    if (phase === 'Continuo') return false;
    const dueDate = getPhaseDueDate(client);
    return new Date() > dueDate;
  };

  const ClientCard = ({ client }: { client: Client }) => {
    const phase = getClientPhase(client);
    const phaseInfo = journeyPhases.find(p => p.id === phase);
    const overdue = isOverdue(client);
    const meta = client.metadata as any;
    const progress = meta?.journey_progress || Math.min(100, (differenceInDays(new Date(), new Date(client.created_at)) / 30) * 100);

    return (
      <Card 
        className={`border-none shadow-sm hover:shadow-md transition-all cursor-pointer ${
          overdue ? 'ring-2 ring-rose-200 dark:ring-rose-900' : ''
        } ${selectedClient?.id === client.id ? 'ring-2 ring-primary' : ''}`}
        onClick={() => setSelectedClient(client)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className={`${getPhaseColor(phase)} text-white`}>
                {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm truncate">{client.name}</h4>
                {overdue && (
                  <AlertTriangle className="h-4 w-4 text-rose-500 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`text-xs ${getPhaseColor(phase)} text-white`}>
                  {phase}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {phaseInfo?.label}
                </span>
              </div>
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Progresso</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
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
          <p className="text-muted-foreground">
            {clients.length} clientes • 17 entregáveis • Plano Preventivo Integral
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            if (!clients || clients.length === 0) {
              toast.error('Nenhum dado para exportar');
              return;
            }
            const headers = ['Cliente', 'Email', 'Telefone', 'Fase Atual', 'Progresso', 'Data Início'];
            const rows = clients.map(c => {
              const phase = getClientPhase(c);
              const meta = c.metadata as any;
              const progress = meta?.journey_progress || Math.min(100, (differenceInDays(new Date(), new Date(c.created_at)) / 30) * 100);
              return [
                c.name,
                c.email || '',
                c.phone || '',
                phase,
                `${Math.round(progress)}%`,
                format(new Date(c.created_at), 'dd/MM/yyyy', { locale: ptBR }),
              ];
            });
            const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `jornada-clientes-${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success('Jornada exportada com sucesso!');
          }}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <OnboardingMeetingDialog
            trigger={
              <Button className="gap-2">
                <FileSignature className="h-4 w-4" />
                Pauta de Onboarding
              </Button>
            }
            onSubmit={(data) => {
              console.log('Onboarding data:', data);
              toast.success('Pauta salva com sucesso!');
            }}
          />
        </div>
      </div>

      {/* Phase Overview with Details */}
      <div className="grid grid-cols-7 gap-2">
        {journeyPhases.map((phase) => {
          const phaseDetail = journeyPhasesDetailed.find(p => p.id === phase.id);
          return (
            <TooltipProvider key={phase.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card 
                    className={cn(
                      "border-none shadow-sm cursor-pointer transition-all hover:shadow-md",
                      selectedPhase === phase.id && 'ring-2 ring-primary'
                    )}
                    onClick={() => setSelectedPhase(selectedPhase === phase.id ? null : phase.id)}
                  >
                    <CardContent className="p-3 text-center relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-60 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (phaseDetail) {
                            setSelectedPhaseDetail(phaseDetail);
                            setPhaseDetailOpen(true);
                          }
                        }}
                      >
                        <Info className="h-3 w-3" />
                      </Button>
                      <div className={cn("w-3 h-3 rounded-full mx-auto mb-2", phase.color)} />
                      <p className="text-xs font-medium">{phase.id}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{phase.label}</p>
                      <p className="text-lg font-bold mt-1">{clientsByPhase[phase.id]?.length || 0}</p>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="font-semibold">{phase.fullLabel}</p>
                  <p className="text-xs text-muted-foreground mt-1">{phase.description}</p>
                  <p className="text-xs mt-2">
                    <span className="font-medium">{phase.deliverables}</span> entregáveis nesta fase
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="list">Lista</TabsTrigger>
            <TabsTrigger value="tracker">Tracker</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </div>

        {/* Pipeline View - Enhanced Kanban with horizontal scroll */}
        <TabsContent value="pipeline" className="mt-4">
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-3 min-w-max">
              {journeyPhases.map((phase) => {
                const phaseDetail = journeyPhasesDetailed.find(p => p.id === phase.id);
                const phaseClients = clientsByPhase[phase.id] || [];
                return (
                  <div key={phase.id} className="flex flex-col w-[200px] flex-shrink-0">
                    {/* Column Header */}
                    <div className={cn("text-white text-center py-2.5 rounded-t-lg relative group", phase.color)}>
                      <p className="font-bold text-sm">{phase.id}</p>
                      <p className="text-[11px] opacity-90">{phase.label}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 text-white hover:bg-white/20"
                        onClick={() => {
                          if (phaseDetail) {
                            setSelectedPhaseDetail(phaseDetail);
                            setPhaseDetailOpen(true);
                          }
                        }}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {/* Column Content */}
                    <ScrollArea className="bg-muted/30 rounded-b-lg min-h-[400px] max-h-[450px] flex-1">
                      <div className="space-y-2 p-2">
                        {phaseClients.map((client) => {
                          const progress = (client.metadata as any)?.journey_progress || 0;
                          return (
                            <Card 
                              key={client.id} 
                              className="bg-card hover:shadow-md transition-shadow cursor-pointer border"
                              onClick={() => setSelectedClient(client)}
                            >
                              <CardContent className="p-2.5">
                                <div className="flex items-center gap-2 mb-2">
                                  <Avatar className="h-7 w-7 flex-shrink-0">
                                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-medium">
                                      {client.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-xs leading-tight line-clamp-2">{client.name}</p>
                                  </div>
                                </div>
                                <Badge 
                                  variant="secondary" 
                                  className={cn("text-[9px] h-4 px-1.5", phase.color.replace('bg-', 'bg-opacity-20 text-').replace('-500', '-700').replace('-600', '-700'))}
                                >
                                  {phase.id}
                                </Badge>
                                <div className="mt-2">
                                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                                    <span>Progresso</span>
                                    <span>{progress}%</span>
                                  </div>
                                  <Progress value={progress} className="h-1" />
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                        {phaseClients.length === 0 && (
                          <div className="text-center text-muted-foreground text-xs py-12 space-y-2">
                            <Users className="h-8 w-8 mx-auto opacity-20" />
                            <p>Nenhum cliente</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                    
                    {/* Column Footer */}
                    <div className="bg-muted/20 px-2 py-1.5 border-t flex items-center justify-between">
                      <span className="text-[9px] text-muted-foreground">{phase.deliverables} entregáveis</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-5 text-[9px] px-1.5 hover:text-primary"
                        onClick={() => {
                          if (phaseDetail) {
                            setSelectedPhaseDetail(phaseDetail);
                            setPhaseDetailOpen(true);
                          }
                        }}
                      >
                        Detalhes
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* List View */}
        <TabsContent value="list" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client) => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        </TabsContent>

        {/* Tracker View */}
        <TabsContent value="tracker" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Client List */}
            <div>
              <h3 className="font-semibold mb-3">Selecione um cliente</h3>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2 pr-4">
                  {filteredClients.map((client) => (
                    <Card 
                      key={client.id}
                      className={`cursor-pointer transition-all ${
                        selectedClient?.id === client.id 
                          ? 'ring-2 ring-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedClient(client)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className={`${getPhaseColor(getClientPhase(client))} text-white text-xs`}>
                                {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{client.name}</p>
                              <Badge variant="outline" className="text-[10px]">
                                {getClientPhase(client)}
                              </Badge>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Journey Tracker */}
            <div className="lg:col-span-2">
              {selectedClient ? (
                <ClientJourneyTracker
                  clientId={selectedClient.id}
                  clientName={selectedClient.name}
                  startDate={(selectedClient.metadata as any)?.journey_start_date || selectedClient.created_at}
                  onStepComplete={(stepCode, completed) => {
                    console.log('Step completed:', stepCode, completed);
                    // TODO: Save to database
                  }}
                />
              ) : (
                <Card className="h-full flex items-center justify-center">
                  <CardContent className="text-center text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>Selecione um cliente para ver a jornada</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Alerts */}
      {clients.some(c => isOverdue(c)) && (
        <Card className="border-rose-200 bg-rose-50 dark:bg-rose-950/20 dark:border-rose-900">
          <CardContent className="pt-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-100 dark:bg-rose-900/50 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-rose-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-rose-800 dark:text-rose-200">
                  Clientes com Jornada Atrasada
                </h3>
                <p className="text-sm text-rose-700 dark:text-rose-300">
                  {clients.filter(c => isOverdue(c)).length} cliente(s) precisam de atenção imediata.
                </p>
              </div>
              <Button 
                variant="outline" 
                className="border-rose-300 text-rose-700 hover:bg-rose-100"
                onClick={() => setSelectedPhase(null)}
              >
                Ver Todos
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phase Detail Modal */}
      <JourneyPhaseDetail
        phase={selectedPhaseDetail}
        open={phaseDetailOpen}
        onClose={() => setPhaseDetailOpen(false)}
        clientName={selectedClient?.name}
      />
    </div>
  );
}
