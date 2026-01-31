import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

interface TimePeriod {
  start_time: string;
  end_time: string;
}

interface DaySchedule {
  day_of_week: number;
  is_enabled: boolean;
  periods: TimePeriod[];
}

interface ScheduleConfig {
  id: string;
  professional_name: string;
  consultation_duration: number;
  buffer_between: number;
  min_advance_hours: number;
  advance_booking_days: number;
  timezone: string;
  agenda_id: string | null;
}

export function useAvivarScheduleConfig(agendaId: string | null) {
  const { user } = useUnifiedAuth();

  // Fetch schedule config
  const { data: scheduleConfig, isLoading: loadingConfig } = useQuery({
    queryKey: ['avivar-schedule-config', agendaId, user?.authUserId],
    queryFn: async () => {
      if (!user?.authUserId) return null;

      let query = supabase
        .from('avivar_schedule_config')
        .select('*')
        .eq('user_id', user.authUserId);

      if (agendaId) {
        query = query.eq('agenda_id', agendaId);
      } else {
        query = query.is('agenda_id', null);
      }

      const { data, error } = await query.single();
      if (error && error.code !== 'PGRST116') throw error;
      return data as ScheduleConfig | null;
    },
    enabled: !!user?.authUserId,
  });

  // Fetch schedule hours
  const { data: scheduleHours, isLoading: loadingHours } = useQuery({
    queryKey: ['avivar-schedule-hours', scheduleConfig?.id],
    queryFn: async () => {
      if (!scheduleConfig?.id) return [];

      const { data, error } = await supabase
        .from('avivar_schedule_hours')
        .select('*')
        .eq('schedule_config_id', scheduleConfig.id)
        .order('day_of_week')
        .order('start_time');

      if (error) throw error;
      
      // Group by day_of_week to support multiple periods per day
      const grouped: Record<number, TimePeriod[]> = {};
      for (const row of data) {
        if (!grouped[row.day_of_week]) {
          grouped[row.day_of_week] = [];
        }
        grouped[row.day_of_week].push({
          start_time: row.start_time,
          end_time: row.end_time,
        });
      }
      
      // Convert to DaySchedule array
      const daySchedules: DaySchedule[] = [];
      for (let i = 0; i <= 6; i++) {
        const periods = grouped[i];
        daySchedules.push({
          day_of_week: i,
          is_enabled: periods && periods.length > 0,
          periods: periods || [],
        });
      }
      
      return daySchedules;
    },
    enabled: !!scheduleConfig?.id,
  });

  return {
    scheduleConfig,
    scheduleHours: scheduleHours || [],
    isLoading: loadingConfig || loadingHours,
  };
}

/**
 * Generate available time slots for a given day based on schedule configuration
 */
export function generateTimeSlotsForDay(
  dayOfWeek: number,
  scheduleHours: DaySchedule[],
  consultationDuration: number = 30
): string[] {
  const daySchedule = scheduleHours.find(h => h.day_of_week === dayOfWeek);
  
  if (!daySchedule || !daySchedule.is_enabled || daySchedule.periods.length === 0) {
    return [];
  }

  const slots: string[] = [];

  for (const period of daySchedule.periods) {
    const [startHour, startMin] = period.start_time.split(':').map(Number);
    const [endHour, endMin] = period.end_time.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    // Generate slots within this period
    for (let currentMin = startMinutes; currentMin + consultationDuration <= endMinutes; currentMin += consultationDuration) {
      const hour = Math.floor(currentMin / 60);
      const min = currentMin % 60;
      const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      slots.push(timeStr);
    }
  }

  // Sort slots chronologically
  slots.sort((a, b) => {
    const [aH, aM] = a.split(':').map(Number);
    const [bH, bM] = b.split(':').map(Number);
    return (aH * 60 + aM) - (bH * 60 + bM);
  });

  return slots;
}

/**
 * Fallback: Generate default time slots if no configuration exists
 */
export function generateDefaultTimeSlots(consultationDuration: number = 30): string[] {
  const slots: string[] = [];
  const startHour = 8;
  const endHour = 18;
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let min = 0; min < 60; min += consultationDuration) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      slots.push(timeStr);
    }
  }
  
  return slots;
}
