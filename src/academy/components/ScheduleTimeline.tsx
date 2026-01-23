import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Coffee,
  Utensils,
  Stethoscope,
  BookOpen,
  Users,
  Clock,
  MapPin,
  User,
  Presentation,
  MessageSquare,
  PartyPopper,
  Briefcase,
  List,
  CalendarClock
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ScheduleItem {
  id: string;
  startTime: string;
  endTime: string;
  activity: string;
  location: string | null;
  instructor: string | null;
  notes: string | null;
}

interface ScheduleDay {
  id: string;
  dayNumber: number;
  dayDate: string | null;
  dayTitle: string;
  dayTheme: string | null;
  items: ScheduleItem[];
}

interface ScheduleTimelineProps {
  schedule: ScheduleDay[];
}

// Activity type to color/icon mapping
function getActivityStyle(activity: string): { 
  icon: React.ReactNode; 
  bgColor: string; 
  borderColor: string;
  textColor: string;
} {
  const lower = activity.toLowerCase();
  
  if (lower.includes('coffee') || lower.includes('break') || lower.includes('welcome')) {
    return {
      icon: <Coffee className="h-4 w-4" />,
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      borderColor: 'border-amber-300 dark:border-amber-700',
      textColor: 'text-amber-700 dark:text-amber-300'
    };
  }
  if (lower.includes('almoço') || lower.includes('almoco')) {
    return {
      icon: <Utensils className="h-4 w-4" />,
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      borderColor: 'border-orange-300 dark:border-orange-700',
      textColor: 'text-orange-700 dark:text-orange-300'
    };
  }
  if (lower.includes('prática') || lower.includes('cirúrgico') || lower.includes('cirurgico') || lower.includes('hands-on')) {
    return {
      icon: <Stethoscope className="h-4 w-4" />,
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
      borderColor: 'border-emerald-300 dark:border-emerald-700',
      textColor: 'text-emerald-700 dark:text-emerald-300'
    };
  }
  if (lower.includes('aula') || lower.includes('teórica') || lower.includes('teorica') || lower.includes('fundamento')) {
    return {
      icon: <BookOpen className="h-4 w-4" />,
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      borderColor: 'border-blue-300 dark:border-blue-700',
      textColor: 'text-blue-700 dark:text-blue-300'
    };
  }
  if (lower.includes('workshop') || lower.includes('apresentação') || lower.includes('apresentacao')) {
    return {
      icon: <Presentation className="h-4 w-4" />,
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      borderColor: 'border-purple-300 dark:border-purple-700',
      textColor: 'text-purple-700 dark:text-purple-300'
    };
  }
  if (lower.includes('neoconnect') || lower.includes('confraternização') || lower.includes('networking')) {
    return {
      icon: <PartyPopper className="h-4 w-4" />,
      bgColor: 'bg-pink-100 dark:bg-pink-900/30',
      borderColor: 'border-pink-300 dark:border-pink-700',
      textColor: 'text-pink-700 dark:text-pink-300'
    };
  }
  if (lower.includes('mentoria') || lower.includes('discussão') || lower.includes('discussao')) {
    return {
      icon: <MessageSquare className="h-4 w-4" />,
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
      borderColor: 'border-indigo-300 dark:border-indigo-700',
      textColor: 'text-indigo-700 dark:text-indigo-300'
    };
  }
  if (lower.includes('abertura') || lower.includes('orientações') || lower.includes('orientacoes')) {
    return {
      icon: <Briefcase className="h-4 w-4" />,
      bgColor: 'bg-slate-100 dark:bg-slate-800/50',
      borderColor: 'border-slate-300 dark:border-slate-600',
      textColor: 'text-slate-700 dark:text-slate-300'
    };
  }
  
  // Default
  return {
    icon: <Clock className="h-4 w-4" />,
    bgColor: 'bg-gray-100 dark:bg-gray-800/50',
    borderColor: 'border-gray-300 dark:border-gray-600',
    textColor: 'text-gray-700 dark:text-gray-300'
  };
}

// Parse time string (HH:MM:SS or HH:MM) to hours
function parseTimeToHours(time: string): number {
  const parts = time.split(':');
  return parseInt(parts[0], 10) + parseInt(parts[1], 10) / 60;
}

// Format time for display
function formatTime(time: string): string {
  return time.substring(0, 5);
}

// Calculate the range of hours in the schedule
function getHourRange(items: ScheduleItem[]): { start: number; end: number } {
  if (items.length === 0) return { start: 8, end: 18 };
  
  let minHour = 24;
  let maxHour = 0;
  
  items.forEach(item => {
    const startHour = parseTimeToHours(item.startTime);
    const endHour = parseTimeToHours(item.endTime);
    minHour = Math.min(minHour, Math.floor(startHour));
    maxHour = Math.max(maxHour, Math.ceil(endHour));
  });
  
  return { start: Math.max(6, minHour), end: Math.min(23, maxHour) };
}

export function ScheduleTimeline({ schedule }: ScheduleTimelineProps) {
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex justify-end">
        <ToggleGroup 
          type="single" 
          value={viewMode} 
          onValueChange={(value) => value && setViewMode(value as 'timeline' | 'list')}
          className="bg-muted rounded-lg p-1"
        >
          <ToggleGroupItem value="timeline" aria-label="Ver como timeline" className="gap-1.5 px-3 data-[state=on]:bg-background data-[state=on]:shadow-sm">
            <CalendarClock className="h-4 w-4" />
            <span className="text-xs hidden sm:inline">Timeline</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="Ver como lista" className="gap-1.5 px-3 data-[state=on]:bg-background data-[state=on]:shadow-sm">
            <List className="h-4 w-4" />
            <span className="text-xs hidden sm:inline">Lista</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      
      {/* Schedule Content */}
      <div className="space-y-6">
        {schedule.map((day) => (
          viewMode === 'timeline' 
            ? <DayTimeline key={day.id} day={day} />
            : <DayList key={day.id} day={day} />
        ))}
      </div>
    </div>
  );
}

// List View Component
function DayList({ day }: { day: ScheduleDay }) {
  const sortedItems = useMemo(() => 
    [...day.items].sort((a, b) => parseTimeToHours(a.startTime) - parseTimeToHours(b.startTime)),
    [day.items]
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{day.dayTitle}</CardTitle>
            {day.dayDate && (
              <CardDescription>
                {format(parseISO(day.dayDate), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </CardDescription>
            )}
          </div>
          <Badge variant="outline" className="font-semibold">Dia {day.dayNumber}</Badge>
        </div>
        {day.dayTheme && (
          <p className="text-sm text-muted-foreground mt-2 italic">{day.dayTheme}</p>
        )}
      </CardHeader>
      <CardContent className="pb-6">
        <div className="space-y-2">
          {sortedItems.map((item) => {
            const style = getActivityStyle(item.activity);
            const isBreak = item.activity.toLowerCase().includes('coffee') || 
                           item.activity.toLowerCase().includes('almoço') ||
                           item.activity.toLowerCase().includes('almoco');
            
            return (
              <div 
                key={item.id} 
                className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-colors ${style.bgColor} ${style.borderColor} ${isBreak ? 'border-dashed' : ''}`}
              >
                <div className={`flex-shrink-0 w-9 h-9 rounded-lg border ${style.bgColor} ${style.borderColor} flex items-center justify-center ${style.textColor}`}>
                  {style.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-sm font-semibold ${style.textColor}`}>
                      {formatTime(item.startTime)} - {formatTime(item.endTime)}
                    </span>
                    {item.location && (
                      <Badge variant="secondary" className="text-xs">
                        {item.location}
                      </Badge>
                    )}
                  </div>
                  <p className="font-medium text-sm">{item.activity}</p>
                  {item.instructor && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <User className="h-3 w-3" />
                      {item.instructor}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Get color classes for group badge
function getGroupBadgeColors(groupName: string): { bg: string; border: string; text: string } {
  const lower = groupName.toLowerCase();
  
  if (lower.includes('verde')) {
    return { bg: 'bg-green-500', border: 'border-green-600', text: 'text-white' };
  }
  if (lower.includes('preto')) {
    return { bg: 'bg-gray-900 dark:bg-black', border: 'border-gray-800', text: 'text-white' };
  }
  if (lower.includes('azul')) {
    return { bg: 'bg-blue-500', border: 'border-blue-600', text: 'text-white' };
  }
  if (lower.includes('branco')) {
    return { bg: 'bg-white', border: 'border-gray-300', text: 'text-gray-800' };
  }
  
  return { bg: 'bg-muted', border: 'border-border', text: 'text-foreground' };
}

// Parse notes to extract group badges - shows dots on mobile, full badges on desktop
function parseGroupBadges(notes: string): React.ReactNode[] {
  const groupColors = ['verde', 'preto', 'azul', 'branco'];
  const foundGroups: string[] = [];
  
  const lower = notes.toLowerCase();
  
  // Find each color mentioned in the notes
  for (const color of groupColors) {
    if (lower.includes(color)) {
      foundGroups.push(color);
    }
  }
  
  // If no specific colors found, skip
  if (foundGroups.length === 0) {
    return [];
  }
  
  return foundGroups.map((color, index) => {
    const groupName = `Grupo ${color.charAt(0).toUpperCase() + color.slice(1)}`;
    const colors = getGroupBadgeColors(groupName);
    return (
      <span
        key={index}
        className="inline-flex items-center gap-1"
        title={groupName}
      >
        {/* Dot for mobile - always visible */}
        <span 
          className={`w-2.5 h-2.5 sm:hidden rounded-full ${colors.bg} ${colors.border} border flex-shrink-0`}
        />
        {/* Full badge for desktop */}
        <span
          className={`hidden sm:inline-flex text-xs px-1.5 py-0.5 rounded-full border font-medium ${colors.bg} ${colors.border} ${colors.text}`}
        >
          {groupName}
        </span>
      </span>
    );
  });
}

// Check if an activity is an all-day type (Mentoria, Estúdio)
function isAllDayActivity(activity: string): boolean {
  const lower = activity.toLowerCase();
  return lower.includes('mentoria') || lower.includes('estúdio') || lower.includes('estudio');
}

// Group overlapping items into columns (for parallel activities)
function groupParallelActivities(items: ScheduleItem[]): { item: ScheduleItem; column: number; totalColumns: number }[] {
  if (items.length === 0) return [];
  
  // Sort by start time
  const sorted = [...items].sort((a, b) => parseTimeToHours(a.startTime) - parseTimeToHours(b.startTime));
  
  // Find overlapping groups
  const result: { item: ScheduleItem; column: number; totalColumns: number }[] = [];
  let currentGroup: ScheduleItem[] = [];
  let groupEndTime = 0;
  
  for (const item of sorted) {
    const itemStart = parseTimeToHours(item.startTime);
    const itemEnd = parseTimeToHours(item.endTime);
    
    // Check if this item overlaps with current group
    if (currentGroup.length === 0 || itemStart < groupEndTime) {
      currentGroup.push(item);
      groupEndTime = Math.max(groupEndTime, itemEnd);
    } else {
      // Finalize current group
      currentGroup.forEach((groupItem, idx) => {
        result.push({ item: groupItem, column: idx, totalColumns: currentGroup.length });
      });
      // Start new group
      currentGroup = [item];
      groupEndTime = itemEnd;
    }
  }
  
  // Finalize last group
  currentGroup.forEach((groupItem, idx) => {
    result.push({ item: groupItem, column: idx, totalColumns: currentGroup.length });
  });
  
  return result;
}

function DayTimeline({ day }: { day: ScheduleDay }) {
  // Separate all-day activities from regular activities
  const { allDayItems, regularItems } = useMemo(() => {
    const allDay: ScheduleItem[] = [];
    const regular: ScheduleItem[] = [];
    
    day.items.forEach(item => {
      if (isAllDayActivity(item.activity)) {
        allDay.push(item);
      } else {
        regular.push(item);
      }
    });
    
    return { allDayItems: allDay, regularItems: regular };
  }, [day.items]);

  // Calculate hour range for this day (only for regular items)
  const hourRange = useMemo(() => getHourRange(regularItems), [regularItems]);
  const hours = useMemo(() => {
    const arr = [];
    for (let h = hourRange.start; h <= hourRange.end; h++) {
      arr.push(h);
    }
    return arr;
  }, [hourRange]);
  
  // Group parallel activities (only regular items)
  const groupedItems = useMemo(() => groupParallelActivities(regularItems), [regularItems]);

  // Calculate pixel height per hour - increased for better readability
  const HOUR_HEIGHT = 80; // pixels per hour (increased from 60)
  const totalHeight = (hourRange.end - hourRange.start) * HOUR_HEIGHT;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{day.dayTitle}</CardTitle>
            {day.dayDate && (
              <CardDescription>
                {format(parseISO(day.dayDate), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </CardDescription>
            )}
          </div>
          <Badge variant="outline" className="font-semibold">Dia {day.dayNumber}</Badge>
        </div>
        {day.dayTheme && (
          <p className="text-sm text-muted-foreground mt-2 italic">{day.dayTheme}</p>
        )}
      </CardHeader>
      <CardContent className="pb-6">
        {/* Timeline Grid with All-Day Columns on the LEFT */}
        <div className="relative flex" style={{ minHeight: totalHeight }}>
          {/* LEFT section: All-Day vertical bars */}
          {allDayItems.length > 0 && (
            <div className="flex gap-2 mr-3 flex-shrink-0">
              {allDayItems.map((item) => {
                const style = getActivityStyle(item.activity);
                return (
                  <div
                    key={item.id}
                    className={`w-20 sm:w-24 rounded-lg border-2 ${style.bgColor} ${style.borderColor} p-2 flex flex-col items-center`}
                    style={{ height: totalHeight }}
                  >
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-md ${style.bgColor} ${style.borderColor} border flex items-center justify-center ${style.textColor} mb-2`}>
                      {style.icon}
                    </div>
                    
                    {/* Vertical text container */}
                    <div className="flex-1 flex items-center justify-center">
                      <p 
                        className="font-medium text-xs sm:text-sm text-center"
                        style={{ 
                          writingMode: 'vertical-rl',
                          textOrientation: 'mixed',
                          transform: 'rotate(180deg)'
                        }}
                      >
                        {item.activity}
                      </p>
                    </div>
                    
                    {/* Location at bottom */}
                    {item.location && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${style.bgColor} ${style.borderColor} ${style.textColor} font-medium mt-2 text-center`}>
                        {item.location}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* RIGHT section: Hour labels + Regular activities */}
          <div className="flex-1 relative" style={{ height: totalHeight }}>
            {/* Hour lines */}
            {hours.map((hour, index) => (
              <div 
                key={hour}
                className="absolute left-0 right-0 flex items-start"
                style={{ top: index * HOUR_HEIGHT }}
              >
                {/* Hour label - narrower on mobile */}
                <div className="w-11 sm:w-14 flex-shrink-0 text-[10px] sm:text-xs text-muted-foreground font-medium pr-1 sm:pr-2 text-right -mt-2">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                {/* Hour line */}
                <div className="flex-1 border-t border-dashed border-muted-foreground/20" />
              </div>
            ))}

            {/* Activity blocks */}
            <div className="absolute left-11 sm:left-14 right-0 top-0" style={{ height: totalHeight }}>
              {groupedItems.map(({ item, column, totalColumns }) => {
                const startHour = parseTimeToHours(item.startTime);
                const endHour = parseTimeToHours(item.endTime);
                const top = (startHour - hourRange.start) * HOUR_HEIGHT;
                const height = (endHour - startHour) * HOUR_HEIGHT;
                
                const style = getActivityStyle(item.activity);
                
                // Calculate width based on number of parallel items
                const widthPercent = 100 / totalColumns;
                const leftPercent = column * widthPercent;
                
                // Parse group badges from notes
                const groupBadges = item.notes ? parseGroupBadges(item.notes) : null;

                return (
                  <div
                    key={item.id}
                    className={`absolute rounded-lg border-2 overflow-hidden ${style.bgColor} ${style.borderColor} p-1.5 sm:p-2`}
                    style={{
                      top,
                      height: Math.max(height, 50),
                      left: `${leftPercent}%`,
                      width: `calc(${widthPercent}% - 4px)`,
                    }}
                  >
                    <div className="h-full flex flex-col min-h-0">
                      {/* Header with icon */}
                      <div className="flex items-start gap-1 sm:gap-1.5 mb-0.5 sm:mb-1 flex-shrink-0">
                        <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md ${style.bgColor} ${style.borderColor} border flex items-center justify-center ${style.textColor} flex-shrink-0`}>
                          {style.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs sm:text-sm leading-tight line-clamp-2">{item.activity}</p>
                        </div>
                      </div>
                      
                      {/* Details - only show if there's enough height */}
                      <div className="flex-1 min-h-0 overflow-hidden">
                        {item.location && height >= 55 && (
                          <span className={`inline-block text-[10px] px-1 sm:px-1.5 py-0.5 rounded-full border ${style.bgColor} ${style.borderColor} ${style.textColor} font-medium`}>
                            {item.location}
                          </span>
                        )}
                        
                        {/* Group badges */}
                        {groupBadges && height >= 70 && (
                          <div className="flex flex-wrap gap-0.5 mt-0.5">
                            {groupBadges}
                          </div>
                        )}
                        
                        {item.instructor && height >= 85 && (
                          <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                            <User className="h-3 w-3 flex-shrink-0" />
                            <span>{item.instructor}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Legenda:</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Coffee Break', style: getActivityStyle('coffee') },
              { label: 'Refeição', style: getActivityStyle('almoço') },
              { label: 'Prática', style: getActivityStyle('prática') },
              { label: 'Aula Teórica', style: getActivityStyle('aula') },
              { label: 'Workshop', style: getActivityStyle('workshop') },
              { label: 'Social', style: getActivityStyle('neoconnect') },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded ${item.style.bgColor} ${item.style.borderColor} border flex items-center justify-center ${item.style.textColor}`}>
                  {item.style.icon}
                </div>
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
