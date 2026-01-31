/**
 * Etapa 14: Fluxo de Atendimento
 * Passos cronológicos + Passos extras para a IA seguir
 */

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SubnichoType, NichoType, FluxoAtendimento, FluxoStep } from '../../types';
import { getFluxoAtendimentoConfig } from '../../nichoConfig';
import { 
  RefreshCw, 
  ListOrdered, 
  Sparkles, 
  Plus, 
  Trash2, 
  GripVertical,
  Edit3,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface StepFluxoAtendimentoProps {
  fluxoAtendimento: FluxoAtendimento;
  attendantName: string;
  companyName: string;
  nicho: NichoType | null;
  subnicho: SubnichoType | null;
  onChange: (fluxo: FluxoAtendimento) => void;
}

interface EditingStep {
  type: 'cronologico' | 'extra';
  index: number;
  step: FluxoStep;
}

export function StepFluxoAtendimento({
  fluxoAtendimento,
  attendantName,
  companyName,
  nicho,
  subnicho,
  onChange
}: StepFluxoAtendimentoProps) {
  const lastSubnichoRef = useRef<SubnichoType | null>(null);
  const hasInitializedRef = useRef(false);
  const [editingStep, setEditingStep] = useState<EditingStep | null>(null);
  const [tempTitulo, setTempTitulo] = useState('');
  const [tempDescricao, setTempDescricao] = useState('');

  // Preenche automaticamente baseado no subnicho
  useEffect(() => {
    const fluxoConfig = getFluxoAtendimentoConfig(subnicho);
    
    // Primeira vez que o componente monta
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      
      // Se não tem conteúdo
      const isEmpty = fluxoAtendimento.passosCronologicos.length === 0 && 
                      fluxoAtendimento.passosExtras.length === 0;
      
      if (isEmpty) {
        onChange(fluxoConfig);
      }
      
      lastSubnichoRef.current = subnicho;
      return;
    }
    
    // Se o subnicho mudou, atualiza os campos
    if (subnicho !== lastSubnichoRef.current) {
      onChange(fluxoConfig);
      lastSubnichoRef.current = subnicho;
    }
  }, [subnicho, fluxoAtendimento, onChange]);

  const resetFluxo = () => {
    const fluxoConfig = getFluxoAtendimentoConfig(subnicho);
    onChange(fluxoConfig);
  };

  const generateId = () => `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Adicionar passo
  const addStep = (type: 'cronologico' | 'extra') => {
    const newStep: FluxoStep = {
      id: generateId(),
      ordem: type === 'cronologico' 
        ? fluxoAtendimento.passosCronologicos.length + 1
        : fluxoAtendimento.passosExtras.length + 1,
      titulo: type === 'cronologico' ? `Passo ${fluxoAtendimento.passosCronologicos.length + 1}` : 'Novo Passo Extra',
      descricao: ''
    };

    if (type === 'cronologico') {
      onChange({
        ...fluxoAtendimento,
        passosCronologicos: [...fluxoAtendimento.passosCronologicos, newStep]
      });
    } else {
      onChange({
        ...fluxoAtendimento,
        passosExtras: [...fluxoAtendimento.passosExtras, newStep]
      });
    }
  };

  // Remover passo
  const removeStep = (type: 'cronologico' | 'extra', index: number) => {
    if (type === 'cronologico') {
      const newPassos = fluxoAtendimento.passosCronologicos.filter((_, i) => i !== index);
      // Reordena
      newPassos.forEach((p, i) => p.ordem = i + 1);
      onChange({
        ...fluxoAtendimento,
        passosCronologicos: newPassos
      });
    } else {
      const newPassos = fluxoAtendimento.passosExtras.filter((_, i) => i !== index);
      newPassos.forEach((p, i) => p.ordem = i + 1);
      onChange({
        ...fluxoAtendimento,
        passosExtras: newPassos
      });
    }
  };

  // Mover passo para cima
  const moveUp = (type: 'cronologico' | 'extra', index: number) => {
    if (index === 0) return;
    
    if (type === 'cronologico') {
      const newPassos = [...fluxoAtendimento.passosCronologicos];
      [newPassos[index - 1], newPassos[index]] = [newPassos[index], newPassos[index - 1]];
      newPassos.forEach((p, i) => p.ordem = i + 1);
      onChange({ ...fluxoAtendimento, passosCronologicos: newPassos });
    } else {
      const newPassos = [...fluxoAtendimento.passosExtras];
      [newPassos[index - 1], newPassos[index]] = [newPassos[index], newPassos[index - 1]];
      newPassos.forEach((p, i) => p.ordem = i + 1);
      onChange({ ...fluxoAtendimento, passosExtras: newPassos });
    }
  };

  // Mover passo para baixo
  const moveDown = (type: 'cronologico' | 'extra', index: number) => {
    const maxIndex = type === 'cronologico' 
      ? fluxoAtendimento.passosCronologicos.length - 1
      : fluxoAtendimento.passosExtras.length - 1;
    
    if (index === maxIndex) return;
    
    if (type === 'cronologico') {
      const newPassos = [...fluxoAtendimento.passosCronologicos];
      [newPassos[index], newPassos[index + 1]] = [newPassos[index + 1], newPassos[index]];
      newPassos.forEach((p, i) => p.ordem = i + 1);
      onChange({ ...fluxoAtendimento, passosCronologicos: newPassos });
    } else {
      const newPassos = [...fluxoAtendimento.passosExtras];
      [newPassos[index], newPassos[index + 1]] = [newPassos[index + 1], newPassos[index]];
      newPassos.forEach((p, i) => p.ordem = i + 1);
      onChange({ ...fluxoAtendimento, passosExtras: newPassos });
    }
  };

  // Abrir editor de passo
  const openEditor = (type: 'cronologico' | 'extra', index: number) => {
    const step = type === 'cronologico' 
      ? fluxoAtendimento.passosCronologicos[index]
      : fluxoAtendimento.passosExtras[index];
    
    setEditingStep({ type, index, step });
    setTempTitulo(step.titulo);
    setTempDescricao(step.descricao);
  };

  // Salvar edição
  const saveEdit = () => {
    if (!editingStep) return;

    const updatedStep = {
      ...editingStep.step,
      titulo: tempTitulo,
      descricao: tempDescricao
    };

    if (editingStep.type === 'cronologico') {
      const newPassos = [...fluxoAtendimento.passosCronologicos];
      newPassos[editingStep.index] = updatedStep;
      onChange({ ...fluxoAtendimento, passosCronologicos: newPassos });
    } else {
      const newPassos = [...fluxoAtendimento.passosExtras];
      newPassos[editingStep.index] = updatedStep;
      onChange({ ...fluxoAtendimento, passosExtras: newPassos });
    }

    setEditingStep(null);
    setTempTitulo('');
    setTempDescricao('');
  };

  const renderStepCard = (step: FluxoStep, index: number, type: 'cronologico' | 'extra') => {
    const isCronologico = type === 'cronologico';
    const maxIndex = isCronologico 
      ? fluxoAtendimento.passosCronologicos.length - 1
      : fluxoAtendimento.passosExtras.length - 1;

    return (
      <div
        key={step.id}
        className="group bg-[hsl(var(--avivar-input))] rounded-lg p-4 border border-[hsl(var(--avivar-border))] hover:border-[hsl(var(--avivar-primary)/0.5)] transition-colors"
      >
        <div className="flex items-start gap-3">
          {/* Número/Ícone */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
            isCronologico 
              ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
              : 'bg-gradient-to-br from-purple-500 to-pink-600'
          }`}>
            {isCronologico ? step.ordem : '✦'}
          </div>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-[hsl(var(--avivar-foreground))] truncate">
              {step.titulo}
            </h4>
            {step.descricao && (
              <p className="text-sm text-[hsl(var(--avivar-muted-foreground))] mt-1 line-clamp-2">
                {step.descricao}
              </p>
            )}
          </div>

          {/* Ações */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isCronologico && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => moveUp(type, index)}
                  disabled={index === 0}
                  className="h-7 w-7 text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))]"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => moveDown(type, index)}
                  disabled={index === maxIndex}
                  className="h-7 w-7 text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))]"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openEditor(type, index)}
              className="h-7 w-7 text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))]"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeStep(type, index)}
              className="h-7 w-7 text-red-400 hover:text-red-500 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
          Fluxo de Atendimento
        </h2>
        <p className="text-[hsl(var(--avivar-muted-foreground))]">
          Defina os passos que {attendantName || 'a IA'} deve seguir durante o atendimento
        </p>
      </div>

      <div className="max-w-xl mx-auto space-y-6">
        {/* Passos Cronológicos */}
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 px-4 py-3 border-b border-[hsl(var(--avivar-border))]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <ListOrdered className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-[hsl(var(--avivar-foreground))]">
                    Passos Cronológicos
                  </h3>
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                    A IA segue esses passos em ordem
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFluxo}
                className="text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))]"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Restaurar
              </Button>
            </div>
          </div>
          <CardContent className="p-4 space-y-3">
            {fluxoAtendimento.passosCronologicos.map((step, index) => 
              renderStepCard(step, index, 'cronologico')
            )}
            
            <Button
              variant="outline"
              onClick={() => addStep('cronologico')}
              className="w-full border-dashed border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))] hover:border-[hsl(var(--avivar-primary)/0.5)]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Passo
            </Button>
          </CardContent>
        </Card>

        {/* Passos Extras */}
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 px-4 py-3 border-b border-[hsl(var(--avivar-border))]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-[hsl(var(--avivar-foreground))]">
                    Passos Extras
                  </h3>
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                    Usados quando o lead foge do script
                  </p>
                </div>
              </div>
            </div>
          </div>
          <CardContent className="p-4 space-y-3">
            {fluxoAtendimento.passosExtras.length === 0 ? (
              <div className="text-center py-4 text-[hsl(var(--avivar-muted-foreground))]">
                <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum passo extra configurado</p>
                <p className="text-xs mt-1">Adicione passos para situações fora do script</p>
              </div>
            ) : (
              fluxoAtendimento.passosExtras.map((step, index) => 
                renderStepCard(step, index, 'extra')
              )
            )}
            
            <Button
              variant="outline"
              onClick={() => addStep('extra')}
              className="w-full border-dashed border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))] hover:border-[hsl(var(--avivar-primary)/0.5)]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Passo Extra
            </Button>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-[hsl(var(--avivar-primary)/0.05)] border-[hsl(var(--avivar-primary)/0.3)]">
          <CardContent className="p-4">
            <h4 className="font-medium text-[hsl(var(--avivar-foreground))] mb-2 flex items-center gap-2">
              💡 Como funciona?
            </h4>
            <div className="text-sm text-[hsl(var(--avivar-muted-foreground))] space-y-2">
              <p>
                <strong className="text-[hsl(var(--avivar-foreground))]">Passos Cronológicos:</strong>{' '}
                A IA segue esses passos em ordem durante o atendimento normal.
              </p>
              <p>
                <strong className="text-[hsl(var(--avivar-foreground))]">Passos Extras:</strong>{' '}
                Quando o lead foge do script (perguntas inesperadas), a IA usa esses passos 
                ou a base de conhecimento para responder e depois retorna ao fluxo principal.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editingStep !== null} onOpenChange={(open) => !open && setEditingStep(null)}>
        <DialogContent className="max-w-lg bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[hsl(var(--avivar-foreground))]">
              {editingStep?.type === 'cronologico' ? (
                <ListOrdered className="h-5 w-5 text-blue-500" />
              ) : (
                <Sparkles className="h-5 w-5 text-purple-500" />
              )}
              Editar {editingStep?.type === 'cronologico' ? `Passo ${editingStep?.step.ordem}` : 'Passo Extra'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[hsl(var(--avivar-foreground))]">
                Título do Passo
              </label>
              <Input
                value={tempTitulo}
                onChange={(e) => setTempTitulo(e.target.value)}
                placeholder="Ex: Saudação inicial"
                className="mt-1 bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-[hsl(var(--avivar-foreground))]">
                Descrição / Instruções
              </label>
              <Textarea
                value={tempDescricao}
                onChange={(e) => setTempDescricao(e.target.value)}
                rows={6}
                placeholder="Descreva o que a IA deve fazer neste passo..."
                className="mt-1 bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] placeholder:text-[hsl(var(--avivar-muted-foreground))] resize-none"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setEditingStep(null)}
                className="border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
              >
                Cancelar
              </Button>
              <Button
                onClick={saveEdit}
                className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white"
              >
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
