/**
 * List of active and recent cadence executions
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  User,
  Calendar,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCadenceExecutions, CadenceExecution } from '../hooks/useCadences';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_CONFIG = {
  active: { label: 'Ativo', color: 'bg-green-500', icon: Play },
  paused: { label: 'Pausado', color: 'bg-amber-500', icon: Pause },
  completed: { label: 'Concluído', color: 'bg-blue-500', icon: CheckCircle2 },
  cancelled: { label: 'Cancelado', color: 'bg-gray-500', icon: XCircle },
  responded: { label: 'Respondeu', color: 'bg-emerald-500', icon: MessageSquare },
};

export function CadenceExecutions() {
  const { data: executions, isLoading } = useCadenceExecutions();

  if (isLoading) {
    return (
      <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <RotateCcw className="h-6 w-6 animate-spin text-[hsl(var(--avivar-muted-foreground))]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!executions || executions.length === 0) {
    return (
      <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
        <CardContent className="py-12 text-center">
          <Clock className="h-12 w-12 text-[hsl(var(--avivar-muted-foreground))] mx-auto mb-4 opacity-50" />
          <h3 className="font-semibold text-[hsl(var(--avivar-foreground))] mb-2">
            Nenhuma execução ativa
          </h3>
          <p className="text-sm text-[hsl(var(--avivar-muted-foreground))]">
            Quando você iniciar uma cadência para um lead, ela aparecerá aqui.
          </p>
        </CardContent>
      </Card>
    );
  }

  const activeCount = executions.filter(e => e.status === 'active').length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Em Andamento</p>
                <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">{activeCount}</p>
              </div>
              <Play className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Responderam</p>
                <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
                  {executions.filter(e => e.status === 'responded').length}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Concluídas</p>
                <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
                  {executions.filter(e => e.status === 'completed').length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Taxa Resposta</p>
                <p className="text-2xl font-bold text-[hsl(var(--avivar-foreground))]">
                  {executions.length > 0 
                    ? Math.round((executions.filter(e => e.status === 'responded').length / executions.length) * 100)
                    : 0}%
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-[hsl(var(--avivar-primary)/0.2)] flex items-center justify-center">
                <span className="text-[hsl(var(--avivar-primary))] font-bold">%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
        <CardHeader>
          <CardTitle className="text-[hsl(var(--avivar-foreground))]">Execuções Recentes</CardTitle>
          <CardDescription className="text-[hsl(var(--avivar-muted-foreground))]">
            Acompanhe o progresso de cada cadência em andamento
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[hsl(var(--avivar-border))]">
                <TableHead className="text-[hsl(var(--avivar-muted-foreground))]">Lead</TableHead>
                <TableHead className="text-[hsl(var(--avivar-muted-foreground))]">Cadência</TableHead>
                <TableHead className="text-[hsl(var(--avivar-muted-foreground))]">Progresso</TableHead>
                <TableHead className="text-[hsl(var(--avivar-muted-foreground))]">Próximo Envio</TableHead>
                <TableHead className="text-[hsl(var(--avivar-muted-foreground))]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {executions.map((execution) => {
                const statusConfig = STATUS_CONFIG[execution.status] || STATUS_CONFIG.active;
                const StatusIcon = statusConfig.icon;

                return (
                  <TableRow 
                    key={execution.id}
                    className="border-[hsl(var(--avivar-border))] hover:bg-[hsl(var(--avivar-muted)/0.3)]"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(var(--avivar-primary))] to-[hsl(var(--avivar-accent))] flex items-center justify-center text-white font-medium">
                          {execution.lead_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-[hsl(var(--avivar-foreground))]">
                            {execution.lead_name}
                          </p>
                          {execution.lead_phone && (
                            <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                              {execution.lead_phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-[hsl(var(--avivar-foreground))]">
                      {(execution.sequence as any)?.name || 'Cadência'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={execution.current_step * 25} 
                          className="w-20 h-2"
                        />
                        <span className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                          Passo {execution.current_step}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[hsl(var(--avivar-muted-foreground))]">
                      {execution.next_step_at ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(execution.next_step_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "text-white text-xs",
                        statusConfig.color
                      )}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
