import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, UserPlus, Calendar, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { HotLead } from '@/hooks/useHotLeads';

interface AvailableLeadCardProps {
  lead: HotLead;
  onAcquire: (lead: HotLead) => void;
}

/**
 * Masks a name by showing only the first 3 letters followed by asterisks.
 * For names with multiple parts, masks each part individually.
 * Example: "Maria Santos" -> "Mar*** San***"
 */
function maskName(fullName: string): string {
  if (!fullName) return '***';
  
  const parts = fullName.trim().split(/\s+/);
  
  return parts.map(part => {
    if (part.length <= 3) {
      return part.charAt(0) + '***';
    }
    return part.substring(0, 3) + '***';
  }).join(' ');
}

export function AvailableLeadCard({ lead, onAcquire }: AvailableLeadCardProps) {
  const location = [lead.city, lead.state].filter(Boolean).join(' - ');
  const maskedName = maskName(lead.name);
  const hasTags = lead.tags && lead.tags.length > 0;
  
  // Format arrival date
  const arrivalDate = lead.created_at 
    ? format(new Date(lead.created_at), "dd 'de' MMM", { locale: ptBR })
    : null;

  return (
    <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow relative overflow-hidden">
      {/* Tag ribbon */}
      {hasTags && (
        <div className="bg-red-500 text-white text-[10px] font-bold px-3 py-1 flex items-center gap-1">
          <Tag className="h-3 w-3 shrink-0" />
          <span className="truncate">{lead.tags!.join(' • ')}</span>
        </div>
      )}
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{maskedName}</h3>
            {location && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3 shrink-0" />
                {location}
              </p>
            )}
            {arrivalDate && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Calendar className="h-3 w-3 shrink-0" />
                Chegou em {arrivalDate}
              </p>
            )}
          </div>
          <Button
            size="sm"
            onClick={() => onAcquire(lead)}
            className="shrink-0"
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Adquirir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}