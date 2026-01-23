import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Briefcase
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
  return (
    <div className="space-y-6">
      {schedule.map((day) => (
        <DayTimeline key={day.id} day={day} />
      ))}
    </div>
  );
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
            {day.items.map((item) => {
              const startHour = parseTimeToHours(item.startTime);
              const endHour = parseTimeToHours(item.endTime);
              const top = (startHour - hourRange.start) * HOUR_HEIGHT;
              const height = Math.max((endHour - startHour) * HOUR_HEIGHT - 4, 40); // Min 40px height
              const style = getActivityStyle(item.activity);
              const isShort = height < 60;

              return (
                <div
                  key={item.id}
                  className={`absolute left-1 right-1 rounded-lg border-2 ${style.bgColor} ${style.borderColor} p-2 overflow-hidden transition-all hover:shadow-md hover:z-10`}
                  style={{ 
                    top: top + 2, 
                    height: height,
                  }}
                >
                  <div className={`flex ${isShort ? 'flex-row items-center gap-2' : 'flex-col gap-1'}`}>
                    {/* Icon and Time row */}
                    <div className={`flex items-center gap-2 ${style.textColor}`}>
                      <div className={`flex-shrink-0 w-7 h-7 rounded-md ${style.bgColor} ${style.borderColor} border flex items-center justify-center`}>
                        {style.icon}
                      </div>
                      <span className="text-xs font-semibold whitespace-nowrap">
                        {formatTime(item.startTime)} - {formatTime(item.endTime)}
                      </span>
                      {item.location && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                          {item.location}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Activity name */}
                    <p className={`font-medium text-sm ${isShort ? 'truncate flex-1' : 'line-clamp-2'}`}>
                      {item.activity}
                    </p>
                    
                    {/* Instructor (only for taller blocks) */}
                    {!isShort && item.instructor && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {item.instructor}
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
