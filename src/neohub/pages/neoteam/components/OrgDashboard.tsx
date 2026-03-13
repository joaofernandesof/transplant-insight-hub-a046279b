import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users, UserCircle, AlertTriangle, Briefcase, Building2,
  TrendingUp, Target, Layers, Globe, UserCheck, UserX, PieChart
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, Legend, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Treemap
} from 'recharts';

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

const DEPARTMENTS = ['Marketing', 'Operacional', 'Processos', 'Comercial', 'Pós-Vendas', 'Financeiro', 'Técnico', 'Jurídico', 'TI'];
const LEVELS = ['Diretoria', 'Gerência', 'Coordenação', 'Supervisão', 'Operação', 'Externos'];
const UNITS = ['Fortaleza', 'IBRAMEC', 'Juazeiro'];

const COLORS = [
  'hsl(var(--primary))',
  'hsl(340, 75%, 55%)',
  'hsl(200, 80%, 50%)',
  'hsl(45, 90%, 50%)',
  'hsl(150, 60%, 45%)',
  'hsl(280, 60%, 55%)',
  'hsl(20, 85%, 55%)',
  'hsl(170, 65%, 45%)',
  'hsl(260, 50%, 60%)',
];

const LEVEL_COLORS_HEX = [
  '#9333ea', '#3b82f6', '#06b6d4', '#f59e0b', '#64748b', '#10b981'
];

interface Props {
  positions: OrgPosition[];
}

export default function OrgDashboard({ positions }: Props) {
  const stats = useMemo(() => {
    const total = positions.length;
    const occupied = positions.filter(p => !p.is_vacant).length;
    const vacant = positions.filter(p => p.is_vacant).length;
    const departments = new Set(positions.map(p => p.department)).size;
    const units = new Set(positions.map(p => p.unit)).size;
    const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;
    const vacancyRate = total > 0 ? Math.round((vacant / total) * 100) : 0;
    const uniquePeople = new Set(positions.filter(p => p.person_name).map(p => p.person_name)).size;
    const multiRolePeople = positions.filter(p => p.person_name).length - uniquePeople;

    return { total, occupied, vacant, departments, units, occupancyRate, vacancyRate, uniquePeople, multiRolePeople };
  }, [positions]);

  // Data: by department
  const byDept = useMemo(() =>
    DEPARTMENTS.map(dept => {
      const items = positions.filter(p => p.department === dept);
      return {
        name: dept,
        total: items.length,
        ocupado: items.filter(p => !p.is_vacant).length,
        vaga: items.filter(p => p.is_vacant).length,
      };
    }).filter(d => d.total > 0),
  [positions]);

  // Data: by level
  const byLevel = useMemo(() =>
    LEVELS.map(level => {
      const items = positions.filter(p => p.level === level);
      return {
        name: level,
        total: items.length,
        ocupado: items.filter(p => !p.is_vacant).length,
        vaga: items.filter(p => p.is_vacant).length,
      };
    }).filter(d => d.total > 0),
  [positions]);

  // Data: by unit
  const byUnit = useMemo(() =>
    UNITS.map(unit => {
      const items = positions.filter(p => p.unit === unit);
      return {
        name: unit,
        total: items.length,
        ocupado: items.filter(p => !p.is_vacant).length,
        vaga: items.filter(p => p.is_vacant).length,
      };
    }).filter(d => d.total > 0),
  [positions]);

  // Pie: occupancy
  const occupancyPie = useMemo(() => [
    { name: 'Ocupado', value: stats.occupied },
    { name: 'Vaga', value: stats.vacant },
  ], [stats]);

  // Radar: dept fullness
  const radarData = useMemo(() =>
    DEPARTMENTS.map(dept => {
      const items = positions.filter(p => p.department === dept);
      const occ = items.filter(p => !p.is_vacant).length;
      const total = items.length;
      return {
        dept: dept.substring(0, 6),
        fullName: dept,
        taxa: total > 0 ? Math.round((occ / total) * 100) : 0,
      };
    }).filter(d => d.taxa > 0 || positions.some(p => p.department.startsWith(d.fullName))),
  [positions]);

  // Treemap data
  const treemapData = useMemo(() =>
    DEPARTMENTS.map((dept, i) => {
      const items = positions.filter(p => p.department === dept);
      return { name: dept, size: items.length, fill: COLORS[i % COLORS.length] };
    }).filter(d => d.size > 0),
  [positions]);

  // Top departments with most vacancies
  const topVacantDepts = useMemo(() =>
    DEPARTMENTS.map(dept => ({
      dept,
      count: positions.filter(p => p.department === dept && p.is_vacant).length,
    })).filter(d => d.count > 0).sort((a, b) => b.count - a.count),
  [positions]);

  // Level distribution pie
  const levelPie = useMemo(() =>
    LEVELS.map((level, i) => ({
      name: level,
      value: positions.filter(p => p.level === level).length,
      fill: LEVEL_COLORS_HEX[i],
    })).filter(d => d.value > 0),
  [positions]);

  // People with multiple roles
  const multiRolePeople = useMemo(() => {
    const nameMap: Record<string, OrgPosition[]> = {};
    positions.filter(p => p.person_name).forEach(p => {
      const name = p.person_name!;
      if (!nameMap[name]) nameMap[name] = [];
      nameMap[name].push(p);
    });
    return Object.entries(nameMap).filter(([, v]) => v.length > 1).map(([name, roles]) => ({ name, roles }));
  }, [positions]);

  // Dept vacancy rate ranking
  const deptVacancyRate = useMemo(() =>
    DEPARTMENTS.map(dept => {
      const items = positions.filter(p => p.department === dept);
      const vacant = items.filter(p => p.is_vacant).length;
      return {
        dept,
        total: items.length,
        vacant,
        rate: items.length > 0 ? Math.round((vacant / items.length) * 100) : 0,
      };
    }).filter(d => d.total > 0).sort((a, b) => b.rate - a.rate),
  [positions]);

  return (
    <div className="space-y-4">
      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><Users className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold">{stats.total}</p><p className="text-[11px] text-muted-foreground">Posições totais</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><UserCheck className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold">{stats.occupied}</p><p className="text-[11px] text-muted-foreground">Ocupadas</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10"><UserX className="h-5 w-5 text-destructive" /></div>
            <div><p className="text-2xl font-bold text-destructive">{stats.vacant}</p><p className="text-[11px] text-muted-foreground">Vagas abertas</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><Briefcase className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold">{stats.departments}</p><p className="text-[11px] text-muted-foreground">Departamentos</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><Building2 className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold">{stats.units}</p><p className="text-[11px] text-muted-foreground">Unidades</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><Target className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold">{stats.uniquePeople}</p><p className="text-[11px] text-muted-foreground">Colaboradores únicos</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Occupancy gauge + Chart by dept */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Widget 1: Occupancy Rate */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Taxa de Ocupação</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            <div className="relative w-32 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie data={occupancyPie} innerRadius={38} outerRadius={55} paddingAngle={4} dataKey="value" startAngle={90} endAngle={-270}>
                    <Cell fill="hsl(var(--primary))" />
                    <Cell fill="hsl(var(--destructive))" />
                  </Pie>
                </RePieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{stats.occupancyRate}%</span>
              </div>
            </div>
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> Ocupado ({stats.occupied})</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive" /> Vaga ({stats.vacant})</span>
            </div>
          </CardContent>
        </Card>

        {/* Widget 2: By Department Bar */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Posições por Departamento</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byDept} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="ocupado" name="Ocupado" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                <Bar dataKey="vaga" name="Vaga" fill="hsl(var(--destructive))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Level distribution + By Unit + Radar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Widget 3: Level Pie */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Distribuição por Nível</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <RePieChart>
                <Pie data={levelPie} innerRadius={35} outerRadius={70} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {levelPie.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Widget 4: By Unit */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Posições por Unidade</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byUnit} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
                <Tooltip />
                <Bar dataKey="ocupado" name="Ocupado" fill="hsl(var(--primary))" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="vaga" name="Vaga" fill="hsl(var(--destructive))" stackId="a" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Widget 5: Radar */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Radar de Ocupação por Depto</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid className="stroke-border" />
                <PolarAngleAxis dataKey="dept" tick={{ fontSize: 9 }} />
                <PolarRadiusAxis tick={{ fontSize: 9 }} domain={[0, 100]} />
                <Radar name="Taxa %" dataKey="taxa" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 4: By Level bar + Vacancy rate + Vacant list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Widget 6: By Level Bar */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Posições por Nível Hierárquico</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byLevel}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={45} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" name="Total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                  {byLevel.map((_, i) => <Cell key={i} fill={LEVEL_COLORS_HEX[i % LEVEL_COLORS_HEX.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Widget 7: Vacancy Rate by Dept */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Taxa de Vacância por Departamento</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {deptVacancyRate.map(d => (
              <div key={d.dept} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">{d.dept}</span>
                  <span className="text-muted-foreground">{d.rate}% ({d.vacant}/{d.total})</span>
                </div>
                <Progress value={d.rate} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Widget 8: Vacant Positions */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" /> Vagas em Aberto ({stats.vacant})
          </CardTitle></CardHeader>
          <CardContent className="max-h-[240px] overflow-y-auto">
            {positions.filter(p => p.is_vacant).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhuma vaga em aberto 🎉</p>
            ) : (
              <div className="space-y-2">
                {positions.filter(p => p.is_vacant).map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg border border-dashed border-destructive/30 bg-destructive/5">
                    <div>
                      <p className="font-medium text-sm">{p.role_title}</p>
                      <p className="text-[11px] text-muted-foreground">{p.department} • {p.level} • {p.unit}</p>
                    </div>
                    <Badge variant="destructive" className="text-[10px]">Vaga</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 5: Multi-role + Dept Grid + Span distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Widget 9: Multi-role collaborators */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" /> Colaboradores com Múltiplas Funções
          </CardTitle></CardHeader>
          <CardContent className="max-h-[240px] overflow-y-auto">
            {multiRolePeople.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum colaborador acumula funções</p>
            ) : (
              <div className="space-y-3">
                {multiRolePeople.map(({ name, roles }) => (
                  <div key={name} className="p-2.5 rounded-lg border bg-accent/30">
                    <p className="font-medium text-sm">{name}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {roles.map(r => (
                        <Badge key={r.id} variant="outline" className="text-[10px]">{r.role_title}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Widget 10: Dept Overview Grid */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Resumo por Departamento</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {DEPARTMENTS.map((dept, i) => {
                const items = positions.filter(p => p.department === dept);
                if (items.length === 0) return null;
                const vacant = items.filter(p => p.is_vacant).length;
                return (
                  <div key={dept} className="p-2 rounded-lg border text-center" style={{ borderLeftWidth: 3, borderLeftColor: COLORS[i % COLORS.length] }}>
                    <p className="text-[10px] font-medium truncate">{dept}</p>
                    <p className="text-lg font-bold">{items.length}</p>
                    {vacant > 0 && <p className="text-[10px] text-destructive">{vacant} vagas</p>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Widget 11: Span of Control */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Span of Control
          </CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {DEPARTMENTS.map(dept => {
              const items = positions.filter(p => p.department === dept);
              if (items.length === 0) return null;
              const leaders = items.filter(p => ['Diretoria', 'Gerência', 'Coordenação', 'Supervisão'].includes(p.level) && !p.is_vacant).length;
              const operators = items.filter(p => ['Operação', 'Externos'].includes(p.level) && !p.is_vacant).length;
              const ratio = leaders > 0 ? (operators / leaders).toFixed(1) : '—';
              return (
                <div key={dept} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{dept}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{leaders}L : {operators}O</span>
                    <Badge variant="outline" className="text-[10px] font-mono">{ratio}:1</Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Row 6: Widget 12 - Treemap */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Mapa de Proporção por Departamento</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={treemapData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
              <Tooltip />
              <Bar dataKey="size" name="Posições" radius={[0, 4, 4, 0]}>
                {treemapData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
