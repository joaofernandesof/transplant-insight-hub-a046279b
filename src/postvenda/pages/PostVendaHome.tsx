import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Ticket, Clock, AlertCircle, CheckCircle2, Star, TrendingUp } from 'lucide-react';
import { GlobalBreadcrumb } from '@/components/GlobalBreadcrumb';
import { usePostVenda } from '../hooks/usePostVenda';
import { ETAPA_LABELS } from '../lib/permissions';

export default function PostVendaHome() {
  const { chamados, stats, isLoading } = usePostVenda();

  const etapas = ['triagem', 'atendimento', 'resolucao', 'validacao_paciente', 'nps'] as const;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <GlobalBreadcrumb />

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Ticket className="h-6 w-6 text-primary" />
          Dashboard Pós-Venda
        </h1>
        <p className="text-muted-foreground">Visão geral do atendimento CAPYS</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Ticket className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Chamados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">{stats.slaOk}</p>
                <p className="text-xs text-muted-foreground">SLA OK</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{stats.slaWarning}</p>
                <p className="text-xs text-muted-foreground">Atenção</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.slaEstourados}</p>
                <p className="text-xs text-muted-foreground">SLA Estourado</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">--</p>
                <p className="text-xs text-muted-foreground">NPS Médio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chamados por Etapa */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Chamados por Etapa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {etapas.map(etapa => (
              <div key={etapa} className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold">{stats.byEtapa[etapa] || 0}</p>
                <p className="text-sm text-muted-foreground">{ETAPA_LABELS[etapa]}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
