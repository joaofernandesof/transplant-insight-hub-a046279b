/**
 * Compact Journey Card - Kommo-style design
 * Shows: Name, Lead ID, Tags, Creation date/time
 */

import { PatientJourney, SERVICE_LABELS } from '../types';
import { Badge } from '@/components/ui/badge';
import { User, Calendar, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CompactJourneyCardProps {
  journey: PatientJourney;
  onSelect: () => void;
}

export function CompactJourneyCard({ journey, onSelect }: CompactJourneyCardProps) {
  // Generate short ID from UUID (first 8 chars)
  const shortId = journey.id.slice(0, 8).toUpperCase();
  
  // Get service tag
  const serviceTag = journey.service_type === 'capilar' ? '#CAPILAR' 
    : journey.service_type === 'barba' ? '#BARBA' 
    : '#SOBRANCELHA';
  
  // Format creation date
  const createdAt = new Date(journey.created_at);
  const formattedDate = format(createdAt, "dd/MM 'às' HH:mm", { locale: ptBR });
  
  return (
    <div
      onClick={onSelect}
      className={cn(
        "group bg-[hsl(var(--avivar-card))] rounded-lg border border-[hsl(var(--avivar-border))]",
        "p-3 cursor-pointer transition-all duration-200",
        "hover:shadow-md hover:border-[hsl(var(--avivar-primary)/0.5)]",
        "hover:bg-[hsl(var(--avivar-card-hover))]"
      )}
    >
      {/* Row 1: Avatar + Name + Date */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Avatar Circle */}
          <div className="w-8 h-8 rounded-full bg-[hsl(var(--avivar-muted))] flex items-center justify-center shrink-0">
            <User className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
          </div>
          {/* Name */}
          <span className="font-medium text-sm text-[hsl(var(--avivar-foreground))] truncate">
            {journey.patient_name}
          </span>
        </div>
        {/* Date/Time */}
        <span className="text-[10px] text-[hsl(var(--avivar-muted-foreground))] shrink-0 flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {formattedDate}
        </span>
      </div>

      {/* Row 2: Lead ID subtitle */}
      <div className="flex items-center gap-1.5 mb-2 pl-10">
        <Hash className="h-3 w-3 text-[hsl(var(--avivar-primary))]" />
        <span className="text-xs text-[hsl(var(--avivar-primary))] font-medium">
          Lead #{shortId}
        </span>
      </div>

      {/* Row 3: Tags */}
      <div className="flex items-center gap-1.5 pl-10 flex-wrap">
        <Badge 
          variant="secondary" 
          className={cn(
            "text-[10px] px-1.5 py-0 h-5 font-normal",
            journey.service_type === 'capilar' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
            journey.service_type === 'barba' && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
            journey.service_type === 'sobrancelha' && "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400"
          )}
        >
          {serviceTag}
        </Badge>
        
        {/* Lead source tag if available */}
        {journey.lead_source && (
          <Badge 
            variant="outline" 
            className="text-[10px] px-1.5 py-0 h-5 font-normal border-[hsl(var(--avivar-border))] text-[hsl(var(--avivar-muted-foreground))]"
          >
            #{journey.lead_source.replace(/\s+/g, '_').toUpperCase()}
          </Badge>
        )}

        {/* Status indicator dot */}
        <div className="ml-auto">
          <div className={cn(
            "w-2 h-2 rounded-full",
            journey.attended ? "bg-emerald-500" : "bg-amber-500"
          )} />
        </div>
      </div>
    </div>
  );
}
