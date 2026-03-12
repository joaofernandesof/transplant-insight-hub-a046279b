import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClinicAuth } from '../contexts/ClinicAuthContext';
import { logSurgeryChanges } from '../utils/logSurgeryChange';
import { toast } from 'sonner';
import { differenceInDays, addDays, format } from 'date-fns';

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
  guidesSent: boolean;
  contractSigned: boolean;
  chartReady: boolean;
  surgeryConfirmed: boolean;
  lunchChoice: string | null;
  bookingTermSigned: boolean;
  dischargeTermSigned: boolean;
  gpiD1Done: boolean;
  companionName: string | null;
  companionPhone: string | null;
  medicalRecord: string | null;
  trichotomyDatetime: string | null;
  d20Contact: boolean;
  d15Contact: boolean;
  d10Contact: boolean;
  d7Contact: boolean;
  d2Contact: boolean;
  d1Contact: boolean;
  notes: string | null;
  createdAt: string;
  // Sale-derived fields
  saleDate: string | null;
  vgv: number | null;
  seller: string | null;
  contractStatus: string | null;
  daysSinceSale: number | null;
  upgradeValue: number;
  upgradeCategory: string | null;
  upsellValue: number;
  upsellCategory: string | null;
  depositPaid: number;
  remainingPaid: number;
  balanceDue: number;
}

export interface SurgeryInput {
  patientId: string;
  patientName?: string;
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
  trichotomyDatetime?: string;
  notes?: string;
}

export function useClinicSurgeries() {
  const { user, session, currentBranch, isAdmin, isGestao } = useClinicAuth();
  const queryClient = useQueryClient();

  const { data: surgeries = [], isLoading, error } = useQuery({
    queryKey: ['clinic-surgeries', currentBranch, isAdmin, isGestao],
    queryFn: async () => {
      let query = supabase
        .from('clinic_surgeries')
        .select('*, clinic_patients!clinic_surgeries_patient_id_fkey(full_name)')
        .order('surgery_date', { ascending: true, nullsFirst: false })
        .limit(5000);

      if (!isAdmin && !isGestao && currentBranch) {
        query = query.eq('branch', currentBranch);
      }

      const { data, error } = await query;

      if (error) throw error;

      const today = new Date();

      return (data || []).map((s: any): ClinicSurgery => {
        return {
          id: s.id,
          patientId: s.patient_id || null,
          patientName: s.patient_name || s.clinic_patients?.full_name || 'Paciente não vinculado',
          patientPhone: null,
          saleId: s.sale_id || null,
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
          guidesSent: s.guides_sent || false,
          contractSigned: s.contract_signed || false,
          chartReady: s.chart_ready || false,
          surgeryConfirmed: s.surgery_confirmed || false,
          lunchChoice: s.lunch_choice,
          bookingTermSigned: s.booking_term_signed || false,
          dischargeTermSigned: s.discharge_term_signed || false,
          gpiD1Done: s.gpi_d1_done || false,
          companionName: s.companion_name,
          companionPhone: s.companion_phone,
          medicalRecord: s.medical_record,
          trichotomyDatetime: s.trichotomy_datetime,
          d20Contact: s.d20_contact || false,
          d15Contact: s.d15_contact || false,
          d10Contact: s.d10_contact || false,
          d7Contact: s.d7_contact || false,
          d2Contact: s.d2_contact || false,
          d1Contact: s.d1_contact || false,
          notes: s.notes,
          createdAt: s.created_at,
          saleDate: null,
          vgv: s.vgv ? Number(s.vgv) : null,
          seller: null,
          contractStatus: s.contract_status || 'NAO_ENVIADO',
          daysSinceSale: null,
          upgradeValue: Number(s.upgrade_value) || 0,
          upgradeCategory: (s as any).upgrade_category || null,
          upsellValue: Number(s.upsell_value) || 0,
          upsellCategory: (s as any).upsell_category || null,
          depositPaid: Number(s.deposit_paid) || 0,
          remainingPaid: Number(s.remaining_paid) || 0,
          balanceDue: Number(s.balance_due) || 0,
        };
      });
    },
    enabled: !!session,
  });

  const createSurgery = useMutation({
    mutationFn: async (input: SurgeryInput) => {
      const { data, error } = await supabase
        .from('clinic_surgeries')
        .insert({
          patient_id: input.patientId,
          patient_name: input.patientName || null,
          sale_id: input.saleId || null,
          branch: input.branch,
          procedure: input.procedure,
          category: input.category || null,
          grade: input.grade || null,
          outsourcing: input.outsourcing || false,
          surgery_date: input.surgeryDate || null,
          surgery_time: input.surgeryTime || null,
          schedule_status: input.surgeryDate ? 'agendado' : 'sem_data',
          expected_month: input.expectedMonth || null,
          doctor_on_duty: input.doctorOnDuty || null,
          companion_name: input.companionName || null,
          companion_phone: input.companionPhone || null,
          notes: input.notes || null,
          trichotomy_datetime: input.trichotomyDatetime || null,
          created_by: user?.userId,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-surgeries'] });
      queryClient.invalidateQueries({ queryKey: ['no-date-patients'] });
      queryClient.invalidateQueries({ queryKey: ['clinic-patients'] });
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
      if (updates.surgeryDate !== undefined) {
        dbUpdates.surgery_date = updates.surgeryDate;
        if (updates.surgeryDate === null) {
          dbUpdates.schedule_status = 'sem_data';
        } else if (updates.scheduleStatus === undefined) {
          dbUpdates.schedule_status = 'agendado';
        }
      }
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
      if (updates.guidesSent !== undefined) dbUpdates.guides_sent = updates.guidesSent;
      if (updates.d20Contact !== undefined) dbUpdates.d20_contact = updates.d20Contact;
      if (updates.d15Contact !== undefined) dbUpdates.d15_contact = updates.d15Contact;
      if (updates.d10Contact !== undefined) dbUpdates.d10_contact = updates.d10Contact;
      if (updates.d7Contact !== undefined) dbUpdates.d7_contact = updates.d7Contact;
      if (updates.d2Contact !== undefined) dbUpdates.d2_contact = updates.d2Contact;
      if (updates.d1Contact !== undefined) dbUpdates.d1_contact = updates.d1Contact;
      if (updates.upgradeValue !== undefined) dbUpdates.upgrade_value = updates.upgradeValue;
      if (updates.upgradeCategory !== undefined) dbUpdates.upgrade_category = updates.upgradeCategory;
      if (updates.upsellValue !== undefined) dbUpdates.upsell_value = updates.upsellValue;
      if (updates.upsellCategory !== undefined) dbUpdates.upsell_category = updates.upsellCategory;
      if (updates.trichotomyDatetime !== undefined) dbUpdates.trichotomy_datetime = updates.trichotomyDatetime;
      if (updates.contractStatus !== undefined) dbUpdates.contract_status = updates.contractStatus;

      // Find current surgery to capture old values for audit log
      const currentSurgery = surgeries.find(s => s.id === id);
      const previousValues: Record<string, any> = {};
      if (currentSurgery) {
        for (const key of Object.keys(updates)) {
          previousValues[key] = (currentSurgery as any)[key];
        }
      }

      const { data, error } = await supabase
        .from('clinic_surgeries')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log changes asynchronously (don't block the update)
      logSurgeryChanges(id, updates, previousValues);

      // Sync category back to clinic_patients.notes if category changed
      if (updates.category !== undefined && currentSurgery?.patientId) {
        try {
          const { data: patientData } = await supabase
            .from('clinic_patients')
            .select('notes')
            .eq('id', currentSurgery.patientId)
            .single();

          if (patientData) {
            const parsed: Record<string, string> = {};
            if (patientData.notes) {
              for (const pair of patientData.notes.split('|')) {
                const m = pair.match(/([^:]+):\s*(.+)/);
                if (m) parsed[m[1].trim().toLowerCase()] = m[2].trim();
              }
            }
            if (updates.category) {
              parsed['categoria'] = updates.category;
            } else {
              delete parsed['categoria'];
            }
            const newNotes = Object.entries(parsed)
              .filter(([, v]) => v && v.trim())
              .map(([k, v]) => `${k}: ${v}`)
              .join(' | ');

            await supabase
              .from('clinic_patients')
              .update({ notes: newNotes })
              .eq('id', currentSurgery.patientId);
          }
        } catch (syncErr) {
          console.error('Failed to sync category to patient notes:', syncErr);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-surgeries'] });
      queryClient.invalidateQueries({ queryKey: ['no-date-patients'] });
      queryClient.invalidateQueries({ queryKey: ['clinic-patients'] });
      toast.success('Cirurgia atualizada!');
    },
    onError: () => {
      toast.error('Erro ao atualizar cirurgia');
    },
  });

  // Reschedule surgery: new date or "a definir"
  const rescheduleSurgery = useMutation({
    mutationFn: async ({ id, newDate, newTime }: { id: string; newDate: string | null; newTime?: string | null }) => {
      const currentSurgery = surgeries.find(s => s.id === id);
      const oldDate = currentSurgery?.surgeryDate || null;

      // 1. Update surgery date, time & status
      const dbUpdates: Record<string, any> = {
        surgery_date: newDate,
        surgery_time: newDate ? (newTime || null) : null,
        schedule_status: newDate ? 'agendado' : 'sem_data',
        surgery_confirmed: false, // Reset confirmation on reschedule
      };

      const { error: updateError } = await supabase
        .from('clinic_surgeries')
        .update(dbUpdates)
        .eq('id', id);

      if (updateError) throw updateError;

      if (newDate) {
        // PATH A: New date → delete non-completed tasks and regenerate via DB function
        await supabase
          .from('surgery_tasks')
          .delete()
          .eq('surgery_id', id)
          .neq('status', 'completed');

        // Call DB function to regenerate tasks (supports both process templates and legacy definitions)
        await supabase.rpc('generate_surgery_tasks', {
          p_surgery_id: id,
          p_surgery_date: newDate,
          p_include_sale: false,
        });
      } else {
        // PATH B: "A definir" → cancel all non-completed tasks
        await supabase
          .from('surgery_tasks')
          .delete()
          .eq('surgery_id', id)
          .neq('status', 'completed');
      }

      // Log the change
      logSurgeryChanges(id, { surgeryDate: newDate }, { surgeryDate: oldDate });

      return { newDate };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clinic-surgeries'] });
      queryClient.invalidateQueries({ queryKey: ['no-date-patients'] });
      queryClient.invalidateQueries({ queryKey: ['clinic-patients'] });
      queryClient.invalidateQueries({ queryKey: ['surgery-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['surgery-tasks-all'] });
      toast.success(data.newDate ? 'Cirurgia reagendada! Tarefas recalculadas.' : 'Cirurgia movida para "A definir". Tarefas removidas.');
    },
    onError: () => {
      toast.error('Erro ao reagendar cirurgia');
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
    !s.examsSent || !s.contractSigned
  );

  const noDateOver30 = noDateSurgeries.filter(s => s.daysSinceSale !== null && s.daysSinceSale >= 30);
  const noDateOver60 = noDateSurgeries.filter(s => s.daysSinceSale !== null && s.daysSinceSale >= 60);

  const stats = {
    total: surgeries.length,
    scheduled: scheduledSurgeries.length,
    noDate: noDateSurgeries.length,
    thisWeek: thisWeekSurgeries.length,
    pendingChecklist: pendingChecklist.length,
    confirmed: surgeries.filter(s => s.surgeryConfirmed).length,
    noDateOver30: noDateOver30.length,
    noDateOver60: noDateOver60.length,
  };

  const deleteSurgery = useMutation({
    mutationFn: async (id: string) => {
      // Delete related tasks first
      await supabase
        .from('surgery_tasks')
        .delete()
        .eq('surgery_id', id);

      const { error } = await supabase
        .from('clinic_surgeries')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-surgeries'] });
      queryClient.invalidateQueries({ queryKey: ['no-date-patients'] });
      queryClient.invalidateQueries({ queryKey: ['clinic-patients'] });
      toast.success('Paciente removido da agenda!');
    },
    onError: () => {
      toast.error('Erro ao remover paciente da agenda');
    },
  });

  return {
    surgeries,
    scheduledSurgeries,
    noDateSurgeries,
    noDateOver30,
    noDateOver60,
    thisWeekSurgeries,
    pendingChecklist,
    isLoading,
    error,
    stats,
    createSurgery,
    updateSurgery,
    rescheduleSurgery,
    deleteSurgery,
  };
}
