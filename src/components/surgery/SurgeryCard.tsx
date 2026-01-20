import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Phone, 
  Clock, 
  DollarSign, 
  ChevronRight,
  CheckCircle,
  AlertCircle,
  FileText,
  ExternalLink,
} from "lucide-react";
import { format, parseISO, isToday, isTomorrow, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SurgerySchedule } from "@/hooks/useSurgerySchedule";
import { SurgeryChecklistTimeline } from "./SurgeryChecklistTimeline";
import { cn } from "@/lib/utils";

interface SurgeryCardProps {
  surgery: SurgerySchedule;
  onEdit: (surgery: SurgerySchedule) => void;
  onViewPatient?: (patientId: string) => void;
}

export function SurgeryCard({ surgery, onEdit, onViewPatient }: SurgeryCardProps) {
  const surgeryDate = parseISO(surgery.surgery_date);
  const daysUntilSurgery = differenceInDays(surgeryDate, new Date());
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const getCategoryColor = (category?: string) => {
    if (!category) return 'bg-muted text-muted-foreground';
    const colors: Record<string, string> = {
      'CATEGORIA A': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      'CATEGORIA B': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      'CATEGORIA C': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      'CATEGORIA D': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'RETOQUE': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    };
    const shortCategory = category.split(' - ')[0];
    return colors[shortCategory] || 'bg-muted text-muted-foreground';
  };

  const getDateLabel = () => {
    if (isToday(surgeryDate)) return { label: "Hoje", color: "bg-green-500 text-white" };
    if (isTomorrow(surgeryDate)) return { label: "Amanhã", color: "bg-blue-500 text-white" };
    if (daysUntilSurgery < 0) return { label: "Realizada", color: "bg-muted text-muted-foreground" };
    if (daysUntilSurgery <= 7) return { label: `D-${daysUntilSurgery}`, color: "bg-amber-500 text-white" };
    return { label: format(surgeryDate, "dd MMM", { locale: ptBR }), color: "bg-muted text-muted-foreground" };
  };

  const dateInfo = getDateLabel();
  const hasFinancialPending = surgery.balance_due > 0;
  const isConfirmed = surgery.confirmed;
  const hasExams = surgery.exams_sent;

  return (
    <Card 
      className={cn(
        "overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group",
        isToday(surgeryDate) && "ring-2 ring-green-500 ring-offset-2",
        isTomorrow(surgeryDate) && "ring-2 ring-blue-400 ring-offset-2",
        hasFinancialPending && daysUntilSurgery <= 2 && daysUntilSurgery >= 0 && "ring-2 ring-red-400 ring-offset-2"
      )}
      onClick={() => onEdit(surgery)}
    >
      {/* Header with date badge */}
      <div className="flex items-center justify-between p-3 bg-muted/30 border-b">
        <div className="flex items-center gap-3">
          <Badge className={cn("font-semibold", dateInfo.color)}>
            {dateInfo.label}
          </Badge>
          {surgery.surgery_time && (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {surgery.surgery_time}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isConfirmed && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Confirmado
            </Badge>
          )}
          {hasExams && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
              <FileText className="h-3 w-3 mr-1" />
              Exames OK
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        {/* Patient Info */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                {surgery.patient_name}
              </h3>
              {onViewPatient && surgery.medical_record && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewPatient(surgery.medical_record!);
                  }}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            {surgery.patient_phone && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {surgery.patient_phone}
              </p>
            )}
          </div>
          
          {/* Financial summary */}
          <div className="text-right flex-shrink-0">
            <p className="text-lg font-bold text-green-600">{formatCurrency(surgery.final_value)}</p>
            {hasFinancialPending && (
              <p className="text-xs text-red-600 flex items-center justify-end gap-1">
                <AlertCircle className="h-3 w-3" />
                Saldo: {formatCurrency(surgery.balance_due)}
              </p>
            )}
          </div>
        </div>

        {/* Category & Procedure */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="secondary" className={getCategoryColor(surgery.category)}>
            {surgery.category?.split(' - ')[0].replace('CATEGORIA ', 'Cat ') || 'Sem categoria'}
          </Badge>
          <Badge variant="outline">
            {surgery.procedure_type || 'N/A'}
          </Badge>
          {surgery.grade && (
            <Badge variant="outline" className="bg-muted">
              Grau {surgery.grade}
            </Badge>
          )}
        </div>

        {/* Compact Checklist */}
        <div className="flex items-center justify-between pt-3 border-t">
          <SurgeryChecklistTimeline surgery={surgery} compact />
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
        </div>
      </CardContent>
    </Card>
  );
}
