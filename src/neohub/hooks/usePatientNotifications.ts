import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

export interface PatientNotification {
  id: string;
  patient_id: string;
  type: 'appointment_reminder' | 'appointment_confirmation' | 'welcome' | 'document_available' | 'general';
  channel: string;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  status: 'pending' | 'sent' | 'failed' | 'read';
  scheduled_for: string | null;
  sent_at: string | null;
  read_at: string | null;
  created_at: string;
}

export function usePatientNotifications() {
  const { user } = useUnifiedAuth();
  
  return useQuery({
    queryKey: ['patient-notifications', user?.id],
    queryFn: async () => {
      // First get patient ID
      const { data: portalUser } = await supabase
        .from('portal_users')
        .select('id')
        .eq('email', user?.email)
        .single();

      if (!portalUser) return [];

      const { data: patient } = await supabase
        .from('portal_patients')
        .select('id')
        .eq('portal_user_id', portalUser.id)
        .single();

      if (!patient) return [];

      const { data, error } = await supabase
        .from('patient_notifications')
        .select('*')
        .eq('patient_id', patient.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as PatientNotification[];
    },
    enabled: !!user?.email,
  });
}

export function useUnreadNotificationsCount() {
  const { data: notifications } = usePatientNotifications();
  return notifications?.filter(n => n.status === 'sent' && !n.read_at).length || 0;
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('patient_notifications')
        .update({ 
          status: 'read',
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-notifications'] });
    },
  });
}

export function useSendAppointmentNotification() {
  return useMutation({
    mutationFn: async ({ 
      appointmentId, 
      type, 
      channels 
    }: { 
      appointmentId: string; 
      type: 'confirmation' | 'reminder' | 'cancellation' | 'reschedule';
      channels?: ('email' | 'whatsapp')[];
    }) => {
      const { data, error } = await supabase.functions.invoke('send-appointment-notifications', {
        body: {
          appointment_id: appointmentId,
          type,
          channels: channels || ['email', 'whatsapp'],
        }
      });

      if (error) throw error;
      return data;
    },
  });
}
