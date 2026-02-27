/**
 * Etapa de FAQ Manual
 * Usuário cria suas próprias perguntas e respostas
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X,
  MessageCircleQuestion,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
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

const ITEMS_PER_PAGE = 10;

export function StepFAQGenerator({ 
  generatedFAQ,
  onFAQChange,
}: StepFAQGeneratorProps) {
  const [newPergunta, setNewPergunta] = useState('');
  const [newResposta, setNewResposta] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id: string; pergunta: string; resposta: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(generatedFAQ.length / ITEMS_PER_PAGE));

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return generatedFAQ.slice(start, start + ITEMS_PER_PAGE);
  }, [generatedFAQ, currentPage]);

  // Reset page if out of bounds
  if (currentPage > totalPages) setCurrentPage(1);

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

    onFAQChange([newItem, ...generatedFAQ]);
    setNewPergunta('');
    setNewResposta('');
    setShowAddForm(false);
    setCurrentPage(1);
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

  // Global index for numbering
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

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
          Crie as perguntas e respostas mais comuns do seu negócio
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        {/* Add Button / Form */}
        {showAddForm ? (
          <Card className="border-2 border-dashed border-[hsl(var(--avivar-primary)/0.5)] bg-[hsl(var(--avivar-card))]">
            <CardContent className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-[hsl(var(--avivar-muted-foreground))]">
                  Pergunta
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
            </CardContent>
          </Card>
        ) : (
          <Button
            onClick={() => setShowAddForm(true)}
            className="w-full bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary)/0.9)] text-white"
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Adicionar Pergunta e Resposta
          </Button>
        )}

        {/* FAQ List */}
        {generatedFAQ.length > 0 && (
          <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
                  <MessageCircleQuestion className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
                  Suas Perguntas
                </h4>
                <Badge className="bg-[hsl(var(--avivar-primary)/0.2)] text-[hsl(var(--avivar-primary))]">
                  {generatedFAQ.length} pergunta{generatedFAQ.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              <div className="space-y-3">
                {paginatedItems.map((item, index) => (
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
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[hsl(var(--avivar-primary))]">
                            {startIndex + index + 1}. {item.pergunta}
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
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-3 border-t border-[hsl(var(--avivar-border))]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <span className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
