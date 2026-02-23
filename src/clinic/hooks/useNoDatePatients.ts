import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinicAuth } from '../contexts/ClinicAuthContext';
import { differenceInDays } from 'date-fns';
import { useMemo, useState } from 'react';

export interface NoDatePatient {
  saleId: string;
  patientId: string;
  patientName: string;
  branch: string;
  procedure: string;
  category: string | null;
  vgv: number;
  saleDate: string;
  daysSinceSale: number;
  seller: string | null;
  contractStatus: string | null;
  notes: string | null;
}

export interface NoDateFilters {
  search: string;
  saleDateFrom: Date | undefined;
  saleDateTo: Date | undefined;
  branch: string;
  category: string;
  procedure: string;
  seller: string;
  delayFilter: 'all' | '30' | '60';
}

const defaultFilters: NoDateFilters = {
  search: '',
  saleDateFrom: undefined,
  saleDateTo: undefined,
  branch: 'all',
  category: 'all',
  procedure: 'all',
  seller: 'all',
  delayFilter: 'all',
};

export function useNoDatePatients() {
  const { user, currentBranch, isAdmin, isGestao } = useClinicAuth();
  const [filters, setFilters] = useState<NoDateFilters>(defaultFilters);

  // Fetch sales with active contracts
  const { data: salesData = [], isLoading: loadingSales } = useQuery({
    queryKey: ['no-date-patients-sales', currentBranch, isAdmin, isGestao],
    queryFn: async () => {
      let query = supabase
        .from('clinic_sales')
        .select(`
          id, sale_date, patient_id, branch, service_type, seller, category, vgv, contract_status, notes,
          clinic_patients(full_name)
        `)
        .neq('contract_status', 'cancelado');

      if (!isAdmin && !isGestao && currentBranch) {
        query = query.eq('branch', currentBranch);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch all surgeries to check which patients have future scheduled ones
  const { data: surgeriesData = [], isLoading: loadingSurgeries } = useQuery({
    queryKey: ['no-date-patients-surgeries', currentBranch, isAdmin, isGestao],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('clinic_surgeries')
        .select('id, patient_id, surgery_date, schedule_status')
        .or(`surgery_date.gte.${today},surgery_date.is.null`)
        .in('schedule_status', ['agendado', 'confirmado']);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Derive "sold without date" patients
  const allNoDatePatients = useMemo(() => {
    const patientsWithFutureSurgery = new Set(
      surgeriesData
        .filter((s: any) => s.surgery_date !== null)
        .map((s: any) => s.patient_id)
    );

    const today = new Date();

    return salesData
      .filter((sale: any) => sale.patient_id && !patientsWithFutureSurgery.has(sale.patient_id))
      .map((sale: any): NoDatePatient => ({
        saleId: sale.id,
        patientId: sale.patient_id!,
        patientName: sale.clinic_patients?.full_name || 'Paciente não vinculado',
        branch: sale.branch,
        procedure: sale.service_type || '-',
        category: sale.category,
        vgv: Number(sale.vgv) || 0,
        saleDate: sale.sale_date,
        daysSinceSale: differenceInDays(today, new Date(sale.sale_date)),
        seller: sale.seller,
        contractStatus: sale.contract_status,
        notes: sale.notes,
      }));
  }, [salesData, surgeriesData]);

  // Apply filters
  const filteredPatients = useMemo(() => {
    return allNoDatePatients.filter(p => {
      if (filters.search && !p.patientName.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.branch !== 'all' && p.branch !== filters.branch) return false;
      if (filters.category !== 'all' && p.category !== filters.category) return false;
      if (filters.procedure !== 'all' && p.procedure !== filters.procedure) return false;
      if (filters.seller !== 'all' && p.seller !== filters.seller) return false;
      if (filters.delayFilter === '30' && p.daysSinceSale < 30) return false;
      if (filters.delayFilter === '60' && p.daysSinceSale < 60) return false;
      if (filters.saleDateFrom && new Date(p.saleDate) < filters.saleDateFrom) return false;
      if (filters.saleDateTo && new Date(p.saleDate) > filters.saleDateTo) return false;
      return true;
    });
  }, [allNoDatePatients, filters]);

  // Unique filter options
  const filterOptions = useMemo(() => ({
    branches: [...new Set(allNoDatePatients.map(p => p.branch))].filter(Boolean).sort(),
    categories: [...new Set(allNoDatePatients.map(p => p.category))].filter(Boolean).sort() as string[],
    procedures: [...new Set(allNoDatePatients.map(p => p.procedure))].filter(Boolean).sort(),
    sellers: [...new Set(allNoDatePatients.map(p => p.seller))].filter(Boolean).sort() as string[],
  }), [allNoDatePatients]);

  const over30 = allNoDatePatients.filter(p => p.daysSinceSale >= 30).length;
  const over60 = allNoDatePatients.filter(p => p.daysSinceSale >= 60).length;

  return {
    patients: filteredPatients,
    allPatients: allNoDatePatients,
    isLoading: loadingSales || loadingSurgeries,
    filters,
    setFilters,
    updateFilter: <K extends keyof NoDateFilters>(key: K, value: NoDateFilters[K]) => {
      setFilters(prev => ({ ...prev, [key]: value }));
    },
    resetFilters: () => setFilters(defaultFilters),
    filterOptions,
    stats: {
      total: allNoDatePatients.length,
      over30,
      over60,
      filtered: filteredPatients.length,
    },
  };
}
