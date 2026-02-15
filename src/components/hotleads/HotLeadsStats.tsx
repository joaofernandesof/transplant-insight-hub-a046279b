import { Flame, Target, UserCheck, Clock } from 'lucide-react';
import type { HotLead } from '@/hooks/useHotLeads';

interface HotLeadsStatsProps {
  leads: HotLead[];
  availableCount: number;
  myLeadsCount: number;
  acquiredCount: number;
  queuedCount: number;
}

export function HotLeadsStats({ leads, availableCount, myLeadsCount, acquiredCount, queuedCount }: HotLeadsStatsProps) {
  const stats = [
    { label: 'Total de Leads', value: leads.length + queuedCount, icon: Flame, gradient: 'from-orange-500 to-red-500' },
    { label: 'Disponíveis', value: availableCount, icon: Target, gradient: 'from-green-400 to-emerald-600' },
    { label: 'Adquiridos', value: acquiredCount + myLeadsCount, icon: UserCheck, gradient: 'from-blue-500 to-indigo-600' },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`rounded-xl bg-gradient-to-br ${stat.gradient} p-3 sm:p-4 flex flex-col justify-between shadow-lg min-h-[80px] sm:min-h-[90px] overflow-hidden`}
        >
          <div className="flex items-start justify-between gap-1">
            <p className="text-white/80 text-[10px] sm:text-xs font-medium leading-tight">{stat.label}</p>
            <stat.icon className="h-6 w-6 sm:h-10 sm:w-10 text-white/20 shrink-0" />
          </div>
          <p className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-none mt-1 truncate">
            {stat.value.toLocaleString('pt-BR')}
          </p>
        </div>
      ))}
    </div>
  );
}
