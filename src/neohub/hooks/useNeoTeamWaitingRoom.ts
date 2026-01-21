import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface WaitingPatient {
  id: string;
  appointment_id?: string;
  patient_id?: string;
  patient_name: string;
  appointment_time?: string;
  arrival_time: string;
  type: string;
  doctor_name?: string;
  room?: string;
  status: 'arrived' | 'waiting' | 'called' | 'in_service' | 'completed';
  priority: 'normal' | 'high' | 'urgent';
  called_at?: string;
  service_started_at?: string;
  service_ended_at?: string;
  branch?: string;
  created_at: string;
  updated_at: string;
}

export interface AddToWaitingRoom {
  patient_name: string;
  appointment_time?: string;
  type: string;
  doctor_name?: string;
  priority?: 'normal' | 'high' | 'urgent';
  appointment_id?: string;
}

export function useNeoTeamWaitingRoom() {
  const [patients, setPatients] = useState<WaitingPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchPatients = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('neoteam_waiting_room')
        .select('*')
        .gte('arrival_time', `${today}T00:00:00`)
        .lte('arrival_time', `${today}T23:59:59`)
        .neq('status', 'completed')
        .order('priority', { ascending: false })
        .order('arrival_time', { ascending: true });

      if (error) throw error;
      setPatients((data as WaitingPatient[]) || []);
    } catch (error) {
      console.error('Error fetching waiting room:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Subscribe to realtime updates
  useEffect(() => {
    fetchPatients();

    const channel = supabase
      .channel('neoteam-waiting-room-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'neoteam_waiting_room',
        },
        (payload) => {
          console.log('Waiting room change:', payload);
          
          if (payload.eventType === 'INSERT') {
            setPatients((prev) => {
              const newPatient = payload.new as WaitingPatient;
              // Sort by priority and arrival time
              const updated = [...prev, newPatient].sort((a, b) => {
                const priorityOrder = { urgent: 0, high: 1, normal: 2 };
                const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
                if (priorityDiff !== 0) return priorityDiff;
                return new Date(a.arrival_time).getTime() - new Date(b.arrival_time).getTime();
              });
              return updated;
            });
            
            toast({
              title: 'Novo Paciente',
              description: `${(payload.new as WaitingPatient).patient_name} chegou na recepção`,
            });
          } else if (payload.eventType === 'UPDATE') {
            setPatients((prev) =>
              prev.map((p) =>
                p.id === payload.new.id ? (payload.new as WaitingPatient) : p
              ).filter(p => p.status !== 'completed')
            );
          } else if (payload.eventType === 'DELETE') {
            setPatients((prev) =>
              prev.filter((p) => p.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPatients, toast]);

  const addToWaitingRoom = async (patient: AddToWaitingRoom) => {
    try {
      const { data, error } = await supabase
        .from('neoteam_waiting_room')
        .insert([{
          ...patient,
          status: 'arrived',
          priority: patient.priority || 'normal',
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Paciente Adicionado',
        description: `${patient.patient_name} foi adicionado à sala de espera`,
      });

      return data as WaitingPatient;
    } catch (error) {
      console.error('Error adding to waiting room:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o paciente',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const callPatient = async (id: string, room?: string) => {
    try {
      const { error } = await supabase
        .from('neoteam_waiting_room')
        .update({
          status: 'called',
          called_at: new Date().toISOString(),
          room: room,
        })
        .eq('id', id);

      if (error) throw error;

      // Play notification sound
      try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.play().catch(() => {});
      } catch {}

      toast({
        title: 'Paciente Chamado',
        description: room ? `Direcionado para ${room}` : 'Aguardando direcionamento',
      });
    } catch (error) {
      console.error('Error calling patient:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível chamar o paciente',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const startService = async (id: string, room: string) => {
    try {
      const { error } = await supabase
        .from('neoteam_waiting_room')
        .update({
          status: 'in_service',
          room: room,
          service_started_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Atendimento Iniciado',
        description: `Atendimento iniciado na ${room}`,
      });
    } catch (error) {
      console.error('Error starting service:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível iniciar o atendimento',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const completeService = async (id: string) => {
    try {
      const { error } = await supabase
        .from('neoteam_waiting_room')
        .update({
          status: 'completed',
          service_ended_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Atendimento Concluído',
        description: 'Paciente liberado',
      });
    } catch (error) {
      console.error('Error completing service:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível finalizar o atendimento',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const removeFromWaitingRoom = async (id: string) => {
    try {
      const { error } = await supabase
        .from('neoteam_waiting_room')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Removido',
        description: 'Paciente removido da fila',
      });
    } catch (error) {
      console.error('Error removing from waiting room:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o paciente',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updatePriority = async (id: string, priority: 'normal' | 'high' | 'urgent') => {
    try {
      const { error } = await supabase
        .from('neoteam_waiting_room')
        .update({ priority })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Prioridade Atualizada',
        description: `Prioridade alterada para ${priority === 'urgent' ? 'urgente' : priority === 'high' ? 'alta' : 'normal'}`,
      });
    } catch (error) {
      console.error('Error updating priority:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a prioridade',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Stats
  const stats = {
    waiting: patients.filter(p => ['arrived', 'waiting'].includes(p.status)).length,
    called: patients.filter(p => p.status === 'called').length,
    inService: patients.filter(p => p.status === 'in_service').length,
    avgWaitTime: Math.round(
      patients
        .filter(p => ['waiting', 'called'].includes(p.status))
        .reduce((acc, p) => {
          const wait = (Date.now() - new Date(p.arrival_time).getTime()) / 60000;
          return acc + wait;
        }, 0) / Math.max(1, patients.filter(p => ['waiting', 'called'].includes(p.status)).length)
    ),
  };

  return {
    patients,
    isLoading,
    stats,
    addToWaitingRoom,
    callPatient,
    startService,
    completeService,
    removeFromWaitingRoom,
    updatePriority,
    refetch: fetchPatients,
  };
}
