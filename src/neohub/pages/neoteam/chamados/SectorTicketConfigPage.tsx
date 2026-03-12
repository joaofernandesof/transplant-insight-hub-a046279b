import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Trash2, Settings, Loader2 } from 'lucide-react';
import { NeoTeamBreadcrumb } from '@/neohub/components/NeoTeamBreadcrumb';
import { useSectorTickets, SECTOR_LABELS } from '@/neohub/hooks/useSectorTickets';

interface Props {
  sectorCode: string;
  sectorSlug: string;
}

export default function SectorTicketConfigPage({ sectorCode, sectorSlug }: Props) {
  const navigate = useNavigate();
  const { ticketTypes, stages, getStagesForType, createTicketType, deleteTicketType } = useSectorTickets(sectorCode);
  const [showNewType, setShowNewType] = useState(false);
  const [newType, setNewType] = useState({ name: '', code: '', description: '' });

  const handleCreateType = async () => {
    if (!newType.name.trim() || !newType.code.trim()) return;
    await createTicketType.mutateAsync(newType);
    setNewType({ name: '', code: '', description: '' });
    setShowNewType(false);
  };

  const handleDeleteType = async (id: string) => {
    if (!confirm('Excluir este tipo de chamado e todas as suas etapas?')) return;
    await deleteTicketType.mutateAsync(id);
  };

  const sectorLabel = SECTOR_LABELS[sectorCode] || sectorCode;

  return (
    <div className="space-y-6 p-6">
      <NeoTeamBreadcrumb />

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/neoteam/${sectorSlug}/chamados`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Configuração — {sectorLabel}</h1>
          <p className="text-muted-foreground">Gerencie tipos de chamado e etapas</p>
        </div>
        <Button className="gap-2" onClick={() => setShowNewType(true)}>
          <Plus className="h-4 w-4" />
          Novo Tipo
        </Button>
      </div>

      <div className="grid gap-4">
        {ticketTypes.map(type => {
          const typeStages = getStagesForType(type.id);
          return (
            <Card key={type.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${type.color}`} />
                    <CardTitle className="text-base">{type.name}</CardTitle>
                    <Badge variant="outline" className="text-xs">{type.code}</Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleDeleteType(type.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {type.description && <p className="text-sm text-muted-foreground mt-1">{type.description}</p>}
              </CardHeader>
              <CardContent>
                <p className="text-xs font-medium text-muted-foreground mb-2">Etapas ({typeStages.length})</p>
                <div className="flex flex-wrap gap-2">
                  {typeStages.map((stage, idx) => (
                    <Badge key={stage.id} variant={stage.is_initial ? 'default' : stage.is_final ? 'secondary' : 'outline'} className="text-xs">
                      {idx + 1}. {stage.name}
                      {stage.sla_hours && <span className="ml-1 opacity-60">({stage.sla_hours}h)</span>}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={showNewType} onOpenChange={setShowNewType}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Tipo de Chamado</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Nome *</Label>
              <Input value={newType.name} onChange={e => setNewType(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Solicitação de Compra" />
            </div>
            <div className="grid gap-2">
              <Label>Código *</Label>
              <Input value={newType.code} onChange={e => setNewType(f => ({ ...f, code: e.target.value.toLowerCase().replace(/\s+/g, '_') }))} placeholder="Ex: solicitacao_compra" />
            </div>
            <div className="grid gap-2">
              <Label>Descrição</Label>
              <Input value={newType.description} onChange={e => setNewType(f => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewType(false)}>Cancelar</Button>
            <Button onClick={handleCreateType} disabled={!newType.name.trim() || !newType.code.trim() || createTicketType.isPending}>
              {createTicketType.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
