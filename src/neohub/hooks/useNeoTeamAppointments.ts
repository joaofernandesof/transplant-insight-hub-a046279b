import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export interface Appointment {
  id: string;
  patient_id?: string;
  patient_name: string;
  patient_phone?: string;
  patient_email?: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  type: string;
  doctor_name?: string;
  doctor_id?: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  branch?: string;
  created_at: string;
  updated_at: string;
}

export interface NewAppointment {
  patient_name: string;
  patient_phone?: string;
  patient_email?: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  type: string;
  doctor_name?: string;
  notes?: string;
}

export function useNeoTeamAppointments(selectedDate?: Date) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('neoteam_appointments')
        .select('*')
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (selectedDate) {
        query = query.eq('appointment_date', format(selectedDate, 'yyyy-MM-dd'));
      }

      const { data, error } = await query;

      if (error) throw error;
      setAppointments((data as Appointment[]) || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os agendamentos',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createAppointment = async (appointment: NewAppointment) => {
    try {
      const { data, error } = await supabase
        .from('neoteam_appointments')
        .insert([{
          ...appointment,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Agendamento criado com sucesso',
      });

      await fetchAppointments();
      return data as Appointment;
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o agendamento',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
    try {
      const { error } = await supabase
        .from('neoteam_appointments')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Agendamento atualizado',
      });

      await fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o agendamento',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteAppointment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('neoteam_appointments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Agendamento removido',
      });

      await fetchAppointments();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o agendamento',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const confirmAppointment = async (id: string) => {
    return updateAppointment(id, { status: 'confirmed' });
  };

  const cancelAppointment = async (id: string) => {
    return updateAppointment(id, { status: 'cancelled' });
  };

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  return {
    appointments,
    isLoading,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    confirmAppointment,
    cancelAppointment,
    refetch: fetchAppointments,
  };
}
