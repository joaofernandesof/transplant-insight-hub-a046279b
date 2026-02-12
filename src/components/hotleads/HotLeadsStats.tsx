import { Flame, Users, UserCheck, UserX } from 'lucide-react';
import type { HotLead } from '@/hooks/useHotLeads';

interface HotLeadsStatsProps {
  leads: HotLead[];
  availableCount: number;
  myLeadsCount: number;
  acquiredCount: number;
}

export function HotLeadsStats({ leads, availableCount, myLeadsCount, acquiredCount }: HotLeadsStatsProps) {
  const totalActive = availableCount + myLeadsCount + acquiredCount;

  const stats = [
    { label: 'Total de Leads', value: totalActive, icon: Users, bg: 'bg-orange-50 dark:bg-orange-950', iconColor: 'text-orange-500', border: 'border-orange-200 dark:border-orange-800' },
    { label: 'Disponíveis', value: availableCount, icon: Flame, bg: 'bg-green-50 dark:bg-green-950', iconColor: 'text-green-500', border: 'border-green-200 dark:border-green-800' },
    { label: 'Meus Leads', value: myLeadsCount, icon: UserCheck, bg: 'bg-blue-50 dark:bg-blue-950', iconColor: 'text-blue-500', border: 'border-blue-200 dark:border-blue-800' },
    { label: 'Perdidos', value: acquiredCount, icon: UserX, bg: 'bg-slate-50 dark:bg-slate-900', iconColor: 'text-slate-400', border: 'border-slate-200 dark:border-slate-700' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div key={stat.label} className={`rounded-xl border-2 ${stat.border} ${stat.bg} p-4 flex flex-col justify-center`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-white dark:bg-background shadow-sm ${stat.iconColor}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-3xl lg:text-4xl font-extrabold leading-none tracking-tight">{stat.value.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">{stat.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
