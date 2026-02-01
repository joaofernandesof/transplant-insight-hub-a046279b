/**
 * AvivarAgentsPage - Gestão de Múltiplos Agentes de IA
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Bot, 
  Plus, 
  Trash2, 
  Settings2,
  Sparkles,
  MessageSquare,
  Target,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Agent {
  id: string;
  name: string;
  avatar_url?: string | null;
  personality?: string | null;
  target_kanbans: string[];
  target_stages: string[];
  is_active: boolean;
  created_at: string;
  knowledge_files?: any;
  company_name?: string | null;
  document_count?: number; // Contagem real de documentos vinculados
}

const KANBAN_OPTIONS = [
  { id: 'comercial', label: 'Comercial', description: 'Leads novos e prospecção' },
  { id: 'pos_venda', label: 'Pós-Venda', description: 'Clientes após procedimento' },
  { id: 'reativacao', label: 'Reativação', description: 'Leads inativos' },
];

const STAGE_OPTIONS = [
  { id: 'novo_lead', label: 'Novo Lead', kanban: 'comercial' },
  { id: 'qualificacao', label: 'Qualificação', kanban: 'comercial' },
  { id: 'agendado', label: 'Agendado', kanban: 'comercial' },
  { id: 'compareceu', label: 'Compareceu', kanban: 'comercial' },
  { id: 'pos_procedimento', label: 'Pós-Procedimento', kanban: 'pos_venda' },
  { id: 'acompanhamento', label: 'Acompanhamento', kanban: 'pos_venda' },
  { id: 'inativo', label: 'Inativo', kanban: 'reativacao' },
];

export default function AvivarAgentsPage() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('avivar_agents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Calcular contagem de documentos baseado no campo knowledge_files do agente
      // E também buscar documentos da tabela avivar_knowledge_documents
      const agentsWithDocs = await Promise.all((data || []).map(async (agent) => {
        // Contagem de documentos na tabela separada
        const { count: dbDocCount } = await supabase
          .from('avivar_knowledge_documents')
          .select('*', { count: 'exact', head: true })
          .eq('agent_id', agent.id);
        
        // Contagem de arquivos no campo knowledge_files do agente
        const knowledgeFilesCount = Array.isArray(agent.knowledge_files) 
          ? agent.knowledge_files.length 
          : 0;
        
        return {
          ...agent,
          document_count: (dbDocCount || 0) + knowledgeFilesCount
        };
      }));
      
      setAgents(agentsWithDocs);
    } catch (error) {
      console.error('Error loading agents:', error);
      toast.error('Erro ao carregar agentes');
    } finally {
      setLoading(false);
    }
  };

  const toggleAgentStatus = async (agentId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('avivar_agents')
        .update({ is_active: isActive })
        .eq('id', agentId);

      if (error) throw error;
      
      setAgents(prev => prev.map(a => 
        a.id === agentId ? { ...a, is_active: isActive } : a
      ));
      
      toast.success(isActive ? 'Agente ativado' : 'Agente desativado');
    } catch (error) {
      console.error('Error toggling agent:', error);
      toast.error('Erro ao atualizar agente');
    }
  };

  const deleteAgent = async (agentId: string) => {
    if (!confirm('Tem certeza que deseja excluir este agente?')) return;

    try {
      const { error } = await supabase
        .from('avivar_agents')
        .delete()
        .eq('id', agentId);

      if (error) throw error;
      
      setAgents(prev => prev.filter(a => a.id !== agentId));
      toast.success('Agente excluído');
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast.error('Erro ao excluir agente');
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--avivar-primary))]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
            <Bot className="h-6 w-6 text-[hsl(var(--avivar-primary))]" />
            Meus Agentes de IA
          </h1>
          <p className="text-[hsl(var(--avivar-muted-foreground))]">
            Configure agentes para atuar em diferentes kanbans e estágios
          </p>
        </div>
        <Button 
          onClick={() => navigate('/avivar/config/new')}
          className="bg-gradient-to-r from-[hsl(270_75%_45%)] to-[hsl(280_80%_50%)] text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Criar Novo Agente
        </Button>
      </div>

      {/* Empty State */}
      {agents.length === 0 && (
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-full bg-[hsl(var(--avivar-primary)/0.2)] flex items-center justify-center mb-4">
              <Bot className="h-10 w-10 text-[hsl(var(--avivar-primary))]" />
            </div>
            <h3 className="text-xl font-semibold text-[hsl(var(--avivar-foreground))] mb-2">
              Nenhum agente criado
            </h3>
            <p className="text-[hsl(var(--avivar-muted-foreground))] text-center max-w-md mb-6">
              Crie seu primeiro agente de IA para automatizar o atendimento no WhatsApp
            </p>
            <Button 
              onClick={() => navigate('/avivar/config/new')}
              className="bg-gradient-to-r from-[hsl(270_75%_45%)] to-[hsl(280_80%_50%)] text-white"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Criar Primeiro Agente
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agents.map((agent) => (
          <Card 
            key={agent.id} 
            className={`bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] transition-all ${
              agent.is_active ? 'border-l-4 border-l-[hsl(var(--avivar-primary))]' : 'opacity-60'
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[hsl(270_75%_45%)] to-[hsl(280_80%_50%)] flex items-center justify-center text-white font-bold text-lg">
                    {agent.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <CardTitle className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
                      {agent.name}
                      {agent.is_active ? (
                        <Badge className="bg-green-500/20 text-green-400 text-xs">Ativo</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Inativo</Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                      {agent.company_name || 'Empresa não definida'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={agent.is_active}
                  onCheckedChange={(checked) => toggleAgentStatus(agent.id, checked)}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Target Kanbans */}
              <div>
                <p className="text-xs font-medium text-[hsl(var(--avivar-muted-foreground))] mb-2 flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  Kanbans de Atuação
                </p>
                <div className="flex flex-wrap gap-1">
                  {agent.target_kanbans?.length > 0 ? (
                    agent.target_kanbans.map(kanban => (
                      <Badge key={kanban} variant="outline" className="text-xs border-[hsl(var(--avivar-primary)/0.5)] text-[hsl(var(--avivar-primary))]">
                        {KANBAN_OPTIONS.find(k => k.id === kanban)?.label || kanban}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Nenhum definido</span>
                  )}
                </div>
              </div>

              {/* Knowledge Base */}
              <div className="flex items-center gap-2 text-sm text-[hsl(var(--avivar-muted-foreground))]">
                <MessageSquare className="h-4 w-4" />
                <span>
                  {agent.document_count || 0} documento(s) na base
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/avivar/config/edit/${agent.id}`)}
                  className="border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                >
                  <Settings2 className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/avivar/agents/routing/${agent.id}`)}
                  className="border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                >
                  <Target className="h-4 w-4 mr-1" />
                  Roteamento
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => deleteAgent(agent.id)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Card */}
      {agents.length > 0 && (
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4">
            <h4 className="font-medium text-blue-300 mb-2">💡 Como funciona</h4>
            <ul className="text-sm text-blue-200/80 space-y-1">
              <li>• Cada agente pode atuar em kanbans específicos (Comercial, Pós-Venda, etc.)</li>
              <li>• No modo "Automático", o sistema escolhe o agente baseado no estágio do lead</li>
              <li>• Você pode alterar manualmente o agente de cada conversa na aba Chats</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
