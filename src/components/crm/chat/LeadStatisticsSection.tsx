import {
  Globe,
  Megaphone,
  Target,
  Search,
  FileText,
  BarChart3,
} from 'lucide-react';

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
  return (
    <div className="space-y-2">
      <span className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--avivar-foreground))]">
        <BarChart3 className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
        Estatísticas
      </span>
      <div className="space-y-2">
        <UtmField icon={Megaphone} label="Fonte (source)" value={utmSource} />
        <UtmField icon={Target} label="Meio (medium)" value={utmMedium} />
        <UtmField icon={FileText} label="Campanha" value={utmCampaign} />
        <UtmField icon={Search} label="Termo" value={utmTerm} />
        <UtmField icon={FileText} label="Conteúdo" value={utmContent} />
      </div>
    </div>
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