import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface EventChecklist {
  id: string;
  class_id: string | null;
  event_name: string;
  event_start_date: string;
  event_end_date: string | null;
  location: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface EventChecklistItem {
  id: string;
  checklist_id: string;
  task_description: string;
  days_offset: number;
  due_date: string | null;
  responsible: string;
  status: string;
  observation: string | null;
  category: string | null;
  priority: string;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChecklistWithItems extends EventChecklist {
  items: EventChecklistItem[];
}

export function useEventChecklists() {
  const queryClient = useQueryClient();

  const { data: checklists, isLoading } = useQuery({
    queryKey: ["event-checklists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_checklists")
        .select("*")
        .order("event_start_date", { ascending: true });
      
      if (error) throw error;
      return data as EventChecklist[];
    }
  });

  const { data: upcomingClasses } = useQuery({
    queryKey: ["upcoming-classes-for-events"],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from("course_classes")
        .select("id, name, code, start_date, end_date, location, status")
        .gte("start_date", today)
        .order("start_date", { ascending: true })
        .limit(10);
      
      if (error) throw error;
      return data;
    }
  });

  const createChecklist = useMutation({
    mutationFn: async (checklist: {
      event_name: string;
      event_start_date: string;
      event_end_date?: string | null;
      location?: string | null;
      class_id?: string | null;
      notes?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("event_checklists")
        .insert(checklist)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-checklists"] });
      toast.success("Checklist criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar checklist: " + error.message);
    }
  });

  return {
    checklists,
    upcomingClasses,
    isLoading,
    createChecklist
  };
}

export function useChecklistItems(checklistId: string | null) {
  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ["checklist-items", checklistId],
    queryFn: async () => {
      if (!checklistId) return [];
      
      const { data, error } = await supabase
        .from("event_checklist_items")
        .select("*")
        .eq("checklist_id", checklistId)
        .order("days_offset", { ascending: true })
        .order("task_description", { ascending: true });
      
      if (error) throw error;
      return data as EventChecklistItem[];
    },
    enabled: !!checklistId
  });

  const updateItemStatus = useMutation({
    mutationFn: async ({ itemId, status }: { itemId: string; status: string }) => {
      const updates: Record<string, unknown> = { status };
      
      if (status === "concluido") {
        updates.completed_at = new Date().toISOString();
        const { data: { user } } = await supabase.auth.getUser();
        updates.completed_by = user?.id;
      } else {
        updates.completed_at = null;
        updates.completed_by = null;
      }
      
      const { error } = await supabase
        .from("event_checklist_items")
        .update(updates)
        .eq("id", itemId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-items", checklistId] });
      toast.success("Status atualizado!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    }
  });

  const updateItemObservation = useMutation({
    mutationFn: async ({ itemId, observation }: { itemId: string; observation: string }) => {
      const { error } = await supabase
        .from("event_checklist_items")
        .update({ observation })
        .eq("id", itemId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-items", checklistId] });
    }
  });

  const createItem = useMutation({
    mutationFn: async (item: {
      checklist_id: string;
      task_description: string;
      responsible: string;
      days_offset?: number;
      due_date?: string | null;
      status?: string;
      observation?: string | null;
      category?: string | null;
      priority?: string;
    }) => {
      const { data, error } = await supabase
        .from("event_checklist_items")
        .insert(item)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-items", checklistId] });
      toast.success("Tarefa adicionada!");
    }
  });

  const deleteItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from("event_checklist_items")
        .delete()
        .eq("id", itemId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-items", checklistId] });
      toast.success("Tarefa removida!");
    }
  });

  const bulkCreateItems = useMutation({
    mutationFn: async (items: {
      checklist_id: string;
      task_description: string;
      responsible: string;
      days_offset?: number;
      due_date?: string | null;
      status?: string;
      observation?: string | null;
      category?: string | null;
      priority?: string;
    }[]) => {
      const { error } = await supabase
        .from("event_checklist_items")
        .insert(items);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-items", checklistId] });
      toast.success("Tarefas importadas com sucesso!");
    }
  });

  // Stats
  const stats = items ? {
    total: items.length,
    pendente: items.filter(i => i.status === "pendente").length,
    em_andamento: items.filter(i => i.status === "em_andamento").length,
    concluido: items.filter(i => i.status === "concluido").length,
    cancelado: items.filter(i => i.status === "cancelado").length,
    atrasados: items.filter(i => {
      if (!i.due_date || i.status === "concluido" || i.status === "cancelado") return false;
      return new Date(i.due_date) < new Date();
    }).length,
    byResponsible: items.reduce((acc, item) => {
      const key = item.responsible;
      if (!acc[key]) acc[key] = { total: 0, concluido: 0, pendente: 0, em_andamento: 0 };
      acc[key].total++;
      if (item.status === "concluido") acc[key].concluido++;
      if (item.status === "pendente") acc[key].pendente++;
      if (item.status === "em_andamento") acc[key].em_andamento++;
      return acc;
    }, {} as Record<string, { total: number; concluido: number; pendente: number; em_andamento: number }>)
  } : null;

  return {
    items,
    stats,
    isLoading,
    updateItemStatus,
    updateItemObservation,
    createItem,
    deleteItem,
    bulkCreateItems
  };
}
