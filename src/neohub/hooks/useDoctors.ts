import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Doctor {
  id: string;
  full_name: string;
  specialty: string | null;
  crm: string | null;
  crm_state: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  consultation_duration_minutes: number;
}

export interface DoctorSchedule {
  id: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  is_active: boolean;
}

export interface ScheduleBlock {
  id: string;
  doctor_id: string | null;
  start_date: string;
  end_date: string;
  reason: string | null;
  is_all_doctors: boolean;
}

export function useDoctors() {
  return useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neoteam_doctors')
        .select('*')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      return data as Doctor[];
    },
  });
}

export function useDoctorSchedules(doctorId?: string) {
  return useQuery({
    queryKey: ['doctor-schedules', doctorId],
    queryFn: async () => {
      let query = supabase
        .from('neoteam_doctor_schedules')
        .select('*')
        .eq('is_active', true);

      if (doctorId) {
        query = query.eq('doctor_id', doctorId);
      }

      const { data, error } = await query.order('day_of_week');
      if (error) throw error;
      return data as DoctorSchedule[];
    },
    enabled: true,
  });
}

export function useScheduleBlocks(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ['schedule-blocks', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from('neoteam_schedule_blocks')
        .select('*');

      if (startDate) {
        query = query.gte('end_date', startDate.toISOString().split('T')[0]);
      }
      if (endDate) {
        query = query.lte('start_date', endDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ScheduleBlock[];
    },
  });
}

export function useAvailableSlots(doctorId: string, date: Date) {
  const { data: schedules } = useDoctorSchedules(doctorId);
  const { data: blocks } = useScheduleBlocks(date, date);
  
  return useQuery({
    queryKey: ['available-slots', doctorId, date.toISOString().split('T')[0]],
    queryFn: async () => {
      const dayOfWeek = date.getDay();
      const dateStr = date.toISOString().split('T')[0];
      
      // Check if doctor works on this day
      const daySchedule = schedules?.find(s => s.day_of_week === dayOfWeek);
      if (!daySchedule) return [];
      
      // Check for blocks
      const isBlocked = blocks?.some(b => 
        (b.doctor_id === doctorId || b.is_all_doctors) &&
        dateStr >= b.start_date && dateStr <= b.end_date
      );
      if (isBlocked) return [];
      
      // Generate time slots
      const slots: string[] = [];
      const [startHour, startMin] = daySchedule.start_time.split(':').map(Number);
      const [endHour, endMin] = daySchedule.end_time.split(':').map(Number);
      const slotDuration = daySchedule.slot_duration_minutes;
      
      let currentMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      while (currentMinutes < endMinutes) {
        const hour = Math.floor(currentMinutes / 60);
        const min = currentMinutes % 60;
        slots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
        currentMinutes += slotDuration;
      }
      
      // Get existing appointments for this day
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const { data: appointments } = await supabase
        .from('portal_appointments')
        .select('scheduled_at, duration_minutes')
        .eq('doctor_id', doctorId)
        .gte('scheduled_at', startOfDay.toISOString())
        .lte('scheduled_at', endOfDay.toISOString())
        .neq('status', 'cancelled');
      
      // Filter out booked slots
      const bookedTimes = new Set(
        appointments?.map(a => {
          const d = new Date(a.scheduled_at);
          return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        }) || []
      );
      
      return slots.filter(slot => !bookedTimes.has(slot));
    },
    enabled: !!schedules && !!doctorId,
  });
}
