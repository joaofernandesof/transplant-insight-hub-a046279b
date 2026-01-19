import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Helper to check if user is licensee (not admin)
export function useIsLicensee() {
  const { isAdmin } = useAuth();
  return !isAdmin;
}

export interface SalaTecnicaMeeting {
  id: string;
  title: string;
  description: string | null;
  meeting_date: string;
  meeting_time: string;
  duration_minutes: number;
  google_meet_link: string | null;
  mentor_names: string[] | null;
  is_cancelled: boolean;
  created_at: string;
}

export interface MeetingConfirmation {
  id: string;
  meeting_id: string;
  user_id: string;
  confirmed_at: string;
  attendance_status: string;
}

export function useSalaTecnicaMeetings() {
  return useQuery({
    queryKey: ['sala-tecnica-meetings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sala_tecnica_meetings')
        .select('*')
        .eq('is_cancelled', false)
        .gte('meeting_date', new Date().toISOString().split('T')[0])
        .order('meeting_date', { ascending: true });

      if (error) throw error;
      return data as SalaTecnicaMeeting[];
    },
  });
}

export function useAllSalaTecnicaMeetings() {
  return useQuery({
    queryKey: ['all-sala-tecnica-meetings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sala_tecnica_meetings')
        .select('*')
        .order('meeting_date', { ascending: false });

      if (error) throw error;
      return data as SalaTecnicaMeeting[];
    },
  });
}

export function useNextMeeting() {
  return useQuery({
    queryKey: ['next-sala-tecnica'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('sala_tecnica_meetings')
        .select('*')
        .eq('is_cancelled', false)
        .gte('meeting_date', today)
        .order('meeting_date', { ascending: true })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as SalaTecnicaMeeting | null;
    },
  });
}

export function useMeetingConfirmations(meetingId?: string) {
  return useQuery({
    queryKey: ['meeting-confirmations', meetingId],
    queryFn: async () => {
      if (!meetingId) return [];
      
      const { data, error } = await supabase
        .from('sala_tecnica_confirmations')
        .select('*')
        .eq('meeting_id', meetingId);

      if (error) throw error;
      return data as MeetingConfirmation[];
    },
    enabled: !!meetingId,
  });
}

export function useUserConfirmation(meetingId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-confirmation', meetingId, user?.id],
    queryFn: async () => {
      if (!meetingId || !user?.id) return null;
      
      const { data, error } = await supabase
        .from('sala_tecnica_confirmations')
        .select('*')
        .eq('meeting_id', meetingId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as MeetingConfirmation | null;
    },
    enabled: !!meetingId && !!user?.id,
  });
}

export function useConfirmMeeting() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (meetingId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('sala_tecnica_confirmations')
        .insert({
          meeting_id: meetingId,
          user_id: user.id,
          attendance_status: 'confirmed'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, meetingId) => {
      queryClient.invalidateQueries({ queryKey: ['user-confirmation', meetingId] });
      queryClient.invalidateQueries({ queryKey: ['meeting-confirmations', meetingId] });
      toast.success('Presença confirmada!', {
        description: 'Você receberá um lembrete antes da reunião.'
      });
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast.info('Você já confirmou presença nesta reunião.');
      } else {
        toast.error('Erro ao confirmar presença', { description: error.message });
      }
    },
  });
}

export function useCancelConfirmation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (meetingId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('sala_tecnica_confirmations')
        .delete()
        .eq('meeting_id', meetingId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: (_, meetingId) => {
      queryClient.invalidateQueries({ queryKey: ['user-confirmation', meetingId] });
      queryClient.invalidateQueries({ queryKey: ['meeting-confirmations', meetingId] });
      toast.success('Confirmação cancelada');
    },
    onError: (error: Error) => {
      toast.error('Erro ao cancelar', { description: error.message });
    },
  });
}

export function useIsThursday() {
  const today = new Date();
  return today.getDay() === 4; // Thursday = 4
}

export function useTodaysMeeting() {
  const isThursday = useIsThursday();
  
  return useQuery({
    queryKey: ['todays-meeting'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('sala_tecnica_meetings')
        .select('*')
        .eq('meeting_date', today)
        .eq('is_cancelled', false)
        .maybeSingle();

      if (error) throw error;
      return data as SalaTecnicaMeeting | null;
    },
    enabled: isThursday,
  });
}
