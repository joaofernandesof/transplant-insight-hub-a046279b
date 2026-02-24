/**
 * CPG Advocacia Médica - Jornada do Cliente Interativa
 * Visualização por cliente com tracking real das etapas D0 a D+30
 * Com Kanban de clientes, detalhes de fase e checklists
 * Suporte a Drag and Drop entre colunas
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Phone,
  Mail,
} from "lucide-react";
import { format, differenceInDays, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import ClientJourneyTracker from "./components/ClientJourneyTracker";
import JourneyPhaseDetail, { journeyPhasesDetailed, PhaseDetail } from "./components/JourneyPhaseDetail";
import { OnboardingMeetingDialog } from "./components/OnboardingMeetingAgenda";
import { MeetingScheduleDialog } from "./components/MeetingScheduleDialog";
import { cn } from "@/lib/utils";

// DnD Kit imports
import {
  DndContext,
  DragOverlay,
  rectIntersection,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  useDroppable,
  useDraggable,
  CollisionDetection,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

// Draggable Client Card Component
function DraggableClientCard({ 
  client, 
  phase, 
  navigate, 
  onScheduleMeeting,
  isDragging,
  isSelected,
  onSelect,
}: { 
  client: Client; 
  phase: typeof journeyPhases[0]; 
  navigate: (path: string) => void;
  onScheduleMeeting: (client: Client) => void;
  isDragging?: boolean;
  isSelected?: boolean;
  onSelect?: (clientId: string, selected: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: client.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-card hover:shadow-md transition-all cursor-grab active:cursor-grabbing border group/card",
        isDragging && "shadow-lg ring-2 ring-primary",
        isSelected && "ring-2 ring-primary bg-primary/5"
      )}
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-3 space-y-2">
        {/* Client Header Row with Checkbox */}
        <div className="flex items-center gap-2">
          {/* Selection Checkbox */}
          <div 
            className="flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(client.id, !isSelected);
            }}
          >
            <div className={cn(
              "h-4 w-4 rounded border-2 flex items-center justify-center cursor-pointer transition-colors",
              isSelected 
                ? "bg-primary border-primary" 
                : "border-muted-foreground/40 hover:border-primary"
            )}>
              {isSelected && (
                <CheckCircle2 className="h-3 w-3 text-white" />
              )}
            </div>
          </div>
          
          <Avatar 
            className="h-8 w-8 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/ipromed/clients/${client.id}`);
            }}
          >
            <AvatarFallback className={cn("text-xs font-medium text-white", phase.color)}>
              {client.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p 
              className="font-medium text-sm hover:text-primary cursor-pointer leading-tight break-words"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/ipromed/clients/${client.id}`);
              }}
            >
              {client.name}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 opacity-0 group-hover/card:opacity-100 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
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
              <DropdownMenuItem onClick={() => onScheduleMeeting(client)}>
                <Video className="h-4 w-4 mr-2" />
                Agendar Reunião
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Contact Info - Phone & Email */}
        <div className="space-y-1 text-xs text-muted-foreground">
          {client.phone && (
            <div className="flex items-center gap-1.5 truncate">
              <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="truncate">{client.phone}</span>
            </div>
          )}
          {client.email && (
            <div className="flex items-center gap-1.5 truncate">
              <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="truncate">{client.email}</span>
            </div>
          )}
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
  );
}

// Sort options
type SortOption = 'name-asc' | 'name-desc' | 'date-asc' | 'date-desc';

// Droppable Column Component
function DroppableColumn({ 
  phase, 
  clients, 
  searchTerm,
  navigate,
  onScheduleMeeting,
  onViewPhaseDetail,
  isOver,
  activeId,
  selectedClients,
  onSelectClient,
  onSelectAll,
  sortOption,
  onSortChange,
}: { 
  phase: typeof journeyPhases[0]; 
  clients: Client[]; 
  searchTerm: string;
  navigate: (path: string) => void;
  onScheduleMeeting: (client: Client) => void;
  onViewPhaseDetail: (phase: PhaseDetail) => void;
  isOver: boolean;
  activeId: string | null;
  selectedClients: Set<string>;
  onSelectClient: (clientId: string, selected: boolean) => void;
  onSelectAll: (phaseId: string, clientIds: string[], selectAll: boolean) => void;
  sortOption: SortOption;
  onSortChange: (phaseId: string, option: SortOption) => void;
}) {
  const { setNodeRef } = useDroppable({ id: phase.id });
  
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Apply sorting
  const sortedClients = [...filteredClients].sort((a, b) => {
    switch (sortOption) {
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'date-asc':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'date-desc':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      default:
        return 0;
    }
  });

  const phaseDetail = journeyPhasesDetailed.find(p => p.id === phase.id);
  const allSelected = sortedClients.length > 0 && sortedClients.every(c => selectedClients.has(c.id));
  const someSelected = sortedClients.some(c => selectedClients.has(c.id));

  return (
    <div className="flex flex-col min-w-0">
      {/* Column Header - Avivar Style */}
      <div className={cn(
        "rounded-xl px-3 py-4 flex items-center justify-between group min-h-[56px]",
        phase.color
      )}>
        <div className="flex items-center gap-2">
          {/* Select All Checkbox */}
          <div 
            className="flex-shrink-0 cursor-pointer"
            onClick={() => onSelectAll(phase.id, sortedClients.map(c => c.id), !allSelected)}
          >
            <div className={cn(
              "h-4 w-4 rounded border-2 flex items-center justify-center transition-colors",
              allSelected 
                ? "bg-white border-white" 
                : someSelected
                  ? "bg-white/50 border-white"
                  : "border-white/50 hover:border-white"
            )}>
              {allSelected && (
                <CheckCircle2 className="h-3 w-3 text-primary" />
              )}
              {someSelected && !allSelected && (
                <div className="h-2 w-2 bg-primary rounded-sm" />
              )}
            </div>
          </div>
          <span className="font-semibold text-white text-sm leading-tight text-center break-words">{phase.label}</span>
        </div>
        <div className="flex items-center gap-1">
          {sortedClients.length > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-white/20 text-white border-0">
              {sortedClients.length}
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
                  onViewPhaseDetail(phaseDetail);
                }
              }}>
                <Info className="h-4 w-4 mr-2" />
                Ver Detalhes da Fase
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onSortChange(phase.id, 'name-asc')}
                className={sortOption === 'name-asc' ? 'bg-muted' : ''}
              >
                Ordenar: Nome (A-Z)
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onSortChange(phase.id, 'name-desc')}
                className={sortOption === 'name-desc' ? 'bg-muted' : ''}
              >
                Ordenar: Nome (Z-A)
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onSortChange(phase.id, 'date-asc')}
                className={sortOption === 'date-asc' ? 'bg-muted' : ''}
              >
                Ordenar: Data (Mais antigo)
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onSortChange(phase.id, 'date-desc')}
                className={sortOption === 'date-desc' ? 'bg-muted' : ''}
              >
                Ordenar: Data (Mais recente)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Column Content - Área de drop expandida e mais responsiva */}
      <div 
        ref={setNodeRef}
        className={cn(
          "flex-1 mt-2 space-y-2 min-h-[500px] rounded-lg p-3 border-2 border-dashed transition-all duration-200 overflow-y-auto",
          isOver 
            ? "bg-primary/15 border-primary ring-2 ring-primary/40 scale-[1.01]" 
            : activeId 
              ? "bg-muted/30 border-primary/30 hover:bg-primary/5 hover:border-primary/50"
              : "bg-muted/20 border-muted-foreground/20"
        )}
      >
        <SortableContext 
          items={sortedClients.map(c => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {sortedClients.map((client) => (
            <DraggableClientCard
              key={client.id}
              client={client}
              phase={phase}
              navigate={navigate}
              onScheduleMeeting={onScheduleMeeting}
              isDragging={activeId === client.id}
              isSelected={selectedClients.has(client.id)}
              onSelect={onSelectClient}
            />
          ))}
        </SortableContext>
        
        {/* Empty State - mostra área de drop visível durante arraste */}
        {sortedClients.length === 0 && (
          <div className={cn(
            "flex flex-col items-center justify-center py-16 text-muted-foreground transition-all duration-200",
            isOver && "text-primary scale-105",
            activeId && !isOver && "text-muted-foreground/60"
          )}>
            <Users className={cn(
              "h-10 w-10 mb-2 transition-all duration-200",
              isOver ? "opacity-80 text-primary" : "opacity-20"
            )} />
            <p className="text-xs font-medium">{isOver ? "✓ Solte aqui" : "Arraste clientes aqui"}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function IpromedJourney() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState("pipeline");
  const [phaseDetailOpen, setPhaseDetailOpen] = useState(false);
  const [selectedPhaseDetail, setSelectedPhaseDetail] = useState<PhaseDetail | null>(null);
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false);
  const [meetingClient, setMeetingClient] = useState<Client | null>(null);
  
  // Selection state
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  
  // Sort state per column
  const [columnSortOptions, setColumnSortOptions] = useState<Record<string, SortOption>>({});
  
  // DnD state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // Selection handlers
  const handleSelectClient = (clientId: string, selected: boolean) => {
    setSelectedClients(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(clientId);
      } else {
        next.delete(clientId);
      }
      return next;
    });
  };

  const handleSelectAll = (phaseId: string, clientIds: string[], selectAll: boolean) => {
    setSelectedClients(prev => {
      const next = new Set(prev);
      clientIds.forEach(id => {
        if (selectAll) {
          next.add(id);
        } else {
          next.delete(id);
        }
      });
      return next;
    });
  };

  const handleSortChange = (phaseId: string, option: SortOption) => {
    setColumnSortOptions(prev => ({
      ...prev,
      [phaseId]: option,
    }));
  };

  // DnD sensors - mais sensível para facilitar o arraste
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Reduzido de 8px para 3px - inicia drag mais rápido
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // IDs das fases (colunas) para filtrar colisões
  const phaseIds = useMemo(() => journeyPhases.map(p => p.id), []);

  // Custom collision detection - FOCA APENAS NAS COLUNAS, ignora cards
  const customCollisionDetection: CollisionDetection = (args) => {
    // Filtra droppableContainers para incluir APENAS as colunas (phases), não os cards
    const columnContainers = args.droppableContainers.filter(
      container => phaseIds.includes(container.id as string)
    );
    
    // Se não há colunas no alcance, retorna vazio
    if (columnContainers.length === 0) {
      return [];
    }

    // Cria novo args apenas com as colunas
    const columnsOnlyArgs = {
      ...args,
      droppableContainers: columnContainers,
    };

    // Usa pointerWithin para detecção precisa apenas em colunas
    const pointerCollisions = pointerWithin(columnsOnlyArgs);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    
    // Fallback para rectIntersection apenas em colunas
    const rectCollisions = rectIntersection(columnsOnlyArgs);
    if (rectCollisions.length > 0) {
      return rectCollisions;
    }
    
    // Último fallback para closestCenter apenas em colunas
    return closestCenter(columnsOnlyArgs);
  };

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

  // Update client phase mutation com atualização otimista
  const updateClientPhase = useMutation({
    mutationFn: async ({ clientId, newPhase }: { clientId: string; newPhase: string }) => {
      // Get current metadata
      const { data: client, error: fetchError } = await supabase
        .from('ipromed_legal_clients')
        .select('metadata')
        .eq('id', clientId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const currentMetadata = (client?.metadata as any) || {};
      const updatedMetadata = {
        ...currentMetadata,
        journey_phase: newPhase,
      };
      
      const { error: updateError } = await supabase
        .from('ipromed_legal_clients')
        .update({ metadata: updatedMetadata })
        .eq('id', clientId);
        
      if (updateError) throw updateError;
      
      return { clientId, newPhase };
    },
    // Atualização otimista - move o card IMEDIATAMENTE sem esperar o servidor
    onMutate: async ({ clientId, newPhase }) => {
      // Cancela queries pendentes para evitar sobrescrita
      await queryClient.cancelQueries({ queryKey: ['ipromed-journey-clients'] });
      
      // Salva estado anterior para rollback
      const previousClients = queryClient.getQueryData<Client[]>(['ipromed-journey-clients']);
      
      // Atualiza cache imediatamente (otimista)
      queryClient.setQueryData<Client[]>(['ipromed-journey-clients'], (old) => {
        if (!old) return old;
        return old.map(client => {
          if (client.id === clientId) {
            return {
              ...client,
              metadata: {
                ...(client.metadata as any),
                journey_phase: newPhase,
              }
            };
          }
          return client;
        });
      });
      
      return { previousClients };
    },
    onError: (error, variables, context) => {
      // Rollback em caso de erro
      if (context?.previousClients) {
        queryClient.setQueryData(['ipromed-journey-clients'], context.previousClients);
      }
      toast.error('Erro ao mover cliente: ' + error.message);
    },
    onSettled: () => {
      // Revalida os dados após mutação (sucesso ou erro)
      queryClient.invalidateQueries({ queryKey: ['ipromed-journey-clients'] });
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
  const clientsByPhase = useMemo(() => {
    return journeyPhases.reduce((acc, phase) => {
      acc[phase.id] = clients.filter(c => getClientPhase(c) === phase.id);
      return acc;
    }, {} as Record<string, Client[]>);
  }, [clients]);

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

  // DnD Handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId(over?.id as string || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setOverId(null);

    if (!over) return;

    const clientId = active.id as string;
    const targetPhaseId = over.id as string;
    
    // Check if dropped on a column (phase)
    const isPhase = journeyPhases.some(p => p.id === targetPhaseId);
    
    if (isPhase) {
      const client = clients.find(c => c.id === clientId);
      const currentPhase = client ? getClientPhase(client) : null;
      
      // Permite mover para qualquer fase (incluindo voltar)
      if (currentPhase !== targetPhaseId) {
        const targetPhase = journeyPhases.find(p => p.id === targetPhaseId);
        const currentPhaseInfo = journeyPhases.find(p => p.id === currentPhase);
        toast.success(`Cliente movido de "${currentPhaseInfo?.label}" para "${targetPhase?.label}"`);
        updateClientPhase.mutate({ clientId, newPhase: targetPhaseId });
      }
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setOverId(null);
  };

  // Get active client for drag overlay
  const activeClient = activeId ? clients.find(c => c.id === activeId) : null;
  const activePhase = activeClient ? journeyPhases.find(p => p.id === getClientPhase(activeClient)) : null;

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
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
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
            
            <Button className="gap-2" onClick={() => navigate('/cpg/clients')}>
              <Plus className="h-4 w-4" />
              Adicionar Cliente
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
          
          {/* Selected count */}
          {selectedClients.size > 0 && (
            <div className="flex items-center gap-2 ml-4 pl-4 border-l">
              <Badge variant="default" className="gap-1">
                {selectedClients.size} selecionado(s)
              </Badge>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedClients(new Set())}
              >
                Limpar
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    Ações em Massa
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {journeyPhases.map((phase) => (
                    <DropdownMenuItem
                      key={phase.id}
                      onClick={() => {
                        selectedClients.forEach(clientId => {
                          updateClientPhase.mutate({ clientId, newPhase: phase.id });
                        });
                        toast.success(`${selectedClients.size} cliente(s) movido(s) para "${phase.label}"`);
                        setSelectedClients(new Set());
                      }}
                    >
                      <div className={cn("h-3 w-3 rounded-full mr-2", phase.color)} />
                      Mover para {phase.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>

      {/* Kanban Content with DnD - Avivar Style */}
      {activeTab === "pipeline" && (
        <DndContext
          sensors={sensors}
          collisionDetection={customCollisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex-1 overflow-hidden px-4 py-4">
            <div className="grid h-full gap-3" style={{ gridTemplateColumns: `repeat(${journeyPhases.length}, minmax(0, 1fr))` }}>
              {journeyPhases.map((phase) => (
                <DroppableColumn
                  key={phase.id}
                  phase={phase}
                  clients={clientsByPhase[phase.id] || []}
                  searchTerm={searchTerm}
                  navigate={navigate}
                  onScheduleMeeting={(client) => {
                    setMeetingClient(client);
                    setMeetingDialogOpen(true);
                  }}
                  onViewPhaseDetail={(phaseDetail) => {
                    setSelectedPhaseDetail(phaseDetail);
                    setPhaseDetailOpen(true);
                  }}
                  isOver={overId === phase.id}
                  activeId={activeId}
                  selectedClients={selectedClients}
                  onSelectClient={handleSelectClient}
                  onSelectAll={handleSelectAll}
                  sortOption={columnSortOptions[phase.id] || 'date-desc'}
                  onSortChange={handleSortChange}
                />
              ))}
            </div>
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeClient && activePhase && (
              <Card className="bg-card shadow-xl border-2 border-primary w-[220px] cursor-grabbing">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className={cn("text-xs font-medium text-white", activePhase.color)}>
                        {activeClient.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {activeClient.name}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* List View - Full Table */}
      {activeTab === "list" && (
        <div className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-4">
              <div className="border rounded-lg overflow-hidden bg-card">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="w-12">
                        <div 
                          className="flex-shrink-0 cursor-pointer"
                          onClick={() => {
                            const allIds = filteredClients.map(c => c.id);
                            const allSelected = allIds.every(id => selectedClients.has(id));
                            if (allSelected) {
                              setSelectedClients(new Set());
                            } else {
                              setSelectedClients(new Set(allIds));
                            }
                          }}
                        >
                          <div className={cn(
                            "h-4 w-4 rounded border-2 flex items-center justify-center transition-colors",
                            filteredClients.length > 0 && filteredClients.every(c => selectedClients.has(c.id))
                              ? "bg-primary border-primary" 
                              : filteredClients.some(c => selectedClients.has(c.id))
                                ? "bg-primary/50 border-primary"
                                : "border-muted-foreground/40 hover:border-primary"
                          )}>
                            {filteredClients.every(c => selectedClients.has(c.id)) && filteredClients.length > 0 && (
                              <CheckCircle2 className="h-3 w-3 text-white" />
                            )}
                          </div>
                        </div>
                      </TableHead>
                      <TableHead className="min-w-[200px]">Cliente</TableHead>
                      <TableHead className="min-w-[150px]">Email</TableHead>
                      <TableHead className="min-w-[130px]">Telefone</TableHead>
                      <TableHead className="min-w-[150px]">Fase Atual</TableHead>
                      <TableHead className="min-w-[120px] text-center">Progresso</TableHead>
                      <TableHead className="min-w-[100px]">Início</TableHead>
                      <TableHead className="min-w-[100px]">Onboarding</TableHead>
                      <TableHead className="min-w-[100px]">Contrato</TableHead>
                      <TableHead className="min-w-[100px]">Reunião</TableHead>
                      <TableHead className="min-w-[80px] text-center">Status</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={12} className="h-32 text-center text-muted-foreground">
                          <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          Nenhum cliente encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredClients.map((client) => {
                        const phase = getClientPhase(client);
                        const phaseInfo = journeyPhases.find(p => p.id === phase);
                        const meta = client.metadata as any;
                        const progress = meta?.journey_progress || Math.min(100, (differenceInDays(new Date(), new Date(client.created_at)) / 30) * 100);
                        const overdue = isOverdue(client);
                        const onboardingDate = meta?.onboarding_date;
                        const contractDate = meta?.contract_signed_date;
                        const meetingDate = meta?.presentation_meeting_date;
                        
                        return (
                          <TableRow 
                            key={client.id}
                            className={cn(
                              "group cursor-pointer",
                              selectedClients.has(client.id) && "bg-primary/5",
                              overdue && "bg-destructive/5"
                            )}
                            onClick={() => navigate(`/ipromed/clients/${client.id}`)}
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <div 
                                className="cursor-pointer"
                                onClick={() => handleSelectClient(client.id, !selectedClients.has(client.id))}
                              >
                                <div className={cn(
                                  "h-4 w-4 rounded border-2 flex items-center justify-center transition-colors",
                                  selectedClients.has(client.id)
                                    ? "bg-primary border-primary" 
                                    : "border-muted-foreground/40 hover:border-primary"
                                )}>
                                  {selectedClients.has(client.id) && (
                                    <CheckCircle2 className="h-3 w-3 text-white" />
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 flex-shrink-0">
                                  <AvatarFallback className={cn("text-xs font-medium text-white", phaseInfo?.color || "bg-muted")}>
                                    {client.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{client.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {client.email || '—'}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {client.phone || '—'}
                            </TableCell>
                            <TableCell>
                              <Badge className={cn("text-white", phaseInfo?.color || "bg-muted")}>
                                {phaseInfo?.label || phase}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={progress} className="h-2 flex-1" />
                                <span className="text-xs text-muted-foreground w-10 text-right">
                                  {Math.round(progress)}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {format(new Date(client.created_at), 'dd/MM/yy', { locale: ptBR })}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {onboardingDate ? (
                                <span className="text-green-600 flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  {format(new Date(onboardingDate), 'dd/MM/yy', { locale: ptBR })}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">Pendente</span>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {contractDate ? (
                                <span className="text-green-600 flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  {format(new Date(contractDate), 'dd/MM/yy', { locale: ptBR })}
                                </span>
                              ) : meta?.contract_signed ? (
                                <span className="text-green-600 flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Assinado
                                </span>
                              ) : (
                                <span className="text-muted-foreground">Pendente</span>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {meetingDate ? (
                                <span className="text-green-600 flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  {format(new Date(meetingDate), 'dd/MM/yy', { locale: ptBR })}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">Pendente</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {overdue ? (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <AlertTriangle className="h-4 w-4 text-destructive" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Cliente precisa de atenção</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              )}
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
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
                                  <DropdownMenuSeparator />
                                  {journeyPhases.map((phase) => (
                                    <DropdownMenuItem
                                      key={phase.id}
                                      onClick={() => {
                                        updateClientPhase.mutate({ clientId: client.id, newPhase: phase.id });
                                      }}
                                    >
                                      <div className={cn("h-3 w-3 rounded-full mr-2", phase.color)} />
                                      Mover para {phase.label}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </ScrollArea>
          
          {/* Bulk Actions Bar */}
          {selectedClients.size > 0 && (
            <div className="border-t bg-muted/50 p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="default">{selectedClients.size} selecionado(s)</Badge>
                <Button variant="ghost" size="sm" onClick={() => setSelectedClients(new Set())}>
                  Limpar seleção
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1">
                      Mover para fase
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {journeyPhases.map((phase) => (
                      <DropdownMenuItem
                        key={phase.id}
                        onClick={() => {
                          selectedClients.forEach(clientId => {
                            updateClientPhase.mutate({ clientId, newPhase: phase.id });
                          });
                          toast.success(`${selectedClients.size} cliente(s) movido(s) para "${phase.label}"`);
                          setSelectedClients(new Set());
                        }}
                      >
                        <div className={cn("h-3 w-3 rounded-full mr-2", phase.color)} />
                        {phase.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
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
