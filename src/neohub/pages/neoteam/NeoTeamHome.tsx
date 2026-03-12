import React from 'react';
import { 
  BarChart3, Stethoscope, HeadphonesIcon, ClipboardCheck, 
  GitCompare, DollarSign, Scale, Megaphone, CircuitBoard, UsersRound,
  Link2, Phone, ShoppingCart, Wrench, GraduationCap,
  type LucideIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const SECTOR_ICONS: Record<string, LucideIcon> = {
  tecnico: Stethoscope,
  sucesso_paciente: HeadphonesIcon,
  sucesso_aluno: GraduationCap,
  operacional: ClipboardCheck,
  processos: GitCompare,
  financeiro: DollarSign,
  juridico: Scale,
  marketing: Megaphone,
  ti: CircuitBoard,
  rh: UsersRound,
  comercial: Phone,
  compras: ShoppingCart,
  manutencao: Wrench,
  gestao: BarChart3,
};

const SECTOR_COLORS: Record<string, { bg: string; icon: string; border: string }> = {
  tecnico: { bg: 'bg-cyan-200 dark:bg-cyan-800/40', icon: 'text-cyan-800 dark:text-cyan-300', border: 'border-cyan-400 dark:border-cyan-600' },
  sucesso_paciente: { bg: 'bg-yellow-200 dark:bg-yellow-800/40', icon: 'text-yellow-800 dark:text-yellow-300', border: 'border-yellow-400 dark:border-yellow-600' },
  operacional: { bg: 'bg-blue-200 dark:bg-blue-800/40', icon: 'text-blue-800 dark:text-blue-300', border: 'border-blue-400 dark:border-blue-600' },
  processos: { bg: 'bg-indigo-200 dark:bg-indigo-800/40', icon: 'text-indigo-800 dark:text-indigo-300', border: 'border-indigo-400 dark:border-indigo-600' },
  financeiro: { bg: 'bg-emerald-200 dark:bg-emerald-800/40', icon: 'text-emerald-800 dark:text-emerald-300', border: 'border-emerald-400 dark:border-emerald-600' },
  juridico: { bg: 'bg-rose-200 dark:bg-rose-800/40', icon: 'text-rose-800 dark:text-rose-300', border: 'border-rose-400 dark:border-rose-600' },
  marketing: { bg: 'bg-pink-200 dark:bg-pink-800/40', icon: 'text-pink-800 dark:text-pink-300', border: 'border-pink-400 dark:border-pink-600' },
  ti: { bg: 'bg-purple-200 dark:bg-purple-800/40', icon: 'text-purple-800 dark:text-purple-300', border: 'border-purple-400 dark:border-purple-600' },
  rh: { bg: 'bg-orange-200 dark:bg-orange-800/40', icon: 'text-orange-800 dark:text-orange-300', border: 'border-orange-400 dark:border-orange-600' },
  comercial: { bg: 'bg-teal-200 dark:bg-teal-800/40', icon: 'text-teal-800 dark:text-teal-300', border: 'border-teal-400 dark:border-teal-600' },
  compras: { bg: 'bg-amber-200 dark:bg-amber-800/40', icon: 'text-amber-800 dark:text-amber-300', border: 'border-amber-400 dark:border-amber-600' },
  manutencao: { bg: 'bg-stone-200 dark:bg-stone-800/40', icon: 'text-stone-800 dark:text-stone-300', border: 'border-stone-400 dark:border-stone-600' },
  gestao: { bg: 'bg-slate-200 dark:bg-slate-800/40', icon: 'text-slate-800 dark:text-slate-300', border: 'border-slate-400 dark:border-slate-600' },
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
                onClick={() => navigate(`/neoteam/${sector.code.replace(/_/g, '-')}`)}
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

        {/* Portal de Links - botão separado */}
        <div className="flex justify-center">
          <button
            onClick={() => navigate('/neoteam/portal-links')}
            className="flex items-center gap-3 px-6 py-3 rounded-xl border border-border bg-card hover:bg-muted/50 hover:shadow-md hover:scale-[1.02] transition-all duration-200"
          >
            <div className="p-2 rounded-lg bg-primary/10">
              <Link2 className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <span className="text-sm font-semibold text-foreground">Portal de Links</span>
              <p className="text-xs text-muted-foreground">Links úteis por setor</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
