/**
 * LeadDetailSheet - Sheet lateral para visualizar detalhes do lead no Kanban
 * Abre ao clicar no lead card, com opção de ir para o inbox
 */

import { useNavigate } from 'react-router-dom';
import { MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { LeadDetailsSidebarStandalone } from '@/components/crm/chat/LeadDetailsSidebarStandalone';
import type { KanbanLead } from '../hooks/useKanbanLeads';

interface LeadDetailSheetProps {
  lead: KanbanLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeadUpdated?: () => void;
}

export function LeadDetailSheet({ lead, open, onOpenChange, onLeadUpdated }: LeadDetailSheetProps) {
  const navigate = useNavigate();

  if (!lead) return null;

  // Map KanbanLead to the Lead shape expected by LeadDetailsSidebarStandalone
  const leadData = {
    id: lead.id,
    name: lead.name,
    phone: lead.phone || '',
    email: lead.email || null,
    status: 'novo',
    source: lead.source || null,
    notes: lead.notes || null,
    interest_level: null,
    tags: lead.tags || null,
    created_at: lead.created_at,
    updated_at: lead.updated_at,
    user_id: '',
  };

  const handleGoToInbox = () => {
    onOpenChange(false);
    if (lead.phone) {
      navigate(`/avivar/inbox?phone=${encodeURIComponent(lead.phone)}`);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="p-0 w-[380px] sm:w-[420px] bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))] flex flex-col"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{lead.name}</SheetTitle>
        </SheetHeader>

        {/* Lead details */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <LeadDetailsSidebarStandalone 
            lead={leadData as any} 
            onLeadUpdated={onLeadUpdated} 
          />
        </div>

        {/* Action footer */}
        {lead.phone && (
          <div className="p-4 border-t border-[hsl(var(--avivar-border))]">
            <Button
              onClick={handleGoToInbox}
              className="w-full bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-primary)/0.9)] text-white"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Abrir Conversa no Inbox
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
