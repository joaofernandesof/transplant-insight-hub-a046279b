/**
 * PublicPortalLinks - Versão pública do Portal de Links (sem autenticação)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ExternalLink, Link as LinkIcon,
  DollarSign, Megaphone, Users, Stethoscope, Scale, CircuitBoard,
  HeadphonesIcon, ClipboardList, GitCompare, Package, Settings, Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SECTORS = [
  { value: 'geral', label: 'Geral', icon: Globe, color: 'bg-slate-500' },
  { value: 'tecnico', label: 'Setor Técnico', icon: Stethoscope, color: 'bg-cyan-500' },
  { value: 'sucesso_paciente', label: 'Sucesso do Paciente', icon: HeadphonesIcon, color: 'bg-yellow-500' },
  { value: 'operacional', label: 'Setor Operacional', icon: ClipboardList, color: 'bg-blue-500' },
  { value: 'processos', label: 'Setor de Processos', icon: GitCompare, color: 'bg-indigo-500' },
  { value: 'financeiro', label: 'Setor Financeiro', icon: DollarSign, color: 'bg-emerald-500' },
  { value: 'juridico', label: 'Setor Jurídico', icon: Scale, color: 'bg-rose-500' },
  { value: 'marketing', label: 'Setor de Marketing', icon: Megaphone, color: 'bg-pink-500' },
  { value: 'ti', label: 'Setor de TI', icon: CircuitBoard, color: 'bg-purple-500' },
  { value: 'rh', label: 'Setor de RH', icon: Users, color: 'bg-amber-500' },
  { value: 'comercial', label: 'Setor Comercial', icon: Package, color: 'bg-teal-500' },
  { value: 'administrativo', label: 'Administrativo', icon: Settings, color: 'bg-gray-500' },
];

interface PortalLink {
  id: string;
  title: string;
  url: string;
  description: string | null;
  sector: string;
}

export default function PublicPortalLinks() {
  const { data: links = [], isLoading } = useQuery({
    queryKey: ['public-portal-links'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neoteam_portal_links' as any)
        .select('id, title, url, description, sector')
        .eq('is_active', true)
        .order('sector')
        .order('order_index');
      if (error) throw error;
      return (data || []) as unknown as PortalLink[];
    },
  });

  const grouped = links.reduce<Record<string, PortalLink[]>>((acc, link) => {
    const key = link.sector || 'geral';
    if (!acc[key]) acc[key] = [];
    acc[key].push(link);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="max-w-4xl mx-auto p-4 lg:p-8 space-y-6">
        <div className="text-center space-y-2 py-8">
          <h1 className="text-3xl font-bold text-foreground">Portal de Links</h1>
          <p className="text-muted-foreground">Links úteis organizados por setor</p>
        </div>

        {isLoading ? (
          <div className="text-center text-muted-foreground py-12">Carregando...</div>
        ) : Object.keys(grouped).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <LinkIcon className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Nenhum link disponível no momento.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {SECTORS.filter(s => grouped[s.value]).map(sector => {
              const SectorIcon = sector.icon;
              const sectorLinks = grouped[sector.value];
              return (
                <Card key={sector.value}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className={cn('p-1.5 rounded-md text-white', sector.color)}>
                        <SectorIcon className="h-4 w-4" />
                      </div>
                      {sector.label}
                      <Badge variant="secondary" className="ml-auto text-xs">{sectorLinks.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {sectorLinks.map(link => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-3 border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                        >
                          <div className={cn('p-2 rounded-md text-white shrink-0', sector.color)}>
                            <ExternalLink className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm text-foreground truncate">{link.title}</p>
                            {link.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{link.description}</p>}
                          </div>
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
