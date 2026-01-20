import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinicAuth } from '../contexts/ClinicAuthContext';
import { toast } from 'sonner';

export type ScheduleStatus = 'sem_data' | 'agendado' | 'confirmado' | 'realizado' | 'cancelado';

export interface ClinicSurgery {
  id: string;
  patientId: string | null;
  patientName?: string;
  patientPhone?: string;
  saleId: string | null;
  branch: string;
  procedure: string;
  category: string | null;
  grade: number | null;
  outsourcing: boolean;
  surgeryDate: string | null;
  surgeryTime: string | null;
  scheduleStatus: ScheduleStatus;
  expectedMonth: string | null;
  doctorOnDuty: string | null;
  examsSent: boolean;
  contractSigned: boolean;
  chartReady: boolean;
  surgeryConfirmed: boolean;
  lunchChoice: string | null;
  bookingTermSigned: boolean;
  dischargeTermSigned: boolean;
  gpiD1Done: boolean;
  companionName: string | null;
  companionPhone: string | null;
  notes: string | null;
  createdAt: string;
}

export interface SurgeryInput {
  patientId: string;
  saleId?: string;
  branch: string;
  procedure: string;
  category?: string;
  grade?: number;
  outsourcing?: boolean;
  surgeryDate?: string;
  surgeryTime?: string;
  scheduleStatus?: ScheduleStatus;
  expectedMonth?: string;
  doctorOnDuty?: string;
  companionName?: string;
  companionPhone?: string;
  notes?: string;
}

export function useClinicSurgeries() {
  const { user, currentBranch, isAdmin, isGestao } = useClinicAuth();
  const queryClient = useQueryClient();

  const { data: surgeries = [], isLoading, error } = useQuery({
    queryKey: ['clinic-surgeries', currentBranch, isAdmin, isGestao],
    queryFn: async () => {
      let query = supabase
        .from('clinic_surgeries')
        .select(`
          *,
          clinic_patients(full_name, phone)
        `)
        .order('surgery_date', { ascending: true, nullsFirst: false });

      if (!isAdmin && !isGestao && currentBranch) {
        query = query.eq('branch', currentBranch);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((s): ClinicSurgery => ({
        id: s.id,
        patientId: s.patient_id,
        patientName: s.clinic_patients?.full_name || 'Paciente não vinculado',
        patientPhone: s.clinic_patients?.phone || null,
        saleId: s.sale_id,
        branch: s.branch,
        procedure: s.procedure,
        category: s.category,
        grade: s.grade,
        outsourcing: s.outsourcing || false,
        surgeryDate: s.surgery_date,
        surgeryTime: s.surgery_time,
        scheduleStatus: s.schedule_status as ScheduleStatus,
        expectedMonth: s.expected_month,
        doctorOnDuty: s.doctor_on_duty,
        examsSent: s.exams_sent || false,
        contractSigned: s.contract_signed || false,
        chartReady: s.chart_ready || false,
        surgeryConfirmed: s.surgery_confirmed || false,
        lunchChoice: s.lunch_choice,
        bookingTermSigned: s.booking_term_signed || false,
        dischargeTermSigned: s.discharge_term_signed || false,
        gpiD1Done: s.gpi_d1_done || false,
        companionName: s.companion_name,
        companionPhone: s.companion_phone,
        notes: s.notes,
        createdAt: s.created_at,
      }));
    },
    enabled: !!user,
  });

  const createSurgery = useMutation({
    mutationFn: async (input: SurgeryInput) => {
      const { data, error } = await supabase
        .from('clinic_surgeries')
        .insert({
          patient_id: input.patientId,
          sale_id: input.saleId || null,
          branch: input.branch,
          procedure: input.procedure,
          category: input.category || null,
          grade: input.grade || null,
          outsourcing: input.outsourcing || false,
          surgery_date: input.surgeryDate || null,
          surgery_time: input.surgeryTime || null,
          schedule_status: input.scheduleStatus || 'sem_data',
          expected_month: input.expectedMonth || null,
          doctor_on_duty: input.doctorOnDuty || null,
          companion_name: input.companionName || null,
          companion_phone: input.companionPhone || null,
          notes: input.notes || null,
          created_by: user?.userId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-surgeries'] });
      toast.success('Cirurgia cadastrada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao cadastrar cirurgia');
    },
  });

  const updateSurgery = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ClinicSurgery> & { id: string }) => {
      const dbUpdates: Record<string, any> = {};
      
      if (updates.patientId !== undefined) dbUpdates.patient_id = updates.patientId;
      if (updates.saleId !== undefined) dbUpdates.sale_id = updates.saleId;
      if (updates.branch !== undefined) dbUpdates.branch = updates.branch;
      if (updates.procedure !== undefined) dbUpdates.procedure = updates.procedure;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.grade !== undefined) dbUpdates.grade = updates.grade;
      if (updates.outsourcing !== undefined) dbUpdates.outsourcing = updates.outsourcing;
      if (updates.surgeryDate !== undefined) dbUpdates.surgery_date = updates.surgeryDate;
      if (updates.surgeryTime !== undefined) dbUpdates.surgery_time = updates.surgeryTime;
      if (updates.scheduleStatus !== undefined) dbUpdates.schedule_status = updates.scheduleStatus;
      if (updates.expectedMonth !== undefined) dbUpdates.expected_month = updates.expectedMonth;
      if (updates.doctorOnDuty !== undefined) dbUpdates.doctor_on_duty = updates.doctorOnDuty;
      if (updates.examsSent !== undefined) dbUpdates.exams_sent = updates.examsSent;
      if (updates.contractSigned !== undefined) dbUpdates.contract_signed = updates.contractSigned;
      if (updates.chartReady !== undefined) dbUpdates.chart_ready = updates.chartReady;
      if (updates.surgeryConfirmed !== undefined) dbUpdates.surgery_confirmed = updates.surgeryConfirmed;
      if (updates.lunchChoice !== undefined) dbUpdates.lunch_choice = updates.lunchChoice;
      if (updates.bookingTermSigned !== undefined) dbUpdates.booking_term_signed = updates.bookingTermSigned;
      if (updates.dischargeTermSigned !== undefined) dbUpdates.discharge_term_signed = updates.dischargeTermSigned;
      if (updates.gpiD1Done !== undefined) dbUpdates.gpi_d1_done = updates.gpiD1Done;
      if (updates.companionName !== undefined) dbUpdates.companion_name = updates.companionName;
      if (updates.companionPhone !== undefined) dbUpdates.companion_phone = updates.companionPhone;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

      const { data, error } = await supabase
        .from('clinic_surgeries')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-surgeries'] });
      toast.success('Cirurgia atualizada!');
    },
    onError: () => {
      toast.error('Erro ao atualizar cirurgia');
    },
  });

  // Filter helpers
  const scheduledSurgeries = surgeries.filter(s => s.scheduleStatus !== 'sem_data');
  const noDateSurgeries = surgeries.filter(s => s.scheduleStatus === 'sem_data');
  
  const thisWeekSurgeries = scheduledSurgeries.filter(s => {
    if (!s.surgeryDate) return false;
    const surgeryDate = new Date(s.surgeryDate);
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return surgeryDate >= weekStart && surgeryDate <= weekEnd;
  });

  const pendingChecklist = scheduledSurgeries.filter(s => 
    !s.examsSent || !s.contractSigned || !s.chartReady
  );

  const stats = {
    total: surgeries.length,
    scheduled: scheduledSurgeries.length,
    noDate: noDateSurgeries.length,
    thisWeek: thisWeekSurgeries.length,
    pendingChecklist: pendingChecklist.length,
    confirmed: surgeries.filter(s => s.surgeryConfirmed).length,
  };

  return {
    surgeries,
    scheduledSurgeries,
    noDateSurgeries,
    thisWeekSurgeries,
    pendingChecklist,
    isLoading,
    error,
    stats,
    createSurgery,
    updateSurgery,
  };
}
