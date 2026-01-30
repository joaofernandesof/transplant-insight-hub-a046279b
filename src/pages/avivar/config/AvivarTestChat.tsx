/**
 * AvivarTestChat - Interface de Teste do Agente
 */

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  User, 
  Send, 
  Plus, 
  RefreshCw, 
  Copy, 
  Sparkles,
  MessageSquare,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAgentConfig } from './hooks/useAgentConfig';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  title: string;
  timestamp: string;
  messages: Message[];
}

export default function AvivarTestChat() {
  const { config } = useAgentConfig();
  const [conversations, setConversations] = useState<Conversation[]>([
    { id: '1', title: 'Teste 1', timestamp: '30/01 14:35', messages: [] }
  ]);
  const [activeConversation, setActiveConversation] = useState('1');
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentConversation = conversations.find(c => c.id === activeConversation);
  const messages = currentConversation?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const createNewConversation = () => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      title: `Teste ${conversations.length + 1}`,
      timestamp: new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
      messages: []
    };
    setConversations(prev => [newConv, ...prev]);
    setActiveConversation(newConv.id);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    // Add user message
    setConversations(prev => prev.map(c => 
      c.id === activeConversation 
        ? { ...c, messages: [...c.messages, userMessage] }
        : c
    ));

    setInput('');
    setIsTyping(true);

    // Simulate AI response
    await new Promise(r => setTimeout(r, 1500));

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: generateResponse(input.trim()),
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setConversations(prev => prev.map(c => 
      c.id === activeConversation 
        ? { ...c, messages: [...c.messages, assistantMessage] }
        : c
    ));

    setIsTyping(false);
  };

  const generateResponse = (userInput: string): string => {
    const name = config.attendantName || 'Assistente';
    const company = config.companyName || 'clínica';

    if (messages.length === 0) {
      return `Olá! Meu nome é ${name} e sou assistente virtual da ${company}. Como posso te ajudar hoje? 😊`;
    }

    if (userInput.toLowerCase().includes('preço') || userInput.toLowerCase().includes('valor')) {
      return `Para fornecer informações sobre valores, preciso entender melhor o que você está buscando. Você tem interesse em transplante capilar, barba, ou tratamento sem cirurgia?`;
    }

    if (userInput.toLowerCase().includes('horário') || userInput.toLowerCase().includes('agendar')) {
      return `Ótimo! Para agendar uma consulta, me diga: qual seria o melhor dia e horário para você?`;
    }

    return `Entendi! Vou te ajudar com isso. Poderia me contar um pouco mais sobre sua situação atual?`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearConversation = () => {
    setConversations(prev => prev.map(c => 
      c.id === activeConversation 
        ? { ...c, messages: [] }
        : c
    ));
  };

  return (
    <div className="p-6 h-[calc(100vh-6rem)]">
      <div className="flex gap-4 h-full max-w-6xl mx-auto">
        {/* Sidebar */}
        <Card className="w-72 flex-shrink-0 bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardHeader className="pb-2">
            <Button 
              onClick={createNewConversation}
              className="w-full bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Conversa
            </Button>
          </CardHeader>
          <CardContent className="p-2">
            <ScrollArea className="h-[calc(100%-4rem)]">
              <div className="space-y-1">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConversation(conv.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg transition-colors",
                      conv.id === activeConversation
                        ? "bg-[hsl(var(--avivar-primary)/0.1)] border border-[hsl(var(--avivar-primary)/0.3)]"
                        : "hover:bg-[hsl(var(--avivar-muted))]"
                    )}
                  >
                    <p className={cn(
                      "font-medium truncate",
                      conv.id === activeConversation
                        ? "text-[hsl(var(--avivar-foreground))]"
                        : "text-[hsl(var(--avivar-muted-foreground))]"
                    )}>
                      {conv.title}
                    </p>
                    <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                      {conv.timestamp}
                    </p>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          {/* Header */}
          <CardHeader className="border-b border-[hsl(var(--avivar-border))] py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(270_75%_45%)] to-[hsl(280_80%_50%)] flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-[hsl(var(--avivar-foreground))]">
                    Chat com {config.attendantName || 'Assistente'}
                  </h3>
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                    Assistente da {config.companyName || 'clínica'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={clearConversation} className="text-[hsl(var(--avivar-muted-foreground))]">
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Reiniciar
                </Button>
                <Badge variant="secondary" className="bg-green-500/20 text-green-500">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Conectado
                </Badge>
              </div>
            </div>
          </CardHeader>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto text-[hsl(var(--avivar-muted-foreground))] mb-4" />
                  <p className="text-[hsl(var(--avivar-muted-foreground))]">
                    Comece uma conversa para testar seu agente
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
                      ? "bg-[hsl(var(--avivar-primary))] text-white rounded-br-none"
                      : "bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-foreground))] rounded-bl-none"
                  )}>
                    <p>{message.content}</p>
                    <p className={cn(
                      "text-xs mt-2",
                      message.role === 'user' ? "text-white/70" : "text-[hsl(var(--avivar-muted-foreground))]"
                    )}>
                      {message.timestamp}
                    </p>
                  </div>

                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-[hsl(var(--avivar-muted))] flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(270_75%_45%)] to-[hsl(280_80%_50%)] flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-[hsl(var(--avivar-muted))] rounded-2xl rounded-bl-none p-4">
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

          {/* Input */}
          <div className="p-4 border-t border-[hsl(var(--avivar-border))]">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                rows={1}
                className="resize-none bg-[hsl(var(--avivar-input))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] placeholder:text-[hsl(var(--avivar-muted-foreground))]"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white px-4"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
