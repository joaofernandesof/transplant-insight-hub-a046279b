import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AgendaNote {
  id: string;
  date: string;
  branch: string | null;
  note: string;
}

export function useSurgeryAgendaNotes(branch: string) {
  const queryClient = useQueryClient();

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['surgery-agenda-notes', branch],
    queryFn: async () => {
      let query = supabase
        .from('surgery_agenda_notes')
        .select('*');

      if (branch && branch !== 'all') {
        query = query.eq('branch', branch);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AgendaNote[];
    },
  });

  const notesByDate = new Map<string, string>();
  for (const n of notes) {
    notesByDate.set(n.date, n.note);
  }

  const upsertNote = useMutation({
    mutationFn: async ({ date, note }: { date: string; note: string }) => {
      const effectiveBranch = branch && branch !== 'all' ? branch : null;
      const userId = (await supabase.auth.getUser()).data.user?.id;

      const { error } = await supabase
        .from('surgery_agenda_notes')
        .upsert(
          {
            date,
            branch: effectiveBranch,
            note,
            updated_by: userId,
            created_by: userId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'date,branch' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surgery-agenda-notes'] });
    },
  });

  return { notesByDate, isLoading, upsertNote };
}
