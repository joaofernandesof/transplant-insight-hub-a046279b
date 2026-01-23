import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';

export interface CourseGallery {
  id: string;
  course_id: string | null;
  class_id: string | null;
  title: string;
  description: string | null;
  cover_photo_url: string | null;
  status: 'draft' | 'published';
  photo_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  course_name?: string;
  class_name?: string;
  class_code?: string;
}

export interface GalleryPhoto {
  id: string;
  gallery_id: string;
  storage_path: string;
  thumbnail_url: string | null;
  full_url: string;
  filename: string | null;
  file_size: number | null;
  order_index: number;
  caption: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface CreateGalleryData {
  course_id: string;
  class_id: string;
  title: string;
  description?: string;
}

// Hook for students to view galleries in Academy
export function useStudentGalleries(classId: string | null) {
  const { user } = useUnifiedAuth();

  const { data: galleries, isLoading, error, refetch } = useQuery({
    queryKey: ['student-galleries', classId],
    queryFn: async () => {
      if (!classId) return [];

      const { data, error } = await supabase
        .from('course_galleries')
        .select(`
          *,
          courses:course_id (title),
          course_classes:class_id (name, code)
        `)
        .eq('class_id', classId)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((g: any) => ({
        ...g,
        course_name: g.courses?.title,
        class_name: g.course_classes?.name,
        class_code: g.course_classes?.code,
      })) as CourseGallery[];
    },
    enabled: !!classId && !!user,
  });

  return { galleries: galleries || [], isLoading, error, refetch };
}

// Hook for students to view photos in a gallery
export function useGalleryPhotos(galleryId: string | null) {
  const { user } = useUnifiedAuth();

  const { data: photos, isLoading, error, refetch } = useQuery({
    queryKey: ['gallery-photos', galleryId],
    queryFn: async () => {
      if (!galleryId) return [];

      const { data, error } = await supabase
        .from('course_gallery_photos')
        .select('*')
        .eq('gallery_id', galleryId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as GalleryPhoto[];
    },
    enabled: !!galleryId && !!user,
  });

  return { photos: photos || [], isLoading, error, refetch };
}

// Hook for NeoTeam to manage galleries
export function useGalleryManagement() {
  const { user, canAccessModule } = useUnifiedAuth();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  const canWrite = canAccessModule('academy_course_gallery', 'write');
  const canDelete = canAccessModule('academy_course_gallery', 'delete');

  // Fetch all galleries (for management)
  const { data: allGalleries, isLoading, refetch } = useQuery({
    queryKey: ['all-galleries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_galleries')
        .select(`
          *,
          courses:course_id (title),
          course_classes:class_id (name, code)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((g: any) => ({
        ...g,
        course_name: g.courses?.title,
        class_name: g.course_classes?.name,
        class_code: g.course_classes?.code,
      })) as CourseGallery[];
    },
    enabled: canWrite,
  });

  // Create gallery
  const createGallery = useMutation({
    mutationFn: async (data: CreateGalleryData) => {
      const { data: gallery, error } = await supabase
        .from('course_galleries')
        .insert({
          ...data,
          created_by: user?.id,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      return gallery;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-galleries'] });
      toast.success('Galeria criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar galeria: ${error.message}`);
    },
  });

  // Update gallery
  const updateGallery = useMutation({
    mutationFn: async ({ id, ...data }: Partial<CourseGallery> & { id: string }) => {
      const { error } = await supabase
        .from('course_galleries')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-galleries'] });
      toast.success('Galeria atualizada!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  // Delete gallery
  const deleteGallery = useMutation({
    mutationFn: async (id: string) => {
      // First delete all photos from storage
      const { data: photos } = await supabase
        .from('course_gallery_photos')
        .select('storage_path')
        .eq('gallery_id', id);

      if (photos && photos.length > 0) {
        const paths = photos.map((p) => p.storage_path);
        await supabase.storage.from('course-galleries').remove(paths);
      }

      // Then delete the gallery (cascade will delete photo records)
      const { error } = await supabase
        .from('course_galleries')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-galleries'] });
      toast.success('Galeria excluída!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir: ${error.message}`);
    },
  });

  // Upload photos to gallery
  const uploadPhotos = useCallback(
    async (galleryId: string, files: File[]) => {
      if (!canWrite) {
        toast.error('Sem permissão para upload');
        return [];
      }

      setIsUploading(true);
      const uploadedPhotos: GalleryPhoto[] = [];

      try {
        for (const file of files) {
          const timestamp = Date.now();
          const ext = file.name.split('.').pop();
          const storagePath = `${galleryId}/${timestamp}-${Math.random().toString(36).substring(7)}.${ext}`;

          // Upload to storage
          const { error: uploadError } = await supabase.storage
            .from('course-galleries')
            .upload(storagePath, file, {
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadError) throw uploadError;

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('course-galleries')
            .getPublicUrl(storagePath);

          // Save photo record
          const { data: photo, error: dbError } = await supabase
            .from('course_gallery_photos')
            .insert({
              gallery_id: galleryId,
              storage_path: storagePath,
              full_url: urlData.publicUrl,
              thumbnail_url: urlData.publicUrl, // Could generate actual thumbnail
              filename: file.name,
              file_size: file.size,
              uploaded_by: user?.id,
            })
            .select()
            .single();

          if (dbError) throw dbError;
          uploadedPhotos.push(photo);
        }

        queryClient.invalidateQueries({ queryKey: ['gallery-photos', galleryId] });
        queryClient.invalidateQueries({ queryKey: ['all-galleries'] });
        toast.success(`${uploadedPhotos.length} foto(s) enviada(s)!`);
        return uploadedPhotos;
      } catch (error: any) {
        toast.error(`Erro no upload: ${error.message}`);
        return [];
      } finally {
        setIsUploading(false);
      }
    },
    [canWrite, user, queryClient]
  );

  // Delete photo
  const deletePhoto = useMutation({
    mutationFn: async (photo: GalleryPhoto) => {
      // Delete from storage
      await supabase.storage.from('course-galleries').remove([photo.storage_path]);

      // Delete record
      const { error } = await supabase
        .from('course_gallery_photos')
        .delete()
        .eq('id', photo.id);

      if (error) throw error;
      return photo.gallery_id;
    },
    onSuccess: (galleryId) => {
      queryClient.invalidateQueries({ queryKey: ['gallery-photos', galleryId] });
      queryClient.invalidateQueries({ queryKey: ['all-galleries'] });
      toast.success('Foto excluída!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir foto: ${error.message}`);
    },
  });

  // Toggle gallery status
  const toggleStatus = useCallback(
    async (gallery: CourseGallery) => {
      const newStatus = gallery.status === 'published' ? 'draft' : 'published';
      await updateGallery.mutateAsync({ id: gallery.id, status: newStatus });
    },
    [updateGallery]
  );

  return {
    galleries: allGalleries || [],
    isLoading,
    isUploading,
    canWrite,
    canDelete,
    createGallery,
    updateGallery,
    deleteGallery,
    uploadPhotos,
    deletePhoto,
    toggleStatus,
    refetch,
  };
}
