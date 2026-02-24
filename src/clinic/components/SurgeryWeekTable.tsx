import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, CheckCircle2 } from 'lucide-react';
import { format, parseISO, isToday, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ClinicSurgery } from '../hooks/useClinicSurgeries';
import { SurgeryDetailDialog } from './SurgeryDetailDialog';

interface SurgeryWeekTableProps {
  surgeries: ClinicSurgery[];
  onUpdate?: (id: string, updates: Partial<ClinicSurgery>) => void;
  title?: string;
}

export function SurgeryWeekTable({ surgeries, onUpdate, title }: SurgeryWeekTableProps) {
  const [selectedSurgery, setSelectedSurgery] = useState<ClinicSurgery | null>(null);

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, ClinicSurgery[]>();
    const sorted = [...surgeries].sort((a, b) => {
      if (a.surgeryDate === b.surgeryDate) {
        return (a.surgeryTime || '').localeCompare(b.surgeryTime || '');
      }
      return (a.surgeryDate || '').localeCompare(b.surgeryDate || '');
    });
    for (const s of sorted) {
      const key = s.surgeryDate || 'sem-data';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    // Reorder: today first, then future dates, then past dates
    const today = startOfDay(new Date());
    const entries = Array.from(map.entries());
    const todayEntries: typeof entries = [];
    const futureEntries: typeof entries = [];
    const pastEntries: typeof entries = [];
    const noDateEntries: typeof entries = [];
    for (const entry of entries) {
      if (entry[0] === 'sem-data') {
        noDateEntries.push(entry);
      } else {
        try {
          const d = startOfDay(parseISO(entry[0]));
          if (isToday(d)) todayEntries.push(entry);
          else if (isBefore(d, today)) pastEntries.push(entry);
          else futureEntries.push(entry);
        } catch {
          noDateEntries.push(entry);
        }
      }
    }
    return new Map([...todayEntries, ...futureEntries, ...pastEntries, ...noDateEntries]);
  }, [surgeries]);

  const formatDateHeader = (dateStr: string) => {
    if (dateStr === 'sem-data') return 'Sem Data';
    try {
      return format(parseISO(dateStr), "EEEE, dd 'de' MMMM", { locale: ptBR });
    } catch { return dateStr; }
  };

  const checklistItems = [
    { key: 'examsSent' as const, label: 'E', title: 'Exames' },
    { key: 'contractSigned' as const, label: 'C', title: 'Contrato' },
    { key: 'guidesSent' as const, label: 'G', title: 'Guias' },
    { key: 'd20Contact' as const, label: '20', title: 'Contato D-20' },
    { key: 'd15Contact' as const, label: '15', title: 'Contato D-15' },
    { key: 'd10Contact' as const, label: '10', title: 'Contato D-10' },
    { key: 'd7Contact' as const, label: '7', title: 'Contato D-7' },
    { key: 'd2Contact' as const, label: '2', title: 'Contato D-2' },
    { key: 'd1Contact' as const, label: '1', title: 'Contato D-1' },
    { key: 'surgeryConfirmed' as const, label: '✓', title: 'Confirmada' },
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {title || 'Cirurgias da Semana'}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="font-medium">Legenda:</span>
            <span className="flex items-center gap-1"><span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-[10px] font-bold">E</span> Exames</span>
            <span className="flex items-center gap-1"><span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-[10px] font-bold">C</span> Contrato</span>
            <span className="flex items-center gap-1"><span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-[10px] font-bold">G</span> Guias</span>
            <span className="flex items-center gap-1"><span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-[10px] font-bold">20</span> D-20</span>
            <span className="flex items-center gap-1"><span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-[10px] font-bold">15</span> D-15</span>
            <span className="flex items-center gap-1"><span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-[10px] font-bold">10</span> D-10</span>
            <span className="flex items-center gap-1"><span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-[10px] font-bold">7</span> D-7</span>
            <span className="flex items-center gap-1"><span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-[10px] font-bold">2</span> D-2</span>
            <span className="flex items-center gap-1"><span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-[10px] font-bold">1</span> D-1</span>
            <span className="flex items-center gap-1"><span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-[10px] font-bold">✓</span> Confirmada</span>
          </div>
        </CardHeader>
        <CardContent>
          {surgeries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma cirurgia agendada para esta semana
            </p>
          ) : (
            <div>
              <div className="space-y-4">
                {Array.from(grouped.entries()).map(([date, items]) => (
                  <div key={date}>
                    <div className="sticky top-0 bg-background z-10 py-1.5 mb-1">
                      <h4 className="text-sm font-semibold capitalize text-primary">
                        {formatDateHeader(date)}
                        <Badge variant="secondary" className="ml-2 text-xs">{items.length}</Badge>
                      </h4>
                    </div>
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="w-[60px]">Hora</TableHead>
                            <TableHead>Paciente</TableHead>
                            <TableHead className="hidden md:table-cell">Procedimento</TableHead>
                            <TableHead className="hidden lg:table-cell">Grau</TableHead>
                            <TableHead className="hidden md:table-cell">Checklist</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map(surgery => (
                            <TableRow key={surgery.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedSurgery(surgery)}>
                              <TableCell className="text-xs font-mono">
                                {surgery.surgeryTime ? surgery.surgeryTime.substring(0, 5) : '—'}
                              </TableCell>
                              <TableCell>
                                <span className="font-medium text-primary hover:underline cursor-pointer text-sm">
                                  {surgery.patientName}
                                </span>
                                {surgery.category && (
                                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">{surgery.category}</p>
                                )}
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-sm">
                                {surgery.procedure || '—'}
                              </TableCell>
                              <TableCell className="hidden lg:table-cell text-sm">
                                {surgery.grade || '—'}
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <div className="flex gap-0.5 flex-wrap">
                                  {checklistItems.map(item => (
                                    <CheckDot key={item.key} done={!!surgery[item.key]} label={item.label} title={item.title} />
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                {surgery.surgeryConfirmed ? (
                                  <Badge className="bg-emerald-600 text-xs gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Confirmada
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">Pendente</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <SurgeryDetailDialog
        surgery={selectedSurgery}
        open={!!selectedSurgery}
        onOpenChange={(open) => !open && setSelectedSurgery(null)}
        onUpdate={onUpdate}
      />
    </>
  );
}

function CheckDot({ done, label, title }: { done: boolean; label: string; title?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${
        done
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
          : 'bg-muted text-muted-foreground'
      }`}
      title={`${title || label}: ${done ? 'OK' : 'Pendente'}`}
    >
      {label}
    </span>
  );
}
