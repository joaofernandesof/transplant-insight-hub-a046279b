import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Key, Plus, Trash2, Copy, Loader2, CheckCircle2, Eye, EyeOff, BookOpen, ChevronDown, Code2, Send, ShieldCheck, Webhook, ExternalLink } from 'lucide-react';
import { useAvivarApiTokens } from '@/hooks/useAvivarApiTokens';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export function ApiTokensTab() {
  const { tokens, isLoading, createToken, deleteToken, toggleToken } = useAvivarApiTokens();
  const [showCreate, setShowCreate] = useState(false);
  const [tokenName, setTokenName] = useState('');
  const [newToken, setNewToken] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!tokenName.trim()) return;
    const raw = await createToken.mutateAsync({ name: tokenName.trim(), permissions: ['receive_lead'] });
    setNewToken(raw);
    setTokenName('');
  };

  const copyToken = () => {
    if (newToken) {
      navigator.clipboard.writeText(newToken);
      toast.success('Token copiado!');
    }
  };

  return (
    <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
              <Key className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
              Tokens de API
            </CardTitle>
            <CardDescription>
              Gere tokens para integrar sistemas externos com o CRM
            </CardDescription>
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Token
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[hsl(var(--avivar-muted-foreground))]" />
          </div>
        ) : tokens.length === 0 ? (
          <div className="text-center py-8 text-[hsl(var(--avivar-muted-foreground))]">
            <Key className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum token criado</p>
            <p className="text-xs mt-1">Crie um token para começar a receber leads via API</p>
          </div>
        ) : (
          tokens.map((token) => (
            <div
              key={token.id}
              className="flex items-center justify-between p-4 rounded-xl border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-background))]"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-[hsl(var(--avivar-foreground))]">{token.name}</p>
                  <Badge variant={token.is_active ? 'default' : 'secondary'} className="text-xs">
                    {token.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] font-mono mt-1">
                  {token.token_prefix}••••••••
                </p>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] mt-1">
                  Criado em {format(new Date(token.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  {token.last_used_at && ` · Último uso: ${format(new Date(token.last_used_at), "dd/MM HH:mm", { locale: ptBR })}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={token.is_active}
                  onCheckedChange={(checked) => toggleToken.mutate({ id: token.id, is_active: checked })}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteId(token.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}

        {/* Instruções de uso */}
        <Separator className="bg-[hsl(var(--avivar-border))]" />
        
        {/* Documentação completa de uso */}
        <ApiDocsSection />
      </CardContent>

      {/* Dialog Criar Token */}
      <Dialog open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) { setNewToken(null); setShowToken(false); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Token de API</DialogTitle>
            <DialogDescription>
              O token será exibido apenas uma vez. Copie e guarde em local seguro.
            </DialogDescription>
          </DialogHeader>
          {newToken ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <p className="font-medium">Token criado com sucesso!</p>
              </div>
              <div className="relative">
                <Input
                  readOnly
                  value={showToken ? newToken : '••••••••••••••••••••••••••••••••••••'}
                  className="font-mono pr-20"
                />
                <div className="absolute right-1 top-1 flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setShowToken(!showToken)}>
                    {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={copyToken}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-destructive">⚠️ Este token não será exibido novamente.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do token</Label>
                <Input
                  placeholder="Ex: Integração Landing Page"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
                <Button
                  onClick={handleCreate}
                  disabled={!tokenName.trim() || createToken.isPending}
                  className="bg-[hsl(var(--avivar-primary))] text-white"
                >
                  {createToken.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Gerar Token
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Token</AlertDialogTitle>
            <AlertDialogDescription>
              Sistemas que utilizam este token perderão acesso imediatamente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteId) deleteToken.mutate(deleteId); setDeleteId(null); }}
              className="bg-destructive text-destructive-foreground"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function CodeBlock({ children }: { children: string }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    toast.success('Código copiado!');
  };

  return (
    <div className="relative group">
      <pre className="bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))] rounded-lg p-3 text-xs font-mono text-[hsl(var(--avivar-foreground))] overflow-x-auto whitespace-pre-wrap break-all">
        {children}
      </pre>
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleCopy}
      >
        <Copy className="h-3 w-3" />
      </Button>
    </div>
  );
}

function DocSection({ icon: Icon, title, children, defaultOpen = false }: { icon: React.ElementType; title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-2 group">
        <ChevronDown className={`h-4 w-4 text-[hsl(var(--avivar-muted-foreground))] transition-transform ${open ? '' : '-rotate-90'}`} />
        <Icon className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
        <span className="text-sm font-medium text-[hsl(var(--avivar-foreground))]">{title}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-10 space-y-3 pb-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

function ApiDocsSection() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://seu-projeto.supabase.co';
  const baseUrl = `${supabaseUrl}/functions/v1`;
  const isProduction = window.location.hostname === 'transplant-insight-hub.lovable.app' || (!window.location.hostname.includes('localhost') && !window.location.hostname.includes('preview'));
  const appDomain = isProduction ? window.location.origin : window.location.origin;
  const apiDocsUrl = `${appDomain}/api-docs`;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
          <p className="text-sm font-medium text-[hsl(var(--avivar-foreground))]">Documentação da API</p>
        </div>
        <a href="/api-docs" target="_blank" rel="noopener noreferrer" className="text-xs text-[hsl(var(--avivar-primary))] hover:underline flex items-center gap-1">
          <ExternalLink className="h-3 w-3" />
          Ver documentação completa
        </a>
      </div>

      <div className="bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))] rounded-lg p-3 mb-3">
        <p className="text-xs font-medium text-[hsl(var(--avivar-foreground))] mb-1">🔗 URL Base da API:</p>
        <div className="flex items-center gap-2">
          <code className="text-xs font-mono text-[hsl(var(--avivar-primary))] bg-[hsl(var(--avivar-muted))] px-2 py-1 rounded break-all flex-1">{baseUrl}</code>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 shrink-0"
            onClick={() => { navigator.clipboard.writeText(baseUrl); toast.success('URL copiada!'); }}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <DocSection icon={ShieldCheck} title="Autenticação" defaultOpen>
        <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
          Todas as requisições devem incluir o header <code className="bg-[hsl(var(--avivar-muted))] px-1 rounded">X-API-Key</code> com seu token de API.
        </p>
        <CodeBlock>{`curl -X POST ${baseUrl}/receive-lead \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: avr_seutoken" \\
  -d '{"name": "João", "phone": "11999998888"}'`}</CodeBlock>
        <div className="text-xs text-[hsl(var(--avivar-muted-foreground))] space-y-1">
          <p>• O token começa com o prefixo <code className="bg-[hsl(var(--avivar-muted))] px-1 rounded">avr_</code></p>
          <p>• Tokens inválidos ou inativos retornam <Badge variant="destructive" className="text-[10px] px-1.5 py-0">401</Badge></p>
          <p>• Cada token registra a data do último uso automaticamente</p>
        </div>
      </DocSection>

      <Separator className="bg-[hsl(var(--avivar-border))]" />

      <DocSection icon={Send} title="Endpoint: Receber Lead">
        <div className="flex items-center gap-2 mb-1">
          <Badge className="bg-green-600 text-white text-[10px] px-1.5 py-0">POST</Badge>
          <code className="text-xs font-mono text-[hsl(var(--avivar-foreground))] break-all">{baseUrl}/receive-lead</code>
        </div>
        <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Cria um novo lead no CRM. O lead será inserido automaticamente no funil configurado.</p>

        <p className="text-xs font-medium text-[hsl(var(--avivar-foreground))] mt-2">Campos obrigatórios:</p>
        <div className="border border-[hsl(var(--avivar-border))] rounded-lg overflow-hidden text-xs">
          <table className="w-full">
            <thead>
              <tr className="bg-[hsl(var(--avivar-muted))]">
                <th className="text-left p-2 font-medium text-[hsl(var(--avivar-foreground))]">Campo</th>
                <th className="text-left p-2 font-medium text-[hsl(var(--avivar-foreground))]">Tipo</th>
                <th className="text-left p-2 font-medium text-[hsl(var(--avivar-foreground))]">Descrição</th>
              </tr>
            </thead>
            <tbody className="text-[hsl(var(--avivar-muted-foreground))]">
              <tr className="border-t border-[hsl(var(--avivar-border))]">
                <td className="p-2 font-mono">name</td>
                <td className="p-2">string</td>
                <td className="p-2">Nome do lead (mín. 2 caracteres)</td>
              </tr>
              <tr className="border-t border-[hsl(var(--avivar-border))]">
                <td className="p-2 font-mono">phone</td>
                <td className="p-2">string</td>
                <td className="p-2">Telefone (10-11 dígitos, formato BR)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-xs font-medium text-[hsl(var(--avivar-foreground))] mt-2">Campos opcionais:</p>
        <div className="border border-[hsl(var(--avivar-border))] rounded-lg overflow-hidden text-xs">
          <table className="w-full">
            <thead>
              <tr className="bg-[hsl(var(--avivar-muted))]">
                <th className="text-left p-2 font-medium text-[hsl(var(--avivar-foreground))]">Campo</th>
                <th className="text-left p-2 font-medium text-[hsl(var(--avivar-foreground))]">Tipo</th>
                <th className="text-left p-2 font-medium text-[hsl(var(--avivar-foreground))]">Descrição</th>
              </tr>
            </thead>
            <tbody className="text-[hsl(var(--avivar-muted-foreground))]">
              <tr className="border-t border-[hsl(var(--avivar-border))]"><td className="p-2 font-mono">email</td><td className="p-2">string</td><td className="p-2">E-mail do lead</td></tr>
              <tr className="border-t border-[hsl(var(--avivar-border))]"><td className="p-2 font-mono">city</td><td className="p-2">string</td><td className="p-2">Cidade</td></tr>
              <tr className="border-t border-[hsl(var(--avivar-border))]"><td className="p-2 font-mono">state</td><td className="p-2">string</td><td className="p-2">Estado (UF, 2 caracteres)</td></tr>
              <tr className="border-t border-[hsl(var(--avivar-border))]"><td className="p-2 font-mono">source</td><td className="p-2">string</td><td className="p-2">Origem (ex: "landing_page", "instagram")</td></tr>
              <tr className="border-t border-[hsl(var(--avivar-border))]"><td className="p-2 font-mono">utm_source</td><td className="p-2">string</td><td className="p-2">UTM Source</td></tr>
              <tr className="border-t border-[hsl(var(--avivar-border))]"><td className="p-2 font-mono">utm_medium</td><td className="p-2">string</td><td className="p-2">UTM Medium</td></tr>
              <tr className="border-t border-[hsl(var(--avivar-border))]"><td className="p-2 font-mono">utm_campaign</td><td className="p-2">string</td><td className="p-2">UTM Campaign</td></tr>
              <tr className="border-t border-[hsl(var(--avivar-border))]"><td className="p-2 font-mono">interest_level</td><td className="p-2">string</td><td className="p-2">Nível de interesse (padrão: "warm")</td></tr>
            </tbody>
          </table>
        </div>

        <p className="text-xs font-medium text-[hsl(var(--avivar-foreground))] mt-2">Exemplo completo:</p>
        <CodeBlock>{`curl -X POST ${baseUrl}/receive-lead \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: avr_seutoken" \\
  -d '{
    "name": "Maria Silva",
    "phone": "11987654321",
    "email": "maria@email.com",
    "city": "São Paulo",
    "state": "SP",
    "source": "landing_page",
    "utm_source": "google",
    "utm_medium": "cpc",
    "utm_campaign": "verao2026",
    "interest_level": "hot"
  }'`}</CodeBlock>

        <p className="text-xs font-medium text-[hsl(var(--avivar-foreground))] mt-2">Respostas:</p>
        <div className="space-y-2">
          <div>
            <Badge className="bg-green-600 text-white text-[10px] px-1.5 py-0 mb-1">201 Created</Badge>
            <CodeBlock>{`{ "success": true, "message": "Lead received successfully", "lead_id": "uuid" }`}</CodeBlock>
          </div>
          <div>
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 mb-1">400 Bad Request</Badge>
            <CodeBlock>{`{ "error": "Name and phone are required" }`}</CodeBlock>
          </div>
          <div>
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 mb-1">401 Unauthorized</Badge>
            <CodeBlock>{`{ "error": "Invalid API token" }`}</CodeBlock>
          </div>
          <div>
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 mb-1">429 Too Many Requests</Badge>
            <CodeBlock>{`{ "error": "Rate limit exceeded. Please try again later." }`}</CodeBlock>
          </div>
        </div>
      </DocSection>

      <Separator className="bg-[hsl(var(--avivar-border))]" />

      <DocSection icon={Code2} title="Exemplos de Integração">
        <p className="text-xs font-medium text-[hsl(var(--avivar-foreground))]">JavaScript / Fetch:</p>
        <CodeBlock>{`const response = await fetch("${baseUrl}/receive-lead", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "avr_seutoken"
  },
  body: JSON.stringify({
    name: "João Silva",
    phone: "11999998888",
    source: "meu_site"
  })
});
const data = await response.json();
console.log(data.lead_id);`}</CodeBlock>

        <p className="text-xs font-medium text-[hsl(var(--avivar-foreground))] mt-2">PHP:</p>
        <CodeBlock>{`$ch = curl_init("${baseUrl}/receive-lead");
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    "Content-Type: application/json",
    "X-API-Key: avr_seutoken"
  ],
  CURLOPT_POSTFIELDS => json_encode([
    "name" => "Maria Santos",
    "phone" => "11987654321",
    "source" => "formulario_php"
  ])
]);
$response = curl_exec($ch);
curl_close($ch);`}</CodeBlock>

        <p className="text-xs font-medium text-[hsl(var(--avivar-foreground))] mt-2">Python:</p>
        <CodeBlock>{`import requests

response = requests.post(
    "${baseUrl}/receive-lead",
    headers={
        "Content-Type": "application/json",
        "X-API-Key": "avr_seutoken"
    },
    json={
        "name": "Carlos Souza",
        "phone": "21988887777",
        "source": "script_python"
    }
)
print(response.json())`}</CodeBlock>
      </DocSection>

      <Separator className="bg-[hsl(var(--avivar-border))]" />

      <DocSection icon={Webhook} title="Webhooks (Outbound)">
        <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
          Configure webhooks para receber notificações em tempo real quando eventos ocorrerem no CRM. O sistema enviará um <code className="bg-[hsl(var(--avivar-muted))] px-1 rounded">POST</code> para a URL configurada — funciona como um nó HTTP Request do n8n.
        </p>

        <div className="bg-[hsl(var(--avivar-muted))] rounded-lg p-3 mt-2 text-xs text-[hsl(var(--avivar-foreground))]">
          <p className="font-medium mb-1">💡 Como funciona:</p>
          <ol className="list-decimal list-inside space-y-1 text-[hsl(var(--avivar-muted-foreground))]">
            <li>Um evento ocorre no CRM (ex: lead criado via API ou WhatsApp)</li>
            <li>O sistema verifica quais webhooks estão ativos para esse evento</li>
            <li>Um <code className="bg-[hsl(var(--avivar-background))] px-1 rounded">POST</code> é enviado para cada URL cadastrada com os dados do evento</li>
            <li>Você pode usar para enviar mensagens, atualizar ERPs, notificar equipes, etc.</li>
          </ol>
        </div>

        <p className="text-xs font-medium text-[hsl(var(--avivar-foreground))] mt-3">Eventos disponíveis:</p>
        <div className="border border-[hsl(var(--avivar-border))] rounded-lg overflow-hidden text-xs">
          <table className="w-full">
            <thead>
              <tr className="bg-[hsl(var(--avivar-muted))]">
                <th className="text-left p-2 font-medium text-[hsl(var(--avivar-foreground))]">Evento</th>
                <th className="text-left p-2 font-medium text-[hsl(var(--avivar-foreground))]">Descrição</th>
                <th className="text-left p-2 font-medium text-[hsl(var(--avivar-foreground))]">Disparado quando</th>
              </tr>
            </thead>
            <tbody className="text-[hsl(var(--avivar-muted-foreground))]">
              <tr className="border-t border-[hsl(var(--avivar-border))]"><td className="p-2 font-mono">lead.created</td><td className="p-2">Novo lead criado</td><td className="p-2">Lead chega via API ou WhatsApp</td></tr>
              <tr className="border-t border-[hsl(var(--avivar-border))]"><td className="p-2 font-mono">lead.updated</td><td className="p-2">Lead atualizado</td><td className="p-2">Etapa, dados ou status alterados</td></tr>
              <tr className="border-t border-[hsl(var(--avivar-border))]"><td className="p-2 font-mono">message.received</td><td className="p-2">Mensagem recebida</td><td className="p-2">Lead envia mensagem no WhatsApp</td></tr>
              <tr className="border-t border-[hsl(var(--avivar-border))]"><td className="p-2 font-mono">message.sent</td><td className="p-2">Mensagem enviada</td><td className="p-2">Operador ou IA envia mensagem</td></tr>
              <tr className="border-t border-[hsl(var(--avivar-border))]"><td className="p-2 font-mono">appointment.created</td><td className="p-2">Agendamento criado</td><td className="p-2">Novo agendamento pelo CRM ou IA</td></tr>
              <tr className="border-t border-[hsl(var(--avivar-border))]"><td className="p-2 font-mono">appointment.updated</td><td className="p-2">Agendamento atualizado</td><td className="p-2">Confirmação, cancelamento, etc.</td></tr>
            </tbody>
          </table>
        </div>

        <p className="text-xs font-medium text-[hsl(var(--avivar-foreground))] mt-3">Payload de exemplo (lead.created):</p>
        <CodeBlock>{`{
  "event": "lead.created",
  "timestamp": "2026-02-19T15:30:00Z",
  "data": {
    "lead_id": "uuid-do-lead",
    "lead_code": "L00042",
    "name": "Maria Silva",
    "phone": "11987654321",
    "email": "maria@email.com",
    "city": "São Paulo",
    "state": "SP",
    "source": "landing_page",
    "interest_level": "warm",
    "created_at": "2026-02-19T15:30:00Z",
    "link": "https://seudominio.com/crm/lead/uuid-do-lead"
  }
}`}</CodeBlock>

        <p className="text-xs font-medium text-[hsl(var(--avivar-foreground))] mt-3">Payload de exemplo (message.received):</p>
        <CodeBlock>{`{
  "event": "message.received",
  "timestamp": "2026-02-19T15:35:00Z",
  "data": {
    "conversation_id": "uuid-da-conversa",
    "direction": "inbound",
    "content": "Olá, quero mais informações...",
    "sender_name": "Maria Silva",
    "phone": "11987654321",
    "timestamp": "2026-02-19T15:35:00Z"
  }
}`}</CodeBlock>

        <p className="text-xs font-medium text-[hsl(var(--avivar-foreground))] mt-3">Exemplo prático — Enviar notificação via n8n/Make:</p>
        <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
          Configure a URL do webhook no n8n (nó "Webhook") ou no Make (módulo "Custom Webhook"). O CRM enviará automaticamente os dados no formato acima toda vez que o evento ocorrer.
        </p>
        <CodeBlock>{`# Exemplo com cURL - simulando o que o CRM envia:
curl -X POST https://sua-url-n8n.com/webhook/abc123 \\
  -H "Content-Type: application/json" \\
  -H "X-Webhook-Signature: hmac_sha256_aqui" \\
  -d '{
    "event": "lead.created",
    "timestamp": "2026-02-19T15:30:00Z",
    "data": {
      "lead_id": "uuid",
      "name": "João Silva",
      "phone": "11999998888",
      "link": "https://seudominio.com/crm/lead/uuid"
    }
  }'`}</CodeBlock>

        <p className="text-xs font-medium text-[hsl(var(--avivar-foreground))] mt-3">Segurança (HMAC):</p>
        <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
          Configure um <strong>secret</strong> no webhook para receber o header <code className="bg-[hsl(var(--avivar-muted))] px-1 rounded">X-Webhook-Signature</code> com assinatura HMAC-SHA256:
        </p>
        <CodeBlock>{`// Node.js - Validar assinatura
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}`}</CodeBlock>

        <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] mt-1">
          • Até <strong>3 retentativas</strong> automáticas em caso de falha (status ≥ 400 ou timeout)
        </p>
        <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
          • Timeout de <strong>10 segundos</strong> por requisição
        </p>
        <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
          • Logs de entrega disponíveis na aba <strong>Webhooks</strong> (ícone 👁️)
        </p>
      </DocSection>

      <Separator className="bg-[hsl(var(--avivar-border))]" />

      <div className="text-xs text-[hsl(var(--avivar-muted-foreground))] space-y-1 pt-2">
        <p className="font-medium text-[hsl(var(--avivar-foreground))]">⚡ Limites:</p>
        <p>• Rate limit: <strong>10 requisições/hora</strong> por IP no endpoint de leads</p>
        <p>• Nome: máx. 100 caracteres | Telefone: 10-11 dígitos (BR)</p>
        <p>• Webhooks: timeout de 10s por requisição, 3 retentativas</p>
      </div>
    </div>
  );
}
