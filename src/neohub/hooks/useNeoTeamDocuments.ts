import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type DocumentCategory = 'exames' | 'laudos' | 'receitas' | 'termos' | 'fotos' | 'outros';

export interface PatientDocument {
  id: string;
  patient_id?: string;
  patient_name?: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size?: number;
  category: DocumentCategory;
  description?: string;
  uploaded_by?: string;
  branch?: string;
  created_at: string;
  updated_at: string;
}

export interface UploadDocumentParams {
  file: File;
  patient_name?: string;
  patient_id?: string;
  category: DocumentCategory;
  description?: string;
}

export function useNeoTeamDocuments(patientId?: string) {
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const fetchDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('neoteam_patient_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (patientId) {
        query = query.eq('patient_id', patientId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDocuments((data as PatientDocument[]) || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os documentos',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [patientId, toast]);

  const uploadDocument = async (params: UploadDocumentParams) => {
    try {
      setIsUploading(true);
      const { file, patient_name, patient_id, category, description } = params;
      
      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `neoteam/${patient_id || 'general'}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('patient-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { data, error } = await supabase
        .from('neoteam_patient_documents')
        .insert([{
          patient_id,
          patient_name,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          category,
          description,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Documento enviado com sucesso',
      });

      await fetchDocuments();
      return data as PatientDocument;
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar o documento',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteDocument = async (document: PatientDocument) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('patient-documents')
        .remove([document.file_path]);

      if (storageError) {
        console.error('Storage error:', storageError);
      }

      // Delete record
      const { error } = await supabase
        .from('neoteam_patient_documents')
        .delete()
        .eq('id', document.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Documento removido com sucesso',
      });

      await fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o documento',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const getDocumentUrl = async (filePath: string) => {
    const { data } = await supabase.storage
      .from('patient-documents')
      .createSignedUrl(filePath, 3600);

    return data?.signedUrl;
  };

  const downloadDocument = async (document: PatientDocument) => {
    try {
      const url = await getDocumentUrl(document.file_path);
      if (url) {
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível baixar o documento',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Group by category
  const documentsByCategory = documents.reduce((acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = [];
    }
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<DocumentCategory, PatientDocument[]>);

  return {
    documents,
    documentsByCategory,
    isLoading,
    isUploading,
    uploadDocument,
    deleteDocument,
    downloadDocument,
    getDocumentUrl,
    refetch: fetchDocuments,
  };
}
