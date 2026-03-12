import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSectorTickets, PRIORITY_CONFIG } from '@/neohub/hooks/useSectorTickets';
import { Loader2, Plus } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectorCode: string;
}

export function NewSectorTicketDialog({ open, onOpenChange, sectorCode }: Props) {
  const { ticketTypes, createTicket, createTicketType } = useSectorTickets(sectorCode);
  const [form, setForm] = useState({
    ticket_type_id: '',
    title: '',
    description: '',
    priority: 'normal',
  });
  const [showNewType, setShowNewType] = useState(false);
  const [newType, setNewType] = useState({ name: '', code: '', description: '' });

  const handleSave = async () => {
    if (!form.ticket_type_id || !form.title.trim()) return;
    await createTicket.mutateAsync(form);
    setForm({ ticket_type_id: '', title: '', description: '', priority: 'normal' });
    onOpenChange(false);
  };

  const handleCreateType = async () => {
    if (!newType.name.trim() || !newType.code.trim()) return;
    const result = await createTicketType.mutateAsync(newType);
    setNewType({ name: '', code: '', description: '' });
    setShowNewType(false);
    // Auto-select the newly created type if possible
    if (result?.id) {
      setForm(f => ({ ...f, ticket_type_id: result.id }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Chamado</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Tipo de Chamado *</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs text-primary"
                onClick={() => setShowNewType(!showNewType)}
              >
                <Plus className="h-3 w-3" />
                Novo Tipo
              </Button>
            </div>

            {showNewType ? (
              <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
                <div className="grid gap-1.5">
                  <Label className="text-xs">Nome *</Label>
                  <Input
                    value={newType.name}
                    onChange={e => {
                      const name = e.target.value;
                      setNewType(f => ({
                        ...f,
                        name,
                        code: name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
                      }));
                    }}
                    placeholder="Ex: Solicitação de Suporte"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Código *</Label>
                  <Input
                    value={newType.code}
                    onChange={e => setNewType(f => ({ ...f, code: e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') }))}
                    placeholder="Ex: solicitacao_suporte"
                    className="h-8 text-sm font-mono"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Descrição</Label>
                  <Input
                    value={newType.description}
                    onChange={e => setNewType(f => ({ ...f, description: e.target.value }))}
                    placeholder="Descrição opcional"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setShowNewType(false); setNewType({ name: '', code: '', description: '' }); }}>
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleCreateType}
                    disabled={!newType.name.trim() || !newType.code.trim() || createTicketType.isPending}
                  >
                    {createTicketType.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    Criar Tipo
                  </Button>
                </div>
              </div>
            ) : (
              <Select value={form.ticket_type_id} onValueChange={v => setForm(f => ({ ...f, ticket_type_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                <SelectContent>
                  {ticketTypes.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="grid gap-2">
            <Label>Título *</Label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Descreva brevemente o chamado" />
          </div>
          <div className="grid gap-2">
            <Label>Descrição</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} placeholder="Detalhes adicionais..." />
          </div>
          <div className="grid gap-2">
            <Label>Prioridade</Label>
            <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!form.ticket_type_id || !form.title.trim() || createTicket.isPending}>
            {createTicket.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Criar Chamado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
