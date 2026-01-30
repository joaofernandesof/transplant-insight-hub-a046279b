/**
 * ChatHeader - Cabeçalho do painel de chat
 * Exibe info do lead e ações rápidas
 */

import { 
  MoreVertical, 
  Check, 
  Archive, 
  Phone, 
  Video,
  User,
  ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CrmConversation } from '@/hooks/useCrmConversations';

interface ChatHeaderProps {
  conversation: CrmConversation;
  onStatusChange: (status: 'resolved' | 'archived') => void;
  onBack?: () => void;
  showBackButton?: boolean;
}

const statusLabels = {
  open: 'Aberta',
  pending: 'Pendente',
  resolved: 'Resolvida',
  archived: 'Arquivada',
};

const statusStyles = {
  open: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  archived: 'bg-[hsl(var(--avivar-muted))] text-[hsl(var(--avivar-muted-foreground))]',
};

export function ChatHeader({ 
  conversation, 
  onStatusChange, 
  onBack,
  showBackButton 
}: ChatHeaderProps) {
  const lead = conversation.lead;

  return (
    <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-card))]">
      <div className="flex items-center gap-3">
        {showBackButton && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            className="shrink-0 md:hidden text-[hsl(var(--avivar-muted-foreground))]"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}

        <Avatar className="h-10 w-10 border-2 border-[hsl(var(--avivar-primary))]">
          <AvatarFallback className="bg-[hsl(var(--avivar-primary)/0.15)] text-[hsl(var(--avivar-primary))] font-semibold">
            {lead?.name?.charAt(0).toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[hsl(var(--avivar-foreground))] truncate">
              {lead?.name || 'Lead'}
            </h3>
            <Badge 
              variant="outline" 
              className={cn("text-xs shrink-0", statusStyles[conversation.status])}
            >
              {statusLabels[conversation.status]}
            </Badge>
          </div>
          <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] truncate">
            {lead?.phone} • {lead?.procedure_interest || 'Sem interesse definido'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))]"
        >
          <Phone className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))]"
        >
          <Video className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))]"
        >
          <User className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className="text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))]"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]"
          >
            <DropdownMenuItem 
              onClick={() => onStatusChange('resolved')}
              className="gap-2 text-[hsl(var(--avivar-foreground))]"
            >
              <Check className="h-4 w-4 text-green-500" />
              Marcar como Resolvida
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[hsl(var(--avivar-border))]" />
            <DropdownMenuItem 
              onClick={() => onStatusChange('archived')}
              className="gap-2 text-[hsl(var(--avivar-foreground))]"
            >
              <Archive className="h-4 w-4" />
              Arquivar Conversa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
