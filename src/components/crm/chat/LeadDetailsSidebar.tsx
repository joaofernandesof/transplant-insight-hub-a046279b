/**
 * LeadDetailsSidebar - Painel lateral com detalhes do lead
 * Exibe: nome, responsável, funil, estágio, campos customizados (checklist)
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  User,
  Phone,
  Mail,
  Calendar,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Loader2,
  ListChecks,
  MoreVertical,
  Tags,
  Settings2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CrmConversation } from '@/hooks/useCrmConversations';
import { LeadEditDialog } from './LeadEditDialog';
import { Lead, useLeads } from '@/hooks/useLeads';
import { useAuth } from '@/contexts/AuthContext';
import { useLeadKanbanInfo } from '@/hooks/useLeadKanbanInfo';
import { useLeadChecklistFields } from '@/hooks/useLeadChecklistFields';
import { FunnelColumnSelector } from './FunnelColumnSelector';
import { LeadTagsDialog } from './LeadTagsDialog';
import { LeadTagsInline } from './LeadTagsInline';
import { ChecklistFieldRenderer } from './ChecklistFieldRenderer';
import { ChecklistConfigDialog } from './ChecklistConfigDialog';
import { ResponsibleSelector } from './ResponsibleSelector';
import { LeadStatisticsSection } from './LeadStatisticsSection';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

interface LeadDetailsSidebarProps {
  conversation: CrmConversation;
  onClose?: () => void;
  onLeadUpdated?: () => void;
}

const statusColors = {
  novo: 'bg-blue-500',
  new: 'bg-blue-500',
  qualificado: 'bg-green-500',
  contacted: 'bg-amber-500',
  'em-negociacao': 'bg-amber-500',
  scheduled: 'bg-purple-500',
  perdido: 'bg-red-500',
  lost: 'bg-red-500',
  convertido: 'bg-emerald-500',
  converted: 'bg-emerald-500',
};

export function LeadDetailsSidebar({ conversation, onClose, onLeadUpdated }: LeadDetailsSidebarProps) {
  const [isContactOpen, setIsContactOpen] = useState(true);
  const [isFieldsOpen, setIsFieldsOpen] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTagsDialogOpen, setIsTagsDialogOpen] = useState(false);
  const [isChecklistConfigOpen, setIsChecklistConfigOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const { deleteLead } = useLeads();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const lead = conversation.lead;
  const queryClient = useQueryClient();
  
  // Buscar informações do Kanban/Coluna
  const { data: kanbanInfo, refetch: refetchKanbanInfo } = useLeadKanbanInfo(lead?.phone);
  
  // Buscar campos do checklist do kanban (universal para todos os leads do kanban)
  const { data: checklistFields = [] } = useLeadChecklistFields(kanbanInfo?.kanbanId, lead?.phone);

  const handleDeleteLead = async () => {
    if (!lead) return;
    
    setIsDeleting(true);
    const success = await deleteLead(lead.id);
    setIsDeleting(false);
    
    if (success) {
      // Invalidate kanban caches so deleted lead disappears from all views
      queryClient.invalidateQueries({ queryKey: ['avivar-kanban-leads'] });
      queryClient.invalidateQueries({ queryKey: ['crm-conversations'] });
      // Navigate back to inbox after deletion
      navigate('/avivar/inbox');
    }
  };

  if (!lead) {
    return (
      <div className="h-full flex items-center justify-center text-[hsl(var(--avivar-muted-foreground))]">
        <p>Nenhum lead selecionado</p>
      </div>
    );
  }

  // Converter lead do CRM para tipo Lead completo
  const leadForEdit: Lead = {
    id: lead.id,
    name: lead.name || '',
    email: lead.email || null,
    phone: lead.phone || '',
    city: null,
    state: null,
    source: (lead as any).source || null,
    interest_level: 'warm',
    status: (lead.status as Lead['status']) || 'new',
    notes: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    clinic_id: null,
    created_at: conversation.created_at,
    updated_at: conversation.updated_at,
    claimed_by: null,
    claimed_at: null,
    available_at: null,
    converted_value: null,
    procedures_sold: null,
    converted_at: null,
  };

  return (
    <>
    <div className="h-full min-h-0 flex flex-col bg-[hsl(var(--avivar-card))] border-l border-[hsl(var(--avivar-border))]">
      {/* Header */}
      <div className="p-4 border-b border-[hsl(var(--avivar-border))]">
        <div className="flex items-center justify-between">
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
            {/* Tags do lead - inline */}
            <LeadTagsInline
              leadPhone={lead.phone || ''}
              tags={kanbanInfo?.tags || []}
              onTagsChanged={() => refetchKanbanInfo()}
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="shrink-0"
              >
                <MoreVertical className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover border-[hsl(var(--avivar-border))]">
              <DropdownMenuItem 
                onClick={() => setIsEditDialogOpen(true)}
                className="cursor-pointer"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Editar Lead
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setIsTagsDialogOpen(true)}
                className="cursor-pointer"
              >
                <Tags className="h-4 w-4 mr-2" />
                Editar Tags
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setDeleteDialogOpen(true)}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Lead
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* AlertDialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{lead.name}</strong>?
              <br /><br />
              Esta ação irá excluir permanentemente:
              <ul className="list-disc list-inside mt-2 text-sm">
                <li>Todas as conversas</li>
                <li>Todas as mensagens</li>
                <li>Histórico da jornada</li>
                <li>Contatos vinculados</li>
              </ul>
              <br />
              <strong className="text-destructive">Esta ação não pode ser desfeita.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLead}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Excluir Lead
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Content with visible scrollbar */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-avivar">
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

          {/* Seletor de Funil e Coluna */}
          <FunnelColumnSelector
            phone={lead.phone}
            currentKanbanName={kanbanInfo?.kanbanName}
            currentColumnName={kanbanInfo?.columnName}
            onTransferred={onLeadUpdated}
          />

          {/* Responsável */}
          <div className="space-y-3">
            <ResponsibleSelector
              conversationId={conversation.id}
              currentAssignedTo={conversation.assigned_to || null}
              onAssigned={onLeadUpdated}
            />
          </div>

          <Separator className="bg-[hsl(var(--avivar-border))]" />

          {/* Campos do Checklist */}
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
              {/* Tratamento - campo especial */}
              <div className="flex items-center gap-3">
                <label className="text-xs text-[hsl(var(--avivar-muted-foreground))] uppercase tracking-wide whitespace-nowrap shrink-0">TRATAMENTO</label>
                <Select
                  value={kanbanInfo?.tratamento || lead.procedure_interest || ''}
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
                  <SelectTrigger className="h-7 text-sm bg-transparent border-0 border-b border-[hsl(var(--avivar-primary))] rounded-none px-0 focus:ring-0 text-[hsl(var(--avivar-foreground))] flex-1">
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_clear">Nenhum</SelectItem>
                    <SelectItem value="Transplante Capilar">Transplante Capilar</SelectItem>
                    <SelectItem value="Transplante de Barba">Transplante de Barba</SelectItem>
                    <SelectItem value="Transplante de Sobrancelha">Transplante de Sobrancelha</SelectItem>
                    <SelectItem value="Tratamento Clínico">Tratamento Clínico</SelectItem>
                    <SelectItem value="Consulta/Avaliação">Consulta/Avaliação</SelectItem>
                    <SelectItem value="Retorno">Retorno</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {checklistFields.length > 0 ? (
                checklistFields.map((field) => (
                  <ChecklistFieldRenderer 
                    key={field.id} 
                    field={field}
                    leadId={lead.id}
                    leadPhone={lead.phone}
                    columnId={kanbanInfo?.columnId}
                    onUpdate={() => queryClient.invalidateQueries({ queryKey: ['lead-checklist-fields'] })}
                  />
                ))
              ) : (
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] text-center py-2">
                  Nenhum campo configurado
                </p>
              )}
              
              {/* Botão de configuração */}
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

          {/* Origem do Tráfego */}
          <LeadStatisticsSection
            utmSource={kanbanInfo?.utmSource}
            utmMedium={kanbanInfo?.utmMedium}
            utmCampaign={kanbanInfo?.utmCampaign}
            utmTerm={kanbanInfo?.utmTerm}
            utmContent={kanbanInfo?.utmContent}
          />

        </div>
      </div>
    </div>

      {/* Dialog de Edição */}
      <LeadEditDialog
        lead={leadForEdit}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSaved={onLeadUpdated}
      />

      {/* Dialog de Tags */}
      <LeadTagsDialog
        leadPhone={lead.phone || ''}
        leadName={lead.name || ''}
        currentTags={kanbanInfo?.tags || []}
        open={isTagsDialogOpen}
        onOpenChange={setIsTagsDialogOpen}
        onSaved={onLeadUpdated}
      />

      {/* Dialog de Configuração do Checklist - Único local para configurar */}
      {kanbanInfo?.kanbanId && (
        <ChecklistConfigDialog
          open={isChecklistConfigOpen}
          onOpenChange={setIsChecklistConfigOpen}
          kanbanId={kanbanInfo.kanbanId}
          kanbanName={kanbanInfo.kanbanName}
        />
      )}
    </>
  );
}
