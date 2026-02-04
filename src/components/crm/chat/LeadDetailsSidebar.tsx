/**
 * LeadDetailsSidebar - Painel lateral com detalhes do lead
 * Exibe: nome, responsável, funil, estágio, campos customizados (checklist), observações
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  User,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Edit2,
  Bookmark,
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

import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
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
  const [isNotesOpen, setIsNotesOpen] = useState(true);
  const [isFieldsOpen, setIsFieldsOpen] = useState(true);
  const [notes, setNotes] = useState('');
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
  
  // Buscar campos do checklist da coluna atual
  const { data: checklistFields = [] } = useLeadChecklistFields(kanbanInfo?.columnId, lead?.phone);

  const handleDeleteLead = async () => {
    if (!lead) return;
    
    setIsDeleting(true);
    const success = await deleteLead(lead.id);
    setIsDeleting(false);
    
    if (success) {
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
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setDeleteDialogOpen(true)}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir Lead
                  </DropdownMenuItem>
                </>
              )}
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

          {/* Status e Responsável */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Status</label>
              <Badge 
                className={cn(
                  "text-white",
                  statusColors[lead.status as keyof typeof statusColors] || 'bg-[hsl(var(--avivar-muted))]'
                )}
              >
                {lead.status || 'Novo'}
              </Badge>
            </div>
            
            {lead.procedure_interest && (
              <div className="flex items-center justify-between">
                <label className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Interesse</label>
                <span className="text-sm text-[hsl(var(--avivar-foreground))]">
                  {lead.procedure_interest}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Responsável</label>
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[10px] bg-[hsl(var(--avivar-muted))]">
                    OP
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-[hsl(var(--avivar-foreground))]">
                  {conversation.assigned_to ? 'Operador' : 'Não atribuído'}
                </span>
              </div>
            </div>
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
              {checklistFields.length > 0 ? (
                checklistFields.map((field) => (
                  <ChecklistFieldRenderer 
                    key={field.id} 
                    field={field}
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

      {/* Dialog de Configuração do Checklist */}
      {kanbanInfo?.columnId && (
        <ChecklistConfigDialog
          open={isChecklistConfigOpen}
          onOpenChange={setIsChecklistConfigOpen}
          columnId={kanbanInfo.columnId}
          columnName={kanbanInfo.columnName}
        />
      )}
    </>
  );
}
