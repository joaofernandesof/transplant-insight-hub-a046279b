import { useState } from 'react';
import {
  Globe,
  Megaphone,
  Target,
  Search,
  FileText,
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

  const hasAnyUtm = utmSource || utmMedium || utmCampaign || utmTerm || utmContent;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center justify-between w-full py-2 text-left">
          <span className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--avivar-foreground))]">
            <Globe className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
            Origem do Tráfego
          </span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 pt-2">
        {!hasAnyUtm ? (
          <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] italic">
            Nenhum dado de tráfego registrado para este lead.
          </p>
        ) : (
          <div className="space-y-2">
            {utmSource && (
              <UtmField icon={Megaphone} label="Fonte (source)" value={utmSource} />
            )}
            {utmMedium && (
              <UtmField icon={Target} label="Meio (medium)" value={utmMedium} />
            )}
            {utmCampaign && (
              <UtmField icon={FileText} label="Campanha" value={utmCampaign} />
            )}
            {utmTerm && (
              <UtmField icon={Search} label="Termo" value={utmTerm} />
            )}
            {utmContent && (
              <UtmField icon={FileText} label="Conteúdo" value={utmContent} />
            )}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function UtmField({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))]">
      <Icon className="h-3.5 w-3.5 text-[hsl(var(--avivar-primary))] shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">{label}</p>
        <p className="text-sm font-medium text-[hsl(var(--avivar-foreground))] truncate">{value}</p>
      </div>
    </div>
  );
}
