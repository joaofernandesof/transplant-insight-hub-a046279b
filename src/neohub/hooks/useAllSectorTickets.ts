import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SectorTicket, SectorTicketType } from './useSectorTickets';

export function useAllSectorTickets() {
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['all-sector-tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sector_tickets')
        .select('*, ticket_type:sector_ticket_types(*), current_stage:sector_ticket_stages(*)')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as SectorTicket[];
    },
  });

  const { data: allTicketTypes = [] } = useQuery({
    queryKey: ['all-sector-ticket-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sector_ticket_types')
        .select('*')
        .eq('is_active', true)
        .order('sector_code, order_index');
      if (error) throw error;
      return data as SectorTicketType[];
    },
  });

  return { tickets, allTicketTypes, isLoading };
}
