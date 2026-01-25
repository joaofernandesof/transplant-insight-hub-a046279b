import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

export interface GalleryStats {
  gallery_id: string;
  total_views: number;
  total_downloads: number;
  photos_viewed: number;
  photos_downloaded: number;
  unique_users: number;
  last_activity_at: string | null;
}

export interface PhotoStats {
  photo_id: string;
  gallery_id: string;
  view_count: number;
  download_count: number;
  last_viewed_at: string | null;
  last_downloaded_at: string | null;
}

export interface AnalyticsLog {
  id: string;
  photo_id: string;
  gallery_id: string;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  action_type: 'view' | 'download';
  created_at: string;
}

// Hook para buscar estatísticas de uma galeria
export function useGalleryStats(galleryId: string | null) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['gallery-stats', galleryId],
    queryFn: async () => {
      if (!galleryId) return null;

      const { data, error } = await supabase
        .from('gallery_stats')
        .select('*')
        .eq('gallery_id', galleryId)
        .maybeSingle();

      if (error) throw error;
      return data as GalleryStats | null;
    },
    enabled: !!galleryId,
  });

  return { stats: data, isLoading, error, refetch };
}

// Hook para buscar estatísticas das fotos de uma galeria
export function usePhotoStats(galleryId: string | null) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['photo-stats', galleryId],
    queryFn: async () => {
      if (!galleryId) return [];

      const { data, error } = await supabase
        .from('gallery_photo_stats')
        .select('*')
        .eq('gallery_id', galleryId);

      if (error) throw error;
      return (data || []) as PhotoStats[];
    },
    enabled: !!galleryId,
  });

  // Create a map for easy lookup
  const statsMap = new Map<string, PhotoStats>();
  (data || []).forEach(stat => {
    statsMap.set(stat.photo_id, stat);
  });

  return { stats: data || [], statsMap, isLoading, error, refetch };
}

// Hook para buscar logs de atividade de uma galeria
export function useGalleryLogs(galleryId: string | null, limit = 50) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['gallery-logs', galleryId, limit],
    queryFn: async () => {
      if (!galleryId) return [];

      const { data, error } = await supabase
        .from('gallery_photo_analytics')
        .select('*')
        .eq('gallery_id', galleryId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as AnalyticsLog[];
    },
    enabled: !!galleryId,
  });

  return { logs: data || [], isLoading, error, refetch };
}

// Hook para registrar ações (view/download)
export function useTrackPhotoAction() {
  const { user } = useUnifiedAuth();
  const queryClient = useQueryClient();

  const trackAction = useMutation({
    mutationFn: async ({
      photoId,
      galleryId,
      actionType,
    }: {
      photoId: string;
      galleryId: string;
      actionType: 'view' | 'download';
    }) => {
      const { error } = await supabase.from('gallery_photo_analytics').insert({
        photo_id: photoId,
        gallery_id: galleryId,
        user_id: user?.authUserId,
        user_name: user?.fullName,
        user_email: user?.email,
        action_type: actionType,
        user_agent: navigator.userAgent,
      });

      if (error) throw error;
    },
    onSuccess: (_, { galleryId }) => {
      // Invalidate stats queries
      queryClient.invalidateQueries({ queryKey: ['gallery-stats', galleryId] });
      queryClient.invalidateQueries({ queryKey: ['photo-stats', galleryId] });
      queryClient.invalidateQueries({ queryKey: ['gallery-logs', galleryId] });
    },
  });

  return { trackAction: trackAction.mutate, isTracking: trackAction.isPending };
}
