/**
 * Hook for managing Accounts Receivable (Contas a Receber)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';
import { CACHE_TIMES } from '@/lib/queryClient';

export interface Receivable {
  id: string;
  user_id: string;
  client_id?: string;
  contract_id?: string;
  description: string;
  category: string;
  amount: number;
  due_date: string;
  received_date?: string;
  status: 'pendente' | 'recebido' | 'vencido' | 'cancelado' | 'parcial';
  payment_method?: string;
  cost_center?: string;
  notes?: string;
  installment_number?: number;
  total_installments?: number;
  billing_id?: string;
  created_at: string;
  updated_at: string;
}

export type ReceivableInsert = Omit<Receivable, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type ReceivableUpdate = Partial<ReceivableInsert>;

const QUERY_KEY = ['ipromed-receivables'];

export function useReceivables() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: receivables = [], isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_receivables')
        .select('*')
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      return data as Receivable[];
    },
    enabled: !!user,
    ...CACHE_TIMES.SHORT,
  });

  const createMutation = useMutation({
    mutationFn: async (receivable: ReceivableInsert) => {
      const { data, error } = await supabase
        .from('ipromed_receivables')
        .insert({
          ...receivable,
          user_id: user!.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Conta a receber cadastrada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao cadastrar: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: ReceivableUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('ipromed_receivables')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Conta atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ipromed_receivables')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Conta excluída com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir: ${error.message}`);
    },
  });

  const markAsReceivedMutation = useMutation({
    mutationFn: async ({ id, received_date, payment_method }: { 
      id: string; 
      received_date?: string; 
      payment_method?: string;
    }) => {
      const { data, error } = await supabase
        .from('ipromed_receivables')
        .update({
          status: 'recebido',
          received_date: received_date || new Date().toISOString().split('T')[0],
          payment_method,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Recebimento registrado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao registrar recebimento: ${error.message}`);
    },
  });

  // Stats
  const stats = {
    total: receivables.length,
    pending: receivables.filter(r => r.status === 'pendente').length,
    received: receivables.filter(r => r.status === 'recebido').length,
    overdue: receivables.filter(r => r.status === 'vencido' || 
      (r.status === 'pendente' && new Date(r.due_date) < new Date())).length,
    totalPending: receivables
      .filter(r => r.status === 'pendente')
      .reduce((sum, r) => sum + Number(r.amount), 0),
    totalReceived: receivables
      .filter(r => r.status === 'recebido')
      .reduce((sum, r) => sum + Number(r.amount), 0),
  };

  return {
    receivables,
    isLoading,
    error,
    refetch,
    stats,
    createReceivable: createMutation.mutateAsync,
    updateReceivable: updateMutation.mutateAsync,
    deleteReceivable: deleteMutation.mutateAsync,
    markAsReceived: markAsReceivedMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
