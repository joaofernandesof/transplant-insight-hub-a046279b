import { useMemo, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserCircle, AlertCircle } from 'lucide-react';

interface OrgPosition {
  id: string;
  unit: string;
  department: string;
  level: string;
  role_title: string;
  person_name: string | null;
  is_vacant: boolean;
  sort_order: number;
}

const LEVELS_ORDER = ['Diretoria', 'Gerência', 'Coordenação', 'Supervisão', 'Operação', 'Externos'];

const LEVEL_STYLES: Record<string, { bg: string; border: string; accent: string; avatar: string }> = {
  'Diretoria':   { bg: 'bg-amber-50 dark:bg-amber-950/40',   border: 'border-amber-400',   accent: 'bg-amber-500',   avatar: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  'Gerência':    { bg: 'bg-rose-50 dark:bg-rose-950/40',     border: 'border-rose-400',     accent: 'bg-rose-500',     avatar: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300' },
  'Coordenação': { bg: 'bg-violet-50 dark:bg-violet-950/40', border: 'border-violet-400',   accent: 'bg-violet-500',   avatar: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300' },
  'Supervisão':  { bg: 'bg-blue-50 dark:bg-blue-950/40',     border: 'border-blue-400',     accent: 'bg-blue-500',     avatar: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  'Operação':    { bg: 'bg-teal-50 dark:bg-teal-950/40',     border: 'border-teal-400',     accent: 'bg-teal-500',     avatar: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300' },
  'Externos':    { bg: 'bg-slate-50 dark:bg-slate-900/40',   border: 'border-slate-400',    accent: 'bg-slate-500',    avatar: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
};

const DEPARTMENTS = ['Marketing', 'Operacional', 'Processos', 'Comercial', 'Pós-Vendas', 'Financeiro', 'Técnico', 'Jurídico', 'TI'];

interface Props {
  positions: OrgPosition[];
  onEdit?: (pos: OrgPosition) => void;
}

function PersonCard({ pos, style }: { pos: OrgPosition; style: typeof LEVEL_STYLES['Diretoria'] }) {
  const initials = pos.is_vacant
    ? '?'
    : (pos.person_name ?? '')
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || '?';

  return (
    <div className={`relative flex flex-col items-center w-[140px] transition-transform hover:scale-105`}>
      {/* Avatar circle */}
      <div className={`relative z-10 w-12 h-12 rounded-full border-2 ${style.border} flex items-center justify-center ${pos.is_vacant ? 'bg-destructive/10 border-dashed border-destructive/50' : style.avatar}`}>
        {pos.is_vacant ? (
          <AlertCircle className="h-5 w-5 text-destructive" />
        ) : (
          <span className="text-sm font-bold">{initials}</span>
        )}
      </div>
      {/* Card body */}
      <div className={`-mt-4 pt-6 pb-2 px-2 w-full rounded-lg border ${pos.is_vacant ? 'border-dashed border-destructive/40 bg-destructive/5' : `${style.border} ${style.bg}`} text-center`}>
        <p className={`text-xs font-semibold leading-tight truncate ${pos.is_vacant ? 'text-destructive' : 'text-foreground'}`}>
          {pos.is_vacant ? 'VAGA ABERTA' : pos.person_name}
        </p>
        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 truncate">
          {pos.role_title}
        </p>
      </div>
    </div>
  );
}

export default function OrgChart({ positions, onEdit }: Props) {
  const [filterDept, setFilterDept] = useState<string>('all');

  const filtered = useMemo(() => {
    if (filterDept === 'all') return positions;
    return positions.filter(p => p.department === filterDept);
  }, [positions, filterDept]);

  // Group by level
  const byLevel = useMemo(() => {
    const map: Record<string, OrgPosition[]> = {};
    for (const lvl of LEVELS_ORDER) {
      const items = filtered.filter(p => p.level === lvl);
      if (items.length > 0) map[lvl] = items;
    }
    return map;
  }, [filtered]);

  const levels = Object.entries(byLevel);

  return (
    <div className="space-y-4">
      {/* Dept filter */}
      <div className="flex justify-center">
        <Select value={filterDept} onValueChange={setFilterDept}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar departamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Departamentos</SelectItem>
            {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Org Chart */}
      <div className="overflow-x-auto pb-4">
        <div className="min-w-[600px] flex flex-col items-center gap-0">
          {levels.map(([level, items], levelIdx) => {
            const style = LEVEL_STYLES[level] || LEVEL_STYLES['Operação'];
            return (
              <div key={level} className="flex flex-col items-center w-full">
                {/* Vertical connector from previous level */}
                {levelIdx > 0 && (
                  <div className="w-px h-8 bg-border" />
                )}

                {/* Horizontal branch line if multiple items */}
                {levelIdx > 0 && items.length > 1 && (
                  <div className="relative w-full flex justify-center">
                    <div
                      className="h-px bg-border absolute top-0"
                      style={{
                        width: `${Math.min(items.length * 160, 900)}px`,
                        maxWidth: '90%',
                      }}
                    />
                  </div>
                )}

                {/* Level label */}
                <div className="mb-2 mt-1">
                  <Badge className={`text-[10px] px-3 py-0.5 ${style.accent} text-white border-0`}>
                    {level}
                  </Badge>
                </div>

                {/* Person cards row */}
                <div className="flex flex-wrap justify-center gap-4">
                  {items.map((pos) => (
                    <div key={pos.id} className="flex flex-col items-center">
                      {/* Vertical connector to horizontal line */}
                      {levelIdx > 0 && items.length > 1 && (
                        <div className="w-px h-4 bg-border" />
                      )}
                      <div
                        className="cursor-pointer"
                        onClick={() => onEdit?.(pos)}
                      >
                        <PersonCard pos={pos} style={style} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {levels.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              Nenhuma posição encontrada.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
