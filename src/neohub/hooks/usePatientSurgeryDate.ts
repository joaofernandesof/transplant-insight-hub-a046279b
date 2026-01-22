import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNeoHubAuth } from '@/neohub/contexts/NeoHubAuthContext';
import { toast } from 'sonner';

export function usePatientSurgeryDate() {
  const { user, isLoading: authLoading } = useNeoHubAuth();
  const queryClient = useQueryClient();

  const { data: surgeryDate, isLoading, error } = useQuery({
    queryKey: ['patient-surgery-date', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('neohub_users')
        .select('surgery_date')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching surgery date:', error);
        throw error;
      }

      return data?.surgery_date ? new Date(data.surgery_date) : null;
    },
    enabled: !!user?.id && !authLoading,
  });

  const updateSurgeryDate = useMutation({
    mutationFn: async (newDate: Date | null) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('neohub_users')
        .update({ 
          surgery_date: newDate ? newDate.toISOString().split('T')[0] : null 
        })
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-surgery-date'] });
      toast.success('Data da cirurgia atualizada!');
    },
    onError: (error) => {
      console.error('Error updating surgery date:', error);
      toast.error('Erro ao atualizar data da cirurgia');
    },
  });

  return {
    surgeryDate,
    isLoading: isLoading || authLoading,
    error,
    updateSurgeryDate: updateSurgeryDate.mutate,
    isUpdating: updateSurgeryDate.isPending,
  };
}
