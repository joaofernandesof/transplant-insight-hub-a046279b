/**
 * IPROMED - Jornada do Cliente Interativa
 * Visualização por cliente com tracking real das etapas D0 a D+30
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Play,
  Pause,
  Filter,
  Download,
} from "lucide-react";
import { format, differenceInDays, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import ClientJourneyTracker from "./components/ClientJourneyTracker";

// Journey phases with colors
const journeyPhases = [
  { id: 'D0', label: 'Ativação', color: 'bg-blue-500', deliverables: [1, 2] },
  { id: 'D+1', label: 'Agendamento', color: 'bg-indigo-500', deliverables: [3] },
  { id: 'D+3', label: 'Onboarding', color: 'bg-purple-500', deliverables: [4, 5, 6, 7, 8] },
  { id: 'D+7', label: 'Dossiê', color: 'bg-teal-500', deliverables: [9, 10, 11] },
  { id: 'D+15', label: 'Documentação', color: 'bg-amber-500', deliverables: [13, 14] },
  { id: 'D+30', label: 'Compliance', color: 'bg-rose-500', deliverables: [15, 16] },
  { id: 'Contínuo', label: 'Acompanhamento', color: 'bg-emerald-500', deliverables: [12, 17] },
];

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

export default function IpromedJourney() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState("pipeline");

  // Fetch clients with journey data
  const { data: clients = [], isLoading } = useQuery({
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

  // Calculate client's current phase based on contract date
  const getClientPhase = (client: Client) => {
    const meta = client.metadata as any;
    if (meta?.journey_phase) return meta.journey_phase;
    
    const startDate = meta?.journey_start_date || client.created_at;
    const daysSinceStart = differenceInDays(new Date(), new Date(startDate));
    
    if (daysSinceStart >= 30) return 'Contínuo';
    if (daysSinceStart >= 15) return 'D+30';
    if (daysSinceStart >= 7) return 'D+15';
    if (daysSinceStart >= 3) return 'D+7';
    if (daysSinceStart >= 1) return 'D+3';
    return 'D0';
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
      'D0': 0,
      'D+1': 1,
      'D+3': 3,
      'D+7': 7,
      'D+15': 15,
      'D+30': 30,
      'Contínuo': 90,
    };
    
    return addDays(startDate, daysMap[phase] || 0);
  };

  // Check if client is overdue
  const isOverdue = (client: Client) => {
    const phase = getClientPhase(client);
    if (phase === 'Contínuo') return false;
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
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Phase Overview */}
      <div className="grid grid-cols-7 gap-2">
        {journeyPhases.map((phase) => (
          <Card 
            key={phase.id}
            className={`border-none shadow-sm cursor-pointer transition-all ${
              selectedPhase === phase.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedPhase(selectedPhase === phase.id ? null : phase.id)}
          >
            <CardContent className="p-3 text-center">
              <div className={`w-3 h-3 ${phase.color} rounded-full mx-auto mb-2`} />
              <p className="text-xs font-medium">{phase.id}</p>
              <p className="text-[10px] text-muted-foreground truncate">{phase.label}</p>
              <p className="text-lg font-bold mt-1">{clientsByPhase[phase.id]?.length || 0}</p>
            </CardContent>
          </Card>
        ))}
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

        {/* Pipeline View */}
        <TabsContent value="pipeline" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
            {journeyPhases.map((phase) => (
              <div key={phase.id}>
                <div className={`${phase.color} text-white text-center py-2 rounded-t-lg`}>
                  <p className="font-semibold text-sm">{phase.id}</p>
                  <p className="text-xs opacity-80">{phase.label}</p>
                </div>
                <div className="bg-muted/30 rounded-b-lg p-2 min-h-[300px] space-y-2">
                  {clientsByPhase[phase.id]?.map((client) => (
                    <ClientCard key={client.id} client={client} />
                  ))}
                  {(!clientsByPhase[phase.id] || clientsByPhase[phase.id].length === 0) && (
                    <div className="text-center text-muted-foreground text-xs py-8">
                      Nenhum cliente
                    </div>
                  )}
                </div>
              </div>
            ))}
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
    </div>
  );
}
