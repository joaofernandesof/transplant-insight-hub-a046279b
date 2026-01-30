/**
 * Expanded View for Journey Lead
 * Two columns: Lead Details (left) + Chat History (right)
 */

import { useState, useEffect, useRef } from 'react';
import { PatientJourney, SERVICE_LABELS, STAGE_LABELS, COMMERCIAL_STAGES, POST_SALE_STAGES } from '../types';
import { getStageConfig, getStageProgress, canAdvanceStage } from '../hooks/usePatientJourneys';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar,
  ChevronRight,
  ChevronDown,
  Lock,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  Save,
  Loader2,
  Send,
  Paperclip,
  Mic,
  Image,
  Tag,
  ListTodo,
  X,
  MessageSquare,
  Bot
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface JourneyExpandedViewProps {
  journey: PatientJourney | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (updates: Partial<PatientJourney>) => void;
  onAdvance: () => void;
}

// Mock messages for demo - in production, this would come from a messages table
interface ChatMessage {
  id: string;
  content: string;
  fromLead: boolean;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  isBot?: boolean;
}

export function JourneyExpandedView({
  journey,
  open,
  onClose,
  onUpdate,
  onAdvance
}: JourneyExpandedViewProps) {
  const [localData, setLocalData] = useState<Partial<PatientJourney>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [infoExpanded, setInfoExpanded] = useState(true);
  const [checklistExpanded, setChecklistExpanded] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock messages - replace with actual data
  const [messages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: 'Olá! Vi que vocês fazem transplante capilar. Gostaria de saber mais sobre o procedimento.',
      fromLead: true,
      timestamp: new Date(Date.now() - 3600000 * 24),
      status: 'read'
    },
    {
      id: '2',
      content: 'Olá! 👋 Seja bem-vindo(a) à Avivar! Temos sim, somos especialistas em transplante capilar com técnica FUE. Como posso te ajudar hoje?',
      fromLead: false,
      timestamp: new Date(Date.now() - 3600000 * 23),
      status: 'read',
      isBot: true
    },
    {
      id: '3',
      content: 'Qual o valor médio do procedimento?',
      fromLead: true,
      timestamp: new Date(Date.now() - 3600000 * 22),
      status: 'read'
    },
    {
      id: '4',
      content: 'O valor varia de acordo com o grau de calvície e área a ser tratada. Para uma avaliação precisa, agendamos uma consulta gratuita. Qual o melhor dia para você?',
      fromLead: false,
      timestamp: new Date(Date.now() - 3600000 * 21),
      status: 'read',
      isBot: true
    },
  ]);

  // Sync local data when journey changes
  useEffect(() => {
    if (journey) {
      setLocalData({
        patient_name: journey.patient_name,
        patient_phone: journey.patient_phone,
        patient_email: journey.patient_email,
        service_type: journey.service_type,
        notes: journey.notes,
        lead_source: journey.lead_source,
      });
      setHasChanges(false);
    }
  }, [journey]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!journey) return null;

  const stageConfig = getStageConfig(journey.current_stage);
  const progress = stageConfig ? getStageProgress(journey, stageConfig) : 0;
  const { canAdvance, message: advanceMessage } = canAdvanceStage(journey);
  const stages = journey.journey_type === 'comercial' ? COMMERCIAL_STAGES : POST_SALE_STAGES;
  const shortId = journey.id.slice(0, 8).toUpperCase();

  const handleLocalChange = (field: keyof PatientJourney, value: any) => {
    setLocalData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(localData);
      setHasChanges(false);
      toast.success('Informações salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar informações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChecklistChange = (field: keyof PatientJourney, checked: boolean) => {
    onUpdate({ [field]: checked });
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    // In production, this would send the message
    toast.success('Mensagem enviada!');
    setMessageText('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[85vh] p-0 gap-0 bg-[hsl(var(--avivar-background))]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(var(--avivar-primary))] to-[hsl(var(--avivar-accent))] flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-[hsl(var(--avivar-foreground))]">{journey.patient_name}</h2>
              <div className="flex items-center gap-2 text-xs text-[hsl(var(--avivar-muted-foreground))]">
                <span>Lead #{shortId}</span>
                <span>•</span>
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                  {STAGE_LABELS[journey.current_stage]}
                </Badge>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content: Two Columns */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Column: Lead Details */}
          <div className="w-[380px] border-r border-[hsl(var(--avivar-border))] flex flex-col bg-[hsl(var(--avivar-card))]">
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {/* Stage Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-[hsl(var(--avivar-foreground))]">Progresso</span>
                    <span className={cn(
                      "font-bold",
                      progress === 100 ? "text-emerald-500" : "text-amber-500"
                    )}>
                      {progress}%
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  {/* Stage Timeline */}
                  <div className="flex gap-1 mt-2">
                    {stages.slice(0, 5).map((stage, idx) => {
                      const isCurrent = stage.id === journey.current_stage;
                      const isPast = stages.findIndex(s => s.id === journey.current_stage) > idx;
                      
                      return (
                        <div
                          key={stage.id}
                          className={cn(
                            "flex-1 h-1.5 rounded-full transition-colors",
                            isCurrent && stage.statusColor,
                            isPast && "bg-emerald-500",
                            !isCurrent && !isPast && "bg-[hsl(var(--avivar-muted))]"
                          )}
                          title={stage.label}
                        />
                      );
                    })}
                  </div>
                </div>

                <Separator className="bg-[hsl(var(--avivar-border))]" />

                {/* Patient Info - Collapsible */}
                <Collapsible open={infoExpanded} onOpenChange={setInfoExpanded}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full py-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--avivar-foreground))]">
                      <User className="h-4 w-4" />
                      Informações do Lead
                    </div>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", infoExpanded && "rotate-180")} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-3 space-y-3">
                    <div>
                      <Label className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Nome Completo</Label>
                      <Input
                        value={localData.patient_name || ''}
                        onChange={(e) => handleLocalChange('patient_name', e.target.value)}
                        className="mt-1 h-8 text-sm bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Telefone</Label>
                        <Input
                          value={localData.patient_phone || ''}
                          onChange={(e) => handleLocalChange('patient_phone', e.target.value)}
                          placeholder="(11) 99999-9999"
                          className="mt-1 h-8 text-sm bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Email</Label>
                        <Input
                          value={localData.patient_email || ''}
                          onChange={(e) => handleLocalChange('patient_email', e.target.value)}
                          className="mt-1 h-8 text-sm bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Serviço</Label>
                      <Select
                        value={localData.service_type || journey.service_type}
                        onValueChange={(value) => handleLocalChange('service_type', value)}
                      >
                        <SelectTrigger className="mt-1 h-8 text-sm bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="capilar">Transplante Capilar</SelectItem>
                          <SelectItem value="barba">Transplante de Barba</SelectItem>
                          <SelectItem value="sobrancelha">Transplante de Sobrancelha</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Origem</Label>
                      <Input
                        value={localData.lead_source || ''}
                        onChange={(e) => handleLocalChange('lead_source', e.target.value)}
                        placeholder="Instagram, Google, etc."
                        className="mt-1 h-8 text-sm bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]"
                      />
                    </div>
                    
                    {hasChanges && (
                      <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        size="sm"
                        className="w-full bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))]"
                      >
                        {isSaving ? (
                          <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> Salvando...</>
                        ) : (
                          <><Save className="h-3 w-3 mr-1.5" /> Salvar Alterações</>
                        )}
                      </Button>
                    )}
                  </CollapsibleContent>
                </Collapsible>

                <Separator className="bg-[hsl(var(--avivar-border))]" />

                {/* Checklist - Collapsible */}
                {stageConfig && (
                  <Collapsible open={checklistExpanded} onOpenChange={setChecklistExpanded}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full py-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--avivar-foreground))]">
                        <FileText className="h-4 w-4" />
                        Checklist: {stageConfig.label}
                      </div>
                      <ChevronDown className={cn("h-4 w-4 transition-transform", checklistExpanded && "rotate-180")} />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3 space-y-2">
                      <p className="text-[10px] text-[hsl(var(--avivar-muted-foreground))]">
                        Itens preenchidos pela IA durante atendimento
                      </p>
                      {stageConfig.checklist.map(item => {
                        const value = journey[item.field];
                        const isChecked = typeof value === 'boolean' ? value : false;

                        return (
                          <div 
                            key={item.id}
                            className={cn(
                              "flex items-center gap-2 p-2 rounded-lg border transition-colors",
                              isChecked 
                                ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800" 
                                : "bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]"
                            )}
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) => handleChecklistChange(item.field, !!checked)}
                              className="h-4 w-4"
                            />
                            <span className={cn(
                              "text-xs flex-1",
                              isChecked && "line-through text-[hsl(var(--avivar-muted-foreground))]"
                            )}>
                              {item.label}
                            </span>
                            {item.required && !isChecked && (
                              <Badge variant="destructive" className="text-[8px] h-4 px-1">*</Badge>
                            )}
                          </div>
                        );
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                )}

                <Separator className="bg-[hsl(var(--avivar-border))]" />

                {/* Notes */}
                <div>
                  <Label className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Observações</Label>
                  <Textarea
                    value={localData.notes || ''}
                    onChange={(e) => handleLocalChange('notes', e.target.value)}
                    placeholder="Adicione observações..."
                    className="mt-1 min-h-[60px] text-sm bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))]"
                  />
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="text-xs border-[hsl(var(--avivar-border))]">
                    <ListTodo className="h-3 w-3 mr-1.5" />
                    Criar Tarefa
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs border-[hsl(var(--avivar-border))]">
                    <Tag className="h-3 w-3 mr-1.5" />
                    Adicionar Tag
                  </Button>
                </div>

                {/* Blocking Message */}
                {!canAdvance && advanceMessage && (
                  <div className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-xs text-amber-700 dark:text-amber-400">
                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>{advanceMessage}</span>
                  </div>
                )}

                {/* Advance Button */}
                <Button
                  onClick={onAdvance}
                  disabled={!canAdvance}
                  className={cn(
                    "w-full",
                    canAdvance 
                      ? "bg-emerald-600 hover:bg-emerald-700" 
                      : "bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-muted-foreground))]"
                  )}
                >
                  {canAdvance ? (
                    <>Avançar Etapa <ChevronRight className="h-4 w-4 ml-1" /></>
                  ) : (
                    <><Lock className="h-4 w-4 mr-1" /> Bloqueado</>
                  )}
                </Button>

                {/* Metadata */}
                <div className="text-[10px] text-[hsl(var(--avivar-muted-foreground))] space-y-1">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Criado: {format(new Date(journey.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </div>
                  {journey.converted_at && (
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      Convertido: {format(new Date(journey.converted_at), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Right Column: Chat History */}
          <div className="flex-1 flex flex-col bg-[hsl(var(--avivar-background))]">
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))]">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
                <span className="font-medium text-sm text-[hsl(var(--avivar-foreground))]">Histórico de Conversa</span>
                <Badge variant="secondary" className="text-[10px] ml-auto">
                  {messages.length} mensagens
                </Badge>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex",
                      msg.fromLead ? "justify-start" : "justify-end"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2 space-y-1",
                        msg.fromLead
                          ? "bg-[hsl(var(--avivar-muted))] rounded-bl-md"
                          : "bg-gradient-to-br from-[hsl(var(--avivar-primary))] to-[hsl(var(--avivar-accent))] text-white rounded-br-md"
                      )}
                    >
                      {msg.isBot && !msg.fromLead && (
                        <div className="flex items-center gap-1 text-[10px] opacity-75 mb-1">
                          <Bot className="h-3 w-3" />
                          <span>SalesBot</span>
                        </div>
                      )}
                      <p className="text-sm">{msg.content}</p>
                      <div className={cn(
                        "flex items-center gap-1 text-[10px]",
                        msg.fromLead ? "text-[hsl(var(--avivar-muted-foreground))]" : "text-white/70"
                      )}>
                        <span>{format(msg.timestamp, "HH:mm")}</span>
                        {!msg.fromLead && (
                          <CheckCircle2 className={cn(
                            "h-3 w-3",
                            msg.status === 'read' ? "text-blue-300" : "opacity-50"
                          )} />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-3 border-t border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))]">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <Textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="min-h-[44px] max-h-[120px] pr-24 resize-none bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  {/* Attachment buttons inside input */}
                  <div className="absolute right-2 bottom-2 flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-[hsl(var(--avivar-muted-foreground))]">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-[hsl(var(--avivar-muted-foreground))]">
                      <Image className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-[hsl(var(--avivar-muted-foreground))]">
                      <Mic className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Button 
                  onClick={handleSendMessage}
                  disabled={!messageText.trim()}
                  className="h-[44px] px-4 bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))]"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
