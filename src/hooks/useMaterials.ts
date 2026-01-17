import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const { user, isAdmin } = useAuth();

  const fetchMaterials = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast.error('Erro ao carregar materiais');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const uploadMaterial = async (data: CreateMaterialData): Promise<boolean> => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem fazer upload de materiais');
      return false;
    }

    try {
      setIsUploading(true);

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

      toast.success('Material enviado com sucesso!');
      await fetchMaterials();
      return true;
    } catch (error) {
      console.error('Error uploading material:', error);
      toast.error('Erro ao enviar material');
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const updateMaterial = async (id: string, data: UpdateMaterialData): Promise<boolean> => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem editar materiais');
      return false;
    }

    try {
      const { error } = await supabase
        .from('materials')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      toast.success('Material atualizado!');
      await fetchMaterials();
      return true;
    } catch (error) {
      console.error('Error updating material:', error);
      toast.error('Erro ao atualizar material');
      return false;
    }
  };

  const deleteMaterial = async (id: string): Promise<boolean> => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem excluir materiais');
      return false;
    }

    try {
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

      toast.success('Material excluído!');
      await fetchMaterials();
      return true;
    } catch (error) {
      console.error('Error deleting material:', error);
      toast.error('Erro ao excluir material');
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
    isUploading,
    uploadMaterial,
    updateMaterial,
    deleteMaterial,
    downloadMaterial,
    formatFileSize,
    getFileTypeFromName,
    refreshMaterials: fetchMaterials,
  };
}
