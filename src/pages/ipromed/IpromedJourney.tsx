/**
 * CPG Advocacia Médica - Jornada do Cliente Interativa
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  MoreVertical,
  ExternalLink,
  Video,
  Filter,
  RefreshCw,
  LayoutGrid,
  List,
  CheckSquare,
} from "lucide-react";
import { format, differenceInDays, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import ClientJourneyTracker from "./components/ClientJourneyTracker";
import JourneyPhaseDetail, { journeyPhasesDetailed, PhaseDetail } from "./components/JourneyPhaseDetail";
import { OnboardingMeetingDialog } from "./components/OnboardingMeetingAgenda";
import { MeetingScheduleDialog } from "./components/MeetingScheduleDialog";
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
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false);
  const [meetingClient, setMeetingClient] = useState<Client | null>(null);

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
        className={cn(
          "border-none shadow-sm hover:shadow-md transition-all group/card",
          overdue && 'ring-2 ring-destructive/30',
          selectedClient?.id === client.id && 'ring-2 ring-primary'
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar 
              className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-primary"
              onClick={() => navigate(`/ipromed/clients/${client.id}`)}
            >
              <AvatarFallback className={cn(getPhaseColor(phase), "text-white")}>
                {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 
                  className="font-medium text-sm truncate cursor-pointer hover:text-primary"
                  onClick={() => navigate(`/ipromed/clients/${client.id}`)}
                >
                  {client.name}
                </h4>
                <div className="flex items-center gap-1">
                  {overdue && (
                    <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 opacity-0 group-hover/card:opacity-100"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/ipromed/clients/${client.id}`)}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => {
                        setMeetingClient(client);
                        setMeetingDialogOpen(true);
                      }}>
                        <Video className="h-4 w-4 mr-2" />
                        Agendar Reunião
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={cn("text-xs text-white", getPhaseColor(phase))}>
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
    <div className="h-full flex flex-col">
      {/* Header - Avivar Style */}
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/ipromed')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Jornada do Cliente</h1>
                <p className="text-sm text-muted-foreground">
                  Acompanhamento de clientes jurídicos
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center border rounded-lg p-1">
              <Button
                variant={activeTab === "pipeline" ? "default" : "ghost"}
                size="sm"
                className="h-8 gap-2"
                onClick={() => setActiveTab("pipeline")}
              >
                <LayoutGrid className="h-4 w-4" />
                Kanban
              </Button>
              <Button
                variant={activeTab === "list" ? "default" : "ghost"}
                size="sm"
                className="h-8 gap-2"
                onClick={() => setActiveTab("list")}
              >
                <List className="h-4 w-4" />
                Lista
              </Button>
            </div>
            
            <OnboardingMeetingDialog
              trigger={
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Cliente
                </Button>
              }
              onSubmit={(data) => {
                console.log('Onboarding data:', data);
                toast.success('Cliente adicionado!');
              }}
            />
            
            <Button variant="outline" className="gap-2">
              <CheckSquare className="h-4 w-4" />
              Checklist
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {
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
                  Exportar CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("tracker")}>
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Tracker
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, telefone, tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
          <Button variant="ghost" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Total: <span className="font-medium text-foreground">{clients.length}</span> clientes
          </span>
        </div>
      </div>

      {/* Kanban Content - Avivar Style */}
      {activeTab === "pipeline" && (
        <div className="flex-1 overflow-x-auto p-4">
          <div className="flex gap-3 h-full min-w-max">
            {journeyPhases.map((phase) => {
              const phaseDetail = journeyPhasesDetailed.find(p => p.id === phase.id);
              const phaseClients = (clientsByPhase[phase.id] || []).filter(c => 
                c.name.toLowerCase().includes(searchTerm.toLowerCase())
              );
              
              return (
                <div key={phase.id} className="flex flex-col w-[240px] flex-shrink-0">
                  {/* Column Header - Avivar Style */}
                  <div className={cn(
                    "rounded-lg px-3 py-2.5 flex items-center justify-between group",
                    phase.color
                  )}>
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-white/70" />
                      <span className="font-semibold text-white text-sm">{phase.label}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {phaseClients.length > 0 && (
                        <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-white/20 text-white border-0">
                          {phaseClients.length}
                        </Badge>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-white hover:bg-white/20"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            if (phaseDetail) {
                              setSelectedPhaseDetail(phaseDetail);
                              setPhaseDetailOpen(true);
                            }
                          }}>
                            <Info className="h-4 w-4 mr-2" />
                            Ver Detalhes da Fase
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <CheckSquare className="h-4 w-4 mr-2" />
                            Configurar Checklist
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  {/* Column Content */}
                  <div className="flex-1 mt-2 space-y-2 min-h-[500px] bg-muted/20 rounded-lg p-2 border border-dashed border-muted-foreground/20">
                    {phaseClients.map((client) => (
                      <Card 
                        key={client.id} 
                        className="bg-card hover:shadow-md transition-all cursor-pointer border group/card"
                      >
                        <CardContent className="p-3 space-y-2">
                          {/* Client Header Row */}
                          <div className="flex items-center gap-2">
                            <Avatar 
                              className="h-8 w-8 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary"
                              onClick={() => navigate(`/ipromed/clients/${client.id}`)}
                            >
                              <AvatarFallback className={cn("text-xs font-medium text-white", phase.color)}>
                                {client.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p 
                                className="font-medium text-sm truncate hover:text-primary cursor-pointer"
                                onClick={() => navigate(`/ipromed/clients/${client.id}`)}
                              >
                                {client.name}
                              </p>
                            </div>
                            <span className="text-[10px] text-muted-foreground flex-shrink-0">
                              {format(new Date(client.created_at), 'dd.MM.yyyy')}
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 opacity-0 group-hover/card:opacity-100 flex-shrink-0"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate(`/ipromed/clients/${client.id}`)}>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Ver Detalhes
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => {
                                  setMeetingClient(client);
                                  setMeetingDialogOpen(true);
                                }}>
                                  <Video className="h-4 w-4 mr-2" />
                                  Agendar Reunião
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          {/* Tags */}
                          {(client.metadata as any)?.tags && (
                            <div className="flex flex-wrap gap-1">
                              {((client.metadata as any).tags as string[]).slice(0, 2).map((tag, i) => (
                                <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0 h-5 text-primary">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                    
                    {/* Empty State */}
                    {phaseClients.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <Users className="h-10 w-10 opacity-20 mb-2" />
                        <p className="text-xs">Arraste clientes aqui</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {activeTab === "list" && (
        <div className="flex-1 p-6 overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client) => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        </div>
      )}

      {/* Tracker View */}
      {activeTab === "tracker" && (
        <div className="flex-1 p-6 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Client List */}
            <div>
              <h3 className="font-semibold mb-3">Selecione um cliente</h3>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2 pr-4">
                  {filteredClients.map((client) => (
                    <Card 
                      key={client.id}
                      className={cn(
                        "cursor-pointer transition-all",
                        selectedClient?.id === client.id 
                          ? 'ring-2 ring-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      )}
                      onClick={() => setSelectedClient(client)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className={cn(getPhaseColor(getClientPhase(client)), "text-white text-xs")}>
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
        </div>
      )}

      {/* Alerts - Fixed Position */}
      {clients.some(c => isOverdue(c)) && (
        <div className="fixed bottom-6 right-6 z-50">
          <Card className="border-destructive/30 bg-destructive/10 shadow-lg max-w-sm">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-destructive text-sm">
                    Clientes Atrasados
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {clients.filter(c => isOverdue(c)).length} cliente(s) precisam de atenção
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Phase Detail Modal */}
      <JourneyPhaseDetail
        phase={selectedPhaseDetail}
        open={phaseDetailOpen}
        onClose={() => setPhaseDetailOpen(false)}
        clientName={selectedClient?.name}
      />

      {/* Meeting Schedule Dialog */}
      {meetingClient && (
        <MeetingScheduleDialog
          open={meetingDialogOpen}
          onOpenChange={setMeetingDialogOpen}
          clientId={meetingClient.id}
          clientName={meetingClient.name}
          onSchedule={(data) => {
            console.log('Meeting scheduled:', data);
            toast.success('Reunião agendada com sucesso!');
          }}
        />
      )}
    </div>
  );
}
