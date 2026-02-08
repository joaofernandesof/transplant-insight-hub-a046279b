/**
 * Hook for managing Accounts Payable (Contas a Pagar)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';
import { CACHE_TIMES } from '@/lib/queryClient';

export interface Payable {
  id: string;
  user_id: string;
  description: string;
  supplier?: string;
  category: string;
  amount: number;
  due_date: string;
  payment_date?: string;
  status: 'pendente' | 'pago' | 'vencido' | 'cancelado';
  payment_method?: string;
  cost_center?: string;
  notes?: string;
  attachments?: any[];
  recurrence?: 'unico' | 'mensal' | 'trimestral' | 'anual';
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

export type PayableInsert = Omit<Payable, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type PayableUpdate = Partial<PayableInsert>;

const QUERY_KEY = ['ipromed-payables'];

export function usePayables() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: payables = [], isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_payables')
        .select('*')
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      return data as Payable[];
    },
    enabled: !!user,
    ...CACHE_TIMES.SHORT,
  });

  const createMutation = useMutation({
    mutationFn: async (payable: PayableInsert) => {
      const { data, error } = await supabase
        .from('ipromed_payables')
        .insert({
          ...payable,
          user_id: user!.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Conta a pagar cadastrada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao cadastrar: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: PayableUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('ipromed_payables')
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
        .from('ipromed_payables')
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

  const markAsPaidMutation = useMutation({
    mutationFn: async ({ id, payment_date, payment_method }: { 
      id: string; 
      payment_date?: string; 
      payment_method?: string;
    }) => {
      const { data, error } = await supabase
        .from('ipromed_payables')
        .update({
          status: 'pago',
          payment_date: payment_date || new Date().toISOString().split('T')[0],
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
      toast.success('Pagamento registrado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao registrar pagamento: ${error.message}`);
    },
  });

  // Stats
  const stats = {
    total: payables.length,
    pending: payables.filter(p => p.status === 'pendente').length,
    paid: payables.filter(p => p.status === 'pago').length,
    overdue: payables.filter(p => p.status === 'vencido' || 
      (p.status === 'pendente' && new Date(p.due_date) < new Date())).length,
    totalPending: payables
      .filter(p => p.status === 'pendente')
      .reduce((sum, p) => sum + Number(p.amount), 0),
    totalPaid: payables
      .filter(p => p.status === 'pago')
      .reduce((sum, p) => sum + Number(p.amount), 0),
  };

  return {
    payables,
    isLoading,
    error,
    refetch,
    stats,
    createPayable: createMutation.mutateAsync,
    updatePayable: updateMutation.mutateAsync,
    deletePayable: deleteMutation.mutateAsync,
    markAsPaid: markAsPaidMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
