/**
 * LeadCard - Card compacto para exibição de lead no Kanban
 * Com indicador de fonte (ícone) e prévia da última mensagem
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { LeadSourceAvatar } from '@/components/avivar/LeadSourceAvatar';
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

  const formatPhone = (phone: string | null) => {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length >= 10) {
      // Show last 4 digits
      return `***-${cleaned.slice(-4)}`;
    }
    return phone;
  };


  // Get last message preview from custom_fields if available
  const lastMessage = (lead.custom_fields as Record<string, unknown>)?.last_message as string | undefined;

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
      {/* Header with name and menu */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Avatar with source indicator */}
          <LeadSourceAvatar 
            name={lead.name} 
            source={lead.source}
            size="sm"
          />
          
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-sm text-[hsl(var(--avivar-foreground))] truncate">
              {lead.name}
            </h4>
            {lead.phone && (
              <p className="text-[10px] text-[hsl(var(--avivar-muted-foreground))]">
                {formatPhone(lead.phone)}
              </p>
            )}
          </div>
        </div>

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

      {/* Last message preview */}
      {lastMessage && (
        <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] truncate mb-2 italic">
          "{lastMessage}"
        </p>
      )}

      {/* Tags */}
      {lead.tags && lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {lead.tags.slice(0, 2).map((tag, idx) => (
            <Badge 
              key={idx}
              variant="outline"
              className="text-[10px] px-1.5 py-0 border-[hsl(var(--avivar-primary)/0.3)] text-[hsl(var(--avivar-primary))]"
            >
              {tag}
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
        </div>
      )}
    </div>
  );
}
