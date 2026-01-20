import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, AlertCircle, Clock, FileText, Phone, Stethoscope, UserCheck, ClipboardCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SurgerySchedule } from "@/hooks/useSurgerySchedule";
import { differenceInDays, parseISO, isToday, isTomorrow } from "date-fns";

interface SurgeryChecklistTimelineProps {
  surgery: SurgerySchedule;
  compact?: boolean;
}

interface ChecklistItem {
  key: keyof SurgerySchedule;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  dayOffset: number; // Negative = before surgery, positive = after
  critical?: boolean;
}

const checklistItems: ChecklistItem[] = [
  { key: 'exams_sent', label: 'Exames Enviados', shortLabel: 'Exames', icon: <Stethoscope className="h-3.5 w-3.5" />, dayOffset: -15, critical: true },
  { key: 'exams_in_system', label: 'Exames no Sistema', shortLabel: 'Sistema', icon: <FileText className="h-3.5 w-3.5" />, dayOffset: -10 },
  { key: 'contract_signed', label: 'Contrato Assinado', shortLabel: 'Contrato', icon: <ClipboardCheck className="h-3.5 w-3.5" />, dayOffset: -7, critical: true },
  { key: 'd7_contact', label: 'Contato D-7', shortLabel: 'D-7', icon: <Phone className="h-3.5 w-3.5" />, dayOffset: -7 },
  { key: 'd2_contact', label: 'Contato D-2', shortLabel: 'D-2', icon: <Phone className="h-3.5 w-3.5" />, dayOffset: -2 },
  { key: 'd1_contact', label: 'Contato D-1', shortLabel: 'D-1', icon: <Phone className="h-3.5 w-3.5" />, dayOffset: -1, critical: true },
  { key: 'confirmed', label: 'Confirmado', shortLabel: 'Conf', icon: <UserCheck className="h-3.5 w-3.5" />, dayOffset: -1, critical: true },
  { key: 'checkin_sent', label: 'Check-in Enviado', shortLabel: 'Check-in', icon: <FileText className="h-3.5 w-3.5" />, dayOffset: 0 },
  { key: 'd0_discharge_form', label: 'Ficha D-0', shortLabel: 'D-0', icon: <ClipboardCheck className="h-3.5 w-3.5" />, dayOffset: 0 },
  { key: 'd1_gpi', label: 'GPI D+1', shortLabel: 'D+1', icon: <CheckCircle2 className="h-3.5 w-3.5" />, dayOffset: 1 },
];

export function SurgeryChecklistTimeline({ surgery, compact = false }: SurgeryChecklistTimelineProps) {
  const surgeryDate = parseISO(surgery.surgery_date);
  const daysUntilSurgery = differenceInDays(surgeryDate, new Date());
  
  const getItemStatus = (item: ChecklistItem) => {
    const isCompleted = surgery[item.key] as boolean;
    const shouldBeDoneBy = daysUntilSurgery <= Math.abs(item.dayOffset);
    const isPastDue = !isCompleted && shouldBeDoneBy && item.dayOffset <= 0;
    const isUpcoming = !isCompleted && daysUntilSurgery > Math.abs(item.dayOffset);
    
    return { isCompleted, isPastDue, isUpcoming, shouldBeDoneBy };
  };

  if (compact) {
    const completedCount = checklistItems.filter(item => surgery[item.key] as boolean).length;
    const criticalPending = checklistItems.filter(item => {
      const { isPastDue } = getItemStatus(item);
      return item.critical && isPastDue;
    });

    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-xs">
          <span className={cn(
            "font-medium",
            completedCount === checklistItems.length ? "text-green-600" : "text-muted-foreground"
          )}>
            {completedCount}/{checklistItems.length}
          </span>
        </div>
        {criticalPending.length > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <AlertCircle className="h-4 w-4 text-amber-500" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <p className="font-medium mb-1">Pendências críticas:</p>
                  {criticalPending.map(item => (
                    <p key={item.key as string}>• {item.label}</p>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium">Checklist de Preparação</h4>
        <span className="text-xs text-muted-foreground">
          {isToday(surgeryDate) ? "Hoje" : isTomorrow(surgeryDate) ? "Amanhã" : `D-${daysUntilSurgery}`}
        </span>
      </div>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-border" />
        
        <div className="space-y-3">
          {checklistItems.map((item, index) => {
            const { isCompleted, isPastDue, isUpcoming } = getItemStatus(item);
            
            return (
              <div key={item.key as string} className="flex items-center gap-3 relative">
                {/* Timeline dot */}
                <div className={cn(
                  "relative z-10 flex items-center justify-center h-8 w-8 rounded-full border-2 transition-all duration-200",
                  isCompleted && "bg-green-500 border-green-500 text-white",
                  isPastDue && "bg-red-50 border-red-400 text-red-500",
                  isUpcoming && "bg-muted border-muted-foreground/30 text-muted-foreground",
                  !isCompleted && !isPastDue && !isUpcoming && "bg-amber-50 border-amber-400 text-amber-500"
                )}>
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : isPastDue ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    item.icon
                  )}
                </div>
                
                {/* Content */}
                <div className={cn(
                  "flex-1 flex items-center justify-between py-1.5 px-3 rounded-lg transition-colors",
                  isCompleted && "bg-green-50 dark:bg-green-950/20",
                  isPastDue && "bg-red-50 dark:bg-red-950/20",
                  isUpcoming && "bg-muted/30"
                )}>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-sm",
                      isCompleted && "text-green-700 dark:text-green-400",
                      isPastDue && "text-red-700 dark:text-red-400 font-medium"
                    )}>
                      {item.label}
                    </span>
                    {item.critical && !isCompleted && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">
                        Crítico
                      </span>
                    )}
                  </div>
                  <span className={cn(
                    "text-xs",
                    isCompleted ? "text-green-600" : "text-muted-foreground"
                  )}>
                    D{item.dayOffset >= 0 ? '+' : ''}{item.dayOffset}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
