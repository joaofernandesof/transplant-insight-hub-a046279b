/**
 * Editor for creating/editing cadence sequences
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  MessageSquare,
  Mail,
  Phone,
  PhoneCall,
  Plus,
  Trash2,
  GripVertical,
  Clock,
  ArrowRight,
  Save,
  X,
  Variable,
  Sparkles,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  CadenceSequence, 
  CadenceStep,
  TEMPLATE_VARIABLES,
  useCreateCadence,
  useCadenceSequenceWithSteps
} from '../hooks/useCadences';
import { toast } from 'sonner';

const CHANNELS = [
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, color: 'bg-green-500' },
  { id: 'sms', label: 'SMS', icon: Phone, color: 'bg-blue-500' },
  { id: 'email', label: 'Email', icon: Mail, color: 'bg-purple-500' },
  { id: 'call', label: 'Ligação', icon: PhoneCall, color: 'bg-amber-500' },
] as const;

const DELAY_PRESETS = [
  { value: 15, label: '15 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 60, label: '1 hora' },
  { value: 120, label: '2 horas' },
  { value: 240, label: '4 horas' },
  { value: 480, label: '8 horas' },
  { value: 1440, label: '1 dia' },
  { value: 2880, label: '2 dias' },
  { value: 4320, label: '3 dias' },
  { value: 10080, label: '1 semana' },
];

interface StepData {
  id?: string;
  channel: 'whatsapp' | 'sms' | 'email' | 'call';
  delay_minutes: number;
  message_template: string;
  subject?: string;
  is_active: boolean;
}

interface CadenceEditorProps {
  open: boolean;
  onClose: () => void;
  editSequence?: CadenceSequence | null;
}

export function CadenceEditor({ open, onClose, editSequence }: CadenceEditorProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState<string>('no_response');
  const [steps, setSteps] = useState<StepData[]>([]);
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);

  const createCadence = useCreateCadence();
  const { data: sequenceWithSteps } = useCadenceSequenceWithSteps(editSequence?.id || null);

  // Load edit data
  useEffect(() => {
    if (sequenceWithSteps) {
      setName(sequenceWithSteps.name);
      setDescription(sequenceWithSteps.description || '');
      setTriggerType(sequenceWithSteps.trigger_type);
      setSteps(sequenceWithSteps.steps?.map(s => ({
        id: s.id,
        channel: s.channel as any,
        delay_minutes: s.delay_minutes,
        message_template: s.message_template,
        subject: s.subject,
        is_active: s.is_active
      })) || []);
    } else if (!editSequence) {
      // Reset for new
      setName('');
      setDescription('');
      setTriggerType('no_response');
      setSteps([]);
    }
  }, [sequenceWithSteps, editSequence]);

  const addStep = () => {
    const newStep: StepData = {
      channel: 'whatsapp',
      delay_minutes: 30,
      message_template: '',
      is_active: true
    };
    setSteps([...steps, newStep]);
    setActiveStepIndex(steps.length);
  };

  const updateStep = (index: number, updates: Partial<StepData>) => {
    setSteps(steps.map((step, i) => i === index ? { ...step, ...updates } : step));
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
    if (activeStepIndex === index) {
      setActiveStepIndex(null);
    }
  };

  const insertVariable = (variable: string) => {
    if (activeStepIndex !== null) {
      const currentMessage = steps[activeStepIndex].message_template;
      updateStep(activeStepIndex, { 
        message_template: currentMessage + variable 
      });
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Informe um nome para a cadência');
      return;
    }
    if (steps.length === 0) {
      toast.error('Adicione pelo menos um passo na cadência');
      return;
    }
    if (steps.some(s => !s.message_template.trim())) {
      toast.error('Preencha a mensagem de todos os passos');
      return;
    }

    createCadence.mutate({
      name,
      description,
      trigger_type: triggerType,
      steps: steps.map(s => ({
        channel: s.channel,
        delay_minutes: s.delay_minutes,
        message_template: s.message_template,
        subject: s.subject,
        is_active: s.is_active,
        step_order: 0 // Will be set by hook
      }))
    }, {
      onSuccess: () => {
        onClose();
      }
    });
  };

  const getDelayLabel = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
    return `${Math.round(minutes / 1440)}d`;
  };

  const getChannelInfo = (channelId: string) => {
    return CHANNELS.find(c => c.id === channelId) || CHANNELS[0];
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 bg-[hsl(var(--avivar-background))]">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="p-6 border-b border-[hsl(var(--avivar-border))]">
            <SheetTitle className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
              {editSequence ? 'Editar Cadência' : 'Nova Cadência'}
            </SheetTitle>
            <SheetDescription className="text-[hsl(var(--avivar-muted-foreground))]">
              Configure os passos e mensagens automáticas
            </SheetDescription>
          </SheetHeader>

          {/* Content */}
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label className="text-[hsl(var(--avivar-foreground))]">Nome da Cadência</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Follow-up Novos Leads"
                    className="mt-1 bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                  />
                </div>
                
                <div>
                  <Label className="text-[hsl(var(--avivar-foreground))]">Descrição (opcional)</Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva o objetivo desta cadência"
                    className="mt-1 bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
                  />
                </div>

                <div>
                  <Label className="text-[hsl(var(--avivar-foreground))]">Quando disparar?</Label>
                  <Select value={triggerType} onValueChange={setTriggerType}>
                    <SelectTrigger className="mt-1 bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_response">Quando lead não responder</SelectItem>
                      <SelectItem value="after_stage">Após mudança de etapa</SelectItem>
                      <SelectItem value="custom">Disparo manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Steps Builder */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-[hsl(var(--avivar-foreground))]">Passos da Cadência</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="border-[hsl(var(--avivar-border))]">
                        <Variable className="h-4 w-4 mr-1" />
                        Variáveis
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="end">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Variáveis Disponíveis</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          Clique para inserir no passo selecionado
                        </p>
                        <div className="grid grid-cols-2 gap-1">
                          {TEMPLATE_VARIABLES.map(v => (
                            <Button
                              key={v.key}
                              variant="ghost"
                              size="sm"
                              className="justify-start text-xs h-8"
                              onClick={() => insertVariable(v.key)}
                              disabled={activeStepIndex === null}
                            >
                              <code className="bg-muted px-1 rounded text-xs">{v.key}</code>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Timeline */}
                <div className="space-y-3">
                  {steps.map((step, index) => {
                    const channel = getChannelInfo(step.channel);
                    const ChannelIcon = channel.icon;
                    const isActive = activeStepIndex === index;

                    return (
                      <div key={index} className="relative">
                        {/* Connection line */}
                        {index > 0 && (
                          <div className="absolute left-5 -top-3 h-3 w-0.5 bg-[hsl(var(--avivar-border))]" />
                        )}
                        
                        <Card 
                          className={cn(
                            "bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] transition-all cursor-pointer",
                            isActive && "border-[hsl(var(--avivar-primary))] ring-1 ring-[hsl(var(--avivar-primary)/0.3)]"
                          )}
                          onClick={() => setActiveStepIndex(index)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              {/* Step number & channel */}
                              <div className="flex flex-col items-center gap-1">
                                <div className={cn(
                                  "w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm",
                                  channel.color
                                )}>
                                  {index + 1}
                                </div>
                                <span className="text-[10px] text-[hsl(var(--avivar-muted-foreground))]">
                                  {channel.label}
                                </span>
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0 space-y-3">
                                {/* Channel & Delay */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Select 
                                    value={step.channel} 
                                    onValueChange={(v) => updateStep(index, { channel: v as any })}
                                  >
                                    <SelectTrigger className="w-32 h-8 text-xs bg-[hsl(var(--avivar-secondary))] border-[hsl(var(--avivar-border))]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {CHANNELS.map(c => (
                                        <SelectItem key={c.id} value={c.id}>
                                          <div className="flex items-center gap-2">
                                            <c.icon className="h-3 w-3" />
                                            {c.label}
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>

                                  <div className="flex items-center gap-1 text-xs text-[hsl(var(--avivar-muted-foreground))]">
                                    <Clock className="h-3 w-3" />
                                    após
                                  </div>

                                  <Select 
                                    value={step.delay_minutes.toString()} 
                                    onValueChange={(v) => updateStep(index, { delay_minutes: parseInt(v) })}
                                  >
                                    <SelectTrigger className="w-28 h-8 text-xs bg-[hsl(var(--avivar-secondary))] border-[hsl(var(--avivar-border))]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {DELAY_PRESETS.map(d => (
                                        <SelectItem key={d.value} value={d.value.toString()}>
                                          {d.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Subject for email */}
                                {step.channel === 'email' && (
                                  <Input
                                    value={step.subject || ''}
                                    onChange={(e) => updateStep(index, { subject: e.target.value })}
                                    placeholder="Assunto do email"
                                    className="h-8 text-sm bg-[hsl(var(--avivar-secondary))] border-[hsl(var(--avivar-border))]"
                                  />
                                )}

                                {/* Message */}
                                <Textarea
                                  value={step.message_template}
                                  onChange={(e) => updateStep(index, { message_template: e.target.value })}
                                  placeholder={step.channel === 'call' 
                                    ? "Instruções para a ligação..." 
                                    : "Digite a mensagem... Use variáveis como {{nome}}"
                                  }
                                  className="min-h-[80px] text-sm bg-[hsl(var(--avivar-secondary))] border-[hsl(var(--avivar-border))] resize-none"
                                />

                                {/* Preview variables */}
                                {step.message_template && step.message_template.includes('{{') && (
                                  <div className="flex flex-wrap gap-1">
                                    {TEMPLATE_VARIABLES.filter(v => 
                                      step.message_template.includes(v.key)
                                    ).map(v => (
                                      <Badge 
                                        key={v.key} 
                                        variant="outline" 
                                        className="text-[10px] bg-[hsl(var(--avivar-primary)/0.1)] border-[hsl(var(--avivar-primary)/0.3)] text-[hsl(var(--avivar-primary))]"
                                      >
                                        {v.label}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Remove */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-[hsl(var(--avivar-muted-foreground))] hover:text-red-500 hover:bg-red-500/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeStep(index);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}

                  {/* Add Step Button */}
                  <Button
                    variant="outline"
                    className="w-full border-dashed border-[hsl(var(--avivar-primary)/0.3)] text-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary)/0.1)]"
                    onClick={addStep}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Passo
                  </Button>
                </div>
              </div>

              {/* Info */}
              {steps.length > 0 && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-[hsl(var(--avivar-primary)/0.1)] border border-[hsl(var(--avivar-primary)/0.2)]">
                  <AlertCircle className="h-4 w-4 text-[hsl(var(--avivar-primary))] mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-[hsl(var(--avivar-primary))]">
                    Esta cadência enviará {steps.length} mensagens automaticamente. 
                    A última mensagem será enviada após {getDelayLabel(steps.reduce((acc, s) => acc + s.delay_minutes, 0))} do início.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-6 border-t border-[hsl(var(--avivar-border))] flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} className="border-[hsl(var(--avivar-border))]">
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={createCadence.isPending}
              className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {createCadence.isPending ? 'Salvando...' : 'Salvar Cadência'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
