import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCallback } from "react";

export interface Video {
  id: string;
  title: string;
  description: string | null;
  category: string;
  file_url: string | null;
  external_url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  tags: string[];
  is_public: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateVideoData {
  title: string;
  description?: string;
  category: string;
  file?: File;
  external_url?: string;
  thumbnail_url?: string;
  duration_seconds?: number;
  tags?: string[];
  is_public?: boolean;
}

export interface UpdateVideoData {
  title?: string;
  description?: string;
  category?: string;
  external_url?: string;
  thumbnail_url?: string;
  duration_seconds?: number;
  tags?: string[];
  is_public?: boolean;
  is_active?: boolean;
}

export function useVideos(category?: string) {
  const queryClient = useQueryClient();

  // Fetch videos with optional category filter
  const { data: videos, isLoading, error } = useQuery({
    queryKey: ['videos', category],
    queryFn: async () => {
      let query = supabase
        .from('videos')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Video[];
    },
  });

  // Refresh videos
  const refreshVideos = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['videos'] });
  }, [queryClient]);

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: CreateVideoData) => {
      let file_url: string | null = null;

      // Upload file if provided
      if (data.file) {
        const fileExt = data.file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('videos')
          .upload(fileName, data.file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('videos')
          .getPublicUrl(fileName);
        
        file_url = urlData.publicUrl;
      }

      // Insert video record
      const { data: video, error } = await supabase
        .from('videos')
        .insert({
          title: data.title,
          description: data.description,
          category: data.category,
          file_url,
          external_url: data.external_url,
          thumbnail_url: data.thumbnail_url,
          duration_seconds: data.duration_seconds,
          tags: data.tags || [],
          is_public: data.is_public ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return video;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      toast.success('Vídeo adicionado com sucesso!');
    },
    onError: (error) => {
      console.error('Error uploading video:', error);
      toast.error('Erro ao adicionar vídeo');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateVideoData }) => {
      const { error } = await supabase
        .from('videos')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      toast.success('Vídeo atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating video:', error);
      toast.error('Erro ao atualizar vídeo');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Get video to check for file_url
      const { data: video } = await supabase
        .from('videos')
        .select('file_url')
        .eq('id', id)
        .single();

      // Delete from storage if it's an uploaded file
      if (video?.file_url) {
        const fileName = video.file_url.split('/').pop();
        if (fileName) {
          await supabase.storage.from('videos').remove([fileName]);
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      toast.success('Vídeo removido com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting video:', error);
      toast.error('Erro ao remover vídeo');
    },
  });

  // Helper to get embed URL for external videos
  const getEmbedUrl = (video: Video): string | null => {
    if (video.file_url) return video.file_url;
    if (!video.external_url) return null;

    const url = video.external_url;

    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    // Return original URL if no match
    return url;
  };

  // Check if video is external (YouTube/Vimeo)
  const isExternalVideo = (video: Video): boolean => {
    return !!video.external_url && !video.file_url;
  };

  return {
    videos: videos || [],
    isLoading,
    error,
    refreshVideos,
    uploadVideo: (data: CreateVideoData) => uploadMutation.mutateAsync(data),
    updateVideo: (id: string, data: UpdateVideoData) => updateMutation.mutateAsync({ id, data }),
    deleteVideo: (id: string) => deleteMutation.mutateAsync(id),
    isUploading: uploadMutation.isPending,
    getEmbedUrl,
    isExternalVideo,
  };
}

// Get a single video by ID
export function useVideo(id: string | undefined) {
  return useQuery({
    queryKey: ['video', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Video;
    },
    enabled: !!id,
  });
}

// Get videos by tag
export function useVideosByTag(tag: string) {
  return useQuery({
    queryKey: ['videos', 'tag', tag],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('is_active', true)
        .contains('tags', [tag])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Video[];
    },
    enabled: !!tag,
  });
}
