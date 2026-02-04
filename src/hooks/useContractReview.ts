/**
 * Hook para gerenciar solicitações de conferência contratual
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";

export type ContractReviewType = 'locacao' | 'prestacao_servicos' | 'parceria' | 'cessao_espaco' | 'outro';
export type ContractClassification = 'estrategico' | 'operacional';
export type ContractReviewStatus = 'rascunho' | 'aguardando_validacao' | 'em_analise' | 'aguardando_ajustes' | 'aprovado' | 'reprovado' | 'cancelado';

export interface ContractReviewRequest {
  id: string;
  request_number: string;
  status: ContractReviewStatus;
  created_by: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  submitted_at?: string;
  completed_at?: string;
  
  // Bloco 1
  area_empresa: string;
  tipo_contrato: ContractReviewType;
  tipo_contrato_outro?: string;
  nome_outra_parte: string;
  data_assinatura_prevista: string;
  data_inicio_vigencia: string;
  prazo_total_contrato: string;
  
  // Bloco 2
  objetivo_pratico: string;
  beneficio_esperado: string;
  classificacao: ContractClassification;
  
  // Bloco 3
  origem_negociacao: string;
  houve_negociacao: boolean;
  pedido_inicial?: string;
  ajustes_realizados?: string;
  acordos_informais?: string;
  
  // Bloco 4
  valor_total?: number;
  forma_pagamento: string;
  datas_pagamento?: string;
  multas_previstas?: string;
  penalidades_cancelamento?: string;
  condicoes_credito?: string;
  existe_acordo_fora_contrato: boolean;
  descricao_acordo_fora_contrato?: string;
  
  // Bloco 5
  risco_clausula_especifica: boolean;
  risco_financeiro: boolean;
  risco_operacional: boolean;
  risco_juridico: boolean;
  risco_imagem: boolean;
  foco_atencao_juridico: string;
  
  // Bloco 6
  prazo_maximo_retorno: string;
  impacto_atraso: string;
  possui_dependencia_externa: boolean;
  descricao_dependencia_externa?: string;
  
  // SLA
  sla_horas?: number;
  sla_deadline?: string;
  
  // Análise
  parecer_juridico?: string;
  nivel_risco?: string;
  recomendacoes?: string;
  ajustes_necessarios?: string;
  
  // Joins
  creator?: { full_name: string; email: string };
  assignee?: { full_name: string; email: string };
  attachments?: ContractReviewAttachment[];
}

export interface ContractReviewAttachment {
  id: string;
  request_id: string;
  tipo: string;
  nome_arquivo: string;
  url_arquivo: string;
  tamanho_bytes?: number;
  mime_type?: string;
  created_at: string;
}

export interface ContractReviewHistory {
  id: string;
  request_id: string;
  action: string;
  from_status?: ContractReviewStatus;
  to_status?: ContractReviewStatus;
  comment?: string;
  created_by?: string;
  created_at: string;
  creator?: { full_name: string };
}

// Hook para listar solicitações
export function useContractReviewRequests(filters?: { status?: ContractReviewStatus; createdBy?: string }) {
  return useQuery({
    queryKey: ['contract-review-requests', filters],
    queryFn: async () => {
      // Query simples sem joins para evitar erros de ambiguidade
      let query = supabase
        .from('contract_review_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.createdBy) {
        query = query.eq('created_by', filters.createdBy);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Buscar anexos separadamente
      if (data && data.length > 0) {
        const ids = data.map(r => r.id);
        const { data: attachments } = await supabase
          .from('contract_review_attachments')
          .select('*')
          .in('request_id', ids);
        
        // Mapear anexos para cada request
        return data.map(req => ({
          ...req,
          attachments: attachments?.filter(a => a.request_id === req.id) || [],
        })) as unknown as ContractReviewRequest[];
      }
      
      return (data || []) as unknown as ContractReviewRequest[];
    },
  });
}

// Hook para buscar uma solicitação específica
export function useContractReviewRequest(id: string) {
  return useQuery({
    queryKey: ['contract-review-request', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contract_review_requests')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      // Buscar anexos separadamente
      const { data: attachments } = await supabase
        .from('contract_review_attachments')
        .select('*')
        .eq('request_id', id);
      
      return {
        ...data,
        attachments: attachments || [],
      } as unknown as ContractReviewRequest;
    },
    enabled: !!id,
  });
}

// Hook para histórico
export function useContractReviewHistory(requestId: string) {
  return useQuery({
    queryKey: ['contract-review-history', requestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contract_review_history')
        .select(`
          *,
          creator:created_by(full_name)
        `)
        .eq('request_id', requestId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ContractReviewHistory[];
    },
    enabled: !!requestId,
  });
}

// Hook para criar solicitação
export function useCreateContractReview() {
  const queryClient = useQueryClient();
  const { user } = useUnifiedAuth();
  
  return useMutation({
    mutationFn: async (formData: Partial<ContractReviewRequest>) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      // Remover campos que não existem na tabela
      const { creator, assignee, attachments, id, request_number, ...insertData } = formData as any;
      
      const { data: result, error } = await supabase
        .from('contract_review_requests')
        .insert({
          ...insertData,
          created_by: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-review-requests'] });
      toast.success('Solicitação criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar solicitação');
    },
  });
}

// Hook para atualizar solicitação
export function useUpdateContractReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ContractReviewRequest> }) => {
      const { data: result, error } = await supabase
        .from('contract_review_requests')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['contract-review-requests'] });
      queryClient.invalidateQueries({ queryKey: ['contract-review-request', id] });
      toast.success('Solicitação atualizada!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar solicitação');
    },
  });
}

// Hook para enviar solicitação (muda status para aguardando_validacao)
export function useSubmitContractReview() {
  const queryClient = useQueryClient();
  const { user } = useUnifiedAuth();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Atualiza status
      const { error: updateError } = await supabase
        .from('contract_review_requests')
        .update({
          status: 'aguardando_validacao',
          submitted_at: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (updateError) throw updateError;
      
      // Registra histórico
      await supabase.from('contract_review_history').insert({
        request_id: id,
        action: 'Solicitação enviada para análise',
        from_status: 'rascunho',
        to_status: 'aguardando_validacao',
        created_by: user?.id,
      });
      
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['contract-review-requests'] });
      queryClient.invalidateQueries({ queryKey: ['contract-review-request', id] });
      toast.success('Solicitação enviada para análise!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao enviar solicitação');
    },
  });
}

// Hook para upload de anexo
export function useUploadContractReviewAttachment() {
  const queryClient = useQueryClient();
  const { user } = useUnifiedAuth();
  
  return useMutation({
    mutationFn: async ({ requestId, file, tipo }: { requestId: string; file: File; tipo: string }) => {
      // Upload para storage
      const fileName = `${requestId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('contract-review-files')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      // Gera URL pública
      const { data: urlData } = supabase.storage
        .from('contract-review-files')
        .getPublicUrl(fileName);
      
      // Registra anexo
      const { data, error } = await supabase
        .from('contract_review_attachments')
        .insert({
          request_id: requestId,
          tipo,
          nome_arquivo: file.name,
          url_arquivo: urlData.publicUrl,
          tamanho_bytes: file.size,
          mime_type: file.type,
          uploaded_by: user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { requestId }) => {
      queryClient.invalidateQueries({ queryKey: ['contract-review-request', requestId] });
      toast.success('Arquivo anexado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao anexar arquivo');
    },
  });
}

// Constantes
export const CONTRACT_TYPES: { value: ContractReviewType; label: string }[] = [
  { value: 'locacao', label: 'Locação' },
  { value: 'prestacao_servicos', label: 'Prestação de Serviços' },
  { value: 'parceria', label: 'Parceria' },
  { value: 'cessao_espaco', label: 'Cessão de Espaço' },
  { value: 'outro', label: 'Outro' },
];

export const CONTRACT_CLASSIFICATIONS: { value: ContractClassification; label: string }[] = [
  { value: 'estrategico', label: 'Estratégico' },
  { value: 'operacional', label: 'Operacional' },
];

export const CONTRACT_STATUS_CONFIG: Record<ContractReviewStatus, { label: string; color: string }> = {
  rascunho: { label: 'Rascunho', color: 'bg-gray-100 text-gray-700' },
  aguardando_validacao: { label: 'Aguardando Validação', color: 'bg-yellow-100 text-yellow-700' },
  em_analise: { label: 'Em Análise', color: 'bg-blue-100 text-blue-700' },
  aguardando_ajustes: { label: 'Aguardando Ajustes', color: 'bg-orange-100 text-orange-700' },
  aprovado: { label: 'Aprovado', color: 'bg-green-100 text-green-700' },
  reprovado: { label: 'Reprovado', color: 'bg-red-100 text-red-700' },
  cancelado: { label: 'Cancelado', color: 'bg-gray-200 text-gray-500' },
};

export const AREAS_EMPRESA = [
  'Neo Hair Brasil',
  'Neo Care',
  'Academy',
  'CPG Advocacia',
  'Avivar',
  'Administrativo',
  'Financeiro',
  'Marketing',
  'Comercial',
  'Operações',
];
