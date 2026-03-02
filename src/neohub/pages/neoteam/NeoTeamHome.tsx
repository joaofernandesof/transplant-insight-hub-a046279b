import React from 'react';
import { 
  BarChart3, Stethoscope, HeadphonesIcon, ClipboardCheck, 
  GitCompare, DollarSign, Scale, Megaphone, CircuitBoard, UsersRound,
  type LucideIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const SECTOR_ICONS: Record<string, LucideIcon> = {
  tecnico: Stethoscope,
  sucesso_paciente: HeadphonesIcon,
  operacional: ClipboardCheck,
  processos: GitCompare,
  financeiro: DollarSign,
  juridico: Scale,
  marketing: Megaphone,
  ti: CircuitBoard,
  rh: UsersRound,
};

const SECTOR_COLORS: Record<string, { bg: string; icon: string; border: string }> = {
  tecnico: { bg: 'bg-cyan-50 dark:bg-cyan-900/20', icon: 'text-cyan-600', border: 'border-cyan-200 dark:border-cyan-800' },
  sucesso_paciente: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', icon: 'text-yellow-600', border: 'border-yellow-200 dark:border-yellow-800' },
  operacional: { bg: 'bg-blue-50 dark:bg-blue-900/20', icon: 'text-blue-600', border: 'border-blue-200 dark:border-blue-800' },
  processos: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', icon: 'text-indigo-600', border: 'border-indigo-200 dark:border-indigo-800' },
  financeiro: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: 'text-emerald-600', border: 'border-emerald-200 dark:border-emerald-800' },
  juridico: { bg: 'bg-rose-50 dark:bg-rose-900/20', icon: 'text-rose-600', border: 'border-rose-200 dark:border-rose-800' },
  marketing: { bg: 'bg-pink-50 dark:bg-pink-900/20', icon: 'text-pink-600', border: 'border-pink-200 dark:border-pink-800' },
  ti: { bg: 'bg-purple-50 dark:bg-purple-900/20', icon: 'text-purple-600', border: 'border-purple-200 dark:border-purple-800' },
  rh: { bg: 'bg-orange-50 dark:bg-orange-900/20', icon: 'text-orange-600', border: 'border-orange-200 dark:border-orange-800' },
};

export default function NeoTeamHome() {
  const navigate = useNavigate();
  const [sectors, setSectors] = React.useState<Array<{ code: string; name: string }>>([]);

  React.useEffect(() => {
    supabase
      .from('neoteam_sectors')
      .select('code, name')
      .eq('is_active', true)
      .order('order_index')
      .then(({ data }) => {
        if (data) setSectors(data);
      });
  }, []);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-6">
      <div className="w-full max-w-3xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">NeoTeam</h1>
          <p className="text-muted-foreground">Selecione um setor para acessar</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {sectors.map((sector) => {
            const Icon = SECTOR_ICONS[sector.code] ?? BarChart3;
            const colors = SECTOR_COLORS[sector.code] ?? { bg: 'bg-muted', icon: 'text-muted-foreground', border: 'border-border' };
            return (
              <button
                key={sector.code}
                onClick={() => navigate(`/neoteam/setor/${sector.code}`)}
                className={`flex flex-col items-center gap-3 p-6 rounded-2xl border ${colors.border} ${colors.bg} hover:shadow-lg hover:scale-[1.02] transition-all duration-200 group`}
              >
                <div className="p-3 rounded-xl bg-background/80 shadow-sm">
                  <Icon className={`h-7 w-7 ${colors.icon}`} />
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {sector.name.replace('Setor ', '').replace('de ', '')}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
