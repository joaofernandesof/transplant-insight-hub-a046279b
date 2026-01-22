import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Banner {
  id: string;
  title: string | null;
  subtitle: string | null;
  highlight: string | null;
  bg_color: string | null;
  bg_image_url: string | null;
  text_position: string | null;
  route: string;
  is_active: boolean;
  display_order: number;
  click_count: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface BannerInsert {
  title?: string | null;
  subtitle?: string | null;
  highlight?: string | null;
  bg_color?: string | null;
  bg_image_url?: string | null;
  text_position?: string | null;
  route: string;
  is_active?: boolean;
  display_order?: number;
}

export interface BannerClick {
  id: string;
  banner_id: string;
  user_id: string | null;
  clicked_at: string;
}

export interface BannerClicksByPeriod {
  date: string;
  clicks: number;
}

// Hook para upload de imagem do banner
export function useUploadBannerImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `banner_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('banners')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('banners')
        .getPublicUrl(filePath);

      return publicUrl;
    },
    onError: (error) => {
      toast.error('Erro ao fazer upload: ' + error.message);
    }
  });
}

// Hook para métricas de cliques por período
export function useBannerClicksAnalytics(days: number = 30) {
  return useQuery({
    queryKey: ['banner-clicks-analytics', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('banner_clicks')
        .select('clicked_at, banner_id')
        .gte('clicked_at', startDate.toISOString())
        .order('clicked_at', { ascending: true });

      if (error) throw error;

      // Group clicks by date
      const clicksByDate: Record<string, number> = {};
      const clicksByBanner: Record<string, number> = {};
      
      data?.forEach((click) => {
        const date = click.clicked_at.split('T')[0];
        clicksByDate[date] = (clicksByDate[date] || 0) + 1;
        clicksByBanner[click.banner_id] = (clicksByBanner[click.banner_id] || 0) + 1;
      });

      // Fill in missing dates with 0 clicks
      const result: BannerClicksByPeriod[] = [];
      for (let i = days; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        result.push({
          date: dateStr,
          clicks: clicksByDate[dateStr] || 0
        });
      }

      return {
        dailyClicks: result,
        clicksByBanner,
        totalClicks: data?.length || 0
      };
    }
  });
}

// Hook para buscar banners ativos (para o carrossel)
export function useActiveBanners() {
  return useQuery({
    queryKey: ['banners', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('carousel_banners')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as Banner[];
    }
  });
}

// Hook para buscar todos os banners (para admin)
export function useAllBanners() {
  return useQuery({
    queryKey: ['banners', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('carousel_banners')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as Banner[];
    }
  });
}

// Hook para métricas de cliques
export function useBannerClickStats(bannerId?: string) {
  return useQuery({
    queryKey: ['banner-clicks', bannerId],
    queryFn: async () => {
      let query = supabase
        .from('banner_clicks')
        .select('*', { count: 'exact' });

      if (bannerId) {
        query = query.eq('banner_id', bannerId);
      }

      const { data, count, error } = await query;
      if (error) throw error;
      return { clicks: data as BannerClick[], count };
    },
    enabled: !!bannerId || bannerId === undefined
  });
}

// Hook para criar banner
export function useCreateBanner() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (banner: BannerInsert) => {
      const { data, error } = await supabase
        .from('carousel_banners')
        .insert({ ...banner, created_by: user?.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast.success('Banner criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar banner: ' + error.message);
    }
  });
}

// Hook para atualizar banner
export function useUpdateBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Banner> & { id: string }) => {
      const { data, error } = await supabase
        .from('carousel_banners')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast.success('Banner atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    }
  });
}

// Hook para deletar banner
export function useDeleteBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('carousel_banners')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast.success('Banner removido!');
    },
    onError: (error) => {
      toast.error('Erro ao remover: ' + error.message);
    }
  });
}

// Hook para registrar clique
export function useTrackBannerClick() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bannerId: string) => {
      // Registrar clique na tabela de cliques
      const { error: clickError } = await supabase
        .from('banner_clicks')
        .insert({
          banner_id: bannerId,
          user_id: user?.id || null
        });

      if (clickError) throw clickError;

      // Incrementar contador no banner
      const { error: rpcError } = await supabase.rpc('increment_banner_click', {
        banner_uuid: bannerId
      });

      if (rpcError) throw rpcError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
    }
  });
}
