/**
 * CPG Advocacia Médica - Funil Comercial
 * Kanban com 2 funis: Contencioso e Assessoria Preventiva
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  MoreVertical,
  Phone,
  Mail,
  Building2,
  Stethoscope,
  GripVertical,
  Trash2,
  Edit,
  Users,
  Scale,
  Briefcase,
  Loader2,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SalesFunnel {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  order_index: number;
}

interface FunnelStage {
  id: string;
  funnel_id: string;
  name: string;
  description: string | null;
  color: string | null;
  order_index: number;
}

interface SalesLead {
  id: string;
  funnel_id: string;
  stage_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  specialty: string | null;
  company_name: string | null;
  notes: string | null;
  source: string | null;
  metadata: Record<string, unknown> | null;
  custom_fields: Record<string, unknown> | null;
  order_index: number;
  created_at: string;
}

// Draggable Lead Card
function DraggableLeadCard({
  lead,
  stageColor,
  onEdit,
  onDelete,
}: {
  lead: SalesLead;
  stageColor: string;
  onEdit: (lead: SalesLead) => void;
  onDelete: (leadId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-card hover:shadow-md transition-all cursor-grab active:cursor-grabbing border group/card",
        isDragging && "shadow-lg ring-2 ring-primary"
      )}
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-3 space-y-2">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className={cn("text-xs font-medium text-white bg-gradient-to-br", stageColor)}>
              {lead.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{lead.name}</p>
            {lead.company_name && (
              <p className="text-xs text-muted-foreground truncate">{lead.company_name}</p>
            )}
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
              <DropdownMenuItem onClick={() => onEdit(lead)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(lead.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Contact Info */}
        <div className="space-y-1 text-xs text-muted-foreground">
          {lead.phone && (
            <div className="flex items-center gap-1.5 truncate">
              <Phone className="h-3 w-3 shrink-0" />
              <span className="truncate">{lead.phone}</span>
            </div>
          )}
          {lead.email && (
            <div className="flex items-center gap-1.5 truncate">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
          {lead.specialty && (
            <div className="flex items-center gap-1.5 truncate">
              <Stethoscope className="h-3 w-3 shrink-0" />
              <span className="truncate">{lead.specialty}</span>
            </div>
          )}
        </div>

        {/* Source Badge */}
        {lead.source && (
          <Badge variant="outline" className="text-[10px] px-1.5">
            {lead.source}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

// Droppable Stage Column
function DroppableStageColumn({
  stage,
  leads,
  searchTerm,
  onEdit,
  onDelete,
  isOver,
  activeId,
}: {
  stage: FunnelStage;
  leads: SalesLead[];
  searchTerm: string;
  onEdit: (lead: SalesLead) => void;
  onDelete: (leadId: string) => void;
  isOver: boolean;
  activeId: string | null;
}) {
  const { setNodeRef } = useDroppable({ id: stage.id });

  const filteredLeads = leads.filter(
    (l) =>
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col flex-1 min-w-[260px] max-w-[300px]">
      {/* Column Header */}
      <div
        className={cn(
          "rounded-lg px-3 py-2.5 flex items-center justify-between bg-gradient-to-br",
          stage.color || "from-gray-500 to-gray-600"
        )}
      >
        <span className="font-semibold text-white text-sm truncate">{stage.name}</span>
        <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-white/20 text-white border-0">
          {filteredLeads.length}
        </Badge>
      </div>

      {/* Column Content */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 mt-2 space-y-2 min-h-[400px] rounded-lg p-2 border-2 border-dashed transition-all duration-200 overflow-y-auto",
          isOver
            ? "bg-primary/15 border-primary ring-2 ring-primary/40"
            : activeId
            ? "bg-muted/30 border-primary/30 hover:bg-primary/5"
            : "bg-muted/20 border-muted-foreground/20"
        )}
      >
        <SortableContext items={filteredLeads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {filteredLeads.map((lead) => (
            <DraggableLeadCard
              key={lead.id}
              lead={lead}
              stageColor={stage.color || "from-gray-500 to-gray-600"}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>

        {filteredLeads.length === 0 && (
          <div
            className={cn(
              "flex flex-col items-center justify-center py-12 text-muted-foreground transition-all",
              isOver && "text-primary"
            )}
          >
            <Users className={cn("h-8 w-8 mb-2", isOver ? "opacity-80" : "opacity-20")} />
            <p className="text-xs font-medium">{isOver ? "Solte aqui" : "Arraste leads aqui"}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function IpromedSalesFunnel() {
  const queryClient = useQueryClient();
  const [activeFunnel, setActiveFunnel] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<SalesLead | null>(null);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialty: "",
    company_name: "",
    notes: "",
    source: "",
  });

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Fetch funnels
  const { data: funnels = [], isLoading: loadingFunnels } = useQuery({
    queryKey: ["cpg-sales-funnels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cpg_sales_funnels")
        .select("*")
        .eq("is_active", true)
        .order("order_index");
      if (error) throw error;
      return data as SalesFunnel[];
    },
  });

  // Set default funnel when loaded
  useMemo(() => {
    if (funnels.length > 0 && !activeFunnel) {
      setActiveFunnel(funnels[0].id);
    }
  }, [funnels, activeFunnel]);

  // Fetch stages for active funnel
  const { data: stages = [], isLoading: loadingStages } = useQuery({
    queryKey: ["cpg-funnel-stages", activeFunnel],
    queryFn: async () => {
      if (!activeFunnel) return [];
      const { data, error } = await supabase
        .from("cpg_sales_funnel_stages")
        .select("*")
        .eq("funnel_id", activeFunnel)
        .order("order_index");
      if (error) throw error;
      return data as FunnelStage[];
    },
    enabled: !!activeFunnel,
  });

  // Fetch leads for active funnel
  const { data: leads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ["cpg-sales-leads", activeFunnel],
    queryFn: async () => {
      if (!activeFunnel) return [];
      const { data, error } = await supabase
        .from("cpg_sales_leads")
        .select("*")
        .eq("funnel_id", activeFunnel)
        .order("order_index");
      if (error) throw error;
      return data as SalesLead[];
    },
    enabled: !!activeFunnel,
  });

  // Add/Update lead mutation
  const saveLead = useMutation({
    mutationFn: async (data: { id?: string; name: string; email?: string | null; phone?: string | null; specialty?: string | null; company_name?: string | null; notes?: string | null; source?: string | null }) => {
      if (data.id) {
        const { error } = await supabase
          .from("cpg_sales_leads")
          .update({
            name: data.name,
            email: data.email,
            phone: data.phone,
            specialty: data.specialty,
            company_name: data.company_name,
            notes: data.notes,
            source: data.source,
          })
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cpg_sales_leads").insert({
          name: data.name,
          email: data.email,
          phone: data.phone,
          specialty: data.specialty,
          company_name: data.company_name,
          notes: data.notes,
          source: data.source,
          funnel_id: activeFunnel!,
          stage_id: selectedStageId || stages[0]?.id,
          order_index: leads.filter((l) => l.stage_id === (selectedStageId || stages[0]?.id)).length,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cpg-sales-leads"] });
      setAddLeadOpen(false);
      setEditingLead(null);
      resetForm();
      toast.success(editingLead ? "Lead atualizado!" : "Lead adicionado!");
    },
    onError: (error: Error) => {
      toast.error("Erro: " + error.message);
    },
  });

  // Delete lead mutation
  const deleteLead = useMutation({
    mutationFn: async (leadId: string) => {
      const { error } = await supabase.from("cpg_sales_leads").delete().eq("id", leadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cpg-sales-leads"] });
      toast.success("Lead excluído!");
    },
  });

  // Move lead mutation
  const moveLead = useMutation({
    mutationFn: async ({ leadId, newStageId }: { leadId: string; newStageId: string }) => {
      const { error } = await supabase
        .from("cpg_sales_leads")
        .update({ stage_id: newStageId })
        .eq("id", leadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cpg-sales-leads"] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      specialty: "",
      company_name: "",
      notes: "",
      source: "",
    });
    setSelectedStageId(null);
  };

  const handleEdit = (lead: SalesLead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name,
      email: lead.email || "",
      phone: lead.phone || "",
      specialty: lead.specialty || "",
      company_name: lead.company_name || "",
      notes: lead.notes || "",
      source: lead.source || "",
    });
    setAddLeadOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name) {
      toast.error("Nome é obrigatório");
      return;
    }
    saveLead.mutate({
      ...(editingLead ? { id: editingLead.id } : {}),
      name: formData.name,
      email: formData.email || null,
      phone: formData.phone || null,
      specialty: formData.specialty || null,
      company_name: formData.company_name || null,
      notes: formData.notes || null,
      source: formData.source || null,
    });
  };

  // DnD handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: any) => {
    setOverId(event.over?.id as string | null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over) return;

    const leadId = active.id as string;
    const targetId = over.id as string;

    // Check if target is a stage
    const targetStage = stages.find((s) => s.id === targetId);
    if (targetStage) {
      const currentLead = leads.find((l) => l.id === leadId);
      if (currentLead && currentLead.stage_id !== targetStage.id) {
        moveLead.mutate({ leadId, newStageId: targetStage.id });
      }
    }
  };

  const currentFunnel = funnels.find((f) => f.id === activeFunnel);
  const isLoading = loadingFunnels || loadingStages || loadingLeads;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Funil Comercial</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie seus leads e acompanhe o pipeline de vendas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-[200px]"
            />
          </div>
          <Button onClick={() => {
            resetForm();
            setEditingLead(null);
            setAddLeadOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Lead
          </Button>
        </div>
      </div>

      {/* Funnel Tabs */}
      <Tabs value={activeFunnel || ""} onValueChange={setActiveFunnel} className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-fit mb-4">
          {funnels.map((funnel) => (
            <TabsTrigger key={funnel.id} value={funnel.id} className="gap-2">
              {funnel.icon === "scale" ? (
                <Scale className="h-4 w-4" />
              ) : (
                <Briefcase className="h-4 w-4" />
              )}
              {funnel.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {funnels.map((funnel) => (
          <TabsContent key={funnel.id} value={funnel.id} className="flex-1 min-h-0 mt-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                <ScrollArea className="h-full pb-4">
                  <div className="flex gap-4 min-w-max pr-4">
                    {stages.map((stage) => (
                      <DroppableStageColumn
                        key={stage.id}
                        stage={stage}
                        leads={leads.filter((l) => l.stage_id === stage.id)}
                        searchTerm={searchTerm}
                        onEdit={handleEdit}
                        onDelete={(id) => deleteLead.mutate(id)}
                        isOver={overId === stage.id}
                        activeId={activeId}
                      />
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </DndContext>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Add/Edit Lead Dialog */}
      <Dialog open={addLeadOpen} onOpenChange={(open) => {
        setAddLeadOpen(open);
        if (!open) {
          setEditingLead(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingLead ? "Editar Lead" : "Novo Lead"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome completo"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Telefone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Especialidade</Label>
                <Input
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  placeholder="Ex: Cardiologia"
                />
              </div>
              <div>
                <Label>Empresa/Clínica</Label>
                <Input
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="Nome da empresa"
                />
              </div>
            </div>
            <div>
              <Label>Origem</Label>
              <Input
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                placeholder="Ex: Site, Indicação, Instagram"
              />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Anotações sobre o lead..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddLeadOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saveLead.isPending}>
              {saveLead.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              {editingLead ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
