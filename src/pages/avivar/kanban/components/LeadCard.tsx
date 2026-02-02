/**
 * LeadCard - Card compacto para exibição de lead no Kanban
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Phone, Mail, MessageSquare, MoreHorizontal, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

  const formatPhone = (phone: string | null) => {
    if (!phone) return null;
    // Format: 55 85 91234-5678
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 13) {
      return `(${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    }
    if (cleaned.length === 12) {
      return `(${cleaned.slice(2, 4)}) ${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
    }
    return phone;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
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
      {/* Header with name and menu */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(var(--avivar-primary))] to-[hsl(var(--avivar-accent))] flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-white">
              {getInitials(lead.name)}
            </span>
          </div>
          
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-sm text-[hsl(var(--avivar-foreground))] truncate">
              {lead.name}
            </h4>
            {lead.source && (
              <Badge 
                variant="secondary" 
                className="text-[10px] px-1.5 py-0 bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-muted-foreground))]"
              >
                {lead.source}
              </Badge>
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

      {/* Contact Info */}
      <div className="space-y-1">
        {lead.phone && (
          <div className="flex items-center gap-2 text-xs text-[hsl(var(--avivar-muted-foreground))]">
            <Phone className="h-3 w-3" />
            <span className="truncate">{formatPhone(lead.phone)}</span>
          </div>
        )}
        {lead.email && (
          <div className="flex items-center gap-2 text-xs text-[hsl(var(--avivar-muted-foreground))]">
            <Mail className="h-3 w-3" />
            <span className="truncate">{lead.email}</span>
          </div>
        )}
      </div>

      {/* Tags */}
      {lead.tags && lead.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
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
