/**
 * LeadCard - Card compacto para exibição de lead no Kanban
 * Exibe nome, data de criação, tarefas pendentes e tags
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreHorizontal, Trash2, CheckSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { KanbanLead } from '../hooks/useKanbanLeads';

interface LeadCardProps {
  lead: KanbanLead;
  onDelete?: (leadId: string) => void;
  onClick?: (lead: KanbanLead) => void;
}

export function LeadCard({ lead, onDelete, onClick }: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: lead.id,
    data: {
      type: 'lead',
      lead,
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Get initials from name
  const getInitials = (name: string) => {
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Format creation date
  const formatCreationDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'dd.MM.yyyy', { locale: ptBR });
    } catch {
      return '';
    }
  };

  // Get pending tasks count from custom_fields
  const customFields = lead.custom_fields as Record<string, unknown> | undefined;
  const pendingTasks = customFields?.pending_tasks as number | undefined;
  const tratamento = customFields?.tratamento as string | undefined;

  // Get message preview with type indicator
  const getMessagePreview = (
    message: string | null | undefined, 
    type: string | null | undefined,
    direction: 'inbound' | 'outbound' | null | undefined
  ): string => {
    const prefix = direction === 'outbound' ? 'Você: ' : '';
    
    if (!message && !type) return '';
    
    // Handle media types
    switch (type) {
      case 'image':
        return `${prefix}📷 Imagem`;
      case 'audio':
        return `${prefix}🎤 Áudio`;
      case 'video':
        return `${prefix}🎬 Vídeo`;
      case 'document':
        return `${prefix}📄 Documento`;
      case 'sticker':
        return `${prefix}🎨 Figurinha`;
      case 'location':
        return `${prefix}📍 Localização`;
      case 'contact':
        return `${prefix}👤 Contato`;
      default:
        // Truncate text message
        if (message) {
          const truncated = message.length > 35 ? message.substring(0, 35) + '...' : message;
          return `${prefix}${truncated}`;
        }
        return '';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "bg-[hsl(var(--avivar-card))] border border-[hsl(var(--avivar-border))] rounded-lg p-3 cursor-grab active:cursor-grabbing",
        "hover:border-[hsl(var(--avivar-primary)/0.5)] transition-all duration-200",
        "shadow-sm hover:shadow-md",
        isDragging && "opacity-50 shadow-xl ring-2 ring-[hsl(var(--avivar-primary))]"
      )}
      onClick={() => onClick?.(lead)}
    >
      {/* Header with avatar, name and date */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Simple Avatar with initials */}
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="bg-[hsl(var(--avivar-primary)/0.2)] text-[hsl(var(--avivar-primary))] text-xs font-medium">
              {getInitials(lead.name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-sm text-[hsl(var(--avivar-foreground))] truncate">
              {lead.name}
            </h4>
            {/* Last message preview */}
            {lead.last_message !== undefined && (
              <p className="text-[10px] text-[hsl(var(--avivar-muted-foreground))] truncate mt-0.5">
                {getMessagePreview(lead.last_message, lead.last_message_type, lead.last_message_direction)}
              </p>
            )}
          </div>
        </div>

        {/* Date */}
        <span className="text-[10px] text-[hsl(var(--avivar-muted-foreground))] flex-shrink-0">
          {formatCreationDate(lead.created_at)}
        </span>

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-[hsl(var(--avivar-primary)/0.1)]"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[hsl(var(--avivar-card))]">
            {onDelete && (
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(lead.id);
                }}
                className="text-red-500 focus:text-red-500 cursor-pointer"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Treatment indicator */}
      {tratamento && (
        <div className="mb-1.5">
          <Badge 
            variant="outline"
            className="text-[10px] px-1.5 py-0 border-[hsl(var(--avivar-accent)/0.4)] text-[hsl(var(--avivar-accent))] bg-[hsl(var(--avivar-accent)/0.1)]"
          >
            💉 {tratamento}
          </Badge>
        </div>
      )}

      {/* Footer with tags and pending tasks */}
      <div className="flex items-center justify-between gap-2">
        {/* Tags */}
        <div className="flex flex-wrap gap-1 flex-1 min-w-0">
          {lead.tags && lead.tags.length > 0 ? (
            <>
              {lead.tags.slice(0, 2).map((tag, idx) => (
                <Badge 
                  key={idx}
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 border-[hsl(var(--avivar-primary)/0.3)] text-[hsl(var(--avivar-primary))] truncate max-w-[100px]"
                >
                  #{tag}
                </Badge>
              ))}
              {lead.tags.length > 2 && (
                <Badge 
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 border-[hsl(var(--avivar-border))]"
                >
                  +{lead.tags.length - 2}
                </Badge>
              )}
            </>
          ) : null}
        </div>

        {/* Pending tasks indicator */}
        {pendingTasks !== undefined && pendingTasks > 0 && (
          <div className="flex items-center gap-1 text-[hsl(var(--avivar-primary))]">
            <CheckSquare className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium">{pendingTasks}</span>
          </div>
        )}
      </div>
    </div>
  );
}
