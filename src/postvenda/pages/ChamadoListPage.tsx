import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Loader2 } from 'lucide-react';
import { GlobalBreadcrumb } from '@/components/GlobalBreadcrumb';
import { ChamadoCard, NovoChamadoDialog } from '../components';
import { usePostVenda } from '../hooks/usePostVenda';
import { ETAPA_LABELS } from '../lib/permissions';

export default function ChamadoListPage() {
  const { chamados, isLoading, stats } = usePostVenda();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredChamados = chamados.filter(c =>
    c.paciente_nome.toLowerCase().includes(search.toLowerCase()) ||
    c.tipo_demanda.toLowerCase().includes(search.toLowerCase()) ||
    c.numero_chamado?.toString().includes(search)
  );

  const etapas = ['triagem', 'atendimento', 'resolucao', 'validacao_paciente', 'nps'] as const;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <GlobalBreadcrumb />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chamados</h1>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Chamado
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por paciente, tipo ou número..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Kanban por Etapa */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-4">
          {etapas.map(etapa => {
            const etapaChamados = filteredChamados.filter(c => c.etapa_atual === etapa);
            return (
              <div key={etapa} className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  <span className="font-medium text-sm">{ETAPA_LABELS[etapa]}</span>
                  <Badge variant="secondary">{etapaChamados.length}</Badge>
                </div>
                <div className="space-y-2 min-h-[200px]">
                  {etapaChamados.map(chamado => (
                    <ChamadoCard key={chamado.id} chamado={chamado} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <NovoChamadoDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
