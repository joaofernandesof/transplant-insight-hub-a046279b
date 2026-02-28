import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Briefcase, ClipboardList } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function NeoRHDashboard() {
  const [stats, setStats] = useState({ colaboradores: 0, vagas: 0, cargos: 0 });

  useEffect(() => {
    async function load() {
      const [colabs, vagas, cargos] = await Promise.all([
        supabase.from('rh_colaboradores').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
        supabase.from('rh_vagas').select('id', { count: 'exact', head: true }).eq('status', 'aberta'),
        supabase.from('rh_cargos').select('id', { count: 'exact', head: true }),
      ]);
      setStats({
        colaboradores: colabs.count ?? 0,
        vagas: vagas.count ?? 0,
        cargos: cargos.count ?? 0,
      });
    }
    load();
  }, []);

  const cards = [
    { label: 'Colaboradores Ativos', value: stats.colaboradores, icon: Users, color: 'text-blue-500' },
    { label: 'Vagas Abertas', value: stats.vagas, icon: ClipboardList, color: 'text-emerald-500' },
    { label: 'Cargos Cadastrados', value: stats.cargos, icon: Briefcase, color: 'text-amber-500' },
  ];

  return (
    <div className="p-4 lg:p-6 pt-14 lg:pt-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">NeoRH</h1>
        <p className="text-muted-foreground">Gestão de Recursos Humanos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
