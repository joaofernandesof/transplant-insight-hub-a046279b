/**
 * Hook for managing patient journeys with blocking rules
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  PatientJourney, 
  JourneyStage, 
  JourneyType,
  COMMERCIAL_STAGES,
  POST_SALE_STAGES,
  StageConfig,
  ChecklistItem
} from '../types';

export function usePatientJourneys(journeyType?: JourneyType) {
  const queryClient = useQueryClient();

  const { data: journeys = [], isLoading, error } = useQuery({
    queryKey: ['avivar-journeys', journeyType],
    queryFn: async () => {
      let query = supabase
        .from('avivar_patient_journeys')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (journeyType) {
        query = query.eq('journey_type', journeyType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PatientJourney[];
    }
  });

  const createJourney = useMutation({
    mutationFn: async (journey: Partial<PatientJourney>) => {
      const { data, error } = await supabase
        .from('avivar_patient_journeys')
        .insert({
          patient_name: journey.patient_name || 'Novo Lead',
          service_type: journey.service_type || 'capilar',
          current_stage: journey.current_stage || 'lead_entrada',
          journey_type: journey.journey_type || journeyType || 'comercial',
          patient_phone: journey.patient_phone,
          patient_email: journey.patient_email,
          lead_source: journey.lead_source,
          notes: journey.notes,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avivar-journeys'] });
      toast.success('Lead criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar lead: ' + error.message);
    }
  });

  const updateJourney = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PatientJourney> }) => {
      const { data, error } = await supabase
        .from('avivar_patient_journeys')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avivar-journeys'] });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    }
  });

  return {
    journeys,
    isLoading,
    error,
    createJourney,
    updateJourney
  };
}

// Check if a stage's checklist is complete
export function isStageComplete(journey: PatientJourney, stageConfig: StageConfig): boolean {
  return stageConfig.checklist
    .filter(item => item.required)
    .every(item => {
      const value = journey[item.field];
      if (typeof value === 'boolean') return value === true;
      if (typeof value === 'number') return value > 0;
      if (typeof value === 'string') return value && value.trim().length > 0;
      return !!value;
    });
}

// Get completion percentage for a stage
export function getStageProgress(journey: PatientJourney, stageConfig: StageConfig): number {
  const requiredItems = stageConfig.checklist.filter(item => item.required);
  if (requiredItems.length === 0) return 100;

  const completed = requiredItems.filter(item => {
    const value = journey[item.field];
    if (typeof value === 'boolean') return value === true;
    if (typeof value === 'number') return value > 0;
    if (typeof value === 'string') return value && value.trim().length > 0;
    return !!value;
  }).length;

  return Math.round((completed / requiredItems.length) * 100);
}

// Get next stage in the flow
export function getNextStage(currentStage: JourneyStage, journeyType: JourneyType): JourneyStage | null {
  const stages = journeyType === 'comercial' ? COMMERCIAL_STAGES : POST_SALE_STAGES;
  const currentIndex = stages.findIndex(s => s.id === currentStage);
  
  if (currentIndex === -1 || currentIndex === stages.length - 1) {
    // If at the end of commercial, transition to post-sale
    if (journeyType === 'comercial' && currentStage === 'paciente') {
      return 'onboarding';
    }
    return null;
  }
  
  return stages[currentIndex + 1].id;
}

// Get previous stage in the flow
export function getPreviousStage(currentStage: JourneyStage, journeyType: JourneyType): JourneyStage | null {
  const stages = journeyType === 'comercial' ? COMMERCIAL_STAGES : POST_SALE_STAGES;
  const currentIndex = stages.findIndex(s => s.id === currentStage);
  
  if (currentIndex <= 0) return null;
  
  return stages[currentIndex - 1].id;
}

// Get stage config
export function getStageConfig(stage: JourneyStage): StageConfig | undefined {
  return [...COMMERCIAL_STAGES, ...POST_SALE_STAGES].find(s => s.id === stage);
}

// Check if can advance to next stage
export function canAdvanceStage(journey: PatientJourney): { canAdvance: boolean; message?: string } {
  const stageConfig = getStageConfig(journey.current_stage);
  if (!stageConfig) return { canAdvance: false, message: 'Etapa não encontrada' };

  const isComplete = isStageComplete(journey, stageConfig);
  if (!isComplete) {
    return { canAdvance: false, message: stageConfig.blockingMessage };
  }

  return { canAdvance: true };
}
