/**
 * SectorDashboardPage - Dashboard analítico por setor
 * Carrega KPIs reais do banco de dados para cada setor do NeoTeam
 */
import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { GlobalBreadcrumb } from '@/components/GlobalBreadcrumb';
import { DashboardKpiCard } from '@/neohub/components/dashboard';
import { useSectorDashboardData } from '@/neohub/hooks/useSectorDashboardData';
import { withCache } from '@/lib/queryClient';
import {
  Stethoscope, HeadphonesIcon, ClipboardList, GitCompare,
  DollarSign, Scale, Megaphone, CircuitBoard, UsersRound,
  BarChart3, type LucideIcon,
} from 'lucide-react';

const SECTOR_ICONS: Record<string, LucideIcon> = {
  tecnico: Stethoscope,
  sucesso_paciente: HeadphonesIcon,
  operacional: ClipboardList,
  processos: GitCompare,
  financeiro: DollarSign,
  juridico: Scale,
  marketing: Megaphone,
  ti: CircuitBoard,
  rh: UsersRound,
};

const SECTOR_GRADIENTS: Record<string, string> = {
  tecnico: 'from-cyan-500 to-cyan-600',
  sucesso_paciente: 'from-yellow-500 to-amber-600',
  operacional: 'from-blue-500 to-blue-600',
  processos: 'from-indigo-500 to-indigo-600',
  financeiro: 'from-emerald-500 to-emerald-600',
  juridico: 'from-rose-500 to-rose-600',
  marketing: 'from-pink-500 to-pink-600',
  ti: 'from-purple-500 to-purple-600',
  rh: 'from-orange-500 to-orange-600',
};

export default function SectorDashboardPage() {
  const { code } = useParams<{ code: string }>();

  // Fetch sector metadata from DB
  const { data: sector, isLoading: sectorLoading } = useQuery({
    queryKey: ['sector-meta', code],
    queryFn: async () => {
      const { data } = await supabase
        .from('neoteam_sectors')
        .select('*')
        .eq('code', code!)
        .eq('is_active', true)
        .single();
      return data;
    },
    enabled: !!code,
    ...withCache('LONG'),
  });

  const { kpis, isLoading: kpisLoading } = useSectorDashboardData(code ?? '');

  if (!code) return <Navigate to="/neoteam" replace />;

  const Icon = SECTOR_ICONS[code] ?? BarChart3;
  const gradient = SECTOR_GRADIENTS[code] ?? 'from-gray-500 to-gray-600';

  if (sectorLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!sector) {
    return <Navigate to="/neoteam" replace />;
  }

  return (
    <div className="p-4 lg:p-6 pt-14 lg:pt-6 space-y-6">
      <GlobalBreadcrumb />

      {/* Sector Header */}
      <div className={`bg-gradient-to-r ${gradient} rounded-2xl p-6 text-white`}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
            <Icon className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{sector.name}</h1>
            <p className="opacity-90 text-sm">{sector.description ?? 'Dashboard analítico do setor'}</p>
          </div>
        </div>
      </div>

      {/* KPIs Grid */}
      {kpisLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : kpis.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum dado disponível para este setor ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, idx) => (
            <DashboardKpiCard
              key={idx}
              icon={Icon}
              value={kpi.value}
              label={kpi.label}
              variant={kpi.variant ?? 'default'}
              badge={kpi.badge}
              badgeVariant={kpi.variant === 'warning' ? 'warning' : kpi.variant === 'success' ? 'success' : 'default'}
            />
          ))}
        </div>
      )}

      {/* Summary Card */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-2">Resumo do Setor</h3>
          <p className="text-sm text-muted-foreground">
            Este dashboard apresenta os indicadores principais do <strong>{sector.name}</strong>.
            Os dados são carregados em tempo real a partir do banco de dados.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
