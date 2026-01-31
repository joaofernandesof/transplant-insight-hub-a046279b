/**
 * AvivarAgentRoutingConfig - Configuração de Roteamento Multi-Agente
 * Define qual agente atua em qual Kanban/Estágio
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Target,
  Loader2,
  Save,
  Info
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const KANBAN_OPTIONS = [
  { id: 'comercial', label: 'Comercial', description: 'Leads novos e prospecção', color: 'bg-blue-500' },
  { id: 'pos_venda', label: 'Pós-Venda', description: 'Clientes após procedimento', color: 'bg-green-500' },
  { id: 'reativacao', label: 'Reativação', description: 'Leads inativos', color: 'bg-orange-500' },
];

const STAGE_OPTIONS = [
  { id: 'novo_lead', label: 'Novo Lead', kanban: 'comercial', description: 'Primeiro contato' },
  { id: 'qualificacao', label: 'Qualificação', kanban: 'comercial', description: 'Entendendo necessidades' },
  { id: 'agendado', label: 'Agendado', kanban: 'comercial', description: 'Consulta marcada' },
  { id: 'compareceu', label: 'Compareceu', kanban: 'comercial', description: 'Veio na consulta' },
  { id: 'pos_procedimento', label: 'Pós-Procedimento', kanban: 'pos_venda', description: 'Cuidados imediatos' },
  { id: 'acompanhamento', label: 'Acompanhamento', kanban: 'pos_venda', description: 'Evolução do caso' },
  { id: 'inativo', label: 'Inativo', kanban: 'reativacao', description: 'Sem resposta há tempo' },
];

export default function AvivarAgentRoutingConfig() {
  const navigate = useNavigate();
  const { agentId } = useParams<{ agentId: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agent, setAgent] = useState<{ id: string; name: string; target_kanbans: string[]; target_stages: string[] } | null>(null);
  const [selectedKanbans, setSelectedKanbans] = useState<string[]>([]);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);

  useEffect(() => {
    loadAgent();
  }, [agentId]);

  const loadAgent = async () => {
    if (!agentId) return;
    
    try {
      const { data, error } = await supabase
        .from('avivar_agents')
        .select('id, name, target_kanbans, target_stages')
        .eq('id', agentId)
        .single();

      if (error) throw error;
      
      setAgent(data);
      setSelectedKanbans(data.target_kanbans || []);
      setSelectedStages(data.target_stages || []);
    } catch (error) {
      console.error('Error loading agent:', error);
      toast.error('Erro ao carregar agente');
    } finally {
      setLoading(false);
    }
  };

  const handleKanbanToggle = (kanbanId: string) => {
    setSelectedKanbans(prev => {
      if (prev.includes(kanbanId)) {
        // Remove kanban and all its stages
        const kanbanStages = STAGE_OPTIONS.filter(s => s.kanban === kanbanId).map(s => s.id);
        setSelectedStages(stages => stages.filter(s => !kanbanStages.includes(s)));
        return prev.filter(k => k !== kanbanId);
      } else {
        return [...prev, kanbanId];
      }
    });
  };

  const handleStageToggle = (stageId: string) => {
    setSelectedStages(prev => {
      if (prev.includes(stageId)) {
        return prev.filter(s => s !== stageId);
      } else {
        return [...prev, stageId];
      }
    });
  };

  const handleSave = async () => {
    if (!agentId) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('avivar_agents')
        .update({
          target_kanbans: selectedKanbans,
          target_stages: selectedStages,
          updated_at: new Date().toISOString()
        })
        .eq('id', agentId);

      if (error) throw error;
      
      toast.success('Roteamento salvo com sucesso!');
      navigate('/avivar/agents');
    } catch (error) {
      console.error('Error saving routing:', error);
      toast.error('Erro ao salvar roteamento');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--avivar-primary))]" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="p-6 text-center">
        <p className="text-[hsl(var(--avivar-muted-foreground))]">Agente não encontrado</p>
        <Button variant="outline" onClick={() => navigate('/avivar/agents')} className="mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/avivar/agents')}
          className="text-[hsl(var(--avivar-muted-foreground))]"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
            <Target className="h-6 w-6 text-[hsl(var(--avivar-primary))]" />
            Roteamento: {agent.name}
          </h1>
          <p className="text-[hsl(var(--avivar-muted-foreground))]">
            Defina onde este agente vai atuar
          </p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-500/10 border-blue-500/30">
        <CardContent className="p-4 flex gap-3">
          <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-200">
            <p className="font-medium mb-1">Como funciona o Roteamento Híbrido:</p>
            <ul className="space-y-1 text-blue-200/80">
              <li>• O agente será acionado automaticamente para leads nos Kanbans/Estágios selecionados</li>
              <li>• Mesmo atuando em um estágio específico, ele tem acesso à base de conhecimento COMPLETA</li>
              <li>• Se um lead perguntar sobre outro assunto, o agente responderá corretamente</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Kanbans Selection */}
      <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
        <CardHeader>
          <CardTitle className="text-[hsl(var(--avivar-foreground))]">
            Kanbans de Atuação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {KANBAN_OPTIONS.map((kanban) => (
            <div 
              key={kanban.id}
              className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${
                selectedKanbans.includes(kanban.id) 
                  ? 'border-[hsl(var(--avivar-primary))] bg-[hsl(var(--avivar-primary)/0.1)]' 
                  : 'border-[hsl(var(--avivar-border))]'
              }`}
            >
              <Checkbox
                id={`kanban-${kanban.id}`}
                checked={selectedKanbans.includes(kanban.id)}
                onCheckedChange={() => handleKanbanToggle(kanban.id)}
              />
              <div className="flex-1">
                <Label 
                  htmlFor={`kanban-${kanban.id}`}
                  className="text-[hsl(var(--avivar-foreground))] font-medium cursor-pointer flex items-center gap-2"
                >
                  <span className={`w-3 h-3 rounded-full ${kanban.color}`} />
                  {kanban.label}
                </Label>
                <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                  {kanban.description}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Stages Selection (filtered by selected kanbans) */}
      {selectedKanbans.length > 0 && (
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardHeader>
            <CardTitle className="text-[hsl(var(--avivar-foreground))]">
              Estágios Específicos (opcional)
            </CardTitle>
            <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
              Para roteamento mais preciso, selecione estágios específicos. Se não selecionar nenhum, o agente atuará em todos os estágios dos kanbans escolhidos.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {KANBAN_OPTIONS.filter(k => selectedKanbans.includes(k.id)).map((kanban) => (
                <div key={kanban.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${kanban.color}`} />
                    <span className="text-sm font-medium text-[hsl(var(--avivar-muted-foreground))]">
                      {kanban.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 ml-4">
                    {STAGE_OPTIONS.filter(s => s.kanban === kanban.id).map((stage) => (
                      <div
                        key={stage.id}
                        className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${
                          selectedStages.includes(stage.id)
                            ? 'border-[hsl(var(--avivar-primary))] bg-[hsl(var(--avivar-primary)/0.1)]'
                            : 'border-[hsl(var(--avivar-border))]'
                        }`}
                        onClick={() => handleStageToggle(stage.id)}
                      >
                        <Checkbox
                          id={`stage-${stage.id}`}
                          checked={selectedStages.includes(stage.id)}
                          onCheckedChange={() => handleStageToggle(stage.id)}
                        />
                        <div>
                          <Label 
                            htmlFor={`stage-${stage.id}`}
                            className="text-sm text-[hsl(var(--avivar-foreground))] cursor-pointer"
                          >
                            {stage.label}
                          </Label>
                          <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                            {stage.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
        <CardHeader>
          <CardTitle className="text-[hsl(var(--avivar-foreground))]">
            Resumo do Roteamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedKanbans.length === 0 ? (
            <p className="text-[hsl(var(--avivar-muted-foreground))] text-sm">
              Nenhum kanban selecionado. Este agente não será acionado automaticamente.
            </p>
          ) : (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {selectedKanbans.map(k => {
                  const kanban = KANBAN_OPTIONS.find(ko => ko.id === k);
                  return (
                    <Badge key={k} className={`${kanban?.color} text-white`}>
                      {kanban?.label}
                    </Badge>
                  );
                })}
              </div>
              {selectedStages.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Estágios:</span>
                  {selectedStages.map(s => {
                    const stage = STAGE_OPTIONS.find(so => so.id === s);
                    return (
                      <Badge key={s} variant="outline" className="text-xs">
                        {stage?.label}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button 
          variant="outline" 
          onClick={() => navigate('/avivar/agents')}
          className="border-[hsl(var(--avivar-border))]"
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-[hsl(270_75%_45%)] to-[hsl(280_80%_50%)] text-white"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Roteamento
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
