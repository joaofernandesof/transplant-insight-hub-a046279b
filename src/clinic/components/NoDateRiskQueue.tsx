import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertTriangle, CalendarIcon, Clock } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { ClinicSurgery } from '../hooks/useClinicSurgeries';

interface NoDateRiskQueueProps {
  surgeries: ClinicSurgery[];
  onSetDate: (id: string, date: string) => void;
}

export function NoDateRiskQueue({ surgeries, onSetDate }: NoDateRiskQueueProps) {
  const [settingDateFor, setSettingDateFor] = useState<ClinicSurgery | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  if (surgeries.length === 0) return null;

  const sorted = [...surgeries].sort((a, b) => {
    const aDays = a.createdAt ? differenceInDays(new Date(), new Date(a.createdAt)) : 0;
    const bDays = b.createdAt ? differenceInDays(new Date(), new Date(b.createdAt)) : 0;
    return bDays - aDays;
  });

  const handleConfirmDate = () => {
    if (settingDateFor && selectedDate) {
      onSetDate(settingDateFor.id, format(selectedDate, 'yyyy-MM-dd'));
      setSettingDateFor(null);
      setSelectedDate(undefined);
    }
  };

  return (
    <>
      <Card className="border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span>Sem data definida</span>
            <Badge variant="destructive" className="ml-auto text-xs font-bold">
              {surgeries.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {sorted.map(surgery => {
              const daysSince = surgery.createdAt
                ? differenceInDays(new Date(), new Date(surgery.createdAt))
                : 0;
              const isUrgent = daysSince >= 30;
              const isCritical = daysSince >= 60;

              return (
                <div
                  key={surgery.id}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition-colors',
                    isCritical
                      ? 'border-destructive/40 bg-destructive/5'
                      : isUrgent
                      ? 'border-amber-500/30 bg-amber-500/5'
                      : 'border-border bg-background'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {surgery.patientName}
                      </span>
                      {surgery.procedure && (
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {surgery.procedure}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      {surgery.doctorOnDuty && <span>{surgery.doctorOnDuty}</span>}
                      {surgery.branch && <span>{surgery.branch}</span>}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        há {daysSince} dias
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 gap-1.5 text-xs"
                    onClick={() => {
                      setSettingDateFor(surgery);
                      setSelectedDate(undefined);
                    }}
                  >
                    <CalendarIcon className="h-3 w-3" />
                    Definir data
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Define Date Dialog */}
      <Dialog open={!!settingDateFor} onOpenChange={(open) => !open && setSettingDateFor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Definir data da cirurgia</DialogTitle>
          </DialogHeader>
          {settingDateFor && (
            <div className="space-y-4">
              <div className="text-sm">
                <span className="text-muted-foreground">Paciente:</span>{' '}
                <span className="font-medium">{settingDateFor.patientName}</span>
              </div>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={ptBR}
                disabled={(date) => date < new Date()}
                className={cn("p-3 pointer-events-auto mx-auto")}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingDateFor(null)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmDate} disabled={!selectedDate}>
              Confirmar data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
