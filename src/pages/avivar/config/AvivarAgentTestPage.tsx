/**
 * AvivarAgentTestPage - Tela de Teste Completo do Agente
 * Estilo WhatsApp para testar o agente antes de aprovar
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bot, 
  User, 
  Send, 
  ArrowLeft, 
  CheckCircle2, 
  Loader2,
  Sparkles,
  MessageSquare,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  PartyPopper
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAgentConfig } from './hooks/useAgentConfig';
import { usePromptGenerator } from './hooks/usePromptGenerator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AvivarAgentTestPage() {
  const navigate = useNavigate();
  const { config, updateConfig } = useAgentConfig();
  const { prompt } = usePromptGenerator(config);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send welcome message on load
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeContent = config.welcomeMessage || 
        `Olá! Sou ${config.attendantName || 'sua assistente'}, assistente virtual da ${config.companyName || 'clínica'}. Como posso te ajudar hoje? 😊`;
      
      const welcomeMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: welcomeContent,
        timestamp: new Date()
      };
      
      setTimeout(() => {
        setMessages([welcomeMessage]);
      }, 500);
    }
  }, [config]);

  const generateAIResponse = async (userMessage: string, history: Message[]): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke('avivar-chat-test', {
        body: {
          message: userMessage,
          history: history.map(m => ({ role: m.role, content: m.content })),
          config: {
            attendantName: config.attendantName,
            companyName: config.companyName,
            professionalName: config.professionalName,
            services: config.services.filter(s => s.enabled),
            paymentMethods: config.paymentMethods.filter(m => m.enabled),
            consultationType: config.consultationType,
            schedule: config.schedule,
            city: config.city,
            state: config.state
          },
          prompt
        }
      });

      if (error) throw error;
      return data?.response || 'Desculpe, não consegui processar sua mensagem.';
      
    } catch (error) {
      console.error('AI Error:', error);
      // Fallback response
      return generateFallbackResponse(userMessage);
    }
  };

  const generateFallbackResponse = (userMessage: string): string => {
    const msg = userMessage.toLowerCase();
    
    if (messages.length <= 1) {
      return `Olá! Meu nome é ${config.attendantName || 'Ana'} e sou assistente virtual da ${config.companyName || 'clínica'}. Como posso te ajudar hoje?`;
    }
    
    if (msg.includes('preço') || msg.includes('valor') || msg.includes('custo')) {
      return `Para fornecer valores precisos, preciso entender melhor o que você está buscando. Temos diferentes procedimentos disponíveis. Qual seria do seu interesse?`;
    }
    
    if (msg.includes('horário') || msg.includes('agendar') || msg.includes('consulta')) {
      return `Ótimo! Para agendar uma consulta, me diga: qual seria o melhor dia e horário para você? Atendemos de segunda a sexta.`;
    }
    
    if (msg.includes('transplante') || msg.includes('cabelo') || msg.includes('barba')) {
      return `Nossos procedimentos de transplante capilar são realizados pelo Dr. ${config.professionalName || 'especialista'}. Podemos agendar uma avaliação para você?`;
    }
    
    return `Entendi! Vou te ajudar com isso. Poderia me contar um pouco mais sobre sua situação atual?`;
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await generateAIResponse(userMessage.content, [...messages, userMessage]);
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao gerar resposta');
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const handleApprove = async () => {
    if (messages.length < 3) {
      toast.error('Envie pelo menos uma mensagem antes de aprovar');
      return;
    }

    try {
      // Save to database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Você precisa estar logado');
        return;
      }

      // Update config as approved
      updateConfig({ isComplete: true });
      
      // Check if config already exists
      const { data: existingConfig } = await supabase
        .from('avivar_agent_configs')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      // Prepare config data - cast to Json type for Supabase
      const configData = {
        user_id: user.id,
        template: config.template || 'transplante_capilar',
        professional_name: config.professionalName,
        company_name: config.companyName,
        attendant_name: config.attendantName,
        crm: config.crm || null,
        instagram: config.instagram || null,
        address: config.address || null,
        city: config.city || null,
        state: config.state || null,
        calendar_email: config.calendarEmail || null,
        calendar_connected: config.calendarConnected,
        services: JSON.parse(JSON.stringify(config.services)),
        payment_methods: JSON.parse(JSON.stringify(config.paymentMethods)),
        consultation_type: JSON.parse(JSON.stringify(config.consultationType)),
        before_after_images: JSON.parse(JSON.stringify(config.beforeAfterImages)),
        schedule: JSON.parse(JSON.stringify(config.schedule)),
        welcome_message: config.welcomeMessage || null,
        transfer_message: config.transferMessage || null,
        tone_of_voice: config.toneOfVoice,
        consultation_duration: config.consultationDuration,
        is_complete: true,
        is_approved: true,
        approved_at: new Date().toISOString()
      };

      // Save agent config to database
      let error;
      if (existingConfig) {
        const result = await supabase
          .from('avivar_agent_configs')
          .update(configData)
          .eq('id', existingConfig.id);
        error = result.error;
      } else {
        const result = await supabase
          .from('avivar_agent_configs')
          .insert([configData]);
        error = result.error;
      }

      if (error) {
        console.error('Save error:', error);
        // Continue anyway - localStorage backup
      }

      setIsApproved(true);
      setShowSuccessModal(true);
      toast.success('Agente aprovado com sucesso!');

      // Redirect after delay
      setTimeout(() => {
        navigate('/avivar/config/knowledge');
      }, 3000);

    } catch (error) {
      console.error('Approval error:', error);
      toast.error('Erro ao aprovar agente');
    }
  };

  const handleGoBack = () => {
    navigate('/avivar/config/wizard');
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--avivar-background))]">
      {/* Header */}
      <div className="border-b border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))]">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoBack}
                className="text-[hsl(var(--avivar-muted-foreground))]"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
              
              <div>
                <h1 className="text-lg font-bold text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
                  Teste seu Agente de IA
                </h1>
                <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                  Converse com {config.attendantName || 'o assistente'} para testar as configurações
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGoBack}
                className="border-[hsl(var(--avivar-border))]"
              >
                <ThumbsDown className="h-4 w-4 mr-1" />
                Voltar e Ajustar
              </Button>
              
              <Button
                onClick={handleApprove}
                disabled={isApproved || messages.length < 2}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
              >
                {isApproved ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Aprovado!
                  </>
                ) : (
                  <>
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    Aprovar e Finalizar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto p-4">
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] h-[calc(100vh-200px)] flex flex-col">
          {/* Chat Header */}
          <CardHeader className="border-b border-[hsl(var(--avivar-border))] py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(270_75%_45%)] to-[hsl(280_80%_50%)] flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base text-[hsl(var(--avivar-foreground))]">
                    {config.attendantName || 'Assistente Virtual'}
                  </CardTitle>
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                    {config.companyName || 'Clínica'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleClearChat}
                  className="text-[hsl(var(--avivar-muted-foreground))]"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Reiniciar
                </Button>
                <Badge className="bg-green-500/20 text-green-500">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Modo Teste
                </Badge>
              </div>
            </div>
          </CardHeader>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto text-[hsl(var(--avivar-muted-foreground))] mb-4 opacity-50" />
                  <p className="text-[hsl(var(--avivar-muted-foreground))]">
                    Aguarde a mensagem de boas-vindas...
                  </p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === 'user' && "justify-end"
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(270_75%_45%)] to-[hsl(280_80%_50%)] flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  
                  <div className={cn(
                    "max-w-[70%] rounded-2xl p-4",
                    message.role === 'user'
                      ? "bg-[hsl(var(--avivar-primary))] text-white rounded-br-sm"
                      : "bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-foreground))] rounded-bl-sm"
                  )}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className={cn(
                      "text-xs mt-2",
                      message.role === 'user' ? "text-white/70" : "text-[hsl(var(--avivar-muted-foreground))]"
                    )}>
                      {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-[hsl(var(--avivar-muted))] flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(270_75%_45%)] to-[hsl(280_80%_50%)] flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-[hsl(var(--avivar-muted))] rounded-2xl rounded-bl-sm p-4">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-[hsl(var(--avivar-muted-foreground))] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-[hsl(var(--avivar-muted-foreground))] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-[hsl(var(--avivar-muted-foreground))] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-[hsl(var(--avivar-border))]">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                rows={1}
                disabled={isTyping}
                className="resize-none bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))]"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white px-4"
              >
                {isTyping ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] mt-2 text-center">
              Pressione Enter para enviar • Shift+Enter para nova linha
            </p>
          </div>
        </Card>

        {/* Tips Box */}
        <div className="mt-4 p-4 bg-[hsl(var(--avivar-primary)/0.1)] border border-[hsl(var(--avivar-primary)/0.2)] rounded-lg">
          <p className="text-sm text-[hsl(var(--avivar-primary))]">
            <strong>💡 Como testar:</strong> Faça perguntas sobre serviços, preços, horários e agendamentos. 
            Teste se o agente responde de acordo com as configurações. Quando satisfeito, clique em "Aprovar e Finalizar".
          </p>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[hsl(var(--avivar-card))] rounded-2xl p-8 max-w-md text-center shadow-2xl animate-in zoom-in-95">
            <div className="text-6xl mb-4">
              <PartyPopper className="h-16 w-16 mx-auto text-[hsl(var(--avivar-primary))]" />
            </div>
            <h2 className="text-2xl font-bold text-[hsl(var(--avivar-foreground))] mb-2">
              Agente Aprovado!
            </h2>
            <p className="text-[hsl(var(--avivar-muted-foreground))] mb-4">
              Seu agente de IA está pronto. Redirecionando para a base de conhecimento...
            </p>
            <Loader2 className="h-8 w-8 mx-auto text-[hsl(var(--avivar-primary))] animate-spin" />
          </div>
        </div>
      )}
    </div>
  );
}
