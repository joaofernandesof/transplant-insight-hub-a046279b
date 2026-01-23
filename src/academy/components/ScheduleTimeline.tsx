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
  // Calculate hour range for this day
  const hourRange = useMemo(() => getHourRange(day.items), [day.items]);
  const hours = useMemo(() => {
    const arr = [];
    for (let h = hourRange.start; h <= hourRange.end; h++) {
      arr.push(h);
    }
    return arr;
  }, [hourRange]);
  
  // Group parallel activities
  const groupedItems = useMemo(() => groupParallelActivities(day.items), [day.items]);

  // Calculate pixel height per hour
  const HOUR_HEIGHT = 60; // pixels per hour
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
        {/* Timeline Grid */}
        <div className="relative" style={{ height: totalHeight }}>
          {/* Hour lines */}
          {hours.map((hour, index) => (
            <div 
              key={hour}
              className="absolute left-0 right-0 flex items-start"
              style={{ top: index * HOUR_HEIGHT }}
            >
              {/* Hour label */}
              <div className="w-14 flex-shrink-0 text-xs text-muted-foreground font-medium pr-2 text-right -mt-2">
                {hour.toString().padStart(2, '0')}:00
              </div>
              {/* Hour line */}
              <div className="flex-1 border-t border-dashed border-muted-foreground/20" />
            </div>
          ))}

          {/* Activity blocks */}
          <div className="absolute left-14 right-0 top-0" style={{ height: totalHeight }}>
            {groupedItems.map(({ item, column, totalColumns }) => {
              const startHour = parseTimeToHours(item.startTime);
              const endHour = parseTimeToHours(item.endTime);
              const top = (startHour - hourRange.start) * HOUR_HEIGHT;
              const height = Math.max((endHour - startHour) * HOUR_HEIGHT - 4, 40); // Min 40px height
              const style = getActivityStyle(item.activity);
              const isShort = height < 60;
              
              // Calculate width and left position for parallel activities
              const GAP = 4; // gap between parallel items
              const width = totalColumns > 1 
                ? `calc((100% - ${GAP * (totalColumns - 1)}px) / ${totalColumns})`
                : 'calc(100% - 8px)';
              const left = totalColumns > 1
                ? `calc(${column} * ((100% - ${GAP * (totalColumns - 1)}px) / ${totalColumns} + ${GAP}px) + 4px)`
                : '4px';

              return (
                <div
                  key={item.id}
                  className={`absolute rounded-lg border-2 ${style.bgColor} ${style.borderColor} p-2 overflow-hidden transition-all hover:shadow-md hover:z-10`}
                  style={{ 
                    top: top + 2, 
                    height: height,
                    width: width,
                    left: left,
                  }}
                >
                  <div className={`flex ${isShort ? 'flex-row items-center gap-1.5' : 'flex-col gap-1'} h-full`}>
                    {/* Icon and Time row */}
                    <div className={`flex items-center gap-1.5 flex-shrink-0 ${style.textColor} flex-wrap`}>
                      <div className={`flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-md ${style.bgColor} ${style.borderColor} border flex items-center justify-center`}>
                        {style.icon}
                      </div>
                      <span className="text-[10px] sm:text-xs font-semibold whitespace-nowrap">
                        {formatTime(item.startTime)} - {formatTime(item.endTime)}
                      </span>
                      {/* Location badge with activity color - inline on desktop or when space allows */}
                      {item.location && !isShort && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${style.bgColor} ${style.borderColor} ${style.textColor} font-medium whitespace-nowrap hidden sm:inline-block`}>
                          {item.location}
                        </span>
                      )}
                    </div>
                    
                    {/* Activity name */}
                    <p className={`font-medium text-xs sm:text-sm ${isShort ? 'truncate flex-1 min-w-0' : 'line-clamp-2'}`}>
                      {item.activity}
                    </p>
                    
                    {/* Location badge on mobile - shown below title for better fit */}
                    {item.location && !isShort && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${style.bgColor} ${style.borderColor} ${style.textColor} font-medium w-fit sm:hidden`}>
                        {item.location}
                      </span>
                    )}
                    
                    {/* Location for short blocks */}
                    {item.location && isShort && (
                      <span className={`text-[9px] px-1 py-0.5 rounded-full border ${style.bgColor} ${style.borderColor} ${style.textColor} font-medium whitespace-nowrap flex-shrink-0`}>
                        {item.location}
                      </span>
                    )}
                    
                    {/* Instructor (only for taller blocks) */}
                    {!isShort && item.instructor && (
                      <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 mt-auto">
                        <User className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{item.instructor}</span>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
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
