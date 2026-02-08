/**
 * Hook for managing Billings (Cobranças)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';
import { CACHE_TIMES } from '@/lib/queryClient';

export interface Billing {
  id: string;
  user_id: string;
  billing_number: string;
  receivable_id?: string;
  client_id?: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  amount: number;
  due_date: string;
  billing_type: 'pix' | 'boleto' | 'link' | 'manual';
  status: 'pendente' | 'enviado' | 'visualizado' | 'pago' | 'vencido' | 'cancelado';
  pix_code?: string;
  boleto_code?: string;
  payment_link?: string;
  sent_at?: string;
  paid_at?: string;
  reminder_sent_count: number;
  last_reminder_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type BillingInsert = Omit<Billing, 'id' | 'user_id' | 'billing_number' | 'created_at' | 'updated_at' | 'reminder_sent_count'>;
export type BillingUpdate = Partial<BillingInsert>;

const QUERY_KEY = ['ipromed-billings'];

// Generate mock PIX code
function generatePixCode(amount: number, clientName: string): string {
  const baseCode = `00020126580014BR.GOV.BCB.PIX0136${crypto.randomUUID().replace(/-/g, '').slice(0, 36)}`;
  return `${baseCode}5204000053039865802BR5925${clientName.slice(0, 25).toUpperCase().padEnd(25)}6009SAO PAULO62070503***6304`;
}

// Generate mock Boleto code
function generateBoletoCode(): string {
  const random = () => Math.floor(Math.random() * 10);
  return `23793.${random()}${random()}${random()}${random()}${random()} ${random()}${random()}${random()}${random()}${random()}.${random()}${random()}${random()}${random()}${random()}${random()} ${random()}${random()}${random()}${random()}${random()}.${random()}${random()}${random()}${random()}${random()}${random()} ${random()} ${random()}${random()}${random()}${random()}0000000000`;
}

export function useBillings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: billings = [], isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ipromed_billings')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Billing[];
    },
    enabled: !!user,
    ...CACHE_TIMES.SHORT,
  });

  const createMutation = useMutation({
    mutationFn: async (billing: BillingInsert) => {
      // Generate codes based on billing type
      let pix_code: string | undefined;
      let boleto_code: string | undefined;
      let payment_link: string | undefined;

      if (billing.billing_type === 'pix') {
        pix_code = generatePixCode(billing.amount, billing.client_name);
      } else if (billing.billing_type === 'boleto') {
        boleto_code = generateBoletoCode();
      } else if (billing.billing_type === 'link') {
        payment_link = `https://pay.cpgadvocacia.com.br/${crypto.randomUUID().slice(0, 8)}`;
      }

      const { data, error } = await supabase
        .from('ipromed_billings')
        .insert({
          client_name: billing.client_name,
          client_email: billing.client_email,
          client_phone: billing.client_phone,
          client_id: billing.client_id,
          receivable_id: billing.receivable_id,
          amount: billing.amount,
          due_date: billing.due_date,
          billing_type: billing.billing_type,
          status: billing.status || 'pendente',
          notes: billing.notes,
          user_id: user!.id,
          pix_code,
          boleto_code,
          payment_link,
        } as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Cobrança gerada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao gerar cobrança: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: BillingUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('ipromed_billings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Cobrança atualizada!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ipromed_billings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Cobrança excluída!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir: ${error.message}`);
    },
  });

  const sendBillingMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('ipromed_billings')
        .update({
          status: 'enviado',
          sent_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Cobrança enviada ao cliente!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao enviar: ${error.message}`);
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('ipromed_billings')
        .update({
          status: 'pago',
          paid_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Pagamento confirmado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao confirmar: ${error.message}`);
    },
  });

  const sendReminderMutation = useMutation({
    mutationFn: async (id: string) => {
      const billing = billings.find(b => b.id === id);
      if (!billing) throw new Error('Cobrança não encontrada');

      const { data, error } = await supabase
        .from('ipromed_billings')
        .update({
          reminder_sent_count: billing.reminder_sent_count + 1,
          last_reminder_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Lembrete enviado ao cliente!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao enviar lembrete: ${error.message}`);
    },
  });

  // Stats
  const stats = {
    total: billings.length,
    pending: billings.filter(b => b.status === 'pendente').length,
    sent: billings.filter(b => b.status === 'enviado').length,
    paid: billings.filter(b => b.status === 'pago').length,
    overdue: billings.filter(b => b.status === 'vencido' || 
      (['pendente', 'enviado'].includes(b.status) && new Date(b.due_date) < new Date())).length,
    totalPending: billings
      .filter(b => ['pendente', 'enviado', 'visualizado'].includes(b.status))
      .reduce((sum, b) => sum + Number(b.amount), 0),
    totalPaid: billings
      .filter(b => b.status === 'pago')
      .reduce((sum, b) => sum + Number(b.amount), 0),
  };

  return {
    billings,
    isLoading,
    error,
    refetch,
    stats,
    createBilling: createMutation.mutateAsync,
    updateBilling: updateMutation.mutateAsync,
    deleteBilling: deleteMutation.mutateAsync,
    sendBilling: sendBillingMutation.mutateAsync,
    markAsPaid: markAsPaidMutation.mutateAsync,
    sendReminder: sendReminderMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
