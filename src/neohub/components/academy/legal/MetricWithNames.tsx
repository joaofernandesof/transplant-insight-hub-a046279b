/**
 * Metric With Names Component
 * Shows a metric value with a expandable list of names behind it
 */

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PersonInfo {
  name: string;
  avatarUrl?: string | null;
  detail?: string;
}

interface MetricWithNamesProps {
  value: string | number;
  label: string;
  sublabel?: string;
  people: PersonInfo[];
  colorClass?: string;
  bgClass?: string;
  icon?: React.ReactNode;
  showCountBadge?: boolean;
  maxVisible?: number;
  alwaysExpanded?: boolean;
}

export function MetricWithNames({
  value,
  label,
  sublabel,
  people,
  colorClass = 'text-primary',
  bgClass = 'bg-muted/50',
  icon,
  showCountBadge = true,
  maxVisible = 5,
  alwaysExpanded = false
}: MetricWithNamesProps) {
  const [isOpen, setIsOpen] = useState(alwaysExpanded);
  const hasMore = people.length > maxVisible;
  const visiblePeople = isOpen ? people : people.slice(0, maxVisible);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className={cn("rounded-lg p-4", bgClass)}>
      <div className="text-center mb-3">
        {icon && <div className="flex justify-center mb-1">{icon}</div>}
        <p className={cn("text-2xl font-bold", colorClass)}>{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
        {sublabel && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{sublabel}</p>
        )}
      </div>

      {people.length > 0 && (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full h-7 text-xs gap-1 no-print"
            >
              <Users className="h-3 w-3" />
              {showCountBadge && (
                <Badge variant="secondary" className="h-4 text-[10px] px-1.5">
                  {people.length}
                </Badge>
              )}
              <span className="text-muted-foreground">
                {isOpen ? 'Ocultar nomes' : 'Ver nomes'}
              </span>
              {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-2">
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {visiblePeople.map((person, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-2 p-1.5 bg-background rounded-md text-xs"
                >
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={person.avatarUrl || undefined} />
                    <AvatarFallback className="text-[8px]">
                      {getInitials(person.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 truncate font-medium">{person.name}</span>
                  {person.detail && (
                    <span className="text-muted-foreground text-[10px]">{person.detail}</span>
                  )}
                </div>
              ))}
              {!isOpen && hasMore && (
                <p className="text-[10px] text-center text-muted-foreground">
                  +{people.length - maxVisible} mais...
                </p>
              )}
            </div>
          </CollapsibleContent>

          {/* Always visible in print mode */}
          <div className="hidden print:block mt-2">
            <div className="space-y-1 text-[9px]">
              {people.map((person, index) => (
                <div key={index} className="flex items-center gap-1">
                  <span className="font-medium">{person.name}</span>
                  {person.detail && (
                    <span className="text-muted-foreground">({person.detail})</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Collapsible>
      )}
    </div>
  );
}

/**
 * Compact inline list of names (for cards with less space)
 */
interface NameListBadgeProps {
  people: PersonInfo[];
  maxShow?: number;
  className?: string;
}

export function NameListBadge({ people, maxShow = 3, className }: NameListBadgeProps) {
  if (people.length === 0) return null;

  const visible = people.slice(0, maxShow);
  const remaining = people.length - maxShow;

  return (
    <div className={cn("flex flex-wrap gap-1 mt-2", className)}>
      {visible.map((person, i) => (
        <Badge key={i} variant="outline" className="text-[9px] px-1.5 py-0 h-4">
          {person.name.split(' ')[0]}
        </Badge>
      ))}
      {remaining > 0 && (
        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
          +{remaining}
        </Badge>
      )}
    </div>
  );
}

/**
 * Expandable names section for charts/cards
 */
interface ExpandableNamesProps {
  title: string;
  people: PersonInfo[];
  colorClass?: string;
}

export function ExpandableNames({ title, people, colorClass = 'text-foreground' }: ExpandableNamesProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (people.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-2">
      <CollapsibleTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full h-6 text-[10px] justify-between px-2 no-print"
        >
          <span className={cn("flex items-center gap-1", colorClass)}>
            <Users className="h-3 w-3" />
            {title}
          </span>
          <Badge variant="outline" className="h-4 text-[9px] px-1">
            {people.length}
          </Badge>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-1">
        <div className="grid grid-cols-2 gap-1 p-2 bg-muted/30 rounded-md max-h-32 overflow-y-auto">
          {people.map((person, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[10px]">
              <Avatar className="h-4 w-4">
                <AvatarImage src={person.avatarUrl || undefined} />
                <AvatarFallback className="text-[7px]">
                  {person.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{person.name}</span>
            </div>
          ))}
        </div>
      </CollapsibleContent>

      {/* Print version */}
      <div className="hidden print:block mt-1 text-[8px] text-muted-foreground">
        <strong>{title}:</strong> {people.map(p => p.name).join(', ')}
      </div>
    </Collapsible>
  );
}
