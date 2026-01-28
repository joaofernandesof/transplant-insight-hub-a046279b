import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";

export interface AgendaTemplate {
  id: string;
  category: string;
  order_index: number;
  title: string;
  description: string | null;
  guidance: string | null;
  talking_points: string[] | null;
  required_before_next: boolean;
  estimated_minutes: number;
  created_by: string | null;
  created_at: string;
}

export interface MeetingAgenda {
  id: string;
  title: string;
  description: string | null;
  meeting_date: string | null;
  meeting_time: string | null;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AgendaItem {
  id: string;
  agenda_id: string;
  template_id: string | null;
  order_index: number;
  title: string;
  description: string | null;
  guidance: string | null;
  talking_points: string[] | null;
  estimated_minutes: number;
  is_completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface AgendaStats {
  total: number;
  completed: number;
  percentage: number;
  totalMinutes: number;
  completedMinutes: number;
}

// Available template categories
export const AGENDA_CATEGORIES = [
  { id: 'reuniao_equipe', label: 'Reunião de Equipe', icon: '👥', description: 'Alinhamento semanal com o time' },
  { id: 'one_on_one', label: 'One-on-One', icon: '🤝', description: 'Reunião individual com colaborador' },
  { id: 'kickoff_projeto', label: 'Kickoff de Projeto', icon: '🚀', description: 'Início de novo projeto' },
  { id: 'alinhamento_comercial', label: 'Alinhamento Comercial', icon: '💼', description: 'Revisão de pipeline e metas' },
  { id: 'custom', label: 'Personalizada', icon: '✨', description: 'Criar pauta do zero' },
];

export function useAgendaTemplates(category?: string) {
  return useQuery({
    queryKey: ["meeting-agenda-templates", category],
    queryFn: async () => {
      let query = supabase
        .from("meeting_agenda_templates")
        .select("*")
        .order("order_index", { ascending: true });

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as AgendaTemplate[];
    },
  });
}

export function useMeetingAgendas() {
  const { user } = useUnifiedAuth();
  
  return useQuery({
    queryKey: ["meeting-agendas", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meeting_agendas")
        .select("*")
        .order("meeting_date", { ascending: false });

      if (error) throw error;
      return data as unknown as MeetingAgenda[];
    },
    enabled: !!user?.id,
  });
}

export function useMeetingAgendaItems(agendaId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useUnifiedAuth();

  const { data: items, isLoading } = useQuery({
    queryKey: ["meeting-agenda-items", agendaId],
    queryFn: async () => {
      if (!agendaId) return [];

      const { data, error } = await supabase
        .from("meeting_agenda_items")
        .select("*")
        .eq("agenda_id", agendaId)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as unknown as AgendaItem[];
    },
    enabled: !!agendaId,
  });

  const stats: AgendaStats | null = items ? {
    total: items.length,
    completed: items.filter(i => i.is_completed).length,
    percentage: items.length > 0 
      ? Math.round((items.filter(i => i.is_completed).length / items.length) * 100) 
      : 0,
    totalMinutes: items.reduce((sum, i) => sum + (i.estimated_minutes || 0), 0),
    completedMinutes: items.filter(i => i.is_completed).reduce((sum, i) => sum + (i.estimated_minutes || 0), 0),
  } : null;

  const createAgenda = useMutation({
    mutationFn: async ({ title, description, meetingDate, meetingTime, category }: { 
      title: string; 
      description?: string;
      meetingDate?: string;
      meetingTime?: string;
      category?: string;
    }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      // Create the agenda
      const { data: agenda, error: agendaError } = await supabase
        .from("meeting_agendas")
        .insert({
          title,
          description,
          meeting_date: meetingDate,
          meeting_time: meetingTime,
          created_by: user.id,
          status: 'pendente',
        })
        .select()
        .single();

      if (agendaError) throw agendaError;

      // If a category template was selected, copy the template items
      if (category && category !== 'custom') {
        const { data: templates, error: templatesError } = await supabase
          .from("meeting_agenda_templates")
          .select("*")
          .eq("category", category)
          .order("order_index", { ascending: true });

        if (templatesError) throw templatesError;

        if (templates && templates.length > 0) {
          const agendaItems = templates.map((t: AgendaTemplate) => ({
            agenda_id: agenda.id,
            template_id: t.id,
            order_index: t.order_index,
            title: t.title,
            description: t.description,
            guidance: t.guidance,
            talking_points: t.talking_points,
            estimated_minutes: t.estimated_minutes,
            is_completed: false,
          }));

          const { error: insertError } = await supabase
            .from("meeting_agenda_items")
            .insert(agendaItems);

          if (insertError) throw insertError;
        }
      }

      return agenda as MeetingAgenda;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting-agendas"] });
      toast.success("Pauta criada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao criar pauta:", error);
      toast.error("Erro ao criar pauta");
    },
  });

  const addItem = useMutation({
    mutationFn: async ({ agendaId, title, description, guidance, talkingPoints, estimatedMinutes }: { 
      agendaId: string;
      title: string; 
      description?: string;
      guidance?: string;
      talkingPoints?: string[];
      estimatedMinutes?: number;
    }) => {
      // Get current max order_index
      const { data: existing } = await supabase
        .from("meeting_agenda_items")
        .select("order_index")
        .eq("agenda_id", agendaId)
        .order("order_index", { ascending: false })
        .limit(1);

      const nextOrder = (existing?.[0]?.order_index || 0) + 1;

      const { data, error } = await supabase
        .from("meeting_agenda_items")
        .insert({
          agenda_id: agendaId,
          order_index: nextOrder,
          title,
          description,
          guidance,
          talking_points: talkingPoints,
          estimated_minutes: estimatedMinutes || 5,
          is_completed: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting-agenda-items", agendaId] });
      toast.success("Item adicionado!");
    },
    onError: (error) => {
      console.error("Erro ao adicionar item:", error);
      toast.error("Erro ao adicionar item");
    },
  });

  const toggleItem = useMutation({
    mutationFn: async ({ itemId, isCompleted }: { itemId: string; isCompleted: boolean }) => {
      const updates: Record<string, unknown> = { is_completed: isCompleted };

      if (isCompleted) {
        updates.completed_at = new Date().toISOString();
        updates.completed_by = user?.id || null;
      } else {
        updates.completed_at = null;
        updates.completed_by = null;
      }

      const { error } = await supabase
        .from("meeting_agenda_items")
        .update(updates)
        .eq("id", itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting-agenda-items", agendaId] });
    },
    onError: (error) => {
      console.error("Erro ao atualizar item:", error);
      toast.error("Erro ao atualizar item");
    },
  });

  const updateItemNotes = useMutation({
    mutationFn: async ({ itemId, notes }: { itemId: string; notes: string }) => {
      const { error } = await supabase
        .from("meeting_agenda_items")
        .update({ notes })
        .eq("id", itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting-agenda-items", agendaId] });
    },
    onError: (error) => {
      console.error("Erro ao salvar anotações:", error);
      toast.error("Erro ao salvar anotações");
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from("meeting_agenda_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting-agenda-items", agendaId] });
      toast.success("Item removido");
    },
    onError: (error) => {
      console.error("Erro ao remover item:", error);
      toast.error("Erro ao remover item");
    },
  });

  const updateAgendaStatus = useMutation({
    mutationFn: async ({ agendaId, status }: { agendaId: string; status: string }) => {
      const { error } = await supabase
        .from("meeting_agendas")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", agendaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting-agendas"] });
    },
  });

  // Check if previous required items are completed
  const canCompleteItem = (itemOrderIndex: number): boolean => {
    if (!items) return false;
    
    // Find all required items before this one
    const previousItems = items.filter(i => i.order_index < itemOrderIndex);
    
    // For now, allow completing any item (sequential requirement is optional)
    // To enforce strict sequence, return: previousItems.every(i => i.is_completed);
    return true;
  };

  // Get next incomplete item
  const getNextIncompleteItem = (): AgendaItem | null => {
    if (!items) return null;
    return items.find(i => !i.is_completed) || null;
  };

  return {
    items: items || [],
    isLoading,
    stats,
    createAgenda,
    addItem,
    toggleItem,
    updateItemNotes,
    deleteItem,
    updateAgendaStatus,
    canCompleteItem,
    getNextIncompleteItem,
  };
}
