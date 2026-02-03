/**
 * ConversationTemplateEditor - Editor de templates de conversa fixo em 4 passos
 * Nicho fixo: Transplante Capilar (sem opção de escolha)
 * Passos: 1-Apresentação, 2-Qualificação, 3-Agendamento, 4-Confirmação
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { MessageCircle, Play, Save, CheckCircle, ChevronRight, Sparkles } from 'lucide-react';

interface TemplateStep {
  id: string;
  numero: number;
  titulo: string;
  descricao: string;
  mensagem: string;
  variaveis: string[];
}

const FIXED_TEMPLATE_STEPS: TemplateStep[] = [
  {
    id: 'apresentacao',
    numero: 1,
    titulo: 'Apresentação',
    descricao: 'Saudação inicial e identificação do lead',
    mensagem: `Olá! 👋 Bem-vindo(a) à {clinica}! Eu sou {atendente}, assistente virtual especializado em Transplante Capilar.

Como posso te ajudar hoje? Você está interessado(a) em:
• Transplante Capilar
• Transplante de Barba
• Transplante de Sobrancelha
• Tratamentos capilares

Por favor, me diga seu nome para que eu possa personalizar nosso atendimento! 😊`,
    variaveis: ['{clinica}', '{atendente}', '{nome}']
  },
  {
    id: 'qualificacao',
    numero: 2,
    titulo: 'Qualificação',
    descricao: 'Entender necessidades e expectativas do lead',
    mensagem: `Prazer em te conhecer, {nome}! 🙌

Para que eu possa te orientar melhor sobre o procedimento ideal, me conta:

1️⃣ Qual área você gostaria de tratar? (calvície, entradas, coroa, barba, etc.)
2️⃣ Há quanto tempo você percebeu a queda ou falha?
3️⃣ Você já fez algum tratamento capilar antes?

Fique tranquilo(a), todas as informações são confidenciais e nos ajudam a preparar uma avaliação personalizada para você.`,
    variaveis: ['{nome}', '{procedimento}']
  },
  {
    id: 'agendamento',
    numero: 3,
    titulo: 'Agendamento',
    descricao: 'Oferecer horários e agendar consulta',
    mensagem: `Perfeito, {nome}! 📋 

Pelo que você me contou, o ideal seria agendar uma avaliação {tipo_consulta} com nosso especialista {dr_nome}.

Temos horários disponíveis nos próximos dias:
{horarios_disponiveis}

Qual horário funciona melhor para você? 📅

💡 A avaliação tem duração de aproximadamente {duracao} minutos e é o primeiro passo para um resultado natural e definitivo!`,
    variaveis: ['{nome}', '{tipo_consulta}', '{dr_nome}', '{horarios_disponiveis}', '{duracao}']
  },
  {
    id: 'confirmacao',
    numero: 4,
    titulo: 'Confirmação',
    descricao: 'Confirmar agendamento e orientações finais',
    mensagem: `Ótimo, {nome}! ✅ Sua avaliação está confirmada!

📅 *Data:* {data_consulta}
⏰ *Horário:* {horario_consulta}
📍 *Local:* {endereco}
👨‍⚕️ *Especialista:* {dr_nome}

Orientações importantes:
• Chegue com 10 minutos de antecedência
• Traga documento com foto
• Se tiver exames anteriores, pode trazer também

Vou te enviar um lembrete um dia antes da consulta.

Qualquer dúvida, estou à disposição! 💪`,
    variaveis: ['{nome}', '{data_consulta}', '{horario_consulta}', '{endereco}', '{dr_nome}']
  }
];

interface ConversationTemplateEditorProps {
  onSave?: (steps: TemplateStep[]) => void;
}

export function ConversationTemplateEditor({ onSave }: ConversationTemplateEditorProps) {
  const [steps, setSteps] = useState<TemplateStep[]>(FIXED_TEMPLATE_STEPS);
  const [activeStep, setActiveStep] = useState<string>('apresentacao');
  const [testingStep, setTestingStep] = useState<string | null>(null);

  const handleStepChange = (stepId: string, newMessage: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, mensagem: newMessage } : step
    ));
  };

  const handleTestMessage = (stepId: string) => {
    setTestingStep(stepId);
    const step = steps.find(s => s.id === stepId);
    
    if (step) {
      // Simular teste da mensagem
      toast.success(`Testando mensagem do passo ${step.numero}...`, {
        description: 'Mensagem enviada para preview',
        duration: 2000
      });
    }

    setTimeout(() => setTestingStep(null), 2000);
  };

  const handleSave = () => {
    onSave?.(steps);
    toast.success('Template salvo com sucesso!');
  };

  const currentStep = steps.find(s => s.id === activeStep);

  return (
    <div className="space-y-6">
      {/* Header fixo - Transplante Capilar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
            Template de Conversa
          </h2>
          <p className="text-sm text-[hsl(var(--avivar-muted-foreground))] mt-1">
            Fluxo de atendimento para <Badge variant="secondary">Transplante Capilar</Badge>
          </p>
        </div>
        <Button onClick={handleSave} className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white">
          <Save className="h-4 w-4 mr-2" />
          Salvar Template
        </Button>
      </div>

      {/* Steps Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {steps.map((step, index) => (
          <button
            key={step.id}
            onClick={() => setActiveStep(step.id)}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-all min-w-fit ${
              activeStep === step.id 
                ? 'bg-[hsl(var(--avivar-primary))] text-white border-[hsl(var(--avivar-primary))]' 
                : 'bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] hover:border-[hsl(var(--avivar-primary)/0.5)]'
            }`}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
              activeStep === step.id ? 'bg-white/20' : 'bg-[hsl(var(--avivar-primary)/0.1)] text-[hsl(var(--avivar-primary))]'
            }`}>
              {step.numero}
            </div>
            <div className="text-left">
              <div className="font-medium text-sm">{step.titulo}</div>
            </div>
            {index < steps.length - 1 && (
              <ChevronRight className={`h-4 w-4 ml-1 ${activeStep === step.id ? 'text-white/50' : 'text-[hsl(var(--avivar-muted-foreground))]'}`} />
            )}
          </button>
        ))}
      </div>

      {/* Active Step Editor */}
      {currentStep && (
        <Card className="border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))]">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-[hsl(var(--avivar-foreground))]">
                  <MessageCircle className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
                  Passo {currentStep.numero}: {currentStep.titulo}
                </CardTitle>
                <p className="text-sm text-[hsl(var(--avivar-muted-foreground))] mt-1">
                  {currentStep.descricao}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTestMessage(currentStep.id)}
                disabled={testingStep === currentStep.id}
                className="border-[hsl(var(--avivar-border))]"
              >
                {testingStep === currentStep.id ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    Testando...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Testar Mensagem
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Editor de mensagem */}
            <div className="space-y-2">
              <Label className="text-[hsl(var(--avivar-foreground))]">Mensagem do passo</Label>
              <Textarea
                value={currentStep.mensagem}
                onChange={(e) => handleStepChange(currentStep.id, e.target.value)}
                className="min-h-[200px] font-mono text-sm bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                placeholder="Digite a mensagem para este passo..."
              />
            </div>

            {/* Variáveis disponíveis */}
            <div className="space-y-2">
              <Label className="text-[hsl(var(--avivar-muted-foreground))] text-xs uppercase tracking-wide">
                Variáveis disponíveis (clique para copiar)
              </Label>
              <div className="flex flex-wrap gap-2">
                {currentStep.variaveis.map((variavel) => (
                  <Badge
                    key={variavel}
                    variant="outline"
                    className="cursor-pointer hover:bg-[hsl(var(--avivar-primary)/0.1)] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                    onClick={() => {
                      navigator.clipboard.writeText(variavel);
                      toast.success(`"${variavel}" copiado!`);
                    }}
                  >
                    {variavel}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Preview da mensagem */}
            <div className="space-y-2">
              <Label className="text-[hsl(var(--avivar-muted-foreground))] text-xs uppercase tracking-wide">
                Preview
              </Label>
              <div className="bg-[hsl(var(--avivar-muted))] rounded-lg p-4 border border-[hsl(var(--avivar-border))]">
                <div className="bg-green-500/10 rounded-lg p-3 max-w-[80%] ml-auto">
                  <p className="text-sm whitespace-pre-wrap text-[hsl(var(--avivar-foreground))]">
                    {currentStep.mensagem
                      .replace('{clinica}', 'Clínica Exemplo')
                      .replace('{atendente}', 'Sofia')
                      .replace('{nome}', 'João')
                      .replace('{dr_nome}', 'Dr. Carlos')
                      .replace('{tipo_consulta}', 'presencial')
                      .replace('{duracao}', '60')
                      .replace('{procedimento}', 'Transplante Capilar')
                      .replace('{horarios_disponiveis}', '• Segunda 10h\n• Terça 14h\n• Quarta 9h')
                      .replace('{data_consulta}', '15/01/2025')
                      .replace('{horario_consulta}', '10:00')
                      .replace('{endereco}', 'Av. Paulista, 1000 - São Paulo')}
                  </p>
                  <span className="text-xs text-[hsl(var(--avivar-muted-foreground))] mt-2 block text-right">
                    Preview com dados de exemplo
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
