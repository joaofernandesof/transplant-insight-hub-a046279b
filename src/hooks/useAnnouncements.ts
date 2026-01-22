import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Announcement {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  link_text: string | null;
  background_color: string;
  text_color: string;
  accent_color: string;
  target_profiles: string[];
  target_modules: string[];
  is_active: boolean;
  priority: number;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export type AnnouncementInsert = Omit<Announcement, 'id' | 'created_at' | 'updated_at'>;
export type AnnouncementUpdate = Partial<AnnouncementInsert>;

export function useAnnouncements(moduleKey?: string) {
  return useQuery({
    queryKey: ["announcements", moduleKey],
    queryFn: async () => {
      let query = supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .order("priority", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      // Filter by module if specified
      let filtered = data || [];
      if (moduleKey) {
        filtered = filtered.filter(
          (a) =>
            a.target_modules?.includes("all") ||
            a.target_modules?.includes(moduleKey)
        );
      }

      return filtered as Announcement[];
    },
  });
}

export function useAllAnnouncements() {
  return useQuery({
    queryKey: ["announcements", "all-admin"],
    queryFn: async () => {
      // For admin, fetch all announcements including inactive
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Announcement[];
    },
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (announcement: AnnouncementInsert) => {
      const { data, error } = await supabase
        .from("announcements")
        .insert(announcement)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Anúncio criado com sucesso!");
    },
    onError: (error) => {
      console.error("Error creating announcement:", error);
      toast.error("Erro ao criar anúncio");
    },
  });
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & AnnouncementUpdate) => {
      const { data, error } = await supabase
        .from("announcements")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Anúncio atualizado!");
    },
    onError: (error) => {
      console.error("Error updating announcement:", error);
      toast.error("Erro ao atualizar anúncio");
    },
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Anúncio removido!");
    },
    onError: (error) => {
      console.error("Error deleting announcement:", error);
      toast.error("Erro ao remover anúncio");
    },
  });
}
