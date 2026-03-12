import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAllSectorTickets } from '@/neohub/hooks/useAllSectorTickets';
import { useSectorTickets, SECTOR_LABELS, PRIORITY_CONFIG } from '@/neohub/hooks/useSectorTickets';
import { Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GestaoNewTicketDialog({ open, onOpenChange }: Props) {
  const [selectedSector, setSelectedSector] = useState('');
  const { allTicketTypes } = useAllSectorTickets();
  const { createTicket } = useSectorTickets(selectedSector);

  const [form, setForm] = useState({
    ticket_type_id: '',
    title: '',
    description: '',
    priority: 'normal',
  });

  const sectorTypes = allTicketTypes.filter(t => t.sector_code === selectedSector);

  const handleSave = async () => {
    if (!form.ticket_type_id || !form.title.trim() || !selectedSector) return;
    await createTicket.mutateAsync(form);
    setForm({ ticket_type_id: '', title: '', description: '', priority: 'normal' });
    setSelectedSector('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Chamado (Cross-Setor)</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Setor Destino *</Label>
            <Select value={selectedSector} onValueChange={v => { setSelectedSector(v); setForm(f => ({ ...f, ticket_type_id: '' })); }}>
              <SelectTrigger><SelectValue placeholder="Selecione o setor" /></SelectTrigger>
              <SelectContent>
                {Object.entries(SECTOR_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Tipo de Chamado *</Label>
            <Select value={form.ticket_type_id} onValueChange={v => setForm(f => ({ ...f, ticket_type_id: v }))} disabled={!selectedSector}>
              <SelectTrigger><SelectValue placeholder={selectedSector ? 'Selecione o tipo' : 'Selecione um setor primeiro'} /></SelectTrigger>
              <SelectContent>
                {sectorTypes.map(t => (
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
          <Button onClick={handleSave} disabled={!selectedSector || !form.ticket_type_id || !form.title.trim() || createTicket.isPending}>
            {createTicket.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Criar Chamado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
