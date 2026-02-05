import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Lock, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { HotLead } from '@/hooks/useHotLeads';

interface AcquiredLeadCardProps {
  lead: HotLead;
  claimerName: string;
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

export function AcquiredLeadCard({ lead, claimerName }: AcquiredLeadCardProps) {
  const location = [lead.city, lead.state].filter(Boolean).join(' - ');
  const maskedName = maskName(lead.name);
  
  // Format arrival date
  const arrivalDate = lead.created_at 
    ? format(new Date(lead.created_at), "dd 'de' MMM", { locale: ptBR })
    : null;

  return (
    <Card className="border-l-4 border-l-muted opacity-75">
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
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <User className="h-3 w-3 shrink-0" />
              Adquirido por: <span className="font-medium">{claimerName}</span>
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            <Lock className="h-3 w-3" />
            Bloqueado
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
