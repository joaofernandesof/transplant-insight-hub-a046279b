import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ScheduleItem {
  id: string;
  schedule_id: string;
  start_time: string;
  end_time: string;
  activity: string;
  location: string | null;
  instructor: string | null;
  notes: string | null;
  order_index: number | null;
}

export interface ScheduleDay {
  id: string;
  class_id: string;
  day_number: number;
  day_date: string | null;
  day_title: string;
  day_theme: string | null;
  items: ScheduleItem[];
}

export function useScheduleManagement(classId: string | null) {
  const queryClient = useQueryClient();

  const { data: schedule, isLoading, refetch } = useQuery({
    queryKey: ["schedule-management", classId],
    queryFn: async (): Promise<ScheduleDay[]> => {
      if (!classId) return [];

      const { data, error } = await supabase
        .from("class_schedule")
        .select(`
          id, class_id, day_number, day_date, day_title, day_theme,
          class_schedule_items (id, schedule_id, start_time, end_time, activity, location, instructor, notes, order_index)
        `)
        .eq("class_id", classId)
        .order("day_number", { ascending: true });

      if (error) throw error;

      return (data || []).map(day => ({
        id: day.id,
        class_id: day.class_id,
        day_number: day.day_number,
        day_date: day.day_date,
        day_title: day.day_title,
        day_theme: day.day_theme,
        items: ((day.class_schedule_items || []) as ScheduleItem[])
          .sort((a, b) => (a.order_index || 0) - (b.order_index || 0)),
      }));
    },
    enabled: !!classId,
  });

  const updateScheduleItem = useMutation({
    mutationFn: async (item: Partial<ScheduleItem> & { id: string }) => {
      const { id, ...updates } = item;
      const { error } = await supabase
        .from("class_schedule_items")
        .update(updates)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-management", classId] });
      queryClient.invalidateQueries({ queryKey: ["class-details", classId] });
      toast.success("Atividade atualizada!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  const createScheduleItem = useMutation({
    mutationFn: async (item: Omit<ScheduleItem, "id">) => {
      const { error } = await supabase
        .from("class_schedule_items")
        .insert(item);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-management", classId] });
      queryClient.invalidateQueries({ queryKey: ["class-details", classId] });
      toast.success("Atividade adicionada!");
    },
    onError: (error) => {
      toast.error("Erro ao adicionar: " + error.message);
    },
  });

  const deleteScheduleItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from("class_schedule_items")
        .delete()
        .eq("id", itemId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-management", classId] });
      queryClient.invalidateQueries({ queryKey: ["class-details", classId] });
      toast.success("Atividade removida!");
    },
    onError: (error) => {
      toast.error("Erro ao remover: " + error.message);
    },
  });

  const createScheduleDay = useMutation({
    mutationFn: async (day: Omit<ScheduleDay, "id" | "items">) => {
      const { error } = await supabase
        .from("class_schedule")
        .insert(day);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-management", classId] });
      queryClient.invalidateQueries({ queryKey: ["class-details", classId] });
      toast.success("Dia adicionado!");
    },
  });

  const updateScheduleDay = useMutation({
    mutationFn: async (day: Partial<ScheduleDay> & { id: string }) => {
      const { id, items, ...updates } = day;
      const { error } = await supabase
        .from("class_schedule")
        .update(updates)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-management", classId] });
      queryClient.invalidateQueries({ queryKey: ["class-details", classId] });
      toast.success("Dia atualizado!");
    },
  });

  const deleteScheduleDay = useMutation({
    mutationFn: async (dayId: string) => {
      // First delete all items
      await supabase
        .from("class_schedule_items")
        .delete()
        .eq("schedule_id", dayId);
      
      // Then delete the day
      const { error } = await supabase
        .from("class_schedule")
        .delete()
        .eq("id", dayId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-management", classId] });
      queryClient.invalidateQueries({ queryKey: ["class-details", classId] });
      toast.success("Dia removido!");
    },
  });

  return {
    schedule,
    isLoading,
    refetch,
    updateScheduleItem,
    createScheduleItem,
    deleteScheduleItem,
    createScheduleDay,
    updateScheduleDay,
    deleteScheduleDay,
  };
}
