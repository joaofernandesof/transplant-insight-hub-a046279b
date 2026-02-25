import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const DAYS = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Segunda', short: 'Seg' },
  { value: 2, label: 'Terça', short: 'Ter' },
  { value: 3, label: 'Quarta', short: 'Qua' },
  { value: 4, label: 'Quinta', short: 'Qui' },
  { value: 5, label: 'Sexta', short: 'Sex' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
];

interface ScheduleRow {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  is_active: boolean;
}

interface DoctorScheduleEditorProps {
  doctorId: string;
}

export function DoctorScheduleEditor({ doctorId }: DoctorScheduleEditorProps) {
  const queryClient = useQueryClient();
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSchedules();
  }, [doctorId]);

  const loadSchedules = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('neoteam_doctor_schedules')
      .select('*')
      .eq('doctor_id', doctorId)
      .order('day_of_week');

    if (error) {
      toast.error('Erro ao carregar agenda');
      setIsLoading(false);
      return;
    }

    // Build full week, merging existing data
    const fullWeek: ScheduleRow[] = DAYS.map(day => {
      const existing = data?.find(s => s.day_of_week === day.value);
      if (existing) {
        return {
          id: existing.id,
          day_of_week: existing.day_of_week,
          start_time: existing.start_time,
          end_time: existing.end_time,
          slot_duration_minutes: existing.slot_duration_minutes ?? 30,
          is_active: existing.is_active,
        };
      }
      return {
        day_of_week: day.value,
        start_time: '08:00',
        end_time: '18:00',
        slot_duration_minutes: 30,
        is_active: false,
      };
    });

    setSchedules(fullWeek);
    setIsLoading(false);
  };

  const updateRow = (dayOfWeek: number, field: keyof ScheduleRow, value: any) => {
    setSchedules(prev =>
      prev.map(s => s.day_of_week === dayOfWeek ? { ...s, [field]: value } : s)
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      for (const schedule of schedules) {
        if (schedule.id) {
          // Update existing
          const { error } = await supabase
            .from('neoteam_doctor_schedules')
            .update({
              start_time: schedule.start_time,
              end_time: schedule.end_time,
              slot_duration_minutes: schedule.slot_duration_minutes,
              is_active: schedule.is_active,
            })
            .eq('id', schedule.id);
          if (error) throw error;
        } else if (schedule.is_active) {
          // Insert only active new ones
          const { error } = await supabase
            .from('neoteam_doctor_schedules')
            .insert({
              doctor_id: doctorId,
              day_of_week: schedule.day_of_week,
              start_time: schedule.start_time,
              end_time: schedule.end_time,
              slot_duration_minutes: schedule.slot_duration_minutes,
              is_active: true,
            });
          if (error) throw error;
        }
      }

      toast.success('Agenda salva com sucesso');
      queryClient.invalidateQueries({ queryKey: ['neoteam-doctor-week-schedule', doctorId] });
      await loadSchedules();
    } catch (err: any) {
      toast.error('Erro ao salvar agenda: ' + (err.message || ''));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Horários de Atendimento
        </Label>
        <Button size="sm" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
          Salvar Agenda
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[120px_1fr_1fr_100px] gap-2 px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
          <span>Dia</span>
          <span>Início — Fim</span>
          <span>Duração (min)</span>
          <span className="text-center">Ativo</span>
        </div>

        {/* Rows */}
        {schedules.map(schedule => {
          const day = DAYS.find(d => d.value === schedule.day_of_week)!;
          return (
            <div
              key={schedule.day_of_week}
              className={`grid grid-cols-[120px_1fr_1fr_100px] gap-2 px-3 py-2 items-center border-t ${
                !schedule.is_active ? 'opacity-50' : ''
              }`}
            >
              <span className="text-sm font-medium">{day.label}</span>
              <div className="flex items-center gap-1">
                <Input
                  type="time"
                  value={schedule.start_time}
                  onChange={e => updateRow(schedule.day_of_week, 'start_time', e.target.value)}
                  className="h-8 text-xs w-[100px]"
                  disabled={!schedule.is_active}
                />
                <span className="text-muted-foreground text-xs">—</span>
                <Input
                  type="time"
                  value={schedule.end_time}
                  onChange={e => updateRow(schedule.day_of_week, 'end_time', e.target.value)}
                  className="h-8 text-xs w-[100px]"
                  disabled={!schedule.is_active}
                />
              </div>
              <Input
                type="number"
                min={5}
                max={120}
                value={schedule.slot_duration_minutes}
                onChange={e => updateRow(schedule.day_of_week, 'slot_duration_minutes', parseInt(e.target.value) || 30)}
                className="h-8 text-xs w-[80px]"
                disabled={!schedule.is_active}
              />
              <div className="flex justify-center">
                <Switch
                  checked={schedule.is_active}
                  onCheckedChange={val => updateRow(schedule.day_of_week, 'is_active', val)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
