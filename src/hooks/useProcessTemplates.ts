import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';

export interface ProcessTemplate {
  id: string;
  name: string;
  description: string | null;
  status: string;
  category: string | null;
  icon: string;
  color: string;
  branch_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  steps_count?: number;
  instances_count?: number;
  completion_rate?: number;
}

export interface ProcessStep {
  id: string;
  template_id: string;
  name: string;
  description: string | null;
  step_type: string;
  responsible_role: string | null;
  responsible_user_id: string | null;
  relative_day: number | null;
  duration_hours: number;
  order_index: number;
  is_required: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  dependencies?: string[];
}

export interface ProcessInstance {
  id: string;
  template_id: string;
  surgery_id: string | null;
  patient_name: string | null;
  status: string;
  started_at: string;
  completed_at: string | null;
  created_by: string;
  created_at: string;
  template?: ProcessTemplate;
  steps?: ProcessInstanceStep[];
}

export interface ProcessInstanceStep {
  id: string;
  instance_id: string;
  step_id: string;
  status: string;
  assigned_to: string | null;
  due_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  completed_by: string | null;
  notes: string | null;
  step?: ProcessStep;
}

// ==========================================
// Hook: useProcessTemplates
// ==========================================
export function useProcessTemplates() {
  const queryClient = useQueryClient();
  const { user } = useUnifiedAuth();

  const templatesQuery = useQuery({
    queryKey: ['process-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neoteam_process_templates')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Get step counts
      const templateIds = (data || []).map((t: any) => t.id);
      if (templateIds.length === 0) return [];

      const { data: steps } = await supabase
        .from('neoteam_process_steps')
        .select('template_id')
        .in('template_id', templateIds);

      const { data: instances } = await supabase
        .from('neoteam_process_instances')
        .select('template_id, status')
        .in('template_id', templateIds);

      const stepCounts: Record<string, number> = {};
      const instanceCounts: Record<string, number> = {};
      const completionRates: Record<string, number> = {};

      (steps || []).forEach((s: any) => {
        stepCounts[s.template_id] = (stepCounts[s.template_id] || 0) + 1;
      });

      (instances || []).forEach((i: any) => {
        instanceCounts[i.template_id] = (instanceCounts[i.template_id] || 0) + 1;
      });

      const completedInstances: Record<string, number> = {};
      (instances || []).forEach((i: any) => {
        if (i.status === 'completed') {
          completedInstances[i.template_id] = (completedInstances[i.template_id] || 0) + 1;
        }
      });

      templateIds.forEach((id: string) => {
        const total = instanceCounts[id] || 0;
        const completed = completedInstances[id] || 0;
        completionRates[id] = total > 0 ? Math.round((completed / total) * 100) : 0;
      });

      return (data || []).map((t: any) => ({
        ...t,
        steps_count: stepCounts[t.id] || 0,
        instances_count: instanceCounts[t.id] || 0,
        completion_rate: completionRates[t.id] || 0,
      })) as ProcessTemplate[];
    },
  });

  const createTemplate = useMutation({
    mutationFn: async (data: { name: string; description?: string; category?: string; color?: string; branch_id?: string }) => {
      const { data: result, error } = await supabase
        .from('neoteam_process_templates')
        .insert({
          name: data.name,
          description: data.description || null,
          category: data.category || null,
          color: data.color || '#3B82F6',
          branch_id: data.branch_id || null,
          status: 'draft',
          created_by: user?.authUserId || '',
        })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['process-templates'] });
      queryClient.invalidateQueries({ queryKey: ['sidebar-process-templates'] });
      toast.success('Fluxo criado com sucesso.');
    },
    onError: () => toast.error('Erro ao criar fluxo.'),
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; description?: string; status?: string; category?: string; color?: string; branch_id?: string | null }) => {
      const { error } = await supabase
        .from('neoteam_process_templates')
        .update({ ...data, updated_by: user?.authUserId || '' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['process-templates'] });
      queryClient.invalidateQueries({ queryKey: ['sidebar-process-templates'] });
      toast.success('Fluxo atualizado.');
    },
    onError: () => toast.error('Erro ao atualizar fluxo.'),
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('neoteam_process_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['process-templates'] });
      queryClient.invalidateQueries({ queryKey: ['sidebar-process-templates'] });
      toast.success('Fluxo removido.');
    },
    onError: () => toast.error('Erro ao remover fluxo.'),
  });

  return {
    templates: templatesQuery.data || [],
    isLoading: templatesQuery.isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}

// ==========================================
// Hook: useProcessSteps
// ==========================================
export function useProcessSteps(templateId: string | undefined) {
  const queryClient = useQueryClient();

  const stepsQuery = useQuery({
    queryKey: ['process-steps', templateId],
    queryFn: async () => {
      if (!templateId) return [];
      const { data, error } = await supabase
        .from('neoteam_process_steps')
        .select('*')
        .eq('template_id', templateId)
        .order('order_index');
      if (error) throw error;

      // Get dependencies
      const stepIds = (data || []).map((s: any) => s.id);
      const { data: deps } = await supabase
        .from('neoteam_process_step_deps')
        .select('*')
        .in('step_id', stepIds.length > 0 ? stepIds : ['__none__']);

      const depMap: Record<string, string[]> = {};
      (deps || []).forEach((d: any) => {
        if (!depMap[d.step_id]) depMap[d.step_id] = [];
        depMap[d.step_id].push(d.depends_on_step_id);
      });

      return (data || []).map((s: any) => ({
        ...s,
        dependencies: depMap[s.id] || [],
      })) as ProcessStep[];
    },
    enabled: !!templateId,
  });

  const createStep = useMutation({
    mutationFn: async (data: Partial<ProcessStep> & { template_id: string; name: string }) => {
      const maxOrder = stepsQuery.data?.length || 0;
      const { data: result, error } = await supabase
        .from('neoteam_process_steps')
        .insert({
          template_id: data.template_id,
          name: data.name,
          description: data.description || null,
          step_type: data.step_type || 'manual',
          responsible_role: data.responsible_role || null,
          responsible_user_id: data.responsible_user_id || null,
          relative_day: data.relative_day ?? null,
          duration_hours: data.duration_hours || 24,
          order_index: data.order_index ?? maxOrder,
          is_required: data.is_required ?? true,
        })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['process-steps', templateId] });
      toast.success('Etapa adicionada.');
    },
    onError: () => toast.error('Erro ao adicionar etapa.'),
  });

  const updateStep = useMutation({
    mutationFn: async ({ id, ...data }: Partial<ProcessStep> & { id: string }) => {
      const { error } = await supabase
        .from('neoteam_process_steps')
        .update(data as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['process-steps', templateId] });
    },
    onError: () => toast.error('Erro ao atualizar etapa.'),
  });

  const deleteStep = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('neoteam_process_steps')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['process-steps', templateId] });
      toast.success('Etapa removida.');
    },
    onError: () => toast.error('Erro ao remover etapa.'),
  });

  const reorderSteps = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) =>
        supabase.from('neoteam_process_steps').update({ order_index: index }).eq('id', id)
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['process-steps', templateId] });
    },
  });

  const updateDependencies = useMutation({
    mutationFn: async ({ stepId, dependsOn }: { stepId: string; dependsOn: string[] }) => {
      // Remove existing
      await supabase.from('neoteam_process_step_deps').delete().eq('step_id', stepId);
      // Add new
      if (dependsOn.length > 0) {
        const { error } = await supabase
          .from('neoteam_process_step_deps')
          .insert(dependsOn.map(d => ({ step_id: stepId, depends_on_step_id: d })));
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['process-steps', templateId] });
    },
  });

  return {
    steps: stepsQuery.data || [],
    isLoading: stepsQuery.isLoading,
    createStep,
    updateStep,
    deleteStep,
    reorderSteps,
    updateDependencies,
  };
}

// ==========================================
// Hook: useProcessInstances
// ==========================================
export function useProcessInstances(surgeryId?: string) {
  const queryClient = useQueryClient();
  const { user } = useUnifiedAuth();

  const instancesQuery = useQuery({
    queryKey: ['process-instances', surgeryId],
    queryFn: async () => {
      let query = supabase
        .from('neoteam_process_instances')
        .select('*, neoteam_process_templates(*)')
        .order('created_at', { ascending: false });

      if (surgeryId) {
        query = query.eq('surgery_id', surgeryId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((i: any) => ({
        ...i,
        template: i.neoteam_process_templates,
      })) as ProcessInstance[];
    },
  });

  const createInstance = useMutation({
    mutationFn: async (data: { template_id: string; surgery_id?: string; patient_name?: string }) => {
      // Create instance
      const { data: instance, error } = await supabase
        .from('neoteam_process_instances')
        .insert({
          template_id: data.template_id,
          surgery_id: data.surgery_id || null,
          patient_name: data.patient_name || null,
          created_by: user?.authUserId || '',
        })
        .select()
        .single();
      if (error) throw error;

      // Get template steps
      const { data: steps } = await supabase
        .from('neoteam_process_steps')
        .select('*')
        .eq('template_id', data.template_id)
        .order('order_index');

      // Create instance steps
      if (steps && steps.length > 0) {
        const instanceSteps = steps.map((s: any) => ({
          instance_id: instance.id,
          step_id: s.id,
          status: 'pending',
          assigned_to: s.responsible_user_id || null,
        }));
        await supabase.from('neoteam_process_instance_steps').insert(instanceSteps);
      }

      return instance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['process-instances'] });
      toast.success('Processo iniciado.');
    },
    onError: () => toast.error('Erro ao iniciar processo.'),
  });

  return {
    instances: instancesQuery.data || [],
    isLoading: instancesQuery.isLoading,
    createInstance,
  };
}

// ==========================================
// Hook: useProcessInstanceSteps
// ==========================================
export function useProcessInstanceSteps(instanceId: string | undefined) {
  const queryClient = useQueryClient();

  const stepsQuery = useQuery({
    queryKey: ['process-instance-steps', instanceId],
    queryFn: async () => {
      if (!instanceId) return [];
      const { data, error } = await supabase
        .from('neoteam_process_instance_steps')
        .select('*, neoteam_process_steps(*)')
        .eq('instance_id', instanceId)
        .order('created_at');
      if (error) throw error;

      return (data || []).map((s: any) => ({
        ...s,
        step: s.neoteam_process_steps,
      })) as ProcessInstanceStep[];
    },
    enabled: !!instanceId,
  });

  const updateStepStatus = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const updates: Record<string, unknown> = { status };
      if (status === 'in_progress') updates.started_at = new Date().toISOString();
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }
      if (notes !== undefined) updates.notes = notes;

      const { error } = await supabase
        .from('neoteam_process_instance_steps')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['process-instance-steps', instanceId] });
      queryClient.invalidateQueries({ queryKey: ['process-instances'] });
    },
  });

  return {
    steps: stepsQuery.data || [],
    isLoading: stepsQuery.isLoading,
    updateStepStatus,
  };
}
