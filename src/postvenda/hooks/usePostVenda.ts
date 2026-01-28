import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

// Types
export type ChamadoStatus = 'aberto' | 'em_andamento' | 'aguardando_paciente' | 'resolvido' | 'fechado' | 'reaberto' | 'cancelado';
export type ChamadoPrioridade = 'baixa' | 'normal' | 'alta' | 'urgente';
export type ChamadoEtapa = 'triagem' | 'atendimento' | 'resolucao' | 'validacao_paciente' | 'nps' | 'encerrado';

export interface Chamado {
  id: string;
  numero_chamado: number;
  paciente_id?: string;
  paciente_nome: string;
  paciente_telefone?: string;
  paciente_email?: string;
  procedimento_id?: string;
  tipo_demanda: string;
  prioridade: ChamadoPrioridade;
  canal_origem: string;
  status: ChamadoStatus;
  etapa_atual: ChamadoEtapa;
  responsavel_id?: string;
  responsavel_nome?: string;
  sla_id?: string;
  sla_prazo_fim?: string;
  sla_estourado: boolean;
  motivo_abertura?: string;
  resolucao?: string;
  branch?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ChamadoHistorico {
  id: string;
  chamado_id: string;
  etapa: ChamadoEtapa;
  acao: string;
  descricao?: string;
  usuario_id?: string;
  usuario_nome?: string;
  data_evento: string;
  evidencias: any[];
  metadata: Record<string, any>;
}

export interface SlaConfig {
  id: string;
  tipo_demanda: string;
  prioridade: ChamadoPrioridade;
  etapa: ChamadoEtapa;
  tempo_limite_horas: number;
  alerta_previo_min: number;
  escalonamento_auto: boolean;
}

export interface NovoChamado {
  paciente_id?: string;
  paciente_nome: string;
  paciente_telefone?: string;
  paciente_email?: string;
  procedimento_id?: string;
  tipo_demanda: string;
  prioridade?: ChamadoPrioridade;
  canal_origem?: string;
  motivo_abertura?: string;
  branch?: string;
  // Campos específicos de Distrato
  distrato_valor_pago?: number;
  distrato_data_pagamento_sinal?: string;
  distrato_forma_pagamento?: 'online' | 'presencial';
  distrato_termo_sinal_assinado?: boolean;
  distrato_termo_sinal_anexo?: boolean;
  distrato_contrato_assinado?: boolean;
  distrato_contrato_anexo?: boolean;
}

// SLA Status helper
export const getSlaStatus = (chamado: Chamado): 'ok' | 'warning' | 'danger' => {
  if (chamado.sla_estourado) return 'danger';
  if (!chamado.sla_prazo_fim) return 'ok';
  
  const prazo = new Date(chamado.sla_prazo_fim);
  const now = new Date();
  const hoursLeft = (prazo.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursLeft < 0) return 'danger';
  if (hoursLeft < 2) return 'warning';
  return 'ok';
};

export function usePostVenda(filters?: { status?: ChamadoStatus; etapa?: ChamadoEtapa; branch?: string }) {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [slaConfigs, setSlaConfigs] = useState<SlaConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useUnifiedAuth();

  const fetchChamados = useCallback(async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('postvenda_chamados')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.etapa) query = query.eq('etapa_atual', filters.etapa);
      if (filters?.branch) query = query.eq('branch', filters.branch);

      const { data, error } = await query;
      if (error) throw error;
      setChamados((data as unknown as Chamado[]) || []);
    } catch (error) {
      console.error('Erro ao buscar chamados:', error);
      toast({ title: 'Erro', description: 'Não foi possível carregar os chamados', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [filters, toast]);

  const createChamado = async (data: NovoChamado) => {
    try {
      // Get SLA config for this type
      const { data: slaConfig } = await supabase
        .from('postvenda_sla_config')
        .select('*')
        .eq('tipo_demanda', data.tipo_demanda)
        .eq('prioridade', data.prioridade || 'normal')
        .eq('etapa', 'triagem')
        .maybeSingle();

      const slaPrazoFim = slaConfig 
        ? new Date(Date.now() + slaConfig.tempo_limite_horas * 60 * 60 * 1000).toISOString()
        : null;

      // Clean up empty strings to null for database compatibility
      const isDistrato = data.tipo_demanda === 'distrato';
      
      const cleanedData: Record<string, any> = {
        paciente_id: data.paciente_id || null,
        paciente_nome: data.paciente_nome,
        paciente_telefone: data.paciente_telefone || null,
        paciente_email: data.paciente_email || null,
        procedimento_id: data.procedimento_id || null,
        tipo_demanda: data.tipo_demanda,
        prioridade: data.prioridade || 'normal',
        canal_origem: data.canal_origem || 'whatsapp',
        motivo_abertura: data.motivo_abertura || null,
        branch: data.branch || null,
      };
      
      // Campos específicos de Distrato - só incluir se for distrato
      if (isDistrato) {
        cleanedData.distrato_valor_pago = data.distrato_valor_pago || null;
        cleanedData.distrato_data_pagamento_sinal = (data.distrato_data_pagamento_sinal && data.distrato_data_pagamento_sinal.trim() !== '') 
          ? data.distrato_data_pagamento_sinal 
          : null;
        cleanedData.distrato_forma_pagamento = data.distrato_forma_pagamento || null;
        cleanedData.distrato_termo_sinal_assinado = data.distrato_termo_sinal_assinado ?? null;
        cleanedData.distrato_termo_sinal_anexo = data.distrato_termo_sinal_anexo ?? null;
        cleanedData.distrato_contrato_assinado = data.distrato_contrato_assinado ?? null;
        cleanedData.distrato_contrato_anexo = data.distrato_contrato_anexo ?? null;
      }

      // Add required fields for insert
      cleanedData.status = 'aberto';
      cleanedData.etapa_atual = 'triagem';
      cleanedData.sla_id = slaConfig?.id || null;
      cleanedData.sla_prazo_fim = slaPrazoFim;
      cleanedData.created_by = user?.id || null;

      const { data: chamado, error } = await supabase
        .from('postvenda_chamados')
        .insert(cleanedData as any)
        .select()
        .single();

      if (error) throw error;

      // Create initial history entry
      await supabase.from('postvenda_chamado_historico').insert({
        chamado_id: chamado.id,
        etapa: 'triagem',
        acao: 'criacao',
        descricao: 'Chamado criado',
        usuario_id: user?.id,
        usuario_nome: user?.fullName,
      });

      toast({ title: 'Sucesso', description: 'Chamado criado com sucesso' });
      await fetchChamados();
      return chamado as unknown as Chamado;
    } catch (error: any) {
      console.error('Erro ao criar chamado:', error);
      const errorCode = error?.code || 'UNKNOWN';
      const errorMessage = error?.message || 'Erro desconhecido';
      toast({ 
        title: 'Erro', 
        description: `[${errorCode}] ${errorMessage}`, 
        variant: 'destructive' 
      });
      throw error;
    }
  };

  const updateChamado = async (id: string, updates: Partial<Chamado>) => {
    try {
      const { error } = await supabase
        .from('postvenda_chamados')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      setChamados(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    } catch (error) {
      console.error('Erro ao atualizar chamado:', error);
      toast({ title: 'Erro', description: 'Não foi possível atualizar', variant: 'destructive' });
      throw error;
    }
  };

  const avancarEtapa = async (chamadoId: string, novaEtapa: ChamadoEtapa, descricao?: string) => {
    try {
      const chamado = chamados.find(c => c.id === chamadoId);
      if (!chamado) throw new Error('Chamado não encontrado');

      // Get new SLA for the stage
      const { data: slaConfig } = await supabase
        .from('postvenda_sla_config')
        .select('*')
        .eq('tipo_demanda', chamado.tipo_demanda)
        .eq('prioridade', chamado.prioridade)
        .eq('etapa', novaEtapa)
        .maybeSingle();

      const slaPrazoFim = slaConfig 
        ? new Date(Date.now() + slaConfig.tempo_limite_horas * 60 * 60 * 1000).toISOString()
        : chamado.sla_prazo_fim;

      const newStatus: ChamadoStatus = novaEtapa === 'encerrado' ? 'fechado' : 
                                        novaEtapa === 'validacao_paciente' ? 'aguardando_paciente' : 'em_andamento';

      // Update chamado
      await supabase.from('postvenda_chamados').update({
        etapa_atual: novaEtapa,
        status: newStatus,
        sla_id: slaConfig?.id || chamado.sla_id,
        sla_prazo_fim: slaPrazoFim,
        sla_estourado: false,
      }).eq('id', chamadoId);

      // Create history entry
      await supabase.from('postvenda_chamado_historico').insert({
        chamado_id: chamadoId,
        etapa: novaEtapa,
        acao: 'transicao_etapa',
        descricao: descricao || `Chamado avançou para ${novaEtapa}`,
        usuario_id: user?.id,
        usuario_nome: user?.fullName,
      });

      toast({ title: 'Sucesso', description: `Chamado avançou para ${novaEtapa}` });
      await fetchChamados();
    } catch (error) {
      console.error('Erro ao avançar etapa:', error);
      toast({ title: 'Erro', description: 'Não foi possível avançar a etapa', variant: 'destructive' });
      throw error;
    }
  };

  const addHistorico = async (chamadoId: string, acao: string, descricao?: string, evidencias?: any[]) => {
    try {
      const chamado = chamados.find(c => c.id === chamadoId);
      
      await supabase.from('postvenda_chamado_historico').insert({
        chamado_id: chamadoId,
        etapa: chamado?.etapa_atual || 'triagem',
        acao,
        descricao,
        evidencias: evidencias || [],
        usuario_id: user?.id,
        usuario_nome: user?.fullName,
      });

      toast({ title: 'Sucesso', description: 'Registro adicionado ao histórico' });
    } catch (error) {
      console.error('Erro ao adicionar histórico:', error);
      toast({ title: 'Erro', description: 'Não foi possível adicionar ao histórico', variant: 'destructive' });
    }
  };

  // Realtime subscription
  useEffect(() => {
    fetchChamados();

    const channel = supabase
      .channel('postvenda_chamados_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'postvenda_chamados' }, () => fetchChamados())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchChamados]);

  // Stats
  const stats = useMemo(() => {
    const total = chamados.length;
    const byEtapa = chamados.reduce((acc, c) => {
      acc[c.etapa_atual] = (acc[c.etapa_atual] || 0) + 1;
      return acc;
    }, {} as Record<ChamadoEtapa, number>);

    const slaEstourados = chamados.filter(c => c.sla_estourado).length;
    const slaOk = chamados.filter(c => getSlaStatus(c) === 'ok').length;
    const slaWarning = chamados.filter(c => getSlaStatus(c) === 'warning').length;

    return { total, byEtapa, slaEstourados, slaOk, slaWarning };
  }, [chamados]);

  return {
    chamados,
    isLoading,
    stats,
    createChamado,
    updateChamado,
    avancarEtapa,
    addHistorico,
    refetch: fetchChamados,
  };
}

// Hook para histórico de um chamado específico
export function useChamadoHistorico(chamadoId: string | undefined) {
  const [historico, setHistorico] = useState<ChamadoHistorico[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!chamadoId) return;

    const fetchHistorico = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('postvenda_chamado_historico')
        .select('*')
        .eq('chamado_id', chamadoId)
        .order('data_evento', { ascending: true });

      if (!error) setHistorico((data as unknown as ChamadoHistorico[]) || []);
      setIsLoading(false);
    };

    fetchHistorico();

    const channel = supabase
      .channel(`historico_${chamadoId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'postvenda_chamado_historico',
        filter: `chamado_id=eq.${chamadoId}`
      }, () => fetchHistorico())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [chamadoId]);

  return { historico, isLoading };
}

// Hook para NPS
export function usePostVendaNps() {
  const { toast } = useToast();

  const enviarNps = async (chamadoId: string, canalEnvio: string = 'whatsapp') => {
    try {
      await supabase.from('postvenda_nps').insert({
        chamado_id: chamadoId,
        canal_envio: canalEnvio,
      });
      toast({ title: 'Sucesso', description: 'NPS enviado ao paciente' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível enviar NPS', variant: 'destructive' });
    }
  };

  const registrarResposta = async (chamadoId: string, nota: number, comentario?: string) => {
    try {
      await supabase.from('postvenda_nps')
        .update({ nota, comentario, respondido_em: new Date().toISOString() })
        .eq('chamado_id', chamadoId);
      toast({ title: 'Sucesso', description: 'Resposta NPS registrada' });
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível registrar resposta', variant: 'destructive' });
    }
  };

  return { enviarNps, registrarResposta };
}
