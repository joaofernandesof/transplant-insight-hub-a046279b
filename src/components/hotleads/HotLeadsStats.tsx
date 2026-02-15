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
    { label: 'Na Fila', value: queuedCount, icon: Clock, gradient: 'from-yellow-400 to-amber-500' },
    { label: 'Disponíveis', value: availableCount, icon: Target, gradient: 'from-green-400 to-emerald-600' },
    { label: 'Adquiridos', value: acquiredCount + myLeadsCount, icon: UserCheck, gradient: 'from-blue-500 to-indigo-600' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`rounded-xl bg-gradient-to-br ${stat.gradient} p-4 flex items-center justify-between shadow-lg min-h-[90px]`}
        >
          <div>
            <p className="text-white/80 text-xs font-medium">{stat.label}</p>
            <p className="text-3xl lg:text-4xl font-extrabold text-white leading-none mt-1">
              {stat.value.toLocaleString('pt-BR')}
            </p>
          </div>
          <stat.icon className="h-10 w-10 text-white/30 shrink-0" />
        </div>
      ))}
    </div>
  );
}
