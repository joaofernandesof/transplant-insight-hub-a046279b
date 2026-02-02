/**
 * AvivarAgentRoutingConfig - Configuração de Roteamento Multi-Agente
 * Define qual agente atua em qual Kanban/Estágio
 * ATUALIZADO: Busca kanbans e colunas dinamicamente do banco de dados
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

interface KanbanOption {
  id: string;
  label: string;
  description: string;
  color: string;
}

interface StageOption {
  id: string;
  label: string;
  kanbanId: string;
  orderIndex: number;
}

// Color mapping for kanbans (extract gradient colors)
const COLOR_MAP: Record<string, string> = {
  'from-blue-500': 'bg-blue-500',
  'from-green-500': 'bg-green-500',
  'from-emerald-500': 'bg-emerald-500',
  'from-orange-500': 'bg-orange-500',
  'from-purple-500': 'bg-purple-500',
  'from-pink-500': 'bg-pink-500',
  'from-red-500': 'bg-red-500',
  'from-cyan-500': 'bg-cyan-500',
  'from-yellow-500': 'bg-yellow-500',
  'from-indigo-500': 'bg-indigo-500',
  'from-teal-500': 'bg-teal-500',
  'from-gray-500': 'bg-gray-500',
};

function getColorClass(gradientColor: string | null): string {
  if (!gradientColor) return 'bg-gray-500';
  // Extract the first color from gradient string like "from-blue-500 to-indigo-600"
  const match = gradientColor.match(/from-\w+-\d+/);
  if (match && COLOR_MAP[match[0]]) {
    return COLOR_MAP[match[0]];
  }
  return 'bg-purple-500';
}

export default function AvivarAgentRoutingConfig() {
  const navigate = useNavigate();
  const { agentId } = useParams<{ agentId: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agent, setAgent] = useState<{ id: string; name: string; target_kanbans: string[]; target_stages: string[] } | null>(null);
  const [selectedKanbans, setSelectedKanbans] = useState<string[]>([]);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  
  // Dynamic data from database
  const [kanbanOptions, setKanbanOptions] = useState<KanbanOption[]>([]);
  const [stageOptions, setStageOptions] = useState<StageOption[]>([]);

  useEffect(() => {
    loadData();
  }, [agentId]);

  const loadData = async () => {
    if (!agentId) return;
    
    try {
      // Load agent, kanbans, and columns in parallel
      const [agentResult, kanbansResult] = await Promise.all([
        supabase
          .from('avivar_agents')
          .select('id, name, target_kanbans, target_stages, user_id')
          .eq('id', agentId)
          .single(),
        supabase
          .from('avivar_kanbans')
          .select(`
            id, 
            name, 
            description, 
            color,
            order_index,
            avivar_kanban_columns (
              id,
              name,
              order_index
            )
          `)
          .order('order_index', { ascending: true })
      ]);

      if (agentResult.error) throw agentResult.error;
      if (kanbansResult.error) throw kanbansResult.error;
      
      const agentData = agentResult.data;
      const kanbansData = kanbansResult.data || [];
      
      // Transform kanbans to options format
      const kanbans: KanbanOption[] = kanbansData.map(k => ({
        id: k.id,
        label: k.name,
        description: k.description || '',
        color: getColorClass(k.color)
      }));
      
      // Transform columns to stages format
      const stages: StageOption[] = [];
      kanbansData.forEach(kanban => {
        const columns = kanban.avivar_kanban_columns as { id: string; name: string; order_index: number }[] || [];
        columns
          .sort((a, b) => a.order_index - b.order_index)
          .forEach(col => {
            stages.push({
              id: col.id,
              label: col.name,
              kanbanId: kanban.id,
              orderIndex: col.order_index
            });
          });
      });
      
      setAgent(agentData);
      setKanbanOptions(kanbans);
      setStageOptions(stages);
      setSelectedKanbans(agentData.target_kanbans || []);
      setSelectedStages(agentData.target_stages || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleKanbanToggle = (kanbanId: string) => {
    setSelectedKanbans(prev => {
      if (prev.includes(kanbanId)) {
        // Remove kanban and all its stages
        const kanbanStages = stageOptions.filter(s => s.kanbanId === kanbanId).map(s => s.id);
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
          {kanbanOptions.length === 0 ? (
            <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
              Nenhum funil encontrado. Crie funis na página de Leads.
            </p>
          ) : (
            kanbanOptions.map((kanban) => (
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
                  {kanban.description && (
                    <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                      {kanban.description}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
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
              {kanbanOptions.filter(k => selectedKanbans.includes(k.id)).map((kanban) => {
                const kanbanStages = stageOptions.filter(s => s.kanbanId === kanban.id);
                return (
                  <div key={kanban.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${kanban.color}`} />
                      <span className="text-sm font-medium text-[hsl(var(--avivar-muted-foreground))]">
                        {kanban.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 ml-4">
                      {kanbanStages.length === 0 ? (
                        <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] col-span-2">
                          Nenhuma coluna neste funil
                        </p>
                      ) : (
                        kanbanStages.map((stage) => (
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
                            <Label 
                              htmlFor={`stage-${stage.id}`}
                              className="text-sm text-[hsl(var(--avivar-foreground))] cursor-pointer"
                            >
                              {stage.label}
                            </Label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
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
                  const kanban = kanbanOptions.find(ko => ko.id === k);
                  return kanban ? (
                    <Badge key={k} className={`${kanban.color} text-white`}>
                      {kanban.label}
                    </Badge>
                  ) : null;
                })}
              </div>
              {selectedStages.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Colunas:</span>
                  {selectedStages.map(s => {
                    const stage = stageOptions.find(so => so.id === s);
                    return stage ? (
                      <Badge key={s} variant="outline" className="text-xs">
                        {stage.label}
                      </Badge>
                    ) : null;
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
