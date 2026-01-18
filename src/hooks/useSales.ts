import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Sale {
  id: string;
  user_id: string;
  clinic_id: string | null;
  sale_date: string;
  month_year: string;
  registered_by: string | null;
  patient_name: string;
  patient_email: string | null;
  patient_cpf: string | null;
  medical_record: string | null;
  service_type: string;
  category: string | null;
  baldness_grade: string | null;
  branch: string | null;
  consulted_by: string | null;
  sold_by: string | null;
  patient_origin: string | null;
  origin_observation: string | null;
  vgv_initial: number;
  deposit_paid: number;
  exchange_value: number;
  contract_status: string | null;
  distract_date: string | null;
  in_clickup: boolean;
  in_conta_azul: boolean;
  in_surgery_schedule: boolean;
  in_feegow: boolean;
  observations: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaleInsert {
  user_id: string;
  clinic_id?: string | null;
  sale_date: string;
  month_year: string;
  registered_by?: string | null;
  patient_name: string;
  patient_email?: string | null;
  patient_cpf?: string | null;
  medical_record?: string | null;
  service_type: string;
  category?: string | null;
  baldness_grade?: string | null;
  branch?: string | null;
  consulted_by?: string | null;
  sold_by?: string | null;
  patient_origin?: string | null;
  origin_observation?: string | null;
  vgv_initial?: number;
  deposit_paid?: number;
  exchange_value?: number;
  contract_status?: string | null;
  distract_date?: string | null;
  in_clickup?: boolean;
  in_conta_azul?: boolean;
  in_surgery_schedule?: boolean;
  in_feegow?: boolean;
  observations?: string | null;
}

export interface SalesStats {
  totalVgv: number;
  totalDeposits: number;
  totalBalance: number;
  salesCount: number;
  avgTicket: number;
  byService: Record<string, { count: number; value: number }>;
  byCategory: Record<string, { count: number; value: number }>;
  byBranch: Record<string, { count: number; value: number }>;
  bySeller: Record<string, { count: number; value: number }>;
  byMonth: Record<string, { count: number; value: number }>;
  byContractStatus: Record<string, number>;
  transplantsSold: number;
  treatmentsSold: number;
  coursesSold: number;
}

export function useSales(selectedMonth?: string) {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: sales = [], isLoading, error } = useQuery({
    queryKey: ['sales', selectedMonth],
    queryFn: async () => {
      let query = supabase
        .from('sales')
        .select('*')
        .order('sale_date', { ascending: false });

      if (selectedMonth) {
        query = query.eq('month_year', selectedMonth);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as Sale[];
    },
    enabled: !!user,
  });

  const stats: SalesStats = sales.reduce((acc, sale) => {
    const vgv = Number(sale.vgv_initial) || 0;
    const deposit = Number(sale.deposit_paid) || 0;
    
    acc.totalVgv += vgv;
    acc.totalDeposits += deposit;
    acc.totalBalance += (vgv - deposit);
    acc.salesCount += 1;

    // By service type
    const service = sale.service_type || 'Outros';
    if (!acc.byService[service]) {
      acc.byService[service] = { count: 0, value: 0 };
    }
    acc.byService[service].count += 1;
    acc.byService[service].value += vgv;

    // Classify services
    const serviceLower = service.toLowerCase();
    if (serviceLower.includes('transplante') || serviceLower.includes('aluno')) {
      acc.transplantsSold += 1;
    } else if (serviceLower.includes('formação') || serviceLower.includes('360')) {
      acc.coursesSold += 1;
    } else {
      acc.treatmentsSold += 1;
    }

    // By category
    const category = sale.category || 'Sem categoria';
    if (!acc.byCategory[category]) {
      acc.byCategory[category] = { count: 0, value: 0 };
    }
    acc.byCategory[category].count += 1;
    acc.byCategory[category].value += vgv;

    // By branch
    const branch = sale.branch || 'Sem filial';
    if (!acc.byBranch[branch]) {
      acc.byBranch[branch] = { count: 0, value: 0 };
    }
    acc.byBranch[branch].count += 1;
    acc.byBranch[branch].value += vgv;

    // By seller
    const seller = sale.sold_by || 'Sem vendedor';
    if (!acc.bySeller[seller]) {
      acc.bySeller[seller] = { count: 0, value: 0 };
    }
    acc.bySeller[seller].count += 1;
    acc.bySeller[seller].value += vgv;

    // By month
    const month = sale.month_year || 'Sem data';
    if (!acc.byMonth[month]) {
      acc.byMonth[month] = { count: 0, value: 0 };
    }
    acc.byMonth[month].count += 1;
    acc.byMonth[month].value += vgv;

    // By contract status
    const status = sale.contract_status || 'Sem status';
    acc.byContractStatus[status] = (acc.byContractStatus[status] || 0) + 1;

    return acc;
  }, {
    totalVgv: 0,
    totalDeposits: 0,
    totalBalance: 0,
    salesCount: 0,
    avgTicket: 0,
    byService: {} as Record<string, { count: number; value: number }>,
    byCategory: {} as Record<string, { count: number; value: number }>,
    byBranch: {} as Record<string, { count: number; value: number }>,
    bySeller: {} as Record<string, { count: number; value: number }>,
    byMonth: {} as Record<string, { count: number; value: number }>,
    byContractStatus: {} as Record<string, number>,
    transplantsSold: 0,
    treatmentsSold: 0,
    coursesSold: 0,
  } as SalesStats);

  stats.avgTicket = stats.salesCount > 0 ? stats.totalVgv / stats.salesCount : 0;

  const createSale = useMutation({
    mutationFn: async (sale: SaleInsert) => {
      const { data, error } = await supabase
        .from('sales')
        .insert(sale)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Venda registrada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao registrar venda: ' + error.message);
    },
  });

  const updateSale = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Sale> & { id: string }) => {
      const { data, error } = await supabase
        .from('sales')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Venda atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar venda: ' + error.message);
    },
  });

  const deleteSale = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Venda removida com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao remover venda: ' + error.message);
    },
  });

  return {
    sales,
    stats,
    isLoading,
    error,
    createSale,
    updateSale,
    deleteSale,
  };
}

export function useAvailableMonths() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['sales-months'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('month_year')
        .order('month_year', { ascending: false });
      
      if (error) throw error;
      
      const uniqueMonths = [...new Set(data.map(d => d.month_year))];
      return uniqueMonths;
    },
    enabled: !!user,
  });
}
