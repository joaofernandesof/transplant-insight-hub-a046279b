import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, ShoppingCart, Calendar, Timer, Eye, EyeOff, Phone, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import type { HotLead } from '@/hooks/useHotLeads';

interface AvailableLeadCardProps {
  lead: HotLead;
  onAcquire: (lead: HotLead) => void;
  cooldownRemaining?: number;
  formatCooldown?: (seconds: number) => string;
}

function maskName(fullName: string): string {
  if (!fullName) return '***';
  const parts = fullName.trim().split(/\s+/);
  return parts.map((part, i) => {
    if (i === 0) return part;
    if (part.length <= 3) return part.charAt(0) + '***';
    return part.substring(0, 3) + '***';
  }).join(' ');
}

export function AvailableLeadCard({ lead, onAcquire, cooldownRemaining = 0, formatCooldown }: AvailableLeadCardProps) {
  const { isAdmin } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const location = [lead.city, lead.state].filter(Boolean).join(' - ');
  const maskedName = maskName(lead.name);
  
  const dateToShow = lead.available_at || lead.created_at;
  const arrivalDate = dateToShow
    ? format(new Date(dateToShow), "dd/MM/yyyy")
    : null;

  return (
    <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-sm truncate">{expanded ? lead.name : maskedName}</h3>
              {isAdmin && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className={`shrink-0 p-1.5 rounded-full transition-all ${
                    expanded 
                      ? 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300 ring-2 ring-orange-300 dark:ring-orange-700' 
                      : 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300 ring-2 ring-amber-300 dark:ring-amber-700 animate-pulse hover:animate-none'
                  }`}
                  title={expanded ? 'Ocultar dados' : 'Ver dados completos (admin)'}
                >
                  {expanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              )}
            </div>
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
            {expanded && isAdmin && (
              <div className="mt-2 pt-2 border-t border-dashed space-y-1">
                {lead.phone && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3 shrink-0" />
                    {lead.phone}
                  </p>
                )}
                {lead.email && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3 shrink-0" />
                    {lead.email}
                  </p>
                )}
                {lead.tags && lead.tags.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Tags: {lead.tags.join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>
          {cooldownRemaining > 0 ? (
            <div className="shrink-0 flex flex-col items-center gap-0.5">
              <Button
                size="sm"
                disabled
                className="bg-muted text-muted-foreground cursor-not-allowed"
              >
                <Timer className="h-4 w-4 mr-1" />
                {formatCooldown ? formatCooldown(cooldownRemaining) : `${Math.floor(cooldownRemaining / 60)}:${(cooldownRemaining % 60).toString().padStart(2, '0')}`}
              </Button>
              <span className="text-[10px] text-muted-foreground">Aguarde</span>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() => onAcquire(lead)}
              className="shrink-0 bg-green-600 hover:bg-green-700 text-white"
            >
              <ShoppingCart className="h-4 w-4 mr-1" />
              Adquirir
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
