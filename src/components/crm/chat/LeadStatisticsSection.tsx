import { useState } from 'react';
import {
  Megaphone,
  Target,
  Search,
  FileText,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface LeadTrafficSectionProps {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
}

export function LeadStatisticsSection({
  utmSource,
  utmMedium,
  utmCampaign,
  utmTerm,
  utmContent,
}: LeadTrafficSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center justify-between w-full py-2 text-left">
          <span className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--avivar-foreground))]">
            <BarChart3 className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
            Estatísticas
          </span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 pt-2">
        <UtmField icon={Megaphone} label="utm_source" value={utmSource} />
        <UtmField icon={Target} label="utm_medium" value={utmMedium} />
        <UtmField icon={FileText} label="utm_campaign" value={utmCampaign} />
        <UtmField icon={Search} label="utm_term" value={utmTerm} />
        <UtmField icon={FileText} label="utm_content" value={utmContent} />
      </CollapsibleContent>
    </Collapsible>
  );
}

function UtmField({ icon: Icon, label, value }: { icon: any; label: string; value?: string | null }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))]">
      <Icon className="h-3.5 w-3.5 text-[hsl(var(--avivar-primary))] shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">{label}</p>
        <p className="text-sm font-medium text-[hsl(var(--avivar-foreground))] truncate">
          {value || <span className="text-[hsl(var(--avivar-muted-foreground))] italic font-normal">—</span>}
        </p>
      </div>
    </div>
  );
}
