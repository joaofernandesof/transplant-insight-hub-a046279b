import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinicAuth } from '../contexts/ClinicAuthContext';
import { toast } from 'sonner';

export type ContractStatus = 'ativo' | 'pendente' | 'quitado' | 'cancelado';

export interface ClinicSale {
  id: string;
  saleDate: string;
  patientId: string | null;
  patientName?: string;
  branch: string;
  serviceType: string;
  seller: string | null;
  consultant: string | null;
  category: string | null;
  leadSource: string | null;
  vgv: number;
  downPayment: number;
  balanceDue: number;
  contractStatus: ContractStatus;
  notes: string | null;
  createdAt: string;
}

export interface SaleInput {
  saleDate: string;
  patientId: string;
  branch: string;
  serviceType: string;
  seller?: string;
  consultant?: string;
  category?: string;
  leadSource?: string;
  vgv: number;
  downPayment: number;
  contractStatus: ContractStatus;
  notes?: string;
}

export function useClinicSales() {
  const { user, currentBranch, isAdmin, isGestao } = useClinicAuth();
  const queryClient = useQueryClient();

  const { data: sales = [], isLoading, error } = useQuery({
    queryKey: ['clinic-sales', currentBranch, isAdmin, isGestao],
    queryFn: async () => {
      let query = supabase
        .from('clinic_sales')
        .select(`
          *,
          clinic_patients(full_name)
        `)
        .order('sale_date', { ascending: false });

      // Filter by branch if not admin/gestao
      if (!isAdmin && !isGestao && currentBranch) {
        query = query.eq('branch', currentBranch);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((s): ClinicSale => ({
        id: s.id,
        saleDate: s.sale_date,
        patientId: s.patient_id,
        patientName: s.clinic_patients?.full_name || 'Paciente não vinculado',
        branch: s.branch,
        serviceType: s.service_type,
        seller: s.seller,
        consultant: s.consultant,
        category: s.category,
        leadSource: s.lead_source,
        vgv: Number(s.vgv) || 0,
        downPayment: Number(s.down_payment) || 0,
        balanceDue: Number(s.balance_due) || 0,
        contractStatus: s.contract_status as ContractStatus,
        notes: s.notes,
        createdAt: s.created_at,
      }));
    },
    enabled: !!user,
  });

  const createSale = useMutation({
    mutationFn: async (input: SaleInput) => {
      const { data, error } = await supabase
        .from('clinic_sales')
        .insert({
          sale_date: input.saleDate,
          patient_id: input.patientId,
          branch: input.branch,
          service_type: input.serviceType,
          seller: input.seller || null,
          consultant: input.consultant || null,
          category: input.category || null,
          lead_source: input.leadSource || null,
          vgv: input.vgv,
          down_payment: input.downPayment,
          contract_status: input.contractStatus,
          notes: input.notes || null,
          created_by: user?.userId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-sales'] });
      toast.success('Venda registrada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao registrar venda');
    },
  });

  const updateSale = useMutation({
    mutationFn: async ({ id, ...input }: Partial<SaleInput> & { id: string }) => {
      const updates: Record<string, any> = {};
      if (input.saleDate) updates.sale_date = input.saleDate;
      if (input.patientId) updates.patient_id = input.patientId;
      if (input.branch) updates.branch = input.branch;
      if (input.serviceType) updates.service_type = input.serviceType;
      if (input.seller !== undefined) updates.seller = input.seller;
      if (input.consultant !== undefined) updates.consultant = input.consultant;
      if (input.category !== undefined) updates.category = input.category;
      if (input.leadSource !== undefined) updates.lead_source = input.leadSource;
      if (input.vgv !== undefined) updates.vgv = input.vgv;
      if (input.downPayment !== undefined) updates.down_payment = input.downPayment;
      if (input.contractStatus) updates.contract_status = input.contractStatus;
      if (input.notes !== undefined) updates.notes = input.notes;

      const { data, error } = await supabase
        .from('clinic_sales')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-sales'] });
      toast.success('Venda atualizada!');
    },
    onError: () => {
      toast.error('Erro ao atualizar venda');
    },
  });

  // Stats for dashboard
  const stats = {
    totalSales: sales.length,
    totalVGV: sales.reduce((sum, s) => sum + s.vgv, 0),
    totalDownPayment: sales.reduce((sum, s) => sum + s.downPayment, 0),
    totalBalanceDue: sales.reduce((sum, s) => sum + s.balanceDue, 0),
    pendingContracts: sales.filter(s => s.contractStatus === 'pendente').length,
    activeContracts: sales.filter(s => s.contractStatus === 'ativo').length,
  };

  return {
    sales,
    isLoading,
    error,
    stats,
    createSale,
    updateSale,
  };
}
