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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Key, Plus, Trash2, Copy, Loader2, CheckCircle2, Eye, EyeOff, BookOpen, ChevronDown, Code2, Send, ShieldCheck, Webhook, ExternalLink, AlertTriangle, Zap, TestTube, Globe, FileJson } from 'lucide-react';
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

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://seu-projeto.supabase.co';
  const baseUrl = `${supabaseUrl}/functions/v1`;

  return (
    <div className="space-y-6">
      {/* Quick Start Banner */}
      <Card className="bg-gradient-to-r from-[hsl(var(--avivar-primary)/0.1)] to-[hsl(var(--avivar-accent)/0.05)] border-[hsl(var(--avivar-primary)/0.3)]">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[hsl(var(--avivar-primary)/0.15)]">
              <Zap className="h-6 w-6 text-[hsl(var(--avivar-primary))]" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-semibold text-[hsl(var(--avivar-foreground))]">🚀 Quick Start — Enviar lead via API</h3>
                <p className="text-sm text-[hsl(var(--avivar-muted-foreground))] mt-1">
                  Integre seu site, landing page ou sistema externo em 3 passos simples.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-[hsl(var(--avivar-card))] border border-[hsl(var(--avivar-border))]">
                  <span className="font-bold text-[hsl(var(--avivar-primary))] text-lg">1</span>
                  <div>
                    <p className="text-xs font-medium text-[hsl(var(--avivar-foreground))]">Crie um Token</p>
                    <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Clique em "Novo Token" abaixo</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-[hsl(var(--avivar-card))] border border-[hsl(var(--avivar-border))]">
                  <span className="font-bold text-[hsl(var(--avivar-primary))] text-lg">2</span>
                  <div>
                    <p className="text-xs font-medium text-[hsl(var(--avivar-foreground))]">Envie um POST</p>
                    <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Use o header X-API-Key</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-[hsl(var(--avivar-card))] border border-[hsl(var(--avivar-border))]">
                  <span className="font-bold text-[hsl(var(--avivar-primary))] text-lg">3</span>
                  <div>
                    <p className="text-xs font-medium text-[hsl(var(--avivar-foreground))]">Lead no CRM ✓</p>
                    <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">Aparece automaticamente no funil</p>
                  </div>
                </div>
              </div>

              <div className="bg-[hsl(var(--avivar-card))] border border-[hsl(var(--avivar-border))] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-green-600 text-white text-[10px] px-2 py-0.5">POST</Badge>
                  <code className="text-xs font-mono text-[hsl(var(--avivar-foreground))] break-all">{baseUrl}/receive-lead</code>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 shrink-0"
                    onClick={() => { navigator.clipboard.writeText(`${baseUrl}/receive-lead`); toast.success('URL copiada!'); }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <p className="text-[11px] text-amber-600 dark:text-amber-400">
                    <strong>Somente método POST.</strong> Requisições GET, PUT ou DELETE retornam erro <code className="bg-[hsl(var(--avivar-muted))] px-1 rounded">405 Method Not Allowed</code>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Token Management */}
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
        <CardContent className="space-y-3">
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
        </CardContent>
      </Card>

      {/* API Documentation */}
      <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
              Documentação da API
            </CardTitle>
            <a href="/api-docs" target="_blank" rel="noopener noreferrer" className="text-xs text-[hsl(var(--avivar-primary))] hover:underline flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              Ver documentação completa
            </a>
          </div>
          <CardDescription>
            Referência completa dos endpoints, exemplos e webhooks
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Base URL */}
          <div className="bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))] rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="h-3.5 w-3.5 text-[hsl(var(--avivar-primary))]" />
              <p className="text-xs font-medium text-[hsl(var(--avivar-foreground))]">URL Base da API</p>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono text-[hsl(var(--avivar-primary))] bg-[hsl(var(--avivar-muted))] px-2 py-1.5 rounded break-all flex-1">{baseUrl}</code>
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

          <Tabs defaultValue="postman" className="w-full">
            <TabsList className="w-full grid grid-cols-5 h-auto">
              <TabsTrigger value="postman" className="text-xs py-2 gap-1"><TestTube className="h-3 w-3" />Postman</TabsTrigger>
              <TabsTrigger value="endpoint" className="text-xs py-2 gap-1"><Send className="h-3 w-3" />Endpoint</TabsTrigger>
              <TabsTrigger value="examples" className="text-xs py-2 gap-1"><Code2 className="h-3 w-3" />Exemplos</TabsTrigger>
              <TabsTrigger value="webhooks" className="text-xs py-2 gap-1"><Webhook className="h-3 w-3" />Webhooks</TabsTrigger>
              <TabsTrigger value="auth" className="text-xs py-2 gap-1"><ShieldCheck className="h-3 w-3" />Auth</TabsTrigger>
            </TabsList>

            {/* Postman Tab */}
            <TabsContent value="postman" className="space-y-4 mt-4">
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
                  <TestTube className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
                  Como testar no Postman (passo a passo)
                </h4>

                <div className="space-y-3">
                  {[
                    { step: 1, title: 'Crie uma nova Request', desc: 'Clique em "New" → "HTTP Request"' },
                    { step: 2, title: 'Configure o método', desc: 'Selecione POST (não GET!) na dropdown ao lado da URL' },
                    { step: 3, title: 'Cole a URL', desc: `${baseUrl}/receive-lead` },
                    { step: 4, title: 'Aba Headers — adicione 2 headers', desc: 'Content-Type: application/json\nX-API-Key: avr_seutoken' },
                    { step: 5, title: 'Aba Body → raw → JSON', desc: 'Cole o JSON de exemplo abaixo' },
                    { step: 6, title: 'Clique Send', desc: 'Deve retornar status 201 com o lead_id' },
                  ].map(({ step, title, desc }) => (
                    <div key={step} className="flex gap-3 p-3 rounded-lg border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-background))]">
                      <div className="flex items-center justify-center h-7 w-7 rounded-full bg-[hsl(var(--avivar-primary))] text-white text-xs font-bold shrink-0">
                        {step}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[hsl(var(--avivar-foreground))]">{title}</p>
                        <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] whitespace-pre-line">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Erros comuns
                  </p>
                  <ul className="text-xs text-red-600/80 dark:text-red-400/80 mt-1 space-y-1 list-disc list-inside">
                    <li><strong>405 Method Not Allowed</strong> — Você usou GET em vez de POST. Troque o método.</li>
                    <li><strong>401 Unauthorized</strong> — Token inválido, inativo ou expirado. Verifique o header X-API-Key.</li>
                    <li><strong>400 Bad Request</strong> — Campos "name" e "phone" são obrigatórios. Verifique o body JSON.</li>
                    <li><strong>429 Too Many Requests</strong> — Rate limit atingido (máx. 10 req/hora por IP).</li>
                  </ul>
                </div>

                <p className="text-xs font-medium text-[hsl(var(--avivar-foreground))]">Body JSON para teste:</p>
                <CodeBlock>{`{
  "name": "Teste Postman",
  "phone": "11999998888",
  "email": "teste@email.com",
  "city": "São Paulo",
  "state": "SP",
  "source": "postman_test"
}`}</CodeBlock>

                <p className="text-xs font-medium text-[hsl(var(--avivar-foreground))]">Resposta esperada (201):</p>
                <CodeBlock>{`{
  "success": true,
  "message": "Lead received successfully",
  "lead_id": "uuid-do-lead-criado"
}`}</CodeBlock>
              </div>
            </TabsContent>

            {/* Endpoint Tab */}
            <TabsContent value="endpoint" className="space-y-4 mt-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))]">
                <Badge className="bg-green-600 text-white text-[10px] px-2 py-0.5">POST</Badge>
                <code className="text-sm font-mono text-[hsl(var(--avivar-foreground))] break-all">{baseUrl}/receive-lead</code>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0 ml-auto"
                  onClick={() => { navigator.clipboard.writeText(`${baseUrl}/receive-lead`); toast.success('URL copiada!'); }}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>

              <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                Cria um novo lead no CRM. O lead recebe um código único (ex: L00042) e é inserido automaticamente no funil configurado.
              </p>

              <div>
                <p className="text-xs font-semibold text-[hsl(var(--avivar-foreground))] mb-2 flex items-center gap-1">
                  <FileJson className="h-3.5 w-3.5 text-[hsl(var(--avivar-primary))]" />
                  Headers obrigatórios
                </p>
                <div className="border border-[hsl(var(--avivar-border))] rounded-lg overflow-hidden text-xs">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[hsl(var(--avivar-muted))]">
                        <th className="text-left p-2 font-medium text-[hsl(var(--avivar-foreground))]">Header</th>
                        <th className="text-left p-2 font-medium text-[hsl(var(--avivar-foreground))]">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="text-[hsl(var(--avivar-muted-foreground))]">
                      <tr className="border-t border-[hsl(var(--avivar-border))]">
                        <td className="p-2 font-mono">Content-Type</td>
                        <td className="p-2">application/json</td>
                      </tr>
                      <tr className="border-t border-[hsl(var(--avivar-border))]">
                        <td className="p-2 font-mono">X-API-Key</td>
                        <td className="p-2">avr_seutoken (opcional, mas necessário para webhooks)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-[hsl(var(--avivar-foreground))] mb-2">Campos obrigatórios (Body JSON)</p>
                <FieldTable fields={[
                  { name: 'name', type: 'string', desc: 'Nome do lead (mín. 2 caracteres, máx. 100)' },
                  { name: 'phone', type: 'string', desc: 'Telefone (10-11 dígitos, formato BR)' },
                ]} />
              </div>

              <div>
                <p className="text-xs font-semibold text-[hsl(var(--avivar-foreground))] mb-2">Campos opcionais</p>
                <FieldTable fields={[
                  { name: 'email', type: 'string', desc: 'E-mail do lead' },
                  { name: 'city', type: 'string', desc: 'Cidade (máx. 100 caracteres)' },
                  { name: 'state', type: 'string', desc: 'Estado — UF com 2 caracteres (ex: SP, RJ)' },
                  { name: 'source', type: 'string', desc: 'Origem (padrão: "landing_page")' },
                  { name: 'utm_source', type: 'string', desc: 'UTM Source (rastreamento)' },
                  { name: 'utm_medium', type: 'string', desc: 'UTM Medium (rastreamento)' },
                  { name: 'utm_campaign', type: 'string', desc: 'UTM Campaign (rastreamento)' },
                  { name: 'interest_level', type: 'string', desc: 'Nível de interesse (padrão: "warm"). Opções: cold, warm, hot' },
                ]} />
              </div>

              <div>
                <p className="text-xs font-semibold text-[hsl(var(--avivar-foreground))] mb-2">Respostas</p>
                <div className="space-y-2">
                  <ResponseExample status="201" label="Created" color="green"
                    body='{ "success": true, "message": "Lead received successfully", "lead_id": "uuid" }' />
                  <ResponseExample status="400" label="Bad Request" color="red"
                    body='{ "error": "Name and phone are required" }' />
                  <ResponseExample status="401" label="Unauthorized" color="red"
                    body='{ "error": "Invalid API token" }' />
                  <ResponseExample status="405" label="Method Not Allowed" color="red"
                    body='{ "error": "Method not allowed" } — Use POST, não GET!' />
                  <ResponseExample status="429" label="Too Many Requests" color="red"
                    body='{ "error": "Rate limit exceeded. Please try again later." }' />
                </div>
              </div>
            </TabsContent>

            {/* Examples Tab */}
            <TabsContent value="examples" className="space-y-4 mt-4">
              <h4 className="text-sm font-semibold text-[hsl(var(--avivar-foreground))]">Exemplos de integração</h4>

              <div>
                <p className="text-xs font-medium text-[hsl(var(--avivar-foreground))] mb-1">cURL (Terminal / Scripts):</p>
                <CodeBlock>{`curl -X POST ${baseUrl}/receive-lead \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: avr_seutoken" \\
  -d '{
    "name": "Maria Silva",
    "phone": "11987654321",
    "email": "maria@email.com",
    "city": "São Paulo",
    "state": "SP",
    "source": "landing_page"
  }'`}</CodeBlock>
              </div>

              <Separator className="bg-[hsl(var(--avivar-border))]" />

              <div>
                <p className="text-xs font-medium text-[hsl(var(--avivar-foreground))] mb-1">JavaScript / Fetch (Sites e Landing Pages):</p>
                <CodeBlock>{`const response = await fetch("${baseUrl}/receive-lead", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "avr_seutoken"
  },
  body: JSON.stringify({
    name: "João Silva",
    phone: "11999998888",
    email: "joao@email.com",
    source: "meu_site"
  })
});

const data = await response.json();

if (data.success) {
  console.log("Lead criado:", data.lead_id);
  // Redirecionar para página de agradecimento
  window.location.href = "/obrigado";
} else {
  console.error("Erro:", data.error);
}`}</CodeBlock>
              </div>

              <Separator className="bg-[hsl(var(--avivar-border))]" />

              <div>
                <p className="text-xs font-medium text-[hsl(var(--avivar-foreground))] mb-1">PHP (Formulários WordPress, etc.):</p>
                <CodeBlock>{`<?php
$ch = curl_init("${baseUrl}/receive-lead");
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    "Content-Type: application/json",
    "X-API-Key: avr_seutoken"
  ],
  CURLOPT_POSTFIELDS => json_encode([
    "name" => $_POST["nome"],
    "phone" => $_POST["telefone"],
    "email" => $_POST["email"],
    "source" => "formulario_wordpress"
  ])
]);

$response = json_decode(curl_exec($ch), true);
curl_close($ch);

if ($response["success"]) {
  echo "Lead criado com sucesso!";
}
?>`}</CodeBlock>
              </div>

              <Separator className="bg-[hsl(var(--avivar-border))]" />

              <div>
                <p className="text-xs font-medium text-[hsl(var(--avivar-foreground))] mb-1">Python (Scripts de automação):</p>
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
        "email": "carlos@empresa.com",
        "source": "script_python",
        "interest_level": "hot"
    }
)

data = response.json()
if data.get("success"):
    print(f"Lead criado: {data['lead_id']}")
else:
    print(f"Erro: {data.get('error')}")`}</CodeBlock>
              </div>

              <Separator className="bg-[hsl(var(--avivar-border))]" />

              <div>
                <p className="text-xs font-medium text-[hsl(var(--avivar-foreground))] mb-1">n8n / Make — HTTP Request Node:</p>
                <div className="bg-[hsl(var(--avivar-muted))] rounded-lg p-3 text-xs text-[hsl(var(--avivar-muted-foreground))] space-y-1">
                  <p><strong>Método:</strong> POST</p>
                  <p><strong>URL:</strong> <code className="bg-[hsl(var(--avivar-background))] px-1 rounded">{baseUrl}/receive-lead</code></p>
                  <p><strong>Headers:</strong></p>
                  <p className="pl-4">Content-Type: <code className="bg-[hsl(var(--avivar-background))] px-1 rounded">application/json</code></p>
                  <p className="pl-4">X-API-Key: <code className="bg-[hsl(var(--avivar-background))] px-1 rounded">avr_seutoken</code></p>
                  <p><strong>Body (JSON):</strong> Mapeie os campos do seu formulário para name, phone, email, etc.</p>
                </div>
              </div>
            </TabsContent>

            {/* Webhooks Tab */}
            <TabsContent value="webhooks" className="space-y-4 mt-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-[hsl(var(--avivar-primary)/0.1)] border border-[hsl(var(--avivar-primary)/0.2)]">
                <Webhook className="h-5 w-5 text-[hsl(var(--avivar-primary))] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-[hsl(var(--avivar-foreground))]">Webhooks — Receba dados em tempo real</p>
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] mt-1">
                    Configure URLs para receber um <strong>POST automático</strong> sempre que um evento acontecer no CRM.
                    Funciona como um nó HTTP Request do n8n — você cadastra a URL, escolhe os eventos e o sistema envia os dados.
                  </p>
                </div>
              </div>

              <div className="bg-[hsl(var(--avivar-muted))] rounded-lg p-3 text-xs">
                <p className="font-medium text-[hsl(var(--avivar-foreground))] mb-2">💡 Como funciona:</p>
                <ol className="list-decimal list-inside space-y-1 text-[hsl(var(--avivar-muted-foreground))]">
                  <li>Cadastre um webhook na aba <strong>Webhooks</strong> com a URL de destino</li>
                  <li>Escolha quais eventos devem disparar (ex: lead.created, message.received)</li>
                  <li>Opcionalmente defina um <strong>secret</strong> para validação HMAC</li>
                  <li>Quando o evento ocorrer, o CRM envia um POST com os dados para sua URL</li>
                  <li>O sistema faz até <strong>3 retentativas</strong> automáticas em caso de falha</li>
                </ol>
              </div>

              <div>
                <p className="text-xs font-semibold text-[hsl(var(--avivar-foreground))] mb-2">Eventos disponíveis</p>
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
                      <tr className="border-t border-[hsl(var(--avivar-border))]"><td className="p-2 font-mono">lead.created</td><td className="p-2">Novo lead</td><td className="p-2">Lead chega via API ou WhatsApp</td></tr>
                      <tr className="border-t border-[hsl(var(--avivar-border))]"><td className="p-2 font-mono">lead.updated</td><td className="p-2">Lead atualizado</td><td className="p-2">Dados, etapa ou status alterados</td></tr>
                      <tr className="border-t border-[hsl(var(--avivar-border))]"><td className="p-2 font-mono">message.received</td><td className="p-2">Mensagem recebida</td><td className="p-2">Lead envia mensagem no WhatsApp</td></tr>
                      <tr className="border-t border-[hsl(var(--avivar-border))]"><td className="p-2 font-mono">message.sent</td><td className="p-2">Mensagem enviada</td><td className="p-2">Operador ou IA envia mensagem</td></tr>
                      <tr className="border-t border-[hsl(var(--avivar-border))]"><td className="p-2 font-mono">appointment.created</td><td className="p-2">Agendamento criado</td><td className="p-2">Novo agendamento no CRM ou IA</td></tr>
                      <tr className="border-t border-[hsl(var(--avivar-border))]"><td className="p-2 font-mono">appointment.updated</td><td className="p-2">Agendamento atualizado</td><td className="p-2">Confirmação, cancelamento, etc.</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-[hsl(var(--avivar-foreground))] mb-2">Payload de exemplo — lead.created:</p>
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
    "link": "https://seudominio.com/crm/lead/uuid"
  }
}`}</CodeBlock>
              </div>

              <div>
                <p className="text-xs font-semibold text-[hsl(var(--avivar-foreground))] mb-2">Payload de exemplo — message.received:</p>
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
              </div>

              <div>
                <p className="text-xs font-semibold text-[hsl(var(--avivar-foreground))] mb-2">Segurança — Validação HMAC:</p>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] mb-2">
                  Se você configurar um <code className="bg-[hsl(var(--avivar-muted))] px-1 rounded">secret</code> no webhook, o header <code className="bg-[hsl(var(--avivar-muted))] px-1 rounded">X-Webhook-Signature</code> será enviado com a assinatura HMAC-SHA256.
                </p>
                <CodeBlock>{`// Node.js — Validar assinatura do webhook
const crypto = require('crypto');

function verifyWebhookSignature(body, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// No seu endpoint:
const isValid = verifyWebhookSignature(
  JSON.stringify(req.body),
  req.headers['x-webhook-signature'],
  'seu_secret_aqui'
);`}</CodeBlock>
              </div>

              <div className="text-xs text-[hsl(var(--avivar-muted-foreground))] space-y-1 p-3 rounded-lg bg-[hsl(var(--avivar-muted))]">
                <p className="font-medium text-[hsl(var(--avivar-foreground))]">⚡ Limites de webhooks:</p>
                <p>• Timeout: <strong>10 segundos</strong> por requisição</p>
                <p>• Retentativas: até <strong>3 tentativas</strong> com backoff exponencial</p>
                <p>• Logs de entrega visíveis na aba <strong>Webhooks</strong></p>
              </div>
            </TabsContent>

            {/* Auth Tab */}
            <TabsContent value="auth" className="space-y-4 mt-4">
              <h4 className="text-sm font-semibold text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
                Autenticação via API Token
              </h4>

              <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                Envie seu token no header <code className="bg-[hsl(var(--avivar-muted))] px-1 rounded font-mono">X-API-Key</code> em cada requisição.
                O token é validado via SHA-256 hash e verificado contra os tokens ativos da sua conta.
              </p>

              <CodeBlock>{`# Header de autenticação
X-API-Key: avr_seutoken_aqui`}</CodeBlock>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-[hsl(var(--avivar-foreground))]">Comportamento:</p>
                <div className="text-xs text-[hsl(var(--avivar-muted-foreground))] space-y-2">
                  <div className="flex items-start gap-2 p-2 rounded bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))]">
                    <Badge className="bg-green-600 text-white text-[10px] shrink-0 mt-0.5">Com token</Badge>
                    <p>Lead é criado <strong>E</strong> webhooks configurados são disparados automaticamente. O uso do token é registrado.</p>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))]">
                    <Badge variant="secondary" className="text-[10px] shrink-0 mt-0.5">Sem token</Badge>
                    <p>Lead é criado normalmente, mas <strong>webhooks não são disparados</strong> (sem vínculo de conta).</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-[hsl(var(--avivar-foreground))]">Detalhes do token:</p>
                <ul className="text-xs text-[hsl(var(--avivar-muted-foreground))] space-y-1 list-disc list-inside">
                  <li>Prefixo: <code className="bg-[hsl(var(--avivar-muted))] px-1 rounded font-mono">avr_</code> seguido de 32 caracteres</li>
                  <li>Exibido apenas no momento da criação — copie e guarde em local seguro</li>
                  <li>Pode ser desativado/reativado sem excluir</li>
                  <li>Data do último uso registrada automaticamente</li>
                  <li>Tokens inativos ou inválidos retornam <code className="bg-[hsl(var(--avivar-muted))] px-1 rounded">401</code></li>
                </ul>
              </div>

              <div className="text-xs text-[hsl(var(--avivar-muted-foreground))] space-y-1 p-3 rounded-lg bg-[hsl(var(--avivar-muted))]">
                <p className="font-medium text-[hsl(var(--avivar-foreground))]">⚡ Limites gerais:</p>
                <p>• Rate limit: <strong>10 requisições/hora</strong> por IP</p>
                <p>• Nome: máx. 100 caracteres | Telefone: 10-11 dígitos (BR)</p>
                <p>• E-mail: máx. 255 caracteres | Estado: 2 caracteres (UF)</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

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
    </div>
  );
}

/* ── Helper Components ── */

function CodeBlock({ children }: { children: string }) {
  return (
    <div className="relative group">
      <pre className="bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))] rounded-lg p-3 text-xs font-mono text-[hsl(var(--avivar-foreground))] overflow-x-auto whitespace-pre-wrap break-all">
        {children}
      </pre>
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => { navigator.clipboard.writeText(children); toast.success('Código copiado!'); }}
      >
        <Copy className="h-3 w-3" />
      </Button>
    </div>
  );
}

function FieldTable({ fields }: { fields: { name: string; type: string; desc: string }[] }) {
  return (
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
          {fields.map((f) => (
            <tr key={f.name} className="border-t border-[hsl(var(--avivar-border))]">
              <td className="p-2 font-mono">{f.name}</td>
              <td className="p-2">{f.type}</td>
              <td className="p-2">{f.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResponseExample({ status, label, color, body }: { status: string; label: string; color: string; body: string }) {
  return (
    <div>
      <Badge className={`${color === 'green' ? 'bg-green-600' : 'bg-red-600'} text-white text-[10px] px-1.5 py-0 mb-1`}>
        {status} {label}
      </Badge>
      <CodeBlock>{body}</CodeBlock>
    </div>
  );
}
