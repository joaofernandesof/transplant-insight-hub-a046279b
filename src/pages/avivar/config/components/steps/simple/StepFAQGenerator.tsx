/**
 * Etapa de Geração Automática de FAQ
 * Gera perguntas e respostas comuns baseado no nicho/subnicho
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X,
  Copy,
  MessageCircleQuestion,
  Loader2,
  SkipForward,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { NichoType, SubnichoType, Service, PaymentMethod, AgentObjectives, BusinessUnit } from '../../../types';

interface FAQItem {
  id: string;
  pergunta: string;
  resposta: string;
  isEditing?: boolean;
}

interface StepFAQGeneratorProps {
  nicho: NichoType | null;
  subnicho: SubnichoType | null;
  companyName: string;
  companyPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  professionalName?: string;
  crm?: string;
  businessUnits?: BusinessUnit[];
  services: Service[];
  paymentMethods?: PaymentMethod[];
  objectives: AgentObjectives;
  generatedFAQ: FAQItem[];
  onFAQChange: (faq: FAQItem[]) => void;
  onCopyToKnowledge: (content: string) => void;
  onSkip: () => void;
}

export function StepFAQGenerator({ 
  nicho,
  subnicho,
  companyName,
  companyPhone,
  address,
  city,
  state,
  professionalName,
  crm,
  businessUnits,
  services,
  paymentMethods,
  objectives,
  generatedFAQ,
  onFAQChange,
  onCopyToKnowledge,
  onSkip
}: StepFAQGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [newPergunta, setNewPergunta] = useState('');
  const [newResposta, setNewResposta] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id: string; pergunta: string; resposta: string } | null>(null);

  // Preparar dados de serviços com preços
  const enabledServices = services.filter(s => s.enabled).map(s => ({
    name: s.name,
    price: s.showPrice && s.price ? s.price / 100 : null,
    showPrice: s.showPrice || false,
  }));

  const enabledPayments = paymentMethods?.filter(p => p.enabled).map(p => p.name) || [];

  const handleGenerate = async () => {
    if (!nicho || !subnicho) {
      toast.error('Selecione o tipo de negócio primeiro');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('avivar-generate-faq', {
        body: {
          nicho,
          subnicho,
          companyName,
          companyPhone,
          address,
          city,
          state,
          professionalName,
          crm,
          businessUnits,
          services: enabledServices,
          paymentMethods: enabledPayments,
          objectives,
        }
      });

      if (error) throw error;

      if (data?.faq && Array.isArray(data.faq)) {
        const faqWithIds = data.faq.map((item: { pergunta: string; resposta: string }, index: number) => ({
          id: `faq_${Date.now()}_${index}`,
          pergunta: item.pergunta,
          resposta: item.resposta,
        }));
        onFAQChange(faqWithIds);
        toast.success(`${faqWithIds.length} perguntas geradas com sucesso!`);
      }
    } catch (error) {
      console.error('Erro ao gerar FAQ:', error);
      toast.error('Erro ao gerar perguntas. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddItem = () => {
    if (!newPergunta.trim() || !newResposta.trim()) {
      toast.error('Preencha a pergunta e resposta');
      return;
    }

    const newItem: FAQItem = {
      id: `faq_${Date.now()}`,
      pergunta: newPergunta.trim(),
      resposta: newResposta.trim(),
    };

    onFAQChange([...generatedFAQ, newItem]);
    setNewPergunta('');
    setNewResposta('');
    setShowAddForm(false);
    toast.success('Pergunta adicionada!');
  };

  const handleDeleteItem = (id: string) => {
    onFAQChange(generatedFAQ.filter(item => item.id !== id));
    toast.success('Pergunta removida');
  };

  const handleStartEdit = (item: FAQItem) => {
    setEditingItem({ id: item.id, pergunta: item.pergunta, resposta: item.resposta });
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;

    onFAQChange(generatedFAQ.map(item => 
      item.id === editingItem.id 
        ? { ...item, pergunta: editingItem.pergunta, resposta: editingItem.resposta }
        : item
    ));
    setEditingItem(null);
    toast.success('Pergunta atualizada!');
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  const handleCopyToKnowledge = () => {
    if (generatedFAQ.length === 0) {
      toast.error('Nenhuma pergunta para copiar');
      return;
    }

    const content = generatedFAQ.map(item => 
      `## ${item.pergunta}\n${item.resposta}`
    ).join('\n\n---\n\n');

    onCopyToKnowledge(content);
    toast.success('FAQ adicionado à base de conhecimento!');
  };

  const formatFAQForPreview = () => {
    return generatedFAQ.map(item => 
      `**Pergunta:** ${item.pergunta}\n**Resposta:** ${item.resposta}`
    ).join('\n\n');
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[hsl(var(--avivar-primary))] to-[hsl(280_80%_50%)] flex items-center justify-center mx-auto mb-4">
          <MessageCircleQuestion className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
          Perguntas Frequentes
        </h2>
        <p className="text-[hsl(var(--avivar-muted-foreground))]">
          Gere automaticamente as perguntas mais comuns do seu negócio
        </p>
        <Badge variant="outline" className="border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-muted-foreground))]">
          <Sparkles className="h-3 w-3 mr-1" />
          Etapa opcional
        </Badge>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        {/* Generate Button */}
        <Card className="bg-gradient-to-r from-[hsl(var(--avivar-primary)/0.1)] to-[hsl(280_80%_50%/0.1)] border-[hsl(var(--avivar-primary)/0.3)]">
          <CardContent className="p-6 text-center space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium text-[hsl(var(--avivar-foreground))]">
                {generatedFAQ.length > 0 ? 'Regenerar perguntas?' : 'Pronto para gerar?'}
              </h3>
              <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                A IA vai criar perguntas e respostas baseadas nos seus <strong>objetivos</strong>
                {companyName && `, tipo de negócio (${companyName})`}
                {enabledServices.length > 0 && `, ${enabledServices.length} serviços`}
                {enabledPayments.length > 0 && ` e ${enabledPayments.length} formas de pagamento`}
              </p>
            </div>

            <Button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary)/0.9)] text-white"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Gerando perguntas...
                </>
              ) : generatedFAQ.length > 0 ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Regenerar FAQ
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Gerar Perguntas Automaticamente
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* FAQ List */}
        {generatedFAQ.length > 0 && (
          <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
                  <MessageCircleQuestion className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
                  Perguntas Geradas
                </h4>
                <Badge className="bg-[hsl(var(--avivar-primary)/0.2)] text-[hsl(var(--avivar-primary))]">
                  {generatedFAQ.length} pergunta{generatedFAQ.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {generatedFAQ.map((item, index) => (
                    <div 
                      key={item.id}
                      className="p-4 rounded-lg bg-[hsl(var(--avivar-muted))] space-y-2"
                    >
                      {editingItem?.id === item.id ? (
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-medium text-[hsl(var(--avivar-muted-foreground))]">
                              Pergunta
                            </label>
                            <Input
                              value={editingItem.pergunta}
                              onChange={(e) => setEditingItem({ ...editingItem, pergunta: e.target.value })}
                              className="mt-1 bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-[hsl(var(--avivar-muted-foreground))]">
                              Resposta
                            </label>
                            <Textarea
                              value={editingItem.resposta}
                              onChange={(e) => setEditingItem({ ...editingItem, resposta: e.target.value })}
                              rows={3}
                              className="mt-1 bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleCancelEdit}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleSaveEdit}
                              className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary)/0.9)]"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Salvar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-[hsl(var(--avivar-primary))]">
                                {index + 1}. {item.pergunta}
                              </p>
                              <p className="text-sm text-[hsl(var(--avivar-foreground))] mt-1">
                                {item.resposta}
                              </p>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleStartEdit(item)}
                              >
                                <Edit3 className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:text-destructive"
                                onClick={() => handleDeleteItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Add New Item */}
              {showAddForm ? (
                <div className="p-4 rounded-lg border-2 border-dashed border-[hsl(var(--avivar-primary)/0.5)] space-y-3">
                  <div>
                    <label className="text-xs font-medium text-[hsl(var(--avivar-muted-foreground))]">
                      Nova Pergunta
                    </label>
                    <Input
                      value={newPergunta}
                      onChange={(e) => setNewPergunta(e.target.value)}
                      placeholder="Ex: Qual o horário de funcionamento?"
                      className="mt-1 bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[hsl(var(--avivar-muted-foreground))]">
                      Resposta
                    </label>
                    <Textarea
                      value={newResposta}
                      onChange={(e) => setNewResposta(e.target.value)}
                      placeholder="Ex: Funcionamos de segunda a sexta, das 8h às 18h."
                      rows={3}
                      className="mt-1 bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewPergunta('');
                        setNewResposta('');
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddItem}
                      className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary)/0.9)]"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full border-dashed border-[hsl(var(--avivar-border))]"
                  onClick={() => setShowAddForm(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Pergunta Manualmente
                </Button>
              )}

              {/* Copy to Knowledge Base */}
              <div className="pt-4 border-t border-[hsl(var(--avivar-border))]">
                <Button
                  onClick={handleCopyToKnowledge}
                  className="w-full bg-gradient-to-r from-[hsl(var(--avivar-primary))] to-[hsl(280_80%_50%)]"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Adicionar à Base de Conhecimento
                </Button>
                <p className="text-xs text-center text-[hsl(var(--avivar-muted-foreground))] mt-2">
                  As perguntas serão salvas como documento na próxima etapa
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Skip Button */}
        <div className="text-center pt-4">
          <Button
            variant="ghost"
            onClick={onSkip}
            className="text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))]"
          >
            <SkipForward className="h-4 w-4 mr-2" />
            Pular etapa
          </Button>
        </div>
      </div>
    </div>
  );
}
