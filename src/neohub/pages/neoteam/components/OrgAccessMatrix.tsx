import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Search, Loader2, Shield, Filter } from 'lucide-react';

interface OrgPosition {
  id: string;
  unit: string;
  department: string;
  level: string;
  role_title: string;
  person_name: string | null;
  is_vacant: boolean;
}

interface OrgSystem {
  id: string;
  name: string;
  category: string;
  sort_order: number;
}

interface AccessEntry {
  position_id: string;
  system_id: string;
}

const DEPARTMENTS = ['Marketing', 'Operacional', 'Processos', 'Comercial', 'Pós-Vendas', 'Financeiro', 'Técnico', 'Jurídico', 'TI'];

export default function OrgAccessMatrix() {
  const [positions, setPositions] = useState<OrgPosition[]>([]);
  const [systems, setSystems] = useState<OrgSystem[]>([]);
  const [accessMap, setAccessMap] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [searchSystem, setSearchSystem] = useState('');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const makeKey = (posId: string, sysId: string) => `${posId}::${sysId}`;

  const load = useCallback(async () => {
    setLoading(true);
    const [posRes, sysRes, accRes] = await Promise.all([
      supabase.from('org_positions').select('id, unit, department, level, role_title, person_name, is_vacant').order('sort_order'),
      supabase.from('org_systems').select('*').order('sort_order'),
      supabase.from('org_access_matrix').select('position_id, system_id').eq('has_access', true),
    ]);

    setPositions((posRes.data ?? []) as OrgPosition[]);
    setSystems((sysRes.data ?? []) as OrgSystem[]);

    const set = new Set<string>();
    (accRes.data ?? []).forEach((a: any) => set.add(makeKey(a.position_id, a.system_id)));
    setAccessMap(set);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Unique positions by role_title (deduplicate same person in multiple roles)
  const uniquePositions = useMemo(() => {
    let result = positions;
    if (filterDept !== 'all') result = result.filter(p => p.department === filterDept);
    // Deduplicate by role_title within same department+level
    const seen = new Map<string, OrgPosition>();
    for (const p of result) {
      const key = `${p.department}|${p.level}|${p.role_title}`;
      if (!seen.has(key)) seen.set(key, p);
    }
    return Array.from(seen.values());
  }, [positions, filterDept]);

  const filteredSystems = useMemo(() => {
    let result = systems;
    if (searchSystem.trim()) {
      const q = searchSystem.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(q));
    }
    if (filterCategory !== 'all') {
      result = result.filter(s => s.category === filterCategory);
    }
    return result;
  }, [systems, searchSystem, filterCategory]);

  const categories = useMemo(() => {
    return [...new Set(systems.map(s => s.category))].sort();
  }, [systems]);

  const toggleAccess = async (positionId: string, systemId: string) => {
    const key = makeKey(positionId, systemId);
    const hasAccess = accessMap.has(key);
    setSaving(key);

    try {
      if (hasAccess) {
        // Remove access
        await supabase
          .from('org_access_matrix')
          .delete()
          .eq('position_id', positionId)
          .eq('system_id', systemId);

        setAccessMap(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      } else {
        // Grant access
        await supabase
          .from('org_access_matrix')
          .upsert({ position_id: positionId, system_id: systemId, has_access: true }, { onConflict: 'position_id,system_id' });

        setAccessMap(prev => {
          const next = new Set(prev);
          next.add(key);
          return next;
        });
      }
    } catch (err: any) {
      toast.error('Erro ao atualizar acesso');
    } finally {
      setSaving(null);
    }
  };

  // Count accesses per system
  const systemAccessCount = useMemo(() => {
    const map: Record<string, number> = {};
    for (const sys of systems) {
      map[sys.id] = uniquePositions.filter(p => accessMap.has(makeKey(p.id, sys.id))).length;
    }
    return map;
  }, [systems, uniquePositions, accessMap]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar sistema..."
                value={searchSystem}
                onChange={e => setSearchSystem(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterDept} onValueChange={setFilterDept}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Deptos</SelectItem>
                {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Badge variant="outline" className="text-xs py-1.5 px-3">
              {filteredSystems.length} sistemas • {uniquePositions.length} cargos
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Matrix Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[calc(100vh-320px)]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm">
                <tr>
                  <th className="sticky left-0 z-20 bg-muted text-left p-3 font-semibold border-b border-r min-w-[220px]">
                    Cargo
                  </th>
                  <th className="sticky left-[220px] z-20 bg-muted text-left p-3 font-semibold border-b border-r min-w-[130px]">
                    Depto
                  </th>
                  {filteredSystems.map(sys => (
                    <th
                      key={sys.id}
                      className="p-2 border-b text-center min-w-[48px] max-w-[48px]"
                      title={`${sys.name} (${sys.category})`}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span
                          className="text-[10px] font-medium leading-tight text-muted-foreground"
                          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', maxHeight: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}
                        >
                          {sys.name}
                        </span>
                        <Badge variant="outline" className="text-[9px] px-1 py-0 mt-1">
                          {systemAccessCount[sys.id] || 0}
                        </Badge>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {uniquePositions.map((pos, idx) => (
                  <tr key={pos.id} className={`${idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'} hover:bg-accent/30 transition-colors`}>
                    <td className={`sticky left-0 z-10 p-3 border-r font-medium ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'} ${pos.is_vacant ? 'text-destructive italic' : ''}`}>
                      <div className="flex flex-col">
                        <span className="text-sm">{pos.is_vacant ? 'VAGA' : pos.person_name}</span>
                        <span className="text-[11px] text-muted-foreground">{pos.role_title}</span>
                      </div>
                    </td>
                    <td className={`sticky left-[220px] z-10 p-3 border-r text-xs ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                      {pos.department}
                    </td>
                    {filteredSystems.map(sys => {
                      const key = makeKey(pos.id, sys.id);
                      const hasAccess = accessMap.has(key);
                      const isSaving = saving === key;
                      return (
                        <td key={sys.id} className="p-1 text-center border-l border-border/30">
                          <div className="flex justify-center">
                            <Switch
                              checked={hasAccess}
                              onCheckedChange={() => toggleAccess(pos.id, sys.id)}
                              disabled={isSaving}
                              className="scale-75"
                            />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {uniquePositions.length === 0 && (
                  <tr>
                    <td colSpan={filteredSystems.length + 2} className="text-center py-12 text-muted-foreground">
                      Nenhum cargo encontrado com os filtros atuais
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
