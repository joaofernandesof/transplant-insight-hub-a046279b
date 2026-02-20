/**
 * AvivarLeadPage - Página completa de detalhes do lead (estilo Kommo CRM)
 * Layout: Sidebar de detalhes à esquerda + Área de chat/ações à direita
 * Acessada via /avivar/lead/:kanbanLeadId
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  Tag,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Target,
  MoreVertical,
  Edit2,
  Tags,
  Trash2,
  MessageCircle,
  Send,
  ListChecks,
  Settings2,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useCrmConversations } from '@/hooks/useCrmConversations';
import { useLeadKanbanInfo } from '@/hooks/useLeadKanbanInfo';
import { useLeadChecklistFields } from '@/hooks/useLeadChecklistFields';
import { FunnelColumnSelector } from '@/components/crm/chat/FunnelColumnSelector';
import { LeadTagsInline } from '@/components/crm/chat/LeadTagsInline';
import { ChecklistFieldRenderer } from '@/components/crm/chat/ChecklistFieldRenderer';
import { ChecklistConfigDialog } from '@/components/crm/chat/ChecklistConfigDialog';
import { ResponsibleSelector } from '@/components/crm/chat/ResponsibleSelector';
import { LeadEditDialog } from '@/components/crm/chat/LeadEditDialog';
import { LeadTagsDialog } from '@/components/crm/chat/LeadTagsDialog';
import { MessageInput } from '@/components/crm/chat/MessageInput';
import { MessageThread } from '@/components/crm/chat/MessageThread';
import { ChatHeader } from '@/components/crm/chat/ChatHeader';
import { Lead } from '@/hooks/useLeads';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function AvivarLeadPage() {
  const { kanbanLeadId } = useParams<{ kanbanLeadId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isContactOpen, setIsContactOpen] = useState(true);
  const [isFieldsOpen, setIsFieldsOpen] = useState(true);
  const [isNotesOpen, setIsNotesOpen] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTagsDialogOpen, setIsTagsDialogOpen] = useState(false);
  const [isChecklistConfigOpen, setIsChecklistConfigOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Fetch kanban lead data
  const { data: kanbanLead, isLoading } = useQuery({
    queryKey: ['avivar-kanban-lead', kanbanLeadId],
    queryFn: async () => {
      if (!kanbanLeadId) return null;
      const { data, error } = await supabase
        .from('avivar_kanban_leads')
        .select('*')
        .eq('id', kanbanLeadId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!kanbanLeadId,
  });

  // Find existing conversation by phone
  const { data: existingConversation } = useQuery({
    queryKey: ['lead-conversation-by-phone', kanbanLead?.phone],
    queryFn: async () => {
      if (!kanbanLead?.phone) return null;
      const { data } = await supabase
        .from('leads')
        .select('id, crm_conversations(id)')
        .or(`phone.eq.${kanbanLead.phone},phone.eq.${kanbanLead.phone.replace(/\D/g, '')}`)
        .limit(1)
        .maybeSingle();
      
      const convos = (data as any)?.crm_conversations;
      if (convos && convos.length > 0) {
        return { leadId: data?.id, conversationId: convos[0].id };
      }
      return data?.id ? { leadId: data.id, conversationId: null } : null;
    },
    enabled: !!kanbanLead?.phone,
  });

  // Kanban info for funnel/column display
  const { data: kanbanInfo, refetch: refetchKanbanInfo } = useLeadKanbanInfo(kanbanLead?.phone);
  const { data: checklistFields = [] } = useLeadChecklistFields(kanbanInfo?.kanbanId, kanbanLead?.phone);

  // CRM conversations hook for sending messages
  const {
    conversations,
    messages,
    isLoadingMessages,
    sendMessage,
    createConversation,
  } = useCrmConversations(existingConversation?.conversationId || undefined);

  const currentConversation = existingConversation?.conversationId 
    ? conversations.find(c => c.id === existingConversation.conversationId)
    : null;

  useEffect(() => {
    if (kanbanLead?.notes) {
      setNotes(kanbanLead.notes);
    }
  }, [kanbanLead?.notes]);

  const handleSaveNotes = async () => {
    if (!kanbanLeadId) return;
    setIsSavingNotes(true);
    const { error } = await supabase
      .from('avivar_kanban_leads')
      .update({ notes, updated_at: new Date().toISOString() })
      .eq('id', kanbanLeadId);
    setIsSavingNotes(false);
    if (error) {
      toast.error('Erro ao salvar observações');
    } else {
      toast.success('Observações salvas');
      queryClient.invalidateQueries({ queryKey: ['avivar-kanban-lead', kanbanLeadId] });
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!kanbanLead?.phone) {
      toast.error('Lead não possui telefone cadastrado');
      return;
    }

    if (existingConversation?.conversationId) {
      // Send to existing conversation
      sendMessage.mutate({
        conversationId: existingConversation.conversationId,
        content,
      });
    } else if (existingConversation?.leadId) {
      // Create conversation first
      createConversation.mutate(
        { leadId: existingConversation.leadId, channel: 'whatsapp' },
        {
          onSuccess: (data) => {
            sendMessage.mutate({
              conversationId: data.id,
              content,
            });
            queryClient.invalidateQueries({ queryKey: ['lead-conversation-by-phone'] });
          },
        }
      );
    } else {
      toast.error('Lead não encontrado na base. Verifique o cadastro.');
    }
  };

  const handleGoToInbox = () => {
    if (kanbanLead?.phone) {
      navigate(`/avivar/inbox?phone=${encodeURIComponent(kanbanLead.phone)}`);
    }
  };

  // Map kanban lead to Lead type for edit dialog
  const leadForEdit: Lead | null = kanbanLead ? {
    id: kanbanLead.id,
    name: kanbanLead.name,
    email: kanbanLead.email || null,
    phone: kanbanLead.phone || '',
    city: null,
    state: null,
    source: kanbanLead.source || null,
    interest_level: 'warm',
    status: 'new',
    notes: kanbanLead.notes || null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    clinic_id: null,
    created_at: kanbanLead.created_at,
    updated_at: kanbanLead.updated_at,
    claimed_by: null,
    claimed_at: null,
    available_at: null,
    converted_value: null,
    procedures_sold: null,
    converted_at: null,
  } : null;

  const getInitials = (name: string) => {
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-[hsl(var(--avivar-background))]">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--avivar-primary))]" />
      </div>
    );
  }

  if (!kanbanLead) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[hsl(var(--avivar-background))] gap-4">
        <p className="text-[hsl(var(--avivar-muted-foreground))]">Lead não encontrado</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full lg:h-screen flex flex-col overflow-hidden bg-[hsl(var(--avivar-background))]">
      {/* Top bar */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))]">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="bg-[hsl(var(--avivar-primary)/0.2)] text-[hsl(var(--avivar-primary))] text-sm font-medium">
              {getInitials(kanbanLead.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="font-semibold text-[hsl(var(--avivar-foreground))] truncate">
              {kanbanLead.name}
            </h1>
            <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
              Lead #{(kanbanLead as any).lead_code || kanbanLead.id.slice(0, 8)}
            </p>
          </div>
        </div>
        {kanbanLead.phone && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleGoToInbox}
            className="shrink-0 gap-2 border-[hsl(var(--avivar-border))]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Abrir no Inbox
          </Button>
        )}
      </div>

      {/* Main content: sidebar + chat */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Left sidebar - Lead details */}
        <div className="w-[320px] shrink-0 border-r border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))] flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-avivar">
            <div className="p-4 space-y-4">
              {/* Tags */}
              <LeadTagsInline
                leadPhone={kanbanLead.phone || ''}
                tags={kanbanInfo?.tags || kanbanLead.tags || []}
                onTagsChanged={() => refetchKanbanInfo()}
              />

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
                  {kanbanLead.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                      <span className="text-[hsl(var(--avivar-foreground))]">{kanbanLead.phone}</span>
                    </div>
                  )}
                  {kanbanLead.email && (
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                      <span className="text-[hsl(var(--avivar-foreground))] truncate">{kanbanLead.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                    <span className="text-[hsl(var(--avivar-foreground))]">
                      Criado em {format(new Date(kanbanLead.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  {kanbanLead.source && (
                    <div className="flex items-center gap-3 text-sm">
                      <Target className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                      <span className="text-[hsl(var(--avivar-foreground))]">{kanbanLead.source}</span>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>

              <Separator className="bg-[hsl(var(--avivar-border))]" />

              {/* Funil e Coluna */}
              <FunnelColumnSelector
                phone={kanbanLead.phone}
                currentKanbanName={kanbanInfo?.kanbanName}
                currentColumnName={kanbanInfo?.columnName}
                onTransferred={() => {
                  refetchKanbanInfo();
                  queryClient.invalidateQueries({ queryKey: ['avivar-kanban-leads'] });
                }}
              />

              <Separator className="bg-[hsl(var(--avivar-border))]" />

              {/* Checklist */}
              <Collapsible open={isFieldsOpen} onOpenChange={setIsFieldsOpen}>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center justify-between w-full py-2 text-left">
                    <span className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--avivar-foreground))]">
                      <ListChecks className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
                      Checklist
                      {checklistFields.length > 0 && (
                        <Badge variant="secondary" className="text-xs ml-1">
                          {checklistFields.filter(f => f.value).length}/{checklistFields.length}
                        </Badge>
                      )}
                    </span>
                    {isFieldsOpen ? (
                      <ChevronUp className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-2">
                  {/* Tratamento - campo fixo */}
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-[hsl(var(--avivar-muted-foreground))] uppercase tracking-wide whitespace-nowrap shrink-0">TRATAMENTO</label>
                    <Select
                      value={kanbanInfo?.tratamento || ''}
                      onValueChange={async (value) => {
                        if (!kanbanInfo?.kanbanLeadId) return;
                        try {
                          const { data: current } = await supabase
                            .from('avivar_kanban_leads')
                            .select('custom_fields')
                            .eq('id', kanbanInfo.kanbanLeadId)
                            .single();
                          const fields = (current?.custom_fields as Record<string, unknown>) || {};
                          await supabase
                            .from('avivar_kanban_leads')
                            .update({ custom_fields: { ...fields, tratamento: value === '_clear' ? null : value } })
                            .eq('id', kanbanInfo.kanbanLeadId);
                          refetchKanbanInfo();
                          toast.success('Tratamento atualizado');
                        } catch {
                          toast.error('Erro ao atualizar tratamento');
                        }
                      }}
                    >
                      <SelectTrigger className="h-7 text-xs flex-1 bg-transparent border-0 border-b border-[hsl(var(--avivar-border))] rounded-none px-0 focus:ring-0 shadow-none">
                        <SelectValue placeholder="Selecionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Transplante Capilar">Transplante Capilar</SelectItem>
                        <SelectItem value="Transplante de Barba">Transplante de Barba</SelectItem>
                        <SelectItem value="Transplante de Sobrancelha">Transplante de Sobrancelha</SelectItem>
                        <SelectItem value="Tratamento Clínico">Tratamento Clínico</SelectItem>
                        <SelectItem value="Consulta/Avaliação">Consulta/Avaliação</SelectItem>
                        <SelectItem value="Retorno">Retorno</SelectItem>
                        <SelectItem value="_clear">Limpar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {checklistFields.length > 0 ? (
                    checklistFields.map((field) => (
                      <ChecklistFieldRenderer
                        key={field.id}
                        field={field}
                        leadId={kanbanLead.id}
                        leadPhone={kanbanLead.phone}
                        columnId={kanbanInfo?.columnId}
                        onUpdate={() => queryClient.invalidateQueries({ queryKey: ['lead-checklist-fields'] })}
                      />
                    ))
                  ) : (
                    <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] text-center py-2">
                      Nenhum campo configurado
                    </p>
                  )}
                  {kanbanInfo?.columnId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsChecklistConfigOpen(true)}
                      className="w-full mt-2 text-xs gap-1 text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))]"
                    >
                      <Settings2 className="h-3 w-3" />
                      Configurar campos
                    </Button>
                  )}
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
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="mt-2 w-full bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary)/0.9)]"
                  >
                    {isSavingNotes ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Bookmark className="h-4 w-4 mr-2" />
                    )}
                    Salvar Observações
                  </Button>
                </CollapsibleContent>
              </Collapsible>

              {/* Ações */}
              <Separator className="bg-[hsl(var(--avivar-border))]" />
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditDialogOpen(true)}
                  className="w-full justify-start gap-2 border-[hsl(var(--avivar-border))]"
                >
                  <Edit2 className="h-4 w-4" />
                  Editar Lead
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTagsDialogOpen(true)}
                  className="w-full justify-start gap-2 border-[hsl(var(--avivar-border))]"
                >
                  <Tags className="h-4 w-4" />
                  Editar Tags
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel - Chat area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-[hsl(var(--avivar-card))]">
          {existingConversation?.conversationId && currentConversation ? (
            <>
              {/* Has conversation - show messages */}
              <div className="shrink-0">
                <ChatHeader
                  conversation={currentConversation}
                  onStatusChange={() => {}}
                  onAIToggle={() => {}}
                  onDeleteLead={() => {}}
                  isDeletingLead={false}
                  onBack={() => navigate(-1)}
                  showBackButton={false}
                />
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                <MessageThread
                  messages={messages}
                  isLoading={isLoadingMessages}
                />
              </div>
              <div className="shrink-0">
                <MessageInput
                  onSend={handleSendMessage}
                  disabled={sendMessage.isPending}
                  placeholder={`Mensagem para ${kanbanLead.name}...`}
                  showTaskButton={false}
                />
              </div>
            </>
          ) : (
            <>
              {/* No conversation - show empty state with message input */}
              <div className="p-4 border-b border-[hsl(var(--avivar-border))] flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 rounded-full bg-[hsl(var(--avivar-primary)/0.15)] flex items-center justify-center">
                  <User className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[hsl(var(--avivar-foreground))]">{kanbanLead.name}</h3>
                  <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
                    {kanbanLead.phone || 'Sem telefone cadastrado'}
                  </p>
                </div>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 min-h-0 overflow-auto">
                <div className="w-20 h-20 rounded-full bg-[hsl(var(--avivar-muted))] flex items-center justify-center mb-6">
                  <MessageCircle className="h-10 w-10 text-[hsl(var(--avivar-muted-foreground))] opacity-50" />
                </div>
                <h3 className="text-lg font-medium text-[hsl(var(--avivar-foreground))] mb-2">
                  Este lead ainda não possui conversas
                </h3>
                <p className="text-sm text-[hsl(var(--avivar-muted-foreground))] max-w-md">
                  Envie uma mensagem para iniciar o atendimento via WhatsApp.
                  Você pode editar os dados do lead no painel ao lado.
                </p>
              </div>

              {kanbanLead.phone && (
                <div className="shrink-0">
                  <MessageInput
                    onSend={handleSendMessage}
                    disabled={createConversation.isPending || sendMessage.isPending}
                    placeholder={`Iniciar conversa com ${kanbanLead.name}...`}
                    showTaskButton={false}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Dialogs */}
      {leadForEdit && (
        <LeadEditDialog
          lead={leadForEdit}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['avivar-kanban-lead', kanbanLeadId] });
            queryClient.invalidateQueries({ queryKey: ['avivar-kanban-leads'] });
          }}
        />
      )}

      <LeadTagsDialog
        leadPhone={kanbanLead.phone || ''}
        leadName={kanbanLead.name}
        currentTags={kanbanInfo?.tags || kanbanLead.tags || []}
        open={isTagsDialogOpen}
        onOpenChange={setIsTagsDialogOpen}
        onSaved={() => {
          refetchKanbanInfo();
          queryClient.invalidateQueries({ queryKey: ['avivar-kanban-lead', kanbanLeadId] });
        }}
      />

      {kanbanInfo?.kanbanId && (
        <ChecklistConfigDialog
          open={isChecklistConfigOpen}
          onOpenChange={setIsChecklistConfigOpen}
          kanbanId={kanbanInfo.kanbanId}
          kanbanName={kanbanInfo.kanbanName}
        />
      )}
    </div>
  );
}
