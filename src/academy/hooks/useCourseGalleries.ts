import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';

// Batch size for parallel uploads
const UPLOAD_BATCH_SIZE = 10;

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
  // Unlock requirement fields
  unlock_requirement: 'none' | 'exam' | 'survey';
  required_exam_id: string | null;
  required_survey_type: string | null;
  // Joined data
  course_name?: string;
  class_name?: string;
  class_code?: string;
  exam_title?: string;
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
          course_classes:class_id (name, code),
          exams:required_exam_id (title)
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
        exam_title: g.exams?.title,
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
          course_classes:class_id (name, code),
          exams:required_exam_id (title)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((g: any) => ({
        ...g,
        course_name: g.courses?.title,
        class_name: g.course_classes?.name,
        class_code: g.course_classes?.code,
        exam_title: g.exams?.title,
      })) as CourseGallery[];
    },
    enabled: canWrite,
  });

  // Create gallery
  const createGallery = useMutation({
    mutationFn: async (data: CreateGalleryData) => {
      // Use authUserId (auth.uid) since created_by references auth.users(id)
      const { data: gallery, error } = await supabase
        .from('course_galleries')
        .insert({
          ...data,
          created_by: user?.authUserId,
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

  // Upload photos to gallery - optimized for bulk uploads
  const uploadPhotos = useCallback(
    async (galleryId: string, files: File[]) => {
      if (!canWrite) {
        toast.error('Sem permissão para upload');
        return [];
      }

      if (files.length === 0) return [];

      setIsUploading(true);
      const uploadedPhotos: GalleryPhoto[] = [];
      const failedUploads: string[] = [];
      const totalFiles = files.length;
      
      // Show initial toast
      const toastId = toast.loading(`Preparando upload de ${totalFiles} foto(s)...`);

      try {
        // Process in batches for better performance
        for (let i = 0; i < files.length; i += UPLOAD_BATCH_SIZE) {
          const batch = files.slice(i, i + UPLOAD_BATCH_SIZE);
          const batchNumber = Math.floor(i / UPLOAD_BATCH_SIZE) + 1;
          const totalBatches = Math.ceil(files.length / UPLOAD_BATCH_SIZE);
          
          // Update progress toast
          toast.loading(`Enviando lote ${batchNumber}/${totalBatches} (${i + 1}-${Math.min(i + UPLOAD_BATCH_SIZE, totalFiles)} de ${totalFiles})...`, { id: toastId });
          
          // Upload batch in parallel
          const batchPromises = batch.map(async (file) => {
            try {
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
                  thumbnail_url: urlData.publicUrl,
                  filename: file.name,
                  file_size: file.size,
                  uploaded_by: user?.authUserId,
                })
                .select()
                .single();

              if (dbError) throw dbError;
              return photo;
            } catch (error: any) {
              console.error(`Failed to upload ${file.name}:`, error);
              failedUploads.push(file.name);
              return null;
            }
          });

          const batchResults = await Promise.all(batchPromises);
          batchResults.forEach(photo => {
            if (photo) uploadedPhotos.push(photo);
          });
          
          // Small delay between batches to avoid rate limiting
          if (i + UPLOAD_BATCH_SIZE < files.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }

        queryClient.invalidateQueries({ queryKey: ['gallery-photos', galleryId] });
        queryClient.invalidateQueries({ queryKey: ['all-galleries'] });
        
        // Final success/warning toast
        if (failedUploads.length === 0) {
          toast.success(`${uploadedPhotos.length} foto(s) enviada(s) com sucesso!`, { id: toastId });
        } else {
          toast.warning(`${uploadedPhotos.length} foto(s) enviada(s), ${failedUploads.length} falhou(aram)`, { id: toastId });
        }
        
        return uploadedPhotos;
      } catch (error: any) {
        toast.error(`Erro no upload: ${error.message}`, { id: toastId });
        return uploadedPhotos;
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

  // Set cover photo for gallery (uploads cropped image)
  const setCoverPhoto = useMutation({
    mutationFn: async ({ galleryId, croppedBlob }: { galleryId: string; croppedBlob: Blob }) => {
      // Upload the cropped cover to storage
      const timestamp = Date.now();
      const storagePath = `${galleryId}/cover-${timestamp}.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from('course-galleries')
        .upload(storagePath, croppedBlob, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/jpeg',
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('course-galleries')
        .getPublicUrl(storagePath);

      // Update gallery with cover URL
      const { error } = await supabase
        .from('course_galleries')
        .update({ cover_photo_url: urlData.publicUrl })
        .eq('id', galleryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-galleries'] });
      toast.success('Foto de capa definida!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao definir capa: ${error.message}`);
    },
  });

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
    setCoverPhoto,
    refetch,
  };
}
