import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CACHE_TIMES, QUERY_KEYS } from '@/lib/queryClient';

export interface Material {
  id: string;
  title: string;
  description: string | null;
  category: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  thumbnail_url: string | null;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
}

export interface CreateMaterialData {
  title: string;
  description?: string;
  category: string;
  file: File;
}

export interface UpdateMaterialData {
  title?: string;
  description?: string;
  category?: string;
  is_active?: boolean;
}

export function useMaterials() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  // Fetch materials with STATIC cache (rarely changes)
  const { data: materials = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.materials,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Material[];
    },
    // Use STATIC cache - materials rarely change
    staleTime: CACHE_TIMES.STATIC.staleTime,
    gcTime: CACHE_TIMES.STATIC.gcTime,
  });

  const refreshMaterials = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.materials });
  }, [queryClient]);

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: CreateMaterialData) => {
      // Generate unique file path
      const fileExt = data.file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${data.category}/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('materials')
        .upload(filePath, data.file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('materials')
        .getPublicUrl(filePath);

      // Insert record in materials table
      const { error: insertError } = await supabase
        .from('materials')
        .insert({
          title: data.title,
          description: data.description,
          category: data.category,
          file_name: data.file.name,
          file_url: urlData.publicUrl,
          file_type: data.file.type,
          file_size: data.file.size,
          created_by: user?.id,
        });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.materials });
      toast.success('Material enviado com sucesso!');
    },
    onError: (error) => {
      console.error('Error uploading material:', error);
      toast.error('Erro ao enviar material');
    },
  });

  const uploadMaterial = async (data: CreateMaterialData): Promise<boolean> => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem fazer upload de materiais');
      return false;
    }

    try {
      await uploadMutation.mutateAsync(data);
      return true;
    } catch {
      return false;
    }
  };

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMaterialData }) => {
      const { error } = await supabase
        .from('materials')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.materials });
      toast.success('Material atualizado!');
    },
    onError: (error) => {
      console.error('Error updating material:', error);
      toast.error('Erro ao atualizar material');
    },
  });

  const updateMaterial = async (id: string, data: UpdateMaterialData): Promise<boolean> => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem editar materiais');
      return false;
    }

    try {
      await updateMutation.mutateAsync({ id, data });
      return true;
    } catch {
      return false;
    }
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Get material to find file path
      const material = materials.find(m => m.id === id);
      if (!material) throw new Error('Material não encontrado');

      // Extract file path from URL
      const url = new URL(material.file_url);
      const pathParts = url.pathname.split('/storage/v1/object/public/materials/');
      const filePath = pathParts[1];

      if (filePath) {
        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from('materials')
          .remove([filePath]);

        if (storageError) {
          console.warn('Error deleting file from storage:', storageError);
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.materials });
      toast.success('Material excluído!');
    },
    onError: (error) => {
      console.error('Error deleting material:', error);
      toast.error('Erro ao excluir material');
    },
  });

  const deleteMaterial = async (id: string): Promise<boolean> => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem excluir materiais');
      return false;
    }

    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  };

  const downloadMaterial = async (material: Material) => {
    try {
      // Create a temporary link and trigger download
      const response = await fetch(material.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = material.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Download iniciado: ${material.title}`);
    } catch (error) {
      console.error('Error downloading material:', error);
      toast.error('Erro ao baixar material');
    }
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileTypeFromName = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const typeMap: Record<string, string> = {
      pdf: 'pdf',
      doc: 'doc',
      docx: 'doc',
      xls: 'xlsx',
      xlsx: 'xlsx',
      mp4: 'video',
      mov: 'video',
      avi: 'video',
      png: 'image',
      jpg: 'image',
      jpeg: 'image',
      gif: 'image',
    };
    return typeMap[ext] || 'file';
  };

  return {
    materials,
    isLoading,
    isUploading: uploadMutation.isPending,
    uploadMaterial,
    updateMaterial,
    deleteMaterial,
    downloadMaterial,
    formatFileSize,
    getFileTypeFromName,
    refreshMaterials,
  };
}
