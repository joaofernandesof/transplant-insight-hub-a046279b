/**
 * ChatHeader - Cabeçalho do painel de chat
 * Exibe info do lead, toggle de IA e ações rápidas
 */

import { 
  MoreVertical, 
  Check, 
  Archive, 
  Phone, 
  Video,
  User,
  ChevronLeft,
  Bot,
  BotOff,
  Trash2,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  onAIToggle?: (enabled: boolean) => void;
  onDeleteLead?: () => void;
  isDeletingLead?: boolean;
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
  onAIToggle,
  onDeleteLead,
  isDeletingLead,
  onBack,
  showBackButton 
}: ChatHeaderProps) {
  const lead = conversation.lead;
  const isAIEnabled = conversation.ai_enabled ?? true;

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


        <div className="min-w-0">
          <h3 className="font-semibold text-[hsl(var(--avivar-foreground))] truncate">
            {lead?.name || 'Lead'}
          </h3>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* AI Toggle */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-[hsl(var(--avivar-muted)/0.5)]">
                {isAIEnabled ? (
                  <Bot className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
                ) : (
                  <BotOff className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
                )}
                <Switch
                  checked={isAIEnabled}
                  onCheckedChange={(checked) => onAIToggle?.(checked)}
                  className="data-[state=checked]:bg-[hsl(var(--avivar-primary))]"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isAIEnabled ? 'IA ativa - Respondendo automaticamente' : 'IA desativada - Modo manual'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
