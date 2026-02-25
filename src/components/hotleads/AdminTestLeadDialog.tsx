import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, FlaskConical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdminTestLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const BRAZILIAN_STATES = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT',
  'PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'
];

const SAMPLE_NAMES = [
  'Maria Silva','João Santos','Ana Oliveira','Carlos Souza','Fernanda Costa',
  'Pedro Lima','Juliana Pereira','Lucas Almeida','Beatriz Rocha','Rafael Ferreira',
  'Camila Nascimento','Bruno Martins','Larissa Ribeiro','Gustavo Araújo','Patrícia Gomes',
];

const SAMPLE_CITIES: Record<string, string[]> = {
  SP: ['São Paulo','Campinas','Santos','Ribeirão Preto','Sorocaba'],
  RJ: ['Rio de Janeiro','Niterói','Petrópolis','Volta Redonda'],
  MG: ['Belo Horizonte','Uberlândia','Juiz de Fora','Contagem'],
  BA: ['Salvador','Feira de Santana','Vitória da Conquista'],
  PR: ['Curitiba','Londrina','Maringá','Cascavel'],
  RS: ['Porto Alegre','Caxias do Sul','Pelotas'],
  SC: ['Florianópolis','Joinville','Blumenau'],
  PE: ['Recife','Olinda','Caruaru'],
  CE: ['Fortaleza','Juazeiro do Norte','Sobral'],
  GO: ['Goiânia','Anápolis','Aparecida de Goiânia'],
  DF: ['Brasília'],
};

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePhone(): string {
  const ddd = String(Math.floor(Math.random() * 89) + 11);
  const num = String(Math.floor(Math.random() * 900000000) + 100000000);
  return `(${ddd}) 9${num.slice(1, 5)}-${num.slice(5)}`;
}

function generateEmail(name: string): string {
  const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '.');
  const domains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com.br'];
  return `${slug}+teste@${randomItem(domains)}`;
}

export function AdminTestLeadDialog({ open, onOpenChange, onCreated }: AdminTestLeadDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const [state, setState] = useState('SP');
  const [releaseStatus, setReleaseStatus] = useState<'available' | 'queued'>('available');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const rows = Array.from({ length: quantity }, () => {
        const name = randomItem(SAMPLE_NAMES);
        const cities = SAMPLE_CITIES[state] || ['Cidade Teste'];
        return {
          name: `[TESTE] ${name}`,
          phone: generatePhone(),
          email: generateEmail(name),
          state,
          city: randomItem(cities),
          source: 'planilha' as const,
          status: 'new',
          interest_level: 'warm',
          release_status: releaseStatus,
          available_at: releaseStatus === 'available' ? new Date().toISOString() : null,
          tags: ['teste'],
        };
      });

      const { error } = await supabase.from('leads').insert(rows as any);
      if (error) throw error;

      toast.success(`${quantity} lead(s) de teste criado(s)!`);
      onCreated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating test leads:', error);
      toast.error('Erro ao criar leads de teste');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-purple-500" />
            Criar Leads de Teste
          </DialogTitle>
          <DialogDescription>
            Gera leads fictícios marcados com [TESTE] para simulações. Eles aparecem com a tag "teste".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Quantidade</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={quantity}
                onChange={e => setQuantity(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Estado</Label>
              <Select value={state} onValueChange={setState}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BRAZILIAN_STATES.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Status de liberação</Label>
            <Select value={releaseStatus} onValueChange={v => setReleaseStatus(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Disponível (aparece imediatamente)</SelectItem>
                <SelectItem value="queued">Na fila (aguarda liberação)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleCreate} disabled={isCreating} className="w-full bg-purple-600 hover:bg-purple-700">
            {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FlaskConical className="h-4 w-4 mr-2" />}
            Criar {quantity} lead{quantity > 1 ? 's' : ''} de teste
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
