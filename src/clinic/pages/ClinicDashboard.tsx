import React from 'react';
import { useClinicAuth } from '../contexts/ClinicAuthContext';
import { useClinicSales } from '../hooks/useClinicSales';
import { useClinicSurgeries } from '../hooks/useClinicSurgeries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Calendar,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  Users,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ClinicDashboard() {
  const { user, currentBranch, isAdmin, isGestao } = useClinicAuth();
  const { sales, stats: salesStats } = useClinicSales();
  const { thisWeekSurgeries, noDateSurgeries, pendingChecklist, stats: surgeryStats, noDateOver30, noDateOver60 } = useClinicSurgeries();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Hoje';
    if (isTomorrow(date)) return 'Amanhã';
    return format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
  };

  // Current month sales
  const currentMonthSales = sales.filter(s => {
    const saleDate = new Date(s.saleDate);
    const now = new Date();
    return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo, {user?.name}
          {currentBranch && !isAdmin && !isGestao && (
            <span> • {currentBranch}</span>
          )}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cirurgias da Semana</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{surgeryStats.thisWeek}</div>
            <p className="text-xs text-muted-foreground">
              {surgeryStats.confirmed} confirmadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendências Pré-Op</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{surgeryStats.pendingChecklist}</div>
            <p className="text-xs text-muted-foreground">
              Exames, contratos ou prontuários
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vendidos Sem Data</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{surgeryStats.noDate}</div>
            <div className="flex gap-3 mt-1">
              {surgeryStats.noDateOver30 > 0 && (
                <span className="text-xs text-yellow-600 dark:text-yellow-400">
                  {surgeryStats.noDateOver30} +30d
                </span>
              )}
              {surgeryStats.noDateOver60 > 0 && (
                <span className="text-xs text-red-600 dark:text-red-400">
                  {surgeryStats.noDateOver60} +60d
                </span>
              )}
              {surgeryStats.noDateOver30 === 0 && surgeryStats.noDateOver60 === 0 && (
                <span className="text-xs text-muted-foreground">Aguardando agendamento</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vendas do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMonthSales.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(currentMonthSales.reduce((sum, s) => sum + s.vgv, 0))} VGV
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* This Week Surgeries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Cirurgias da Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {thisWeekSurgeries.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma cirurgia agendada para esta semana
                </p>
              ) : (
                <div className="space-y-3">
                  {thisWeekSurgeries.map(surgery => (
                    <div
                      key={surgery.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{surgery.patientName}</p>
                        <p className="text-sm text-muted-foreground">
                          {surgery.procedure} • Grau {surgery.grade || '-'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {surgery.surgeryDate && formatDateLabel(surgery.surgeryDate)}
                          {surgery.surgeryTime && ` às ${surgery.surgeryTime.substring(0, 5)}`}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {surgery.surgeryConfirmed ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Confirmada
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Pendente</Badge>
                        )}
                        {surgery.category && (
                          <Badge variant="outline" className="text-xs">
                            {surgery.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Pending Checklist */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Pendências Pré-Operatórias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {pendingChecklist.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma pendência encontrada
                </p>
              ) : (
                <div className="space-y-3">
                  {pendingChecklist.slice(0, 10).map(surgery => (
                    <div
                      key={surgery.id}
                      className="p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium truncate">{surgery.patientName}</p>
                        {surgery.surgeryDate && (
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(surgery.surgeryDate), 'dd/MM')}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {!surgery.examsSent && (
                          <Badge variant="destructive" className="text-xs">
                            Exames
                          </Badge>
                        )}
                        {!surgery.contractSigned && (
                          <Badge variant="destructive" className="text-xs">
                            Contrato
                          </Badge>
                        )}
                        {!surgery.chartReady && (
                          <Badge variant="destructive" className="text-xs">
                            Prontuário
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* No Date Queue Preview */}
      {noDateSurgeries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Sem Data Definida ({noDateSurgeries.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {noDateSurgeries.slice(0, 6).map(surgery => (
                <div
                  key={surgery.id}
                  className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <p className="font-medium truncate">{surgery.patientName}</p>
                  <p className="text-sm text-muted-foreground">
                    {surgery.procedure} • Grau {surgery.grade || '-'}
                  </p>
                  {surgery.expectedMonth && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      Prev: {surgery.expectedMonth}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
