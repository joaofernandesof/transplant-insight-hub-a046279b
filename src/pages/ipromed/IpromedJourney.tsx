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

// No mock data - using only real database clients

export default function IpromedJourney() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState("pipeline");
  const [phaseDetailOpen, setPhaseDetailOpen] = useState(false);
  const [selectedPhaseDetail, setSelectedPhaseDetail] = useState<PhaseDetail | null>(null);

  // Fetch clients with journey data from database
  const { data: dbClients = [], isLoading } = useQuery({
    queryKey: ['ipromed-journey-clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_legal_clients')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Client[];
    },
  });

  // Use only real database clients
  const clients = dbClients;

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
      <div className="grid grid-cols-6 gap-2">
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
                      <p className="text-xs font-medium text-center px-1 leading-tight">{phase.label}</p>
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
                    <div className={cn("text-white text-center py-3 rounded-t-lg relative group", phase.color)}>
                      <p className="font-bold text-sm px-2 leading-tight">{phase.label}</p>
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
                              <CardContent className="p-3">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8 flex-shrink-0">
                                    <AvatarFallback className={cn("text-xs font-medium text-white", phase.color)}>
                                      {client.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <p className="font-medium text-sm leading-tight line-clamp-2 flex-1">{client.name}</p>
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
