import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SurgerySchedule {
  id: string;
  clinic_id?: string;
  user_id: string;
  surgery_date: string;
  day_of_week?: string;
  trichotomy_datetime?: string;
  surgery_time?: string;
  confirmed: boolean;
  exams_sent: boolean;
  patient_name: string;
  patient_phone?: string;
  medical_record?: string;
  category?: string;
  procedure_type?: string;
  grade?: number;
  initial_value: number;
  referral_bonus: number;
  upgrade_value: number;
  upsell_value: number;
  final_value: number;
  deposit_paid: number;
  remaining_paid: number;
  balance_due: number;
  companion_name?: string;
  companion_phone?: string;
  contract_signed: boolean;
  exams_in_system: boolean;
  d7_contact: boolean;
  d2_contact: boolean;
  d1_contact: boolean;
  checkin_sent: boolean;
  scheduling_form: boolean;
  d0_discharge_form: boolean;
  d1_gpi: boolean;
  observations?: string;
  financial_verification?: string;
  post_sale_notes?: string;
  cidade?: string;
  medico?: string;
  tipo_agendamento?: string;
  categoria_rodizio?: string;
  created_at: string;
  updated_at: string;
}

export type SurgeryScheduleInsert = Omit<SurgerySchedule, 'id' | 'created_at' | 'updated_at'>;
export type SurgeryScheduleUpdate = Partial<SurgeryScheduleInsert>;

export function useSurgerySchedule() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: surgeries = [], isLoading, error } = useQuery({
    queryKey: ['surgery-schedule', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('surgery_schedule')
        .select('*')
        .order('surgery_date', { ascending: true });
      
      if (error) throw error;
      return data as SurgerySchedule[];
    },
    enabled: !!user?.id,
  });

  const createSurgery = useMutation({
    mutationFn: async (surgery: SurgeryScheduleInsert) => {
      const { data, error } = await supabase
        .from('surgery_schedule')
        .insert(surgery)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surgery-schedule'] });
      toast.success('Cirurgia agendada com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating surgery:', error);
      toast.error('Erro ao agendar cirurgia');
    },
  });

  const updateSurgery = useMutation({
    mutationFn: async ({ id, ...updates }: SurgeryScheduleUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('surgery_schedule')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surgery-schedule'] });
      toast.success('Cirurgia atualizada!');
    },
    onError: (error) => {
      console.error('Error updating surgery:', error);
      toast.error('Erro ao atualizar cirurgia');
    },
  });

  const deleteSurgery = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('surgery_schedule')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surgery-schedule'] });
      toast.success('Cirurgia removida!');
    },
    onError: (error) => {
      console.error('Error deleting surgery:', error);
      toast.error('Erro ao remover cirurgia');
    },
  });

  // Calculate summary stats
  const stats = {
    totalSurgeries: surgeries.length,
    confirmedSurgeries: surgeries.filter(s => s.confirmed).length,
    pendingExams: surgeries.filter(s => !s.exams_sent).length,
    totalValue: surgeries.reduce((sum, s) => sum + (s.final_value || 0), 0),
    depositsPaid: surgeries.reduce((sum, s) => sum + (s.deposit_paid || 0), 0),
    remainingPaid: surgeries.reduce((sum, s) => sum + (s.remaining_paid || 0), 0),
    totalBalanceDue: surgeries.reduce((sum, s) => sum + (s.balance_due || 0), 0),
    upgradeTotal: surgeries.reduce((sum, s) => sum + (s.upgrade_value || 0), 0),
    upsellTotal: surgeries.reduce((sum, s) => sum + (s.upsell_value || 0), 0),
  };

  return {
    surgeries,
    isLoading,
    error,
    stats,
    createSurgery,
    updateSurgery,
    deleteSurgery,
  };
}
