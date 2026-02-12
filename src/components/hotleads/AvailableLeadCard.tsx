import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, ShoppingCart, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { HotLead } from '@/hooks/useHotLeads';

interface AvailableLeadCardProps {
  lead: HotLead;
  onAcquire: (lead: HotLead) => void;
}

/**
 * Masks a name: first name shown fully, remaining parts show first 3 chars + asterisks.
 * Example: "Maria Santos Lima" -> "Maria San*** Lim***"
 */
function maskName(fullName: string): string {
  if (!fullName) return '***';
  const parts = fullName.trim().split(/\s+/);
  return parts.map((part, i) => {
    if (i === 0) return part;
    if (part.length <= 3) return part.charAt(0) + '***';
    return part.substring(0, 3) + '***';
  }).join(' ');
}

export function AvailableLeadCard({ lead, onAcquire }: AvailableLeadCardProps) {
  const location = [lead.city, lead.state].filter(Boolean).join(' - ');
  const maskedName = maskName(lead.name);
  
  // Format arrival date
  const arrivalDate = lead.created_at 
    ? format(new Date(lead.created_at), "dd/MM/yyyy")
    : null;

  return (
    <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
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
                {arrivalDate}
              </p>
            )}
          </div>
          <Button
            size="sm"
            onClick={() => onAcquire(lead)}
            className="shrink-0 bg-green-600 hover:bg-green-700 text-white"
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            Adquirir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}