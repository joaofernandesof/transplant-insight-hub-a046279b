import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { History, CheckCircle2, XCircle, User, Clock } from 'lucide-react';
import { useCleaningInspection } from '../hooks';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HistoryTabProps {
  branchId: string;
}

export function HistoryTab({ branchId }: HistoryTabProps) {
  const { useAuditHistory } = useCleaningInspection(branchId);
  const { data: auditLogs = [], isLoading } = useAuditHistory(100);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Histórico de Auditoria
        </CardTitle>
        <CardDescription>
          Registro completo de aprovações e reprovações
        </CardDescription>
      </CardHeader>
      <CardContent>
        {auditLogs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhum registro de auditoria encontrado.
          </p>
        ) : (
          <div className="space-y-4">
            {auditLogs.map(log => (
              <div 
                key={log.id}
                className="flex items-start gap-4 p-4 border rounded-lg"
              >
                <div className={`p-2 rounded-full ${
                  log.action === 'aprovacao' 
                    ? 'bg-green-100 dark:bg-green-900' 
                    : 'bg-red-100 dark:bg-red-900'
                }`}>
                  {log.action === 'aprovacao' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={log.action === 'aprovacao' ? 'default' : 'destructive'}>
                      {log.action === 'aprovacao' ? 'Aprovação' : 'Reprovação'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {log.entity_type}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>
                    {log.creator_name && (
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {log.creator_name}
                      </div>
                    )}
                  </div>

                  {log.notes && (
                    <p className="text-sm mt-2 text-muted-foreground">
                      {log.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
