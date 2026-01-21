import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Server, Webhook, Shield, Link2 } from "lucide-react";
import { useSentinelMutations } from "@/hooks/useSystemSentinel";

interface AddSystemDialogProps {
  children?: React.ReactNode;
}

const systemTypes = [
  { value: 'api', label: 'API / Web App', icon: Server, description: 'Endpoint HTTP/HTTPS' },
  { value: 'webhook', label: 'Webhook', icon: Webhook, description: 'Endpoint de webhook' },
  { value: 'domain', label: 'Domínio / SSL', icon: Shield, description: 'Verificação de certificado' },
  { value: 'integration', label: 'Integração', icon: Link2, description: 'Serviço externo (Zapier, n8n)' },
];

export function AddSystemDialog({ children }: AddSystemDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<string>('api');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [timeout, setTimeout] = useState(5000);
  const [interval, setInterval] = useState(60);
  const [expectedCodes, setExpectedCodes] = useState('200, 201');

  const { addSystem } = useSentinelMutations();

  const handleSubmit = async () => {
    const codes = expectedCodes.split(',').map(c => parseInt(c.trim())).filter(c => !isNaN(c));
    
    await addSystem.mutateAsync({
      name,
      type: type as 'api' | 'webhook' | 'domain' | 'integration',
      url,
      description: description || null,
      timeout_ms: timeout,
      check_interval_seconds: interval,
      expected_status_codes: codes.length > 0 ? codes : [200],
      headers: {},
      is_active: true,
    });

    // Reset form
    setName('');
    setType('api');
    setUrl('');
    setDescription('');
    setTimeout(5000);
    setInterval(60);
    setExpectedCodes('200, 201');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Sistema
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Sistema para Monitorar</DialogTitle>
          <DialogDescription>
            Configure um novo endpoint, domínio ou integração para monitoramento
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="system-name">Nome do Sistema</Label>
            <Input
              id="system-name"
              placeholder="Ex: API Principal, Zapier Webhook, SSL neofolic.com"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>Tipo de Sistema</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {systemTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <div className="flex items-center gap-2">
                      <t.icon className="h-4 w-4" />
                      <span>{t.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="system-url">
              {type === 'domain' ? 'Domínio (sem https://)' : 'URL do Endpoint'}
            </Label>
            <Input
              id="system-url"
              placeholder={type === 'domain' ? 'neofolic.com' : 'https://api.exemplo.com/health'}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="system-description">Descrição (opcional)</Label>
            <Textarea
              id="system-description"
              placeholder="Breve descrição do sistema..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="system-timeout">Timeout (ms)</Label>
              <Input
                id="system-timeout"
                type="number"
                value={timeout}
                onChange={(e) => setTimeout(parseInt(e.target.value) || 5000)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="system-interval">Intervalo (segundos)</Label>
              <Input
                id="system-interval"
                type="number"
                value={interval}
                onChange={(e) => setInterval(parseInt(e.target.value) || 60)}
              />
            </div>
          </div>

          {type !== 'domain' && (
            <div className="grid gap-2">
              <Label htmlFor="expected-codes">Códigos HTTP Esperados</Label>
              <Input
                id="expected-codes"
                placeholder="200, 201, 204"
                value={expectedCodes}
                onChange={(e) => setExpectedCodes(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Separe múltiplos códigos por vírgula
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!name || !url || addSystem.isPending}
          >
            {addSystem.isPending ? 'Adicionando...' : 'Adicionar Sistema'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
