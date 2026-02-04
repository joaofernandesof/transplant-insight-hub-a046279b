/**
 * Hook para registrar ações no log de atividades do Portal CPG
 * Permite registrar facilmente qualquer ação realizada no sistema
 */

import { supabase } from "@/integrations/supabase/client";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";

export type ActionType = 'create' | 'update' | 'delete' | 'view' | 'login' | 'logout' | 'complete';
export type EntityType = 'client' | 'contract' | 'meeting' | 'task' | 'document' | 'user' | 'settings' | 'onboarding' | 'checklist';

interface LogActivityParams {
  actionType: ActionType;
  entityType: EntityType;
  entityId?: string;
  entityName?: string;
  description: string;
  metadata?: Record<string, any>;
}

export function useActivityLogger() {
  const { user } = useUnifiedAuth();

  const logActivity = async ({
    actionType,
    entityType,
    entityId,
    entityName,
    description,
    metadata = {},
  }: LogActivityParams) => {
    try {
      const { error } = await supabase
        .from('ipromed_activity_logs' as any)
        .insert({
          user_id: user?.id,
          user_name: user?.email?.split('@')[0] || 'Usuário',
          user_email: user?.email,
          action_type: actionType,
          entity_type: entityType,
          entity_id: entityId,
          entity_name: entityName,
          description,
          metadata,
        });

      if (error) {
        console.error('Erro ao registrar atividade:', error);
      }
    } catch (err) {
      console.error('Erro ao registrar atividade:', err);
    }
  };

  // Helpers para ações comuns
  const logClientAction = (action: ActionType, clientId: string, clientName: string, details?: string) => {
    const actionTexts: Record<ActionType, string> = {
      create: `Cadastrou o cliente "${clientName}"`,
      update: `Atualizou dados do cliente "${clientName}"${details ? `: ${details}` : ''}`,
      delete: `Removeu o cliente "${clientName}"`,
      view: `Visualizou o cliente "${clientName}"`,
      login: '',
      logout: '',
      complete: `Concluiu processo do cliente "${clientName}"`,
    };

    return logActivity({
      actionType: action,
      entityType: 'client',
      entityId: clientId,
      entityName: clientName,
      description: actionTexts[action],
    });
  };

  const logContractAction = (action: ActionType, contractId: string, contractName: string, details?: string) => {
    const actionTexts: Record<ActionType, string> = {
      create: `Criou o contrato "${contractName}"`,
      update: `Atualizou o contrato "${contractName}"${details ? `: ${details}` : ''}`,
      delete: `Removeu o contrato "${contractName}"`,
      view: `Visualizou o contrato "${contractName}"`,
      login: '',
      logout: '',
      complete: `Finalizou o contrato "${contractName}"`,
    };

    return logActivity({
      actionType: action,
      entityType: 'contract',
      entityId: contractId,
      entityName: contractName,
      description: actionTexts[action],
    });
  };

  const logMeetingAction = (action: ActionType, meetingId: string, meetingTitle: string, details?: string) => {
    const actionTexts: Record<ActionType, string> = {
      create: `Agendou a reunião "${meetingTitle}"`,
      update: `Atualizou a reunião "${meetingTitle}"${details ? `: ${details}` : ''}`,
      delete: `Cancelou a reunião "${meetingTitle}"`,
      view: `Visualizou a reunião "${meetingTitle}"`,
      login: '',
      logout: '',
      complete: `Concluiu a reunião "${meetingTitle}"`,
    };

    return logActivity({
      actionType: action,
      entityType: 'meeting',
      entityId: meetingId,
      entityName: meetingTitle,
      description: actionTexts[action],
    });
  };

  const logOnboardingAction = (action: ActionType, clientId: string, clientName: string, details?: string) => {
    const actionTexts: Record<ActionType, string> = {
      create: `Iniciou onboarding do cliente "${clientName}"`,
      update: `Atualizou onboarding do cliente "${clientName}"${details ? `: ${details}` : ''}`,
      delete: `Removeu onboarding do cliente "${clientName}"`,
      view: `Visualizou onboarding do cliente "${clientName}"`,
      login: '',
      logout: '',
      complete: `Concluiu onboarding do cliente "${clientName}"`,
    };

    return logActivity({
      actionType: action,
      entityType: 'onboarding',
      entityId: clientId,
      entityName: clientName,
      description: actionTexts[action],
      metadata: { details },
    });
  };

  const logTaskAction = (action: ActionType, taskId: string, taskTitle: string, details?: string) => {
    const actionTexts: Record<ActionType, string> = {
      create: `Criou a tarefa "${taskTitle}"`,
      update: `Atualizou a tarefa "${taskTitle}"${details ? `: ${details}` : ''}`,
      delete: `Removeu a tarefa "${taskTitle}"`,
      view: `Visualizou a tarefa "${taskTitle}"`,
      login: '',
      logout: '',
      complete: `Concluiu a tarefa "${taskTitle}"`,
    };

    return logActivity({
      actionType: action,
      entityType: 'task',
      entityId: taskId,
      entityName: taskTitle,
      description: actionTexts[action],
    });
  };

  return {
    logActivity,
    logClientAction,
    logContractAction,
    logMeetingAction,
    logOnboardingAction,
    logTaskAction,
  };
}
