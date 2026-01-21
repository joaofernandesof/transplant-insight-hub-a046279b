import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';

export type TriageStatus = 'em_espera' | 'nao_precisa' | 'triado' | 'urgente';
export type MoodStatus = 'calmo' | 'ansioso' | 'irritado' | 'tranquilo';

export interface WaitingPatient {
  id: string;
  appointment_id?: string;
  patient_id?: string;
  patient_name: string;
  patient_phone?: string;
  scheduled_time?: string;
  arrival_time: string;
  type: string;
  doctor_name?: string;
  room?: string;
  status: 'arrived' | 'waiting' | 'called' | 'in_service' | 'completed';
  priority: 'normal' | 'high' | 'urgent';
  triage: TriageStatus;
  mood: MoodStatus;
  observations?: string;
  called_at?: string;
  service_started_at?: string;
  service_ended_at?: string;
  branch?: string;
  created_at: string;
  updated_at: string;
}

export interface AddToWaitingRoom {
  patient_name: string;
  scheduled_time?: string;
  type: string;
  doctor_name?: string;
  priority?: 'normal' | 'high' | 'urgent';
  triage?: TriageStatus;
  mood?: MoodStatus;
  branch?: string;
  appointment_id?: string;
}

export function useNeoTeamWaitingRoom(branch?: string) {
  const [patients, setPatients] = useState<WaitingPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchPatients = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      let query = supabase
        .from('neoteam_waiting_room')
        .select('*')
        .gte('arrival_time', `${today}T00:00:00`)
        .lte('arrival_time', `${today}T23:59:59`)
        .neq('status', 'completed')
        .order('priority', { ascending: false })
        .order('arrival_time', { ascending: true });

      if (branch) {
        query = query.eq('branch', branch);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPatients((data as WaitingPatient[]) || []);
    } catch (error) {
      console.error('Error fetching waiting room:', error);
    } finally {
      setIsLoading(false);
    }
  }, [branch]);

  // Subscribe to realtime updates
  useEffect(() => {
    fetchPatients();

    const channel = supabase
      .channel('neoteam-waiting-room-realtime')
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
            const newPatient = payload.new as WaitingPatient;
            // Only add if matches current branch filter
            if (!branch || newPatient.branch === branch) {
              setPatients((prev) => {
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
                description: `${newPatient.patient_name} chegou na recepção`,
              });
            }
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
  }, [fetchPatients, toast, branch]);

  const addToWaitingRoom = async (patient: AddToWaitingRoom) => {
    try {
      const { data, error } = await supabase
        .from('neoteam_waiting_room')
        .insert([{
          ...patient,
          status: 'arrived',
          priority: patient.priority || 'normal',
          triage: patient.triage || 'em_espera',
          mood: patient.mood || 'calmo',
          branch: patient.branch || 'matriz',
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Paciente Adicionado',
        description: `${patient.patient_name} foi adicionado à fila de espera`,
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

  const updatePatient = async (id: string, updates: Partial<WaitingPatient>) => {
    try {
      const { error } = await supabase
        .from('neoteam_waiting_room')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating patient:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateTriage = async (id: string, triage: TriageStatus) => {
    return updatePatient(id, { triage });
  };

  const updateMood = async (id: string, mood: MoodStatus) => {
    return updatePatient(id, { mood });
  };

  const updateObservations = async (id: string, observations: string) => {
    return updatePatient(id, { observations });
  };

  const updateType = async (id: string, type: string) => {
    return updatePatient(id, { type });
  };

  const callPatient = async (id: string, room?: string, notifyWhatsApp = true) => {
    try {
      // Get patient data first for WhatsApp notification
      const patient = patients.find(p => p.id === id);
      
      const { error } = await supabase
        .from('neoteam_waiting_room')
        .update({
          status: 'called',
          called_at: new Date().toISOString(),
          room: room,
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Paciente Chamado',
        description: room ? `Direcionado para ${room}` : 'Aguardando direcionamento',
      });

      // Send WhatsApp notification if patient has phone
      if (notifyWhatsApp && patient?.patient_phone) {
        try {
          const response = await supabase.functions.invoke('notify-patient-called', {
            body: {
              patient_name: patient.patient_name,
              patient_phone: patient.patient_phone,
              room: room,
              doctor_name: patient.doctor_name,
              branch: patient.branch,
            },
          });

          if (response.data?.success) {
            toast({
              title: 'WhatsApp Enviado',
              description: `Notificação enviada para ${patient.patient_name}`,
            });
          }
        } catch (whatsappError) {
          console.log('WhatsApp notification failed:', whatsappError);
          // Don't throw - WhatsApp failure shouldn't block the call
        }
      }
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
        .filter(p => ['arrived', 'waiting', 'called'].includes(p.status))
        .reduce((acc, p) => {
          const wait = (Date.now() - new Date(p.arrival_time).getTime()) / 60000;
          return acc + wait;
        }, 0) / Math.max(1, patients.filter(p => ['arrived', 'waiting', 'called'].includes(p.status)).length)
    ),
  };

  return {
    patients,
    isLoading,
    stats,
    addToWaitingRoom,
    updatePatient,
    updateTriage,
    updateMood,
    updateObservations,
    updateType,
    callPatient,
    startService,
    completeService,
    removeFromWaitingRoom,
    refetch: fetchPatients,
  };
}
