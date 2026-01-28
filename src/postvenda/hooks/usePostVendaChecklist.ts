import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";

export interface ChecklistTemplate {
  id: string;
  tipo_demanda: string;
  order_index: number;
  phase: string;
  title: string;
  description: string | null;
  guidance: string | null;
  required_before_next: boolean;
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  chamado_id: string;
  template_id: string;
  order_index: number;
  phase: string;
  title: string;
  description: string | null;
  guidance: string | null;
  is_completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface ChecklistStats {
  total: number;
  completed: number;
  percentage: number;
  byPhase: Record<string, { total: number; completed: number }>;
}

export function usePostVendaChecklistTemplates(tipoDemanda?: string) {
  return useQuery({
    queryKey: ["postvenda-checklist-templates", tipoDemanda],
    queryFn: async () => {
      let query = supabase
        .from("postvenda_checklist_templates")
        .select("*")
        .order("order_index", { ascending: true });

      if (tipoDemanda) {
        query = query.eq("tipo_demanda", tipoDemanda);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as ChecklistTemplate[];
    },
  });
}

export function usePostVendaChecklist(chamadoId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useUnifiedAuth();

  const { data: items, isLoading } = useQuery({
    queryKey: ["postvenda-checklist-items", chamadoId],
    queryFn: async () => {
      if (!chamadoId) return [];

      const { data, error } = await supabase
        .from("postvenda_checklist_items")
        .select("*")
        .eq("chamado_id", chamadoId)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as unknown as ChecklistItem[];
    },
    enabled: !!chamadoId,
  });

  const stats: ChecklistStats | null = items ? {
    total: items.length,
    completed: items.filter(i => i.is_completed).length,
    percentage: items.length > 0 
      ? Math.round((items.filter(i => i.is_completed).length / items.length) * 100) 
      : 0,
    byPhase: items.reduce((acc, item) => {
      if (!acc[item.phase]) {
        acc[item.phase] = { total: 0, completed: 0 };
      }
      acc[item.phase].total++;
      if (item.is_completed) acc[item.phase].completed++;
      return acc;
    }, {} as Record<string, { total: number; completed: number }>),
  } : null;

  const initializeChecklist = useMutation({
    mutationFn: async ({ chamadoId, tipoDemanda }: { chamadoId: string; tipoDemanda: string }) => {
      // Get templates for this tipo_demanda
      const { data: templates, error: templatesError } = await supabase
        .from("postvenda_checklist_templates")
        .select("*")
        .eq("tipo_demanda", tipoDemanda)
        .order("order_index", { ascending: true });

      if (templatesError) throw templatesError;
      if (!templates || templates.length === 0) {
        throw new Error(`Nenhum template encontrado para ${tipoDemanda}`);
      }

      // Create checklist items from templates
      const items = templates.map((t: ChecklistTemplate) => ({
        chamado_id: chamadoId,
        template_id: t.id,
        order_index: t.order_index,
        phase: t.phase,
        title: t.title,
        description: t.description,
        guidance: t.guidance,
        is_completed: false,
      }));

      const { error: insertError } = await supabase
        .from("postvenda_checklist_items")
        .insert(items);

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["postvenda-checklist-items", chamadoId] });
      toast.success("Checklist inicializado!");
    },
    onError: (error) => {
      console.error("Erro ao inicializar checklist:", error);
      toast.error("Erro ao inicializar checklist");
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
        .from("postvenda_checklist_items")
        .update(updates)
        .eq("id", itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["postvenda-checklist-items", chamadoId] });
    },
    onError: (error) => {
      console.error("Erro ao atualizar item:", error);
      toast.error("Erro ao atualizar item do checklist");
    },
  });

  const updateItemNotes = useMutation({
    mutationFn: async ({ itemId, notes }: { itemId: string; notes: string }) => {
      const { error } = await supabase
        .from("postvenda_checklist_items")
        .update({ notes })
        .eq("id", itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["postvenda-checklist-items", chamadoId] });
    },
    onError: (error) => {
      console.error("Erro ao salvar anotações:", error);
      toast.error("Erro ao salvar anotações");
    },
  });

  // Check if previous items are completed (for sequential validation)
  const canCompleteItem = (itemOrderIndex: number): boolean => {
    if (!items) return false;
    
    // Find all items before this one that are required
    const previousItems = items.filter(i => i.order_index < itemOrderIndex);
    
    // Check if all previous items are completed
    return previousItems.every(i => i.is_completed);
  };

  // Get next incomplete item
  const getNextIncompleteItem = (): ChecklistItem | null => {
    if (!items) return null;
    return items.find(i => !i.is_completed) || null;
  };

  return {
    items: items || [],
    isLoading,
    stats,
    initializeChecklist,
    toggleItem,
    updateItemNotes,
    canCompleteItem,
    getNextIncompleteItem,
  };
}
