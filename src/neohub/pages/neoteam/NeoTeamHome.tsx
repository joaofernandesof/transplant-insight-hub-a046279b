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
  tecnico: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', icon: 'text-cyan-700 dark:text-cyan-400', border: 'border-cyan-300 dark:border-cyan-700' },
  sucesso_paciente: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', icon: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-300 dark:border-yellow-700' },
  operacional: { bg: 'bg-blue-100 dark:bg-blue-900/30', icon: 'text-blue-700 dark:text-blue-400', border: 'border-blue-300 dark:border-blue-700' },
  processos: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', icon: 'text-indigo-700 dark:text-indigo-400', border: 'border-indigo-300 dark:border-indigo-700' },
  financeiro: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', icon: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-300 dark:border-emerald-700' },
  juridico: { bg: 'bg-rose-100 dark:bg-rose-900/30', icon: 'text-rose-700 dark:text-rose-400', border: 'border-rose-300 dark:border-rose-700' },
  marketing: { bg: 'bg-pink-100 dark:bg-pink-900/30', icon: 'text-pink-700 dark:text-pink-400', border: 'border-pink-300 dark:border-pink-700' },
  ti: { bg: 'bg-purple-100 dark:bg-purple-900/30', icon: 'text-purple-700 dark:text-purple-400', border: 'border-purple-300 dark:border-purple-700' },
  rh: { bg: 'bg-orange-100 dark:bg-orange-900/30', icon: 'text-orange-700 dark:text-orange-400', border: 'border-orange-300 dark:border-orange-700' },
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
