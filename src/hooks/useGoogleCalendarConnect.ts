/**
 * Hook for connecting Avivar agendas to Google Calendar
 */
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  primary: boolean;
  backgroundColor?: string;
  accessRole: string;
}

interface AgendaGoogleStatus {
  google_connected: boolean;
  google_calendar_id: string | null;
  google_calendar_name: string | null;
}

export function useGoogleCalendarConnect(agendaId: string | null) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [status, setStatus] = useState<AgendaGoogleStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const queryClient = useQueryClient();

  // Load connection status
  useEffect(() => {
    if (!agendaId) {
      setStatus(null);
      setIsLoadingStatus(false);
      return;
    }

    async function loadStatus() {
      setIsLoadingStatus(true);
      const { data } = await supabase
        .from('avivar_agendas')
        .select('google_connected, google_calendar_id, google_calendar_name')
        .eq('id', agendaId!)
        .single();

      setStatus(data as AgendaGoogleStatus | null);
      setIsLoadingStatus(false);
    }

    loadStatus();
  }, [agendaId]);

  // Start OAuth flow
  const connectGoogle = useCallback(async () => {
    if (!agendaId) return;

    setIsConnecting(true);
    try {
      const redirectUri = `${window.location.origin}/avivar/google-callback`;

      const { data, error } = await supabase.functions.invoke('avivar-google-calendar', {
        body: {
          action: 'get_auth_url',
          redirect_uri: redirectUri,
          agenda_id: agendaId,
        },
      });

      if (error) throw error;
      if (data?.url) {
        // Save agenda_id to sessionStorage so callback page knows which agenda
        sessionStorage.setItem('google_calendar_agenda_id', agendaId);
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error starting Google auth:', error);
      toast.error('Erro ao conectar com Google Calendar');
    } finally {
      setIsConnecting(false);
    }
  }, [agendaId]);

  // Exchange code (called from callback page)
  const exchangeCode = useCallback(async (code: string, agId: string) => {
    const redirectUri = `${window.location.origin}/avivar/google-callback`;

    const { data, error } = await supabase.functions.invoke('avivar-google-calendar', {
      body: {
        action: 'exchange_code',
        code,
        redirect_uri: redirectUri,
        agenda_id: agId,
      },
    });

    if (error) throw error;
    return data;
  }, []);

  // Select calendar
  const selectCalendar = useCallback(async (calendarId: string, calendarName: string) => {
    if (!agendaId) return;

    try {
      const { error } = await supabase.functions.invoke('avivar-google-calendar', {
        body: {
          action: 'select_calendar',
          agenda_id: agendaId,
          calendar_id: calendarId,
          calendar_name: calendarName,
        },
      });

      if (error) throw error;

      setStatus({
        google_connected: true,
        google_calendar_id: calendarId,
        google_calendar_name: calendarName,
      });
      setShowCalendarPicker(false);
      queryClient.invalidateQueries({ queryKey: ['avivar-agendas'] });
      toast.success(`Google Calendar "${calendarName}" conectado com sucesso!`);
    } catch (error) {
      console.error('Error selecting calendar:', error);
      toast.error('Erro ao selecionar calendário');
    }
  }, [agendaId, queryClient]);

  // Disconnect
  const disconnectGoogle = useCallback(async () => {
    if (!agendaId) return;

    try {
      const { error } = await supabase.functions.invoke('avivar-google-calendar', {
        body: {
          action: 'disconnect',
          agenda_id: agendaId,
        },
      });

      if (error) throw error;

      setStatus({
        google_connected: false,
        google_calendar_id: null,
        google_calendar_name: null,
      });
      queryClient.invalidateQueries({ queryKey: ['avivar-agendas'] });
      toast.success('Google Calendar desconectado');
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Erro ao desconectar');
    }
  }, [agendaId, queryClient]);

  // List calendars (for changing selected calendar)
  const listCalendars = useCallback(async () => {
    if (!agendaId) return;

    try {
      const { data, error } = await supabase.functions.invoke('avivar-google-calendar', {
        body: {
          action: 'list_calendars',
          agenda_id: agendaId,
        },
      });

      if (error) throw error;
      setCalendars(data?.calendars || []);
      setShowCalendarPicker(true);
    } catch (error) {
      console.error('Error listing calendars:', error);
      toast.error('Erro ao buscar calendários');
    }
  }, [agendaId]);

  return {
    status,
    isLoadingStatus,
    isConnecting,
    calendars,
    showCalendarPicker,
    setShowCalendarPicker,
    connectGoogle,
    exchangeCode,
    selectCalendar,
    disconnectGoogle,
    listCalendars,
  };
}
