/**
 * LeadDetailsSidebar - Painel lateral com detalhes do lead
 * Exibe: nome, responsável, funil, estágio, campos customizados, observações
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Tag,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Edit2,
  Bookmark,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { CrmConversation } from '@/hooks/useCrmConversations';

interface LeadDetailsSidebarProps {
  conversation: CrmConversation;
  onClose?: () => void;
}

const statusColors = {
  novo: 'bg-blue-500',
  qualificado: 'bg-green-500',
  'em-negociacao': 'bg-amber-500',
  perdido: 'bg-red-500',
  convertido: 'bg-emerald-500',
};

export function LeadDetailsSidebar({ conversation, onClose }: LeadDetailsSidebarProps) {
  const [isContactOpen, setIsContactOpen] = useState(true);
  const [isFunnelOpen, setIsFunnelOpen] = useState(true);
  const [isNotesOpen, setIsNotesOpen] = useState(true);
  const [isFieldsOpen, setIsFieldsOpen] = useState(true);
  const [notes, setNotes] = useState('');

  const lead = conversation.lead;

  if (!lead) {
    return (
      <div className="h-full flex items-center justify-center text-[hsl(var(--avivar-muted-foreground))]">
        <p>Nenhum lead selecionado</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[hsl(var(--avivar-card))] border-l border-[hsl(var(--avivar-border))]">
      {/* Header */}
      <div className="p-4 border-b border-[hsl(var(--avivar-border))]">
        <div className="flex items-start gap-3">
          <Avatar className="h-14 w-14 border-2 border-[hsl(var(--avivar-primary))]">
            <AvatarFallback className="bg-[hsl(var(--avivar-primary)/0.15)] text-[hsl(var(--avivar-primary))] text-xl font-bold">
              {lead.name?.charAt(0).toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[hsl(var(--avivar-foreground))] text-lg truncate">
              {lead.name}
            </h3>
            <Badge 
              variant="outline" 
              className="text-xs font-mono mt-1 bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-muted-foreground))]"
            >
              Lead #{lead.id.slice(0, 8)}
            </Badge>
          </div>
          
          <Button variant="ghost" size="icon" className="shrink-0">
            <Edit2 className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Contato */}
          <Collapsible open={isContactOpen} onOpenChange={setIsContactOpen}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center justify-between w-full py-2 text-left">
                <span className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--avivar-foreground))]">
                  <User className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
                  Contato
                </span>
                {isContactOpen ? (
                  <ChevronUp className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              {lead.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                  <span className="text-[hsl(var(--avivar-foreground))]">{lead.phone}</span>
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                  <span className="text-[hsl(var(--avivar-foreground))] truncate">{lead.email}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                <span className="text-[hsl(var(--avivar-foreground))]">
                  Criado em {format(new Date(conversation.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator className="bg-[hsl(var(--avivar-border))]" />

          {/* Funil e Estágio */}
          <Collapsible open={isFunnelOpen} onOpenChange={setIsFunnelOpen}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center justify-between w-full py-2 text-left">
                <span className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--avivar-foreground))]">
                  <Target className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
                  Funil & Estágio
                </span>
                {isFunnelOpen ? (
                  <ChevronUp className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              <div className="space-y-2">
                <label className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Status atual</label>
                <Badge 
                  className={cn(
                    "text-white",
                    statusColors[lead.status as keyof typeof statusColors] || 'bg-gray-500'
                  )}
                >
                  {lead.status || 'Novo'}
                </Badge>
              </div>
              
              {lead.procedure_interest && (
                <div className="space-y-2">
                  <label className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Interesse</label>
                  <p className="text-sm text-[hsl(var(--avivar-foreground))]">
                    {lead.procedure_interest}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Responsável</label>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs bg-[hsl(var(--avivar-muted))]">
                      OP
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-[hsl(var(--avivar-foreground))]">
                    {conversation.assigned_to ? 'Operador' : 'Não atribuído'}
                  </span>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator className="bg-[hsl(var(--avivar-border))]" />

          {/* Campos Customizados */}
          <Collapsible open={isFieldsOpen} onOpenChange={setIsFieldsOpen}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center justify-between w-full py-2 text-left">
                <span className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--avivar-foreground))]">
                  <Tag className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
                  Campos Customizados
                </span>
                {isFieldsOpen ? (
                  <ChevronUp className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <Checkbox id="confirmacao" />
                <label 
                  htmlFor="confirmacao" 
                  className="text-sm text-[hsl(var(--avivar-foreground))]"
                >
                  Confirmação de consulta enviada
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="pre-atendimento" />
                <label 
                  htmlFor="pre-atendimento" 
                  className="text-sm text-[hsl(var(--avivar-foreground))]"
                >
                  Pré-atendimento realizado
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="contrato" />
                <label 
                  htmlFor="contrato" 
                  className="text-sm text-[hsl(var(--avivar-foreground))]"
                >
                  Contrato enviado
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="pagamento" />
                <label 
                  htmlFor="pagamento" 
                  className="text-sm text-[hsl(var(--avivar-foreground))]"
                >
                  Pagamento confirmado
                </label>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator className="bg-[hsl(var(--avivar-border))]" />

          {/* Observações */}
          <Collapsible open={isNotesOpen} onOpenChange={setIsNotesOpen}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center justify-between w-full py-2 text-left">
                <span className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--avivar-foreground))]">
                  <MessageSquare className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
                  Observações
                </span>
                {isNotesOpen ? (
                  <ChevronUp className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <Textarea
                placeholder="Adicione observações sobre este lead..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[100px] bg-[hsl(var(--avivar-background))] border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-foreground))] placeholder:text-[hsl(var(--avivar-muted-foreground))]"
              />
              <Button 
                size="sm" 
                className="mt-2 w-full bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary)/0.9)]"
              >
                <Bookmark className="h-4 w-4 mr-2" />
                Salvar Observações
              </Button>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>
    </div>
  );
}
