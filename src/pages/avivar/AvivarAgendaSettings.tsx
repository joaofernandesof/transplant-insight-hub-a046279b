/**
 * AvivarAgendaSettings - Configurações da Agenda do Portal Avivar
 * Permite configurar horários, intervalos, pausas e bloqueios
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Calendar, Pause, Lock, Settings2, Save, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { AgendaSelector } from "@/components/avivar/AgendaSelector";
import { AvivarAgenda, useAvivarAgendas } from "@/hooks/useAvivarAgendas";
import { cn } from "@/lib/utils";

interface ScheduleConfig {
  id?: string;
  professional_name: string;
  consultation_duration: number;
  buffer_between: number;
  min_advance_hours: number;
  advance_booking_days: number;
  timezone: string;
}

interface TimePeriod {
  id?: string;
  start_time: string;
  end_time: string;
}

interface DayHours {
  id?: string;
  day_of_week: number;
  is_enabled: boolean;
  periods: TimePeriod[];
}

interface ScheduleBlock {
  id?: string;
  block_date: string;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
}

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const DEFAULT_HOURS: DayHours[] = [
  { day_of_week: 0, is_enabled: false, periods: [{ start_time: '08:00', end_time: '18:00' }] },
  { day_of_week: 1, is_enabled: true, periods: [{ start_time: '08:00', end_time: '12:00' }, { start_time: '14:00', end_time: '18:00' }] },
  { day_of_week: 2, is_enabled: true, periods: [{ start_time: '08:00', end_time: '12:00' }, { start_time: '14:00', end_time: '18:00' }] },
  { day_of_week: 3, is_enabled: true, periods: [{ start_time: '08:00', end_time: '12:00' }, { start_time: '14:00', end_time: '18:00' }] },
  { day_of_week: 4, is_enabled: true, periods: [{ start_time: '08:00', end_time: '12:00' }, { start_time: '14:00', end_time: '18:00' }] },
  { day_of_week: 5, is_enabled: true, periods: [{ start_time: '08:00', end_time: '12:00' }, { start_time: '14:00', end_time: '18:00' }] },
  { day_of_week: 6, is_enabled: false, periods: [{ start_time: '08:00', end_time: '12:00' }] },
];

export default function AvivarAgendaSettings() {
  const navigate = useNavigate();
  const { user } = useUnifiedAuth();
  const { agendas } = useAvivarAgendas();
  const queryClient = useQueryClient();

  const [selectedAgenda, setSelectedAgenda] = useState<AvivarAgenda | null>(null);
  const [config, setConfig] = useState<ScheduleConfig>({
    professional_name: '',
    consultation_duration: 30,
    buffer_between: 0,
    min_advance_hours: 2,
    advance_booking_days: 30,
    timezone: 'America/Sao_Paulo',
  });
  const [hours, setHours] = useState<DayHours[]>(DEFAULT_HOURS);
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [newBlock, setNewBlock] = useState<Partial<ScheduleBlock>>({
    block_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: null,
    end_time: null,
    reason: '',
  });
  const [blockDateOpen, setBlockDateOpen] = useState(false);

  // Fetch existing config - usar authUserId para compatibilidade com RLS
  const { data: existingConfig, isLoading: loadingConfig } = useQuery({
    queryKey: ['avivar-schedule-config', selectedAgenda?.id, user?.authUserId],
    queryFn: async () => {
      if (!user?.authUserId) return null;

      let query = supabase
        .from('avivar_schedule_config')
        .select('*')
        .eq('user_id', user.authUserId);

      if (selectedAgenda) {
        query = query.eq('agenda_id', selectedAgenda.id);
      } else {
        query = query.is('agenda_id', null);
      }

      const { data, error } = await query.single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch hours for config
  const { data: existingHours } = useQuery({
    queryKey: ['avivar-schedule-hours', existingConfig?.id],
    queryFn: async () => {
      if (!existingConfig?.id) return [];

      const { data, error } = await supabase
        .from('avivar_schedule_hours')
        .select('*')
        .eq('schedule_config_id', existingConfig.id)
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
          id: row.id,
          start_time: row.start_time,
          end_time: row.end_time,
        });
      }
      
      // Convert to DayHours format
      const result: DayHours[] = DEFAULT_HOURS.map(dh => {
        const periods = grouped[dh.day_of_week];
        const hasAnyEnabled = data.some(d => d.day_of_week === dh.day_of_week && d.is_enabled);
        if (periods && periods.length > 0) {
          return {
            day_of_week: dh.day_of_week,
            is_enabled: hasAnyEnabled,
            periods,
          };
        }
        return dh;
      });
      
      return result;
    },
    enabled: !!existingConfig?.id,
  });

  // Fetch blocks for config
  const { data: existingBlocks } = useQuery({
    queryKey: ['avivar-schedule-blocks', existingConfig?.id],
    queryFn: async () => {
      if (!existingConfig?.id) return [];

      const { data, error } = await supabase
        .from('avivar_schedule_blocks')
        .select('*')
        .eq('schedule_config_id', existingConfig.id)
        .order('block_date');

      if (error) throw error;
      return data as ScheduleBlock[];
    },
    enabled: !!existingConfig?.id,
  });

  // Update local state when data loads
  useEffect(() => {
    if (existingConfig) {
      setConfig({
        id: existingConfig.id,
        professional_name: existingConfig.professional_name || '',
        consultation_duration: existingConfig.consultation_duration || 30,
        buffer_between: existingConfig.buffer_between || 0,
        min_advance_hours: existingConfig.min_advance_hours || 2,
        advance_booking_days: existingConfig.advance_booking_days || 30,
        timezone: existingConfig.timezone || 'America/Sao_Paulo',
      });
    } else {
      // Reset to defaults
      setConfig({
        professional_name: selectedAgenda?.professional_name || '',
        consultation_duration: 30,
        buffer_between: 0,
        min_advance_hours: 2,
        advance_booking_days: 30,
        timezone: 'America/Sao_Paulo',
      });
    }
  }, [existingConfig, selectedAgenda]);

  useEffect(() => {
    if (existingHours && existingHours.length > 0) {
      setHours(existingHours);
    } else {
      setHours(DEFAULT_HOURS);
    }
  }, [existingHours]);

  useEffect(() => {
    if (existingBlocks) {
      setBlocks(existingBlocks);
    }
  }, [existingBlocks]);

  // Save config mutation
  const saveConfigMutation = useMutation({
    mutationFn: async () => {
      if (!user?.authUserId) throw new Error('Usuário não autenticado');

      // Upsert config - usar authUserId para compatibilidade com RLS
      const configData = {
        user_id: user.authUserId,
        professional_name: config.professional_name || 'Profissional',
        consultation_duration: config.consultation_duration,
        buffer_between: config.buffer_between,
        min_advance_hours: config.min_advance_hours,
        advance_booking_days: config.advance_booking_days,
        timezone: config.timezone,
        agenda_id: selectedAgenda?.id || null,
      };

      let configId = config.id;

      if (configId) {
        const { error } = await supabase
          .from('avivar_schedule_config')
          .update(configData)
          .eq('id', configId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('avivar_schedule_config')
          .insert(configData)
          .select()
          .single();
        if (error) throw error;
        configId = data.id;
      }

      // Delete existing hours and insert new (flattened for multiple periods)
      await supabase
        .from('avivar_schedule_hours')
        .delete()
        .eq('schedule_config_id', configId);

      // Flatten periods into individual rows
      const hoursData: Array<{
        schedule_config_id: string;
        day_of_week: number;
        is_enabled: boolean;
        start_time: string;
        end_time: string;
      }> = [];
      
      for (const h of hours) {
        for (const period of h.periods) {
          hoursData.push({
            schedule_config_id: configId!,
            day_of_week: h.day_of_week,
            is_enabled: h.is_enabled,
            start_time: period.start_time,
            end_time: period.end_time,
          });
        }
      }

      if (hoursData.length > 0) {
        const { error: hoursError } = await supabase
          .from('avivar_schedule_hours')
          .insert(hoursData);
        if (hoursError) throw hoursError;
      }

      return configId;
    },
    onSuccess: () => {
      toast.success('Configurações salvas com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['avivar-schedule-config'] });
      queryClient.invalidateQueries({ queryKey: ['avivar-schedule-hours'] });
    },
    onError: (error) => {
      console.error('Error saving config:', error);
      toast.error('Erro ao salvar configurações');
    },
  });

  // Add block mutation
  const addBlockMutation = useMutation({
    mutationFn: async (block: Partial<ScheduleBlock>) => {
      if (!existingConfig?.id) {
        // Need to save config first
        const configId = await saveConfigMutation.mutateAsync();
        block = { ...block };
        
        const { error } = await supabase
          .from('avivar_schedule_blocks')
          .insert({
            schedule_config_id: configId,
            block_date: block.block_date!,
            start_time: block.start_time || null,
            end_time: block.end_time || null,
            reason: block.reason || null,
          });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('avivar_schedule_blocks')
          .insert({
            schedule_config_id: existingConfig.id,
            block_date: block.block_date!,
            start_time: block.start_time || null,
            end_time: block.end_time || null,
            reason: block.reason || null,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Bloqueio adicionado!');
      queryClient.invalidateQueries({ queryKey: ['avivar-schedule-blocks'] });
      setNewBlock({
        block_date: format(new Date(), 'yyyy-MM-dd'),
        start_time: null,
        end_time: null,
        reason: '',
      });
    },
    onError: (error) => {
      console.error('Error adding block:', error);
      toast.error('Erro ao adicionar bloqueio');
    },
  });

  // Delete block mutation
  const deleteBlockMutation = useMutation({
    mutationFn: async (blockId: string) => {
      const { error } = await supabase
        .from('avivar_schedule_blocks')
        .delete()
        .eq('id', blockId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Bloqueio removido!');
      queryClient.invalidateQueries({ queryKey: ['avivar-schedule-blocks'] });
    },
    onError: (error) => {
      console.error('Error deleting block:', error);
      toast.error('Erro ao remover bloqueio');
    },
  });

  const updateHour = (dayIndex: number, field: keyof DayHours, value: any) => {
    setHours(prev => prev.map((h, i) => 
      i === dayIndex ? { ...h, [field]: value } : h
    ));
  };

  const updatePeriod = (dayIndex: number, periodIndex: number, field: 'start_time' | 'end_time', value: string) => {
    setHours(prev => prev.map((h, i) => {
      if (i !== dayIndex) return h;
      const newPeriods = [...h.periods];
      newPeriods[periodIndex] = { ...newPeriods[periodIndex], [field]: value };
      return { ...h, periods: newPeriods };
    }));
  };

  const addPeriod = (dayIndex: number) => {
    setHours(prev => prev.map((h, i) => {
      if (i !== dayIndex) return h;
      const lastPeriod = h.periods[h.periods.length - 1];
      // Default new period starts 2 hours after last one ends
      const newStart = lastPeriod ? lastPeriod.end_time : '14:00';
      const newEnd = '18:00';
      return { ...h, periods: [...h.periods, { start_time: newStart, end_time: newEnd }] };
    }));
  };

  const removePeriod = (dayIndex: number, periodIndex: number) => {
    setHours(prev => prev.map((h, i) => {
      if (i !== dayIndex) return h;
      if (h.periods.length <= 1) return h; // Keep at least one period
      const newPeriods = h.periods.filter((_, pi) => pi !== periodIndex);
      return { ...h, periods: newPeriods };
    }));
  };

  if (loadingConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--avivar-primary))]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/avivar/agenda')}
            className="text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
              Configurações da Agenda
            </h1>
            <p className="text-[hsl(var(--avivar-muted-foreground))]">
              Configure horários, intervalos e bloqueios
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AgendaSelector 
            selectedAgenda={selectedAgenda} 
            onSelect={setSelectedAgenda} 
          />
          <Button
            className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white"
            onClick={() => saveConfigMutation.mutate()}
            disabled={saveConfigMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="hours" className="space-y-6">
        <TabsList className="bg-[hsl(var(--avivar-card))] border border-[hsl(var(--avivar-border))]">
          <TabsTrigger value="hours" className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white">
            <Clock className="h-4 w-4 mr-2" />
            Horários
          </TabsTrigger>
          <TabsTrigger value="general" className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white">
            <Settings2 className="h-4 w-4 mr-2" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="blocks" className="data-[state=active]:bg-[hsl(var(--avivar-primary))] data-[state=active]:text-white">
            <Lock className="h-4 w-4 mr-2" />
            Bloqueios
          </TabsTrigger>
        </TabsList>

        {/* Hours Tab */}
        <TabsContent value="hours" className="space-y-4">
          <Card className="border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))]">
            <CardHeader>
              <CardTitle className="text-[hsl(var(--avivar-foreground))]">
                Horários de Atendimento
              </CardTitle>
              <CardDescription>
                Configure os dias e horários em que você atende
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {hours.map((dayHour, index) => (
                <div
                  key={dayHour.day_of_week}
                  className={cn(
                    "flex gap-4 p-4 rounded-lg border transition-colors",
                    dayHour.is_enabled
                      ? "border-[hsl(var(--avivar-primary)/0.3)] bg-[hsl(var(--avivar-primary)/0.05)]"
                      : "border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-muted))]"
                  )}
                >
                  <div className="flex items-center gap-4 pt-1">
                    <Switch
                      checked={dayHour.is_enabled}
                      onCheckedChange={(checked) => updateHour(index, 'is_enabled', checked)}
                      className="data-[state=checked]:bg-[hsl(var(--avivar-primary))]"
                    />
                    <span className={cn(
                      "w-24 font-medium",
                      dayHour.is_enabled 
                        ? "text-[hsl(var(--avivar-foreground))]" 
                        : "text-[hsl(var(--avivar-muted-foreground))]"
                    )}>
                      {DAY_NAMES[dayHour.day_of_week]}
                    </span>
                  </div>

                  {dayHour.is_enabled && (
                    <div className="flex-1 space-y-2">
                      {dayHour.periods.map((period, periodIndex) => (
                        <div key={periodIndex} className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={period.start_time}
                            onChange={(e) => updatePeriod(index, periodIndex, 'start_time', e.target.value)}
                            className="w-28 bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))]"
                          />
                          <span className="text-[hsl(var(--avivar-muted-foreground))]">até</span>
                          <Input
                            type="time"
                            value={period.end_time}
                            onChange={(e) => updatePeriod(index, periodIndex, 'end_time', e.target.value)}
                            className="w-28 bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))]"
                          />
                          {dayHour.periods.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removePeriod(index, periodIndex)}
                              className="h-8 w-8 text-[hsl(var(--avivar-destructive))] hover:text-[hsl(var(--avivar-destructive))] hover:bg-[hsl(var(--avivar-destructive)/0.1)]"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          {periodIndex === dayHour.periods.length - 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => addPeriod(index)}
                              className="h-8 w-8 text-[hsl(var(--avivar-primary))] hover:text-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary)/0.1)]"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {!dayHour.is_enabled && (
                    <span className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                      Não atende
                    </span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))]">
              <CardHeader>
                <CardTitle className="text-[hsl(var(--avivar-foreground))]">
                  Configurações Gerais
                </CardTitle>
                <CardDescription>
                  Defina parâmetros básicos da agenda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="professional_name">Nome do Profissional</Label>
                  <Input
                    id="professional_name"
                    value={config.professional_name}
                    onChange={(e) => setConfig(prev => ({ ...prev, professional_name: e.target.value }))}
                    placeholder="Dr. João Silva"
                    className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="consultation_duration">Duração da Consulta (minutos)</Label>
                  <Select
                    value={String(config.consultation_duration)}
                    onValueChange={(value) => setConfig(prev => ({ ...prev, consultation_duration: Number(value) }))}
                  >
                    <SelectTrigger className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutos</SelectItem>
                      <SelectItem value="20">20 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="45">45 minutos</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                      <SelectItem value="90">1h30</SelectItem>
                      <SelectItem value="120">2 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="buffer_between">Intervalo Entre Consultas (minutos)</Label>
                  <Select
                    value={String(config.buffer_between)}
                    onValueChange={(value) => setConfig(prev => ({ ...prev, buffer_between: Number(value) }))}
                  >
                    <SelectTrigger className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sem intervalo</SelectItem>
                      <SelectItem value="5">5 minutos</SelectItem>
                      <SelectItem value="10">10 minutos</SelectItem>
                      <SelectItem value="15">15 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))]">
              <CardHeader>
                <CardTitle className="text-[hsl(var(--avivar-foreground))]">
                  Regras de Agendamento
                </CardTitle>
                <CardDescription>
                  Configure restrições para novos agendamentos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="min_advance_hours">Antecedência Mínima (horas)</Label>
                  <Select
                    value={String(config.min_advance_hours)}
                    onValueChange={(value) => setConfig(prev => ({ ...prev, min_advance_hours: Number(value) }))}
                  >
                    <SelectTrigger className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sem mínimo</SelectItem>
                      <SelectItem value="1">1 hora</SelectItem>
                      <SelectItem value="2">2 horas</SelectItem>
                      <SelectItem value="4">4 horas</SelectItem>
                      <SelectItem value="24">24 horas</SelectItem>
                      <SelectItem value="48">48 horas</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                    Tempo mínimo antes do horário para permitir agendamento
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="advance_booking_days">Máximo de Dias à Frente</Label>
                  <Select
                    value={String(config.advance_booking_days)}
                    onValueChange={(value) => setConfig(prev => ({ ...prev, advance_booking_days: Number(value) }))}
                  >
                    <SelectTrigger className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">1 semana</SelectItem>
                      <SelectItem value="14">2 semanas</SelectItem>
                      <SelectItem value="30">1 mês</SelectItem>
                      <SelectItem value="60">2 meses</SelectItem>
                      <SelectItem value="90">3 meses</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                    Até quando pacientes podem agendar
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <Select
                    value={config.timezone}
                    onValueChange={(value) => setConfig(prev => ({ ...prev, timezone: value }))}
                  >
                    <SelectTrigger className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">Brasília (GMT-3)</SelectItem>
                      <SelectItem value="America/Manaus">Manaus (GMT-4)</SelectItem>
                      <SelectItem value="America/Fortaleza">Fortaleza (GMT-3)</SelectItem>
                      <SelectItem value="America/Cuiaba">Cuiabá (GMT-4)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Blocks Tab */}
        <TabsContent value="blocks" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Add Block */}
            <Card className="border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))]">
              <CardHeader>
                <CardTitle className="text-[hsl(var(--avivar-foreground))]">
                  Adicionar Bloqueio
                </CardTitle>
                <CardDescription>
                  Bloqueie datas ou horários específicos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Popover open={blockDateOpen} onOpenChange={setBlockDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))]",
                          !newBlock.block_date && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {newBlock.block_date
                          ? format(new Date(newBlock.block_date + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                          : "Selecione uma data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarPicker
                        mode="single"
                        selected={newBlock.block_date ? new Date(newBlock.block_date + 'T12:00:00') : undefined}
                        onSelect={(date) => {
                          if (date) {
                            setNewBlock(prev => ({ ...prev, block_date: format(date, 'yyyy-MM-dd') }));
                            setBlockDateOpen(false);
                          }
                        }}
                        locale={ptBR}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hora Início (opcional)</Label>
                    <Input
                      type="time"
                      value={newBlock.start_time || ''}
                      onChange={(e) => setNewBlock(prev => ({ ...prev, start_time: e.target.value || null }))}
                      className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hora Fim (opcional)</Label>
                    <Input
                      type="time"
                      value={newBlock.end_time || ''}
                      onChange={(e) => setNewBlock(prev => ({ ...prev, end_time: e.target.value || null }))}
                      className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))]"
                    />
                  </div>
                </div>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                  Deixe em branco para bloquear o dia inteiro
                </p>

                <div className="space-y-2">
                  <Label>Motivo (opcional)</Label>
                  <Textarea
                    value={newBlock.reason || ''}
                    onChange={(e) => setNewBlock(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Férias, feriado, compromisso..."
                    className="bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))]"
                    rows={2}
                  />
                </div>

                <Button
                  className="w-full bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white"
                  onClick={() => addBlockMutation.mutate(newBlock)}
                  disabled={!newBlock.block_date || addBlockMutation.isPending}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Bloqueio
                </Button>
              </CardContent>
            </Card>

            {/* Existing Blocks */}
            <Card className="border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))]">
              <CardHeader>
                <CardTitle className="text-[hsl(var(--avivar-foreground))]">
                  Bloqueios Ativos
                </CardTitle>
                <CardDescription>
                  {blocks.length === 0 
                    ? "Nenhum bloqueio configurado"
                    : `${blocks.length} bloqueio(s) ativo(s)`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {blocks.length === 0 ? (
                  <div className="text-center py-8 text-[hsl(var(--avivar-muted-foreground))]">
                    <Lock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum bloqueio configurado</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {blocks.map((block) => (
                      <div
                        key={block.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-muted))]"
                      >
                        <div>
                          <p className="font-medium text-[hsl(var(--avivar-foreground))]">
                            {format(new Date(block.block_date + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                          <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                            {block.start_time && block.end_time
                              ? `${block.start_time} - ${block.end_time}`
                              : 'Dia inteiro'
                            }
                          </p>
                          {block.reason && (
                            <Badge variant="secondary" className="mt-1">
                              {block.reason}
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => block.id && deleteBlockMutation.mutate(block.id)}
                          disabled={deleteBlockMutation.isPending}
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
