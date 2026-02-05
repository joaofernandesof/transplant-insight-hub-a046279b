import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, UserPlus } from 'lucide-react';
import type { HotLead } from '@/hooks/useHotLeads';

interface AvailableLeadCardProps {
  lead: HotLead;
  onAcquire: (lead: HotLead) => void;
}

export function AvailableLeadCard({ lead, onAcquire }: AvailableLeadCardProps) {
  const location = [lead.city, lead.state].filter(Boolean).join(' - ');

  return (
    <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{lead.name}</h3>
            {location && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3 shrink-0" />
                {location}
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
