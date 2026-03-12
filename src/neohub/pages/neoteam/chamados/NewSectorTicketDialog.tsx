import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSectorTickets, PRIORITY_CONFIG } from '@/neohub/hooks/useSectorTickets';
import { Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectorCode: string;
}

export function NewSectorTicketDialog({ open, onOpenChange, sectorCode }: Props) {
  const { ticketTypes, createTicket } = useSectorTickets(sectorCode);
  const [form, setForm] = useState({
    ticket_type_id: '',
    title: '',
    description: '',
    priority: 'normal',
  });

  const handleSave = async () => {
    if (!form.ticket_type_id || !form.title.trim()) return;
    await createTicket.mutateAsync(form);
    setForm({ ticket_type_id: '', title: '', description: '', priority: 'normal' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Chamado</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Tipo de Chamado *</Label>
            <Select value={form.ticket_type_id} onValueChange={v => setForm(f => ({ ...f, ticket_type_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
              <SelectContent>
                {ticketTypes.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
