/**
 * Hooks for Procedure Control Module
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { 
  Procedure, 
  ProcedureKit, 
  StockItem, 
  KitItem,
  ProcedureExecution,
  ConsumptionEntry,
  ClinicStock,
  StockMovement
} from '../types';

// ==================== PROCEDURES ====================

export function useProcedures() {
  return useQuery({
    queryKey: ['procedures'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('procedures')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as Procedure[];
    }
  });
}

export function useProcedure(id: string | undefined) {
  return useQuery({
    queryKey: ['procedure', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('procedures')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Procedure;
    },
    enabled: !!id
  });
}

// ==================== KITS ====================

export function useProcedureKits(procedureId?: string) {
  return useQuery({
    queryKey: ['procedure-kits', procedureId],
    queryFn: async () => {
      let query = supabase
        .from('procedure_kits')
        .select(`
          *,
          procedure:procedures(*)
        `)
        .eq('is_active', true)
        .order('version', { ascending: false });
      
      if (procedureId) {
        query = query.eq('procedure_id', procedureId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as ProcedureKit[];
    }
  });
}

export function useKitWithItems(kitId: string | undefined) {
  return useQuery({
    queryKey: ['kit-with-items', kitId],
    queryFn: async () => {
      if (!kitId) return null;
      
      const { data: kit, error: kitError } = await supabase
        .from('procedure_kits')
        .select(`
          *,
          procedure:procedures(*)
        `)
        .eq('id', kitId)
        .single();
      
      if (kitError) throw kitError;
      
      const { data: items, error: itemsError } = await supabase
        .from('kit_items')
        .select(`
          *,
          stock_item:stock_items(*)
        `)
        .eq('kit_id', kitId)
        .order('order_index');
      
      if (itemsError) throw itemsError;
      
      return { ...kit, kit_items: items } as ProcedureKit;
    },
    enabled: !!kitId
  });
}

// ==================== STOCK ITEMS ====================

export function useStockItems() {
  return useQuery({
    queryKey: ['stock-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_items')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as StockItem[];
    }
  });
}

// ==================== CLINIC STOCK ====================

export function useClinicStock(clinicId: string | undefined) {
  return useQuery({
    queryKey: ['clinic-stock', clinicId],
    queryFn: async () => {
      if (!clinicId) return [];
      
      const { data, error } = await supabase
        .from('clinic_stock')
        .select(`
          *,
          stock_item:stock_items(*)
        `)
        .eq('clinic_id', clinicId);
      
      if (error) throw error;
      return data as ClinicStock[];
    },
    enabled: !!clinicId
  });
}

// ==================== EXECUTIONS ====================

export function useProcedureExecutions(filters?: {
  clinicId?: string;
  status?: string;
  patientId?: string;
}) {
  return useQuery({
    queryKey: ['procedure-executions', filters],
    queryFn: async () => {
      let query = supabase
        .from('procedure_executions')
        .select(`
          *,
          procedure:procedures(*),
          patient:clinic_patients(id, full_name),
          clinic:clinics(id, name)
        `)
        .order('executed_at', { ascending: false })
        .limit(100);
      
      if (filters?.clinicId) {
        query = query.eq('clinic_id', filters.clinicId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status as 'em_andamento' | 'finalizado' | 'cancelado');
      }
      if (filters?.patientId) {
        query = query.eq('patient_id', filters.patientId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as ProcedureExecution[];
    }
  });
}

export function useExecutionWithConsumption(executionId: string | undefined) {
  return useQuery({
    queryKey: ['execution-consumption', executionId],
    queryFn: async () => {
      if (!executionId) return null;
      
      const { data: execution, error: execError } = await supabase
        .from('procedure_executions')
        .select(`
          *,
          procedure:procedures(*),
          patient:clinic_patients(id, full_name),
          clinic:clinics(id, name)
        `)
        .eq('id', executionId)
        .single();
      
      if (execError) throw execError;
      
      const { data: entries, error: entriesError } = await supabase
        .from('consumption_entries')
        .select(`
          *,
          stock_item:stock_items(*)
        `)
        .eq('execution_id', executionId);
      
      if (entriesError) throw entriesError;
      
      // Get photos for each entry
      const entryIds = entries.map(e => e.id);
      const { data: photos } = await supabase
        .from('consumption_photos')
        .select('*')
        .in('consumption_entry_id', entryIds);
      
      const entriesWithPhotos = entries.map(entry => ({
        ...entry,
        photos: photos?.filter(p => p.consumption_entry_id === entry.id) || []
      }));
      
      return { execution, entries: entriesWithPhotos as ConsumptionEntry[] };
    },
    enabled: !!executionId
  });
}

// ==================== STOCK MOVEMENTS ====================

export function useStockMovements(clinicId: string | undefined, limit = 50) {
  return useQuery({
    queryKey: ['stock-movements', clinicId, limit],
    queryFn: async () => {
      if (!clinicId) return [];
      
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          stock_item:stock_items(*)
        `)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data as StockMovement[];
    },
    enabled: !!clinicId
  });
}

// ==================== MUTATIONS ====================

export function useCreateExecution() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      clinic_id: string;
      patient_id?: string;
      procedure_id: string;
      kit_id?: string;
      executed_by: string;
      notes?: string;
    }) => {
      const { data: execution, error } = await supabase
        .from('procedure_executions')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return execution;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedure-executions'] });
      toast.success('Aplicação iniciada com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao iniciar aplicação: ' + error.message);
    }
  });
}

export function useCreateConsumptionEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<ConsumptionEntry> & { execution_id: string; stock_item_id: string; quantity_expected: number; quantity_used: number }) => {
      const { data: entry, error } = await supabase
        .from('consumption_entries')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return entry;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['execution-consumption', variables.execution_id] });
      queryClient.invalidateQueries({ queryKey: ['clinic-stock'] });
    },
    onError: (error) => {
      toast.error('Erro ao registrar consumo: ' + error.message);
    }
  });
}

export function useFinalizeExecution() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (executionId: string) => {
      const { error } = await supabase
        .from('procedure_executions')
        .update({ 
          status: 'finalizado' as const,
          completed_at: new Date().toISOString()
        })
        .eq('id', executionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedure-executions'] });
      toast.success('Aplicação finalizada com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao finalizar aplicação: ' + error.message);
    }
  });
}

export function useApproveDivergence() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ entryId, status, approvedBy }: {
      entryId: string;
      status: 'aprovado' | 'rejeitado';
      approvedBy: string;
    }) => {
      const { error } = await supabase
        .from('consumption_entries')
        .update({ 
          divergence_status: status,
          divergence_approved_by: approvedBy,
          divergence_approved_at: new Date().toISOString()
        })
        .eq('id', entryId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['execution-consumption'] });
      toast.success('Divergência processada');
    },
    onError: (error) => {
      toast.error('Erro ao processar divergência: ' + error.message);
    }
  });
}

export function useAddStockEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      clinic_id: string;
      stock_item_id: string;
      quantity: number;
      unit_cost?: number;
      lot_number?: string;
      expiry_date?: string;
      notes?: string;
      created_by: string;
    }) => {
      // Create movement
      const { error: movError } = await supabase
        .from('stock_movements')
        .insert({
          clinic_id: data.clinic_id,
          stock_item_id: data.stock_item_id,
          movement_type: 'entrada',
          quantity: data.quantity,
          unit_cost: data.unit_cost || 0,
          lot_number: data.lot_number,
          expiry_date: data.expiry_date,
          notes: data.notes,
          created_by: data.created_by
        });
      
      if (movError) throw movError;
      
      // Update stock
      const { data: existing } = await supabase
        .from('clinic_stock')
        .select('*')
        .eq('clinic_id', data.clinic_id)
        .eq('stock_item_id', data.stock_item_id)
        .single();
      
      if (existing) {
        const { error } = await supabase
          .from('clinic_stock')
          .update({ 
            on_hand_qty: existing.on_hand_qty + data.quantity 
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('clinic_stock')
          .insert({
            clinic_id: data.clinic_id,
            stock_item_id: data.stock_item_id,
            on_hand_qty: data.quantity
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-stock'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      toast.success('Entrada de estoque registrada');
    },
    onError: (error) => {
      toast.error('Erro ao registrar entrada: ' + error.message);
    }
  });
}
