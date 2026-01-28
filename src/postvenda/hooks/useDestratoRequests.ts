import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';

// Types
export type DestratoEtapa = 
  | 'solicitacao_recebida'
  | 'checklist_preenchido'
  | 'aguardando_parecer_gerente'
  | 'em_negociacao'
  | 'devolver'
  | 'nao_devolver'
  | 'aguardando_pagamento_financeiro'
  | 'caso_concluido';

export type DestratoStatusFinal = 'em_andamento' | 'devolvido' | 'nao_devolvido' | 'cancelado';

export type SubtarefaStatus = 'pendente' | 'em_andamento' | 'concluida' | 'atrasada' | 'cancelada';

export interface DestratoSolicitacao {
  id: string;
  numero_solicitacao: number;
  paciente_id?: string;
  paciente_nome: string;
  paciente_email?: string;
  paciente_telefone?: string;
  etapa_atual: DestratoEtapa;
  status_final: DestratoStatusFinal;
  responsavel_id?: string;
  responsavel_nome?: string;
  email_remetente?: string;
  email_assunto?: string;
  email_corpo?: string;
  email_recebido_em?: string;
  remetente_e_titular?: boolean;
  checklist_preenchido: boolean;
  checklist_nome_completo?: string;
  checklist_email?: string;
  checklist_assinou_termo_sinal?: boolean;
  checklist_assinou_contrato?: boolean;
  checklist_procedimento_contratado?: string;
  checklist_valor_total_contrato?: number;
  checklist_valor_pago?: number;
  checklist_data_contratacao?: string;
  checklist_status_procedimento?: string;
  checklist_observacoes?: string;
  parecer_gerente?: string;
  parecer_gerente_data?: string;
  parecer_gerente_por?: string;
  valor_devolver?: number;
  data_pagamento_prevista?: string;
  data_pagamento_realizado?: string;
  comprovante_pagamento_url?: string;
  termo_destrato_url?: string;
  termo_destrato_assinado: boolean;
  termo_destrato_assinado_em?: string;
  prazo_resposta_inicial?: string;
  prazo_atual?: string;
  sla_estourado: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  concluido_em?: string;
  branch?: string;
}

export interface DestratoSubtarefa {
  id: string;
  solicitacao_id: string;
  titulo: string;
  descricao?: string;
  script_padrao?: string;
  status: SubtarefaStatus;
  ordem: number;
  etapa_relacionada: DestratoEtapa;
  responsavel_id?: string;
  responsavel_nome?: string;
  prazo?: string;
  prazo_horas: number;
  e_recorrente: boolean;
  intervalo_recorrencia_horas?: number;
  proxima_execucao?: string;
  concluida_em?: string;
  concluida_por?: string;
  notas_conclusao?: string;
  created_at: string;
  updated_at: string;
}

export interface DestratoHistorico {
  id: string;
  solicitacao_id: string;
  etapa: DestratoEtapa;
  acao: string;
  descricao?: string;
  usuario_id?: string;
  usuario_nome?: string;
  metadata: Record<string, any>;
  data_evento: string;
}

export interface NovaDestratoSolicitacao {
  paciente_id?: string;
  paciente_nome: string;
  paciente_email?: string;
  paciente_telefone?: string;
  email_remetente?: string;
  email_assunto?: string;
  email_corpo?: string;
  branch?: string;
}

// Labels e Configurações
export const DESTRATO_ETAPA_LABELS: Record<DestratoEtapa, string> = {
  solicitacao_recebida: 'Solicitação Recebida',
  checklist_preenchido: 'Checklist Preenchido',
  aguardando_parecer_gerente: 'Aguardando Parecer da Gerente',
  em_negociacao: 'Em Negociação',
  devolver: 'Devolver',
  nao_devolver: 'Não Devolver',
  aguardando_pagamento_financeiro: 'Aguardando Pagamento Financeiro',
  caso_concluido: 'Caso Concluído',
};

export const DESTRATO_ETAPA_COLORS: Record<DestratoEtapa, string> = {
  solicitacao_recebida: 'bg-blue-100 dark:bg-blue-900/30 border-blue-500',
  checklist_preenchido: 'bg-amber-100 dark:bg-amber-900/30 border-amber-500',
  aguardando_parecer_gerente: 'bg-purple-100 dark:bg-purple-900/30 border-purple-500',
  em_negociacao: 'bg-orange-100 dark:bg-orange-900/30 border-orange-500',
  devolver: 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500',
  nao_devolver: 'bg-rose-100 dark:bg-rose-900/30 border-rose-500',
  aguardando_pagamento_financeiro: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500',
  caso_concluido: 'bg-gray-100 dark:bg-gray-800 border-gray-500',
};

export const DESTRATO_STATUS_LABELS: Record<DestratoStatusFinal, string> = {
  em_andamento: 'Em Andamento',
  devolvido: 'Devolvido',
  nao_devolvido: 'Não Devolvido',
  cancelado: 'Cancelado',
};

// Scripts padrão para respostas
export const SCRIPTS_PADRAO = {
  resposta_titular: `Olá, tudo bem?

Recebemos sua solicitação e ela já foi registrada oficialmente.

Em até 7 dias úteis, nossa equipe de gerência entrará em contato para tratar o seu caso e buscar a melhor solução possível.

Permanecemos à disposição.`,
  
  resposta_nao_titular: `Olá, tudo bem?

Para tratarmos qualquer solicitação relacionada ao contrato, precisamos que o contato seja feito diretamente pelo titular do contrato.

Caso outra pessoa vá representar o titular, será necessária uma procuração autorizando formalmente esse atendimento.

Assim que tivermos isso, daremos sequência.`,
};

// Subtarefas automáticas por etapa
export const SUBTAREFAS_POR_ETAPA: Record<DestratoEtapa, Array<{ titulo: string; descricao?: string; script_padrao?: string; prazo_horas: number }>> = {
  solicitacao_recebida: [
    { titulo: 'Verificar remetente do e-mail', descricao: 'Comparar e-mail do remetente com cadastro do paciente', prazo_horas: 24 },
    { titulo: 'Responder e-mail ao paciente', descricao: 'Enviar resposta padrão conforme verificação', prazo_horas: 24 },
  ],
  checklist_preenchido: [],
  aguardando_parecer_gerente: [
    { titulo: 'Enviar informações para a gerente Jéssica', descricao: 'Enviar checklist completo e aguardar definição', prazo_horas: 24 },
  ],
  em_negociacao: [
    { titulo: 'Acompanhar negociação', descricao: 'Solicitar parecer da gerente (recorrente)', prazo_horas: 24 },
  ],
  devolver: [
    { titulo: 'Enviar destrato com devolução para assinatura', descricao: 'Preparar e enviar termo de destrato ao paciente', prazo_horas: 24 },
  ],
  nao_devolver: [
    { titulo: 'Enviar destrato sem devolução para assinatura', descricao: 'Preparar e enviar termo de acordo sem devolução', prazo_horas: 24 },
  ],
  aguardando_pagamento_financeiro: [
    { titulo: 'Solicitar pagamento ao financeiro', descricao: 'Encaminhar para programação de pagamento', prazo_horas: 24 },
    { titulo: 'Verificar pagamento financeiro', descricao: 'Verificar se o pagamento foi realizado (recorrente)', prazo_horas: 24 },
  ],
  caso_concluido: [],
};

export function useDestratoRequests(filters?: { etapa?: DestratoEtapa; status?: DestratoStatusFinal }) {
  const [solicitacoes, setSolicitacoes] = useState<DestratoSolicitacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useUnifiedAuth();

  const fetchSolicitacoes = useCallback(async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('destrato_solicitacoes')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.etapa) query = query.eq('etapa_atual', filters.etapa);
      if (filters?.status) query = query.eq('status_final', filters.status);

      const { data, error } = await query;
      if (error) throw error;
      setSolicitacoes((data as unknown as DestratoSolicitacao[]) || []);
    } catch (error) {
      console.error('Erro ao buscar solicitações de destrato:', error);
      toast({ title: 'Erro', description: 'Não foi possível carregar as solicitações', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [filters, toast]);

  const criarSolicitacao = async (data: NovaDestratoSolicitacao) => {
    try {
      const prazoInicial = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const { data: solicitacao, error } = await supabase
        .from('destrato_solicitacoes')
        .insert({
          ...data,
          etapa_atual: 'solicitacao_recebida',
          status_final: 'em_andamento',
          responsavel_nome: 'Júlia',
          prazo_resposta_inicial: prazoInicial,
          prazo_atual: prazoInicial,
          email_recebido_em: new Date().toISOString(),
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Criar histórico inicial
      await supabase.from('destrato_historico').insert({
        solicitacao_id: solicitacao.id,
        etapa: 'solicitacao_recebida',
        acao: 'criacao',
        descricao: 'Nova solicitação de destrato registrada',
        usuario_id: user?.id,
        usuario_nome: user?.fullName,
      });

      // Criar subtarefas automáticas da primeira etapa
      const subtarefasEtapa = SUBTAREFAS_POR_ETAPA.solicitacao_recebida;
      for (let i = 0; i < subtarefasEtapa.length; i++) {
        const subtarefa = subtarefasEtapa[i];
        await supabase.from('destrato_subtarefas').insert({
          solicitacao_id: solicitacao.id,
          titulo: subtarefa.titulo,
          descricao: subtarefa.descricao,
          script_padrao: subtarefa.script_padrao,
          etapa_relacionada: 'solicitacao_recebida',
          ordem: i,
          prazo_horas: subtarefa.prazo_horas,
          prazo: new Date(Date.now() + subtarefa.prazo_horas * 60 * 60 * 1000).toISOString(),
          responsavel_nome: 'Júlia',
        });
      }

      toast({ title: 'Sucesso', description: 'Solicitação de destrato criada' });
      await fetchSolicitacoes();
      return solicitacao as unknown as DestratoSolicitacao;
    } catch (error: any) {
      console.error('Erro ao criar solicitação:', error);
      toast({ title: 'Erro', description: 'Não foi possível criar a solicitação', variant: 'destructive' });
      throw error;
    }
  };

  const atualizarSolicitacao = async (id: string, updates: Partial<DestratoSolicitacao>) => {
    try {
      const { error } = await supabase
        .from('destrato_solicitacoes')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      setSolicitacoes(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    } catch (error) {
      console.error('Erro ao atualizar solicitação:', error);
      toast({ title: 'Erro', description: 'Não foi possível atualizar', variant: 'destructive' });
      throw error;
    }
  };

  const moverParaEtapa = async (solicitacaoId: string, novaEtapa: DestratoEtapa, descricao?: string) => {
    try {
      const solicitacao = solicitacoes.find(s => s.id === solicitacaoId);
      if (!solicitacao) throw new Error('Solicitação não encontrada');

      // Determinar status final
      let statusFinal: DestratoStatusFinal = 'em_andamento';
      if (novaEtapa === 'caso_concluido') {
        if (solicitacao.etapa_atual === 'devolver' || solicitacao.etapa_atual === 'aguardando_pagamento_financeiro') {
          statusFinal = 'devolvido';
        } else if (solicitacao.etapa_atual === 'nao_devolver') {
          statusFinal = 'nao_devolvido';
        }
      }

      const prazoNovo = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      await supabase.from('destrato_solicitacoes').update({
        etapa_atual: novaEtapa,
        status_final: statusFinal,
        prazo_atual: prazoNovo,
        sla_estourado: false,
        concluido_em: novaEtapa === 'caso_concluido' ? new Date().toISOString() : null,
      }).eq('id', solicitacaoId);

      // Criar histórico
      await supabase.from('destrato_historico').insert({
        solicitacao_id: solicitacaoId,
        etapa: novaEtapa,
        acao: 'transicao_etapa',
        descricao: descricao || `Movido para ${DESTRATO_ETAPA_LABELS[novaEtapa]}`,
        usuario_id: user?.id,
        usuario_nome: user?.fullName,
      });

      // Criar subtarefas automáticas da nova etapa
      const subtarefasEtapa = SUBTAREFAS_POR_ETAPA[novaEtapa];
      for (let i = 0; i < subtarefasEtapa.length; i++) {
        const subtarefa = subtarefasEtapa[i];
        await supabase.from('destrato_subtarefas').insert({
          solicitacao_id: solicitacaoId,
          titulo: subtarefa.titulo,
          descricao: subtarefa.descricao,
          script_padrao: subtarefa.script_padrao,
          etapa_relacionada: novaEtapa,
          ordem: i,
          prazo_horas: subtarefa.prazo_horas,
          prazo: new Date(Date.now() + subtarefa.prazo_horas * 60 * 60 * 1000).toISOString(),
          responsavel_nome: 'Júlia',
          e_recorrente: subtarefa.titulo.includes('recorrente'),
          intervalo_recorrencia_horas: subtarefa.titulo.includes('recorrente') ? 24 : null,
        });
      }

      toast({ title: 'Sucesso', description: `Movido para ${DESTRATO_ETAPA_LABELS[novaEtapa]}` });
      await fetchSolicitacoes();
    } catch (error) {
      console.error('Erro ao mover etapa:', error);
      toast({ title: 'Erro', description: 'Não foi possível mover', variant: 'destructive' });
      throw error;
    }
  };

  const definirParecerGerente = async (solicitacaoId: string, parecer: 'devolver' | 'nao_devolver' | 'em_negociacao') => {
    const parecerTexto = parecer === 'devolver' ? 'Devolver' : parecer === 'nao_devolver' ? 'Não Devolver' : 'Em Negociação';
    
    await atualizarSolicitacao(solicitacaoId, {
      parecer_gerente: parecerTexto,
      parecer_gerente_data: new Date().toISOString(),
      parecer_gerente_por: 'Jéssica',
    });

    await moverParaEtapa(solicitacaoId, parecer, `Gerente definiu: ${parecerTexto}`);
  };

  // Realtime subscription
  useEffect(() => {
    fetchSolicitacoes();

    const channel = supabase
      .channel('destrato_solicitacoes_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'destrato_solicitacoes' }, () => fetchSolicitacoes())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchSolicitacoes]);

  // Stats
  const stats = useMemo(() => {
    const total = solicitacoes.length;
    const byEtapa = solicitacoes.reduce((acc, s) => {
      acc[s.etapa_atual] = (acc[s.etapa_atual] || 0) + 1;
      return acc;
    }, {} as Record<DestratoEtapa, number>);

    const slaEstourados = solicitacoes.filter(s => s.sla_estourado).length;
    const emAndamento = solicitacoes.filter(s => s.status_final === 'em_andamento').length;
    const concluidos = solicitacoes.filter(s => s.status_final !== 'em_andamento').length;

    return { total, byEtapa, slaEstourados, emAndamento, concluidos };
  }, [solicitacoes]);

  return {
    solicitacoes,
    isLoading,
    stats,
    criarSolicitacao,
    atualizarSolicitacao,
    moverParaEtapa,
    definirParecerGerente,
    refetch: fetchSolicitacoes,
  };
}

// Hook para subtarefas de uma solicitação específica
export function useDestratoSubtarefas(solicitacaoId: string | undefined) {
  const [subtarefas, setSubtarefas] = useState<DestratoSubtarefa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useUnifiedAuth();

  const fetchSubtarefas = useCallback(async () => {
    if (!solicitacaoId) return;
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('destrato_subtarefas')
        .select('*')
        .eq('solicitacao_id', solicitacaoId)
        .order('ordem', { ascending: true });

      if (error) throw error;
      
      // Verificar se alguma subtarefa está atrasada
      const now = new Date();
      const subtarefasAtualizadas = (data || []).map((s: any) => {
        if (s.status === 'pendente' && s.prazo && new Date(s.prazo) < now) {
          return { ...s, status: 'atrasada' };
        }
        return s;
      });
      
      setSubtarefas(subtarefasAtualizadas as DestratoSubtarefa[]);
    } catch (error) {
      console.error('Erro ao buscar subtarefas:', error);
    } finally {
      setIsLoading(false);
    }
  }, [solicitacaoId]);

  const concluirSubtarefa = async (subtarefaId: string, notas?: string) => {
    try {
      await supabase.from('destrato_subtarefas').update({
        status: 'concluida',
        concluida_em: new Date().toISOString(),
        concluida_por: user?.id,
        notas_conclusao: notas,
      }).eq('id', subtarefaId);

      toast({ title: 'Sucesso', description: 'Subtarefa concluída' });
      await fetchSubtarefas();
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível concluir', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchSubtarefas();

    if (!solicitacaoId) return;

    const channel = supabase
      .channel(`subtarefas_${solicitacaoId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'destrato_subtarefas',
        filter: `solicitacao_id=eq.${solicitacaoId}`
      }, () => fetchSubtarefas())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchSubtarefas, solicitacaoId]);

  return { subtarefas, isLoading, concluirSubtarefa, refetch: fetchSubtarefas };
}

// Hook para histórico
export function useDestratoHistorico(solicitacaoId: string | undefined) {
  const [historico, setHistorico] = useState<DestratoHistorico[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!solicitacaoId) return;

    const fetchHistorico = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('destrato_historico')
        .select('*')
        .eq('solicitacao_id', solicitacaoId)
        .order('data_evento', { ascending: true });

      if (!error) setHistorico((data as unknown as DestratoHistorico[]) || []);
      setIsLoading(false);
    };

    fetchHistorico();

    const channel = supabase
      .channel(`historico_destrato_${solicitacaoId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'destrato_historico',
        filter: `solicitacao_id=eq.${solicitacaoId}`
      }, () => fetchHistorico())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [solicitacaoId]);

  return { historico, isLoading };
}
