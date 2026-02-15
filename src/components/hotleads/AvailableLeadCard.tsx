import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, ShoppingCart, Calendar, Timer, Eye, EyeOff, Phone, Mail, User } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import type { HotLead } from '@/hooks/useHotLeads';

interface AvailableLeadCardProps {
  lead: HotLead;
  onAcquire: (lead: HotLead) => void;
  cooldownRemaining?: number;
  formatCooldown?: (seconds: number) => string;
  selected?: boolean;
  onSelect?: (id: string) => void;
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

export function AvailableLeadCard({ lead, onAcquire, cooldownRemaining = 0, formatCooldown, selected, onSelect }: AvailableLeadCardProps) {
  const { isAdmin } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const location = [lead.city, lead.state].filter(Boolean).join(' - ');
  const maskedName = maskName(lead.name);
  
  const dateToShow = lead.available_at || lead.created_at;
  const arrivalDate = dateToShow
    ? format(new Date(dateToShow), "dd/MM/yyyy")
    : null;

  return (
    <Card className={`group border border-border/60 hover:border-green-400/60 hover:shadow-lg transition-all duration-200 overflow-hidden ${selected ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-0">
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-green-400 to-emerald-500" />
        
        <div className="p-4">
          {/* Avatar + Name row */}
          <div className="flex items-center gap-3 mb-3">
            {onSelect && (
              <Checkbox checked={selected} onCheckedChange={() => onSelect(lead.id)} className="shrink-0" />
            )}
            <div className="shrink-0 h-10 w-10 rounded-full bg-muted flex items-center justify-center border-2 border-border">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-sm truncate">{expanded ? lead.name : maskedName}</h3>
                {isAdmin && (
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="shrink-0 transition-colors"
                    title={expanded ? 'Ocultar dados' : 'Ver dados completos (admin)'}
                  >
                    {expanded ? <EyeOff className="h-3.5 w-3.5 text-orange-500" /> : <Eye className="h-3.5 w-3.5 text-amber-500 hover:text-amber-600" />}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Info rows */}
          <div className="space-y-1.5 mb-3">
            {location && (
              <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-green-500" />
                {location}
              </p>
            )}
            {arrivalDate && (
              <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-green-500" />
                {arrivalDate}
              </p>
            )}
          </div>

          {/* Admin expanded info */}
          {expanded && isAdmin && (
            <div className="mb-3 pt-2 border-t border-dashed space-y-1">
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

          {/* Action button */}
          {cooldownRemaining > 0 ? (
            <Button
              size="sm"
              disabled
              className="w-full bg-muted text-muted-foreground cursor-not-allowed"
            >
              <Timer className="h-4 w-4 mr-1" />
              {formatCooldown ? formatCooldown(cooldownRemaining) : `${Math.floor(cooldownRemaining / 60)}:${(cooldownRemaining % 60).toString().padStart(2, '0')}`}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => onAcquire(lead)}
              className="w-full bg-green-600 hover:bg-green-700 text-white shadow-sm"
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
