import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, CheckCircle2, Clock, AlertCircle, GraduationCap } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAcademyCalendar, CalendarCourse } from "../hooks/useAcademyCalendar";

function getStatusConfig(status: CalendarCourse['status']) {
  switch (status) {
    case 'in_progress':
      return {
        label: 'Curso em Andamento',
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/50',
        textColor: 'text-emerald-700 dark:text-emerald-300',
        icon: <Clock className="h-3 w-3" />,
      };
    case 'confirmed':
      return {
        label: 'Data Confirmada',
        bgColor: 'bg-green-100 dark:bg-green-900/50',
        textColor: 'text-green-700 dark:text-green-300',
        icon: <CheckCircle2 className="h-3 w-3" />,
      };
    case 'pending':
      return {
        label: 'Data a Confirmar',
        bgColor: 'bg-amber-100 dark:bg-amber-900/50',
        textColor: 'text-amber-700 dark:text-amber-300',
        icon: <AlertCircle className="h-3 w-3" />,
      };
    case 'completed':
      return {
        label: 'Concluído',
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        textColor: 'text-gray-700 dark:text-gray-300',
        icon: <CheckCircle2 className="h-3 w-3" />,
      };
    default:
      return {
        label: 'Pendente',
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        textColor: 'text-gray-600 dark:text-gray-400',
        icon: <AlertCircle className="h-3 w-3" />,
      };
  }
}

function formatDateRange(startDate: string | null, endDate: string | null): string {
  if (!startDate) return '—';
  
  const start = parseISO(startDate);
  const formattedStart = format(start, "dd/MM", { locale: ptBR });
  
  if (!endDate || startDate === endDate) {
    return formattedStart;
  }
  
  const end = parseISO(endDate);
  const formattedEnd = format(end, "dd/MM", { locale: ptBR });
  
  return `${formattedStart} a ${formattedEnd}`;
}

function getMonthYear(startDate: string | null, code: string): string {
  if (startDate) {
    const date = parseISO(startDate);
    return format(date, "yyyy-MM", { locale: ptBR });
  }
  // Extract from code like F360-2026-07
  const match = code.match(/(\d{4})-(\d{2})$/);
  if (match) {
    return `${match[1]}-${match[2]}`;
  }
  return code;
}

export function CalendarTable() {
  const { classes, isLoading } = useAcademyCalendar();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-emerald-600" />
            Calendário de Cursos Presenciais - IBRAMEC
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter to only show Formação 360 classes for now
  const formacaoClasses = classes.filter(c => 
    c.name.toLowerCase().includes('formação') || 
    c.name.toLowerCase().includes('formacao')
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-emerald-600" />
          Calendário de Cursos Presenciais - IBRAMEC
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left py-3 px-4 font-semibold">Mês/Ano</th>
                <th className="text-left py-3 px-4 font-semibold">Cidade</th>
                <th className="text-left py-3 px-4 font-semibold">Curso</th>
                <th className="text-center py-3 px-4 font-semibold">Datas</th>
                <th className="text-center py-3 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {formacaoClasses.map((classItem, index) => {
                const statusConfig = getStatusConfig(classItem.status);
                const monthYear = getMonthYear(classItem.startDate, classItem.code);
                const courseName = classItem.name.includes('+') 
                  ? classItem.name.split(' - ')[0] 
                  : classItem.courseName || 'Formação 360°';

                return (
                  <tr 
                    key={classItem.id} 
                    className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${
                      index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                    }`}
                  >
                    <td className="py-3 px-4 font-medium">{monthYear}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        {classItem.city || 'São Paulo'}
                      </div>
                    </td>
                    <td className="py-3 px-4">{courseName}</td>
                    <td className="py-3 px-4 text-center font-medium">
                      {formatDateRange(classItem.startDate, classItem.endDate)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={`${statusConfig.bgColor} ${statusConfig.textColor} border-0 flex items-center gap-1 justify-center w-full max-w-[160px] mx-auto`}>
                        {statusConfig.icon}
                        <span className="text-xs">{statusConfig.label}</span>
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="sm:hidden space-y-3 px-4">
          {formacaoClasses.map((classItem) => {
            const statusConfig = getStatusConfig(classItem.status);
            const monthYear = getMonthYear(classItem.startDate, classItem.code);
            const courseName = classItem.name.includes('+') 
              ? classItem.name.split(' - ')[0] 
              : classItem.courseName || 'Formação 360°';

            return (
              <div 
                key={classItem.id} 
                className="p-3 rounded-lg border bg-card"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-sm">{monthYear}</p>
                    <p className="text-xs text-muted-foreground">{courseName}</p>
                  </div>
                  <Badge className={`${statusConfig.bgColor} ${statusConfig.textColor} border-0 text-[10px] px-2`}>
                    {statusConfig.label}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {classItem.city || 'São Paulo'}
                  </div>
                  <div className="flex items-center gap-1 font-medium text-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatDateRange(classItem.startDate, classItem.endDate)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
