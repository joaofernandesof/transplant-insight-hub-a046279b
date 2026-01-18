import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SurgerySchedule } from "@/hooks/useSurgerySchedule";
import { useState } from "react";
import { User, DollarSign, Phone, Clock } from "lucide-react";

interface SurgeryCalendarViewProps {
  surgeries: SurgerySchedule[];
  onSelectSurgery: (surgery: SurgerySchedule) => void;
}

export function SurgeryCalendarView({ surgeries, onSelectSurgery }: SurgeryCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const surgeryDates = useMemo(() => {
    return surgeries.map(s => parseISO(s.surgery_date));
  }, [surgeries]);

  const selectedDaySurgeries = useMemo(() => {
    if (!selectedDate) return [];
    return surgeries.filter(s => isSameDay(parseISO(s.surgery_date), selectedDate));
  }, [surgeries, selectedDate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const getCategoryColor = (category?: string) => {
    if (!category) return 'bg-gray-100 text-gray-700';
    const colors: Record<string, string> = {
      'CATEGORIA A': 'bg-red-100 text-red-700',
      'CATEGORIA B': 'bg-blue-100 text-blue-700',
      'CATEGORIA C': 'bg-amber-100 text-amber-700',
      'CATEGORIA D': 'bg-green-100 text-green-700',
    };
    const shortCategory = category.split(' - ')[0];
    return colors[shortCategory] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle>Calendário</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={ptBR}
            modifiers={{
              hasSurgery: surgeryDates,
            }}
            modifiersStyles={{
              hasSurgery: {
                backgroundColor: 'hsl(var(--primary) / 0.15)',
                fontWeight: 'bold',
              },
            }}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      {/* Day Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {selectedDate 
                ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                : "Selecione uma data"
              }
            </span>
            {selectedDaySurgeries.length > 0 && (
              <Badge>{selectedDaySurgeries.length} cirurgia(s)</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            {selectedDaySurgeries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhuma cirurgia nesta data</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDaySurgeries.map((surgery) => (
                  <Card 
                    key={surgery.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onSelectSurgery(surgery)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <p className="font-medium truncate">{surgery.patient_name}</p>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mb-2">
                            <Badge 
                              variant="secondary" 
                              className={getCategoryColor(surgery.category)}
                            >
                              {surgery.category?.split(' - ')[0].replace('CATEGORIA ', 'Cat ') || 'N/A'}
                            </Badge>
                            <Badge variant="outline">
                              {surgery.procedure_type || 'N/A'}
                            </Badge>
                            {surgery.grade && (
                              <Badge variant="outline">Grau {surgery.grade}</Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {surgery.surgery_time && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {surgery.surgery_time}
                              </div>
                            )}
                            {surgery.patient_phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {surgery.patient_phone}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="flex items-center gap-1 text-green-600 font-bold">
                            <DollarSign className="h-4 w-4" />
                            {formatCurrency(surgery.final_value)}
                          </div>
                          <div className="flex gap-1 mt-2">
                            {surgery.confirmed && (
                              <Badge className="bg-green-500 text-white text-[10px]">✓ Conf</Badge>
                            )}
                            {surgery.exams_sent && (
                              <Badge className="bg-blue-500 text-white text-[10px]">✓ Exames</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {surgery.balance_due > 0 && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-xs text-red-600">
                            Saldo devedor: {formatCurrency(surgery.balance_due)}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
