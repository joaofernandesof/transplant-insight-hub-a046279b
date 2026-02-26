import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ShoppingCart } from 'lucide-react';

const PROCEDURES = [
  'Transplante Capilar',
  'Transplante de Barba',
  'Transplante de Sobrancelhas',
  'Mesoterapia',
  'PRP',
];

interface SaleFormDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (procedure: string, value: number) => Promise<void>;
  leadName: string;
}

export function SaleFormDialog({ open, onClose, onConfirm, leadName }: SaleFormDialogProps) {
  const [procedure, setProcedure] = useState('');
  const [value, setValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!procedure || !value) return;
    const numericValue = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (isNaN(numericValue) || numericValue <= 0) return;
    setIsSubmitting(true);
    try {
      await onConfirm(procedure, numericValue);
    } finally {
      setIsSubmitting(false);
      setProcedure('');
      setValue('');
    }
  };

  const formatCurrency = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    const num = parseInt(digits, 10) / 100;
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-700">
            <ShoppingCart className="h-5 w-5" />
            Registrar Venda
          </DialogTitle>
          <DialogDescription>
            Informe os dados da venda para o lead <strong>{leadName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="procedure">Procedimento vendido</Label>
            <Select value={procedure} onValueChange={setProcedure}>
              <SelectTrigger id="procedure">
                <SelectValue placeholder="Selecione o procedimento" />
              </SelectTrigger>
              <SelectContent>
                {PROCEDURES.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Valor do Procedimento (R$)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
              <Input
                id="value"
                className="pl-10"
                placeholder="0,00"
                value={value}
                onChange={(e) => setValue(formatCurrency(e.target.value))}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            disabled={!procedure || !value || isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Confirmar Venda
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
