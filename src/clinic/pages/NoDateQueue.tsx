import React from 'react';
import { useClinicSurgeries } from '../hooks/useClinicSurgeries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Calendar } from 'lucide-react';

export default function NoDateQueue() {
  const { noDateSurgeries, isLoading, updateSurgery } = useClinicSurgeries();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sem Data Definida</h1>
        <p className="text-muted-foreground">{noDateSurgeries.length} casos aguardando agendamento</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {noDateSurgeries.map(surgery => (
          <Card key={surgery.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{surgery.patientName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{surgery.procedure}</p>
              <div className="flex gap-2">
                {surgery.grade && <Badge variant="outline">Grau {surgery.grade}</Badge>}
                {surgery.category && <Badge variant="secondary">{surgery.category}</Badge>}
              </div>
              {surgery.expectedMonth && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Previsão: {surgery.expectedMonth}
                </p>
              )}
              <Button size="sm" className="w-full mt-2">
                <Calendar className="h-4 w-4 mr-2" /> Agendar
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
