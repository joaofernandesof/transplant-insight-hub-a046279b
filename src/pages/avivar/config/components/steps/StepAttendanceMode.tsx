/**
 * StepAttendanceMode - Seletor do modo de atendimento (Humanizado / Chatbot / Híbrido)
 */

import React, { useState } from 'react';
import { AttendanceMode, ChatbotFlow, ChatbotFlowNode, ChatbotChoice } from '../../types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Bot, Sparkles, Plus, Trash2, ArrowRight, UserRound, BrainCircuit, Send, GripVertical } from 'lucide-react';

interface StepAttendanceModeProps {
  attendanceMode: AttendanceMode;
  chatbotFlows: ChatbotFlow[];
  onChange: (mode: AttendanceMode) => void;
  onFlowsChange: (flows: ChatbotFlow[]) => void;
}

const MODE_OPTIONS: { mode: AttendanceMode; icon: React.ReactNode; title: string; description: string; badge?: string }[] = [
  {
    mode: 'humanized',
    icon: <MessageSquare className="h-8 w-8" />,
    title: 'IA Humanizada',
    description: 'A IA responde em texto livre, seguindo o fluxo de atendimento configurado. Conversas naturais e personalizadas.',
  },
  {
    mode: 'chatbot',
    icon: <Bot className="h-8 w-8" />,
    title: 'Chatbot com Botões',
    description: 'Guie o lead por caminhos pré-definidos usando botões interativos no WhatsApp. Ideal para triagem rápida.',
  },
  {
    mode: 'hybrid',
    icon: <Sparkles className="h-8 w-8" />,
    title: 'Híbrido',
    description: 'Inicia com botões interativos. Se o lead enviar texto livre com dúvidas, a IA responde de forma humanizada.',
    badge: 'Recomendado',
  },
];

const ACTION_LABELS: Record<ChatbotChoice['action'], { label: string; icon: React.ReactNode }> = {
  next_node: { label: 'Ir para submenu', icon: <ArrowRight className="h-3.5 w-3.5" /> },
  transfer_human: { label: 'Transferir humano', icon: <UserRound className="h-3.5 w-3.5" /> },
  switch_to_ai: { label: 'Ativar IA', icon: <BrainCircuit className="h-3.5 w-3.5" /> },
  send_message: { label: 'Enviar mensagem', icon: <Send className="h-3.5 w-3.5" /> },
};

function generateId() {
  return `node_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function createDefaultFlow(): ChatbotFlow {
  const rootId = generateId();
  return {
    id: generateId(),
    name: 'Fluxo Principal',
    rootNodeId: rootId,
    nodes: [
      {
        id: rootId,
        type: 'button',
        text: 'Olá! 👋 Como posso ajudar você hoje?',
        footerText: 'Escolha uma opção abaixo',
        choices: [
          { id: generateId(), label: '📅 Agendar Consulta', action: 'switch_to_ai' },
          { id: generateId(), label: '💬 Tirar Dúvidas', action: 'switch_to_ai' },
          { id: generateId(), label: '👤 Falar com Atendente', action: 'transfer_human' },
        ],
      },
    ],
  };
}

export function StepAttendanceMode({ attendanceMode, chatbotFlows, onChange, onFlowsChange }: StepAttendanceModeProps) {
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  const activeFlow = chatbotFlows[0] || null;

  const handleModeSelect = (mode: AttendanceMode) => {
    onChange(mode);
    // Auto-create default flow if switching to chatbot/hybrid and no flow exists
    if ((mode === 'chatbot' || mode === 'hybrid') && chatbotFlows.length === 0) {
      onFlowsChange([createDefaultFlow()]);
    }
  };

  const updateNode = (nodeId: string, updates: Partial<ChatbotFlowNode>) => {
    if (!activeFlow) return;
    const updatedNodes = activeFlow.nodes.map(n => n.id === nodeId ? { ...n, ...updates } : n);
    onFlowsChange([{ ...activeFlow, nodes: updatedNodes }]);
  };

  const addChoice = (nodeId: string) => {
    if (!activeFlow) return;
    const node = activeFlow.nodes.find(n => n.id === nodeId);
    if (!node || node.choices.length >= 3) return; // WhatsApp limit: max 3 buttons
    const newChoice: ChatbotChoice = {
      id: generateId(),
      label: 'Nova Opção',
      action: 'switch_to_ai',
    };
    updateNode(nodeId, { choices: [...node.choices, newChoice] });
  };

  const updateChoice = (nodeId: string, choiceId: string, updates: Partial<ChatbotChoice>) => {
    if (!activeFlow) return;
    const node = activeFlow.nodes.find(n => n.id === nodeId);
    if (!node) return;
    const updatedChoices = node.choices.map(c => c.id === choiceId ? { ...c, ...updates } : c);
    updateNode(nodeId, { choices: updatedChoices });
  };

  const removeChoice = (nodeId: string, choiceId: string) => {
    if (!activeFlow) return;
    const node = activeFlow.nodes.find(n => n.id === nodeId);
    if (!node || node.choices.length <= 1) return;
    updateNode(nodeId, { choices: node.choices.filter(c => c.id !== choiceId) });
  };

  const rootNode = activeFlow?.nodes.find(n => n.id === activeFlow.rootNodeId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[hsl(var(--avivar-foreground))]">
          Modo de Atendimento
        </h2>
        <p className="text-sm text-[hsl(var(--avivar-muted-foreground))] mt-1">
          Escolha como sua IA vai interagir com os leads no WhatsApp
        </p>
      </div>

      {/* Mode Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MODE_OPTIONS.map(opt => {
          const isSelected = attendanceMode === opt.mode;
          return (
            <Card
              key={opt.mode}
              onClick={() => handleModeSelect(opt.mode)}
              className={`relative p-5 cursor-pointer transition-all duration-200 hover:shadow-md ${
                isSelected
                  ? 'border-[hsl(var(--avivar-primary))] bg-[hsl(var(--avivar-primary)/0.05)] ring-2 ring-[hsl(var(--avivar-primary)/0.3)]'
                  : 'border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))] hover:border-[hsl(var(--avivar-primary)/0.4)]'
              }`}
            >
              {opt.badge && (
                <span className="absolute -top-2.5 right-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[hsl(var(--avivar-primary))] text-white">
                  {opt.badge}
                </span>
              )}
              <div className={`mb-3 ${isSelected ? 'text-[hsl(var(--avivar-primary))]' : 'text-[hsl(var(--avivar-muted-foreground))]'}`}>
                {opt.icon}
              </div>
              <h3 className={`font-semibold text-sm ${isSelected ? 'text-[hsl(var(--avivar-primary))]' : 'text-[hsl(var(--avivar-foreground))]'}`}>
                {opt.title}
              </h3>
              <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] mt-1.5 leading-relaxed">
                {opt.description}
              </p>
            </Card>
          );
        })}
      </div>

      {/* Chatbot Flow Editor - show when chatbot or hybrid */}
      {(attendanceMode === 'chatbot' || attendanceMode === 'hybrid') && rootNode && (
        <div className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-[hsl(var(--avivar-foreground))]">
                Menu de Botões
              </h3>
              <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                Configure a mensagem inicial e os botões que o lead verá no WhatsApp (máx. 3 botões)
              </p>
            </div>
          </div>

          {/* WhatsApp Preview + Editor side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Editor */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[hsl(var(--avivar-muted-foreground))] mb-1.5 block">
                  Mensagem principal
                </label>
                <Textarea
                  value={rootNode.text}
                  onChange={e => updateNode(rootNode.id, { text: e.target.value })}
                  placeholder="Olá! Como posso ajudar?"
                  className="min-h-[80px] bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[hsl(var(--avivar-muted-foreground))] mb-1.5 block">
                  Texto do rodapé (opcional)
                </label>
                <Input
                  value={rootNode.footerText || ''}
                  onChange={e => updateNode(rootNode.id, { footerText: e.target.value })}
                  placeholder="Escolha uma opção"
                  className="bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] text-sm"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-medium text-[hsl(var(--avivar-muted-foreground))] block">
                  Botões ({rootNode.choices.length}/3)
                </label>
                {rootNode.choices.map((choice, idx) => (
                  <div key={choice.id} className="p-3 rounded-lg border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-background))] space-y-2">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))] shrink-0" />
                      <Input
                        value={choice.label}
                        onChange={e => updateChoice(rootNode.id, choice.id, { label: e.target.value })}
                        placeholder={`Botão ${idx + 1}`}
                        className="flex-1 h-8 text-sm bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                        maxLength={20}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeChoice(rootNode.id, choice.id)}
                        disabled={rootNode.choices.length <= 1}
                        className="h-8 w-8 text-[hsl(var(--avivar-muted-foreground))] hover:text-destructive shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="flex gap-1.5 pl-6">
                      {(Object.keys(ACTION_LABELS) as ChatbotChoice['action'][]).map(action => (
                        <button
                          key={action}
                          onClick={() => updateChoice(rootNode.id, choice.id, { action })}
                          className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full transition-colors ${
                            choice.action === action
                              ? 'bg-[hsl(var(--avivar-primary))] text-white'
                              : 'bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-muted-foreground))] hover:bg-[hsl(var(--avivar-primary)/0.15)]'
                          }`}
                        >
                          {ACTION_LABELS[action].icon}
                          {ACTION_LABELS[action].label}
                        </button>
                      ))}
                    </div>
                    {choice.action === 'send_message' && (
                      <div className="pl-6">
                        <Input
                          value={choice.messageContent || ''}
                          onChange={e => updateChoice(rootNode.id, choice.id, { messageContent: e.target.value })}
                          placeholder="Mensagem a enviar..."
                          className="h-8 text-xs bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                        />
                      </div>
                    )}
                  </div>
                ))}
                {rootNode.choices.length < 3 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addChoice(rootNode.id)}
                    className="w-full border-dashed border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-primary))] hover:border-[hsl(var(--avivar-primary)/0.4)]"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Adicionar botão
                  </Button>
                )}
              </div>
            </div>

            {/* WhatsApp Preview */}
            <div className="flex justify-center">
              <div className="w-[300px] bg-[#e5ddd5] rounded-2xl p-4 shadow-inner relative">
                <div className="bg-[#075e54] text-white text-xs font-medium px-4 py-2.5 rounded-t-xl -mx-4 -mt-4 mb-4 text-center">
                  Preview WhatsApp
                </div>
                {/* Message bubble */}
                <div className="bg-white rounded-lg p-3 shadow-sm max-w-[260px] ml-auto mr-0">
                  <p className="text-[13px] text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {rootNode.text || 'Sua mensagem aqui...'}
                  </p>
                  {rootNode.footerText && (
                    <p className="text-[11px] text-gray-400 mt-2 border-t border-gray-100 pt-1.5">
                      {rootNode.footerText}
                    </p>
                  )}
                </div>
                {/* Buttons */}
                <div className="mt-2 space-y-1.5">
                  {rootNode.choices.map(choice => (
                    <div
                      key={choice.id}
                      className="bg-white rounded-lg py-2 px-4 text-center shadow-sm"
                    >
                      <span className="text-[13px] font-medium text-[#00a884]">
                        {choice.label || 'Botão'}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Timestamp */}
                <div className="text-right mt-1">
                  <span className="text-[10px] text-gray-400">
                    {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {attendanceMode === 'hybrid' && (
            <div className="bg-[hsl(var(--avivar-primary)/0.05)] border border-[hsl(var(--avivar-primary)/0.2)] rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-[hsl(var(--avivar-primary))] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[hsl(var(--avivar-foreground))]">Modo Híbrido Ativo</p>
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] mt-1">
                    O lead verá os botões acima ao iniciar a conversa. Se ele digitar uma pergunta em texto livre
                    em vez de clicar nos botões, a IA mudará automaticamente para o modo humanizado e responderá
                    de forma natural seguindo o fluxo de atendimento.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
