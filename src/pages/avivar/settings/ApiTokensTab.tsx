import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Key, Plus, Trash2, Copy, Loader2, CheckCircle2, Eye, EyeOff, BookOpen, ChevronDown, ChevronRight, Code2, Send, ShieldCheck, Webhook, ExternalLink, AlertTriangle, Zap, TestTube, Globe, FileJson, GitBranch, ScrollText, XCircle, RefreshCw } from 'lucide-react';
import { useAvivarApiTokens } from '@/hooks/useAvivarApiTokens';
import { useAvivarAccount } from '@/hooks/useAvivarAccount';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

interface KanbanOption { id: string; name: string; }
interface ColumnOption { id: string; name: string; kanban_id: string; }

export function ApiTokensTab() {
  const { tokens, isLoading, createToken, deleteToken, toggleToken } = useAvivarApiTokens();
  const { accountId, isSuperAdmin } = useAvivarAccount();
  const [showCreate, setShowCreate] = useState(false);
  const [tokenName, setTokenName] = useState('');
  const [targetKanbanId, setTargetKanbanId] = useState('');
  const [targetColumnId, setTargetColumnId] = useState('');
  const [newToken, setNewToken] = useState<string | null>(null);
  const [newWebhookSlug, setNewWebhookSlug] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [tokensOpen, setTokensOpen] = useState(true);
  const [docsOpen, setDocsOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);

  // Fetch kanbans
  const { data: kanbans = [] } = useQuery({
    queryKey: ['avivar-kanbans-list', accountId, isSuperAdmin],
    queryFn: async () => {
      let query = supabase
        .from('avivar_kanbans')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      if (!isSuperAdmin && accountId) {
        query = query.eq('account_id', accountId);
      }
      const { data } = await query;
      return (data || []) as KanbanOption[];
    },
    enabled: !!accountId || isSuperAdmin,
  });

  // Fetch columns for selected kanban
  const { data: columns = [] } = useQuery({
    queryKey: ['avivar-columns-list', targetKanbanId],
    queryFn: async () => {
      if (!targetKanbanId) return [];
      const { data } = await supabase
        .from('avivar_kanban_columns')
        .select('id, name, kanban_id')
        .eq('kanban_id', targetKanbanId)
        .order('order_index');
      return (data || []) as ColumnOption[];
    },
    enabled: !!targetKanbanId,
  });

  // Fetch webhook request logs
  const { data: requestLogs = [], isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['avivar-webhook-request-logs', accountId],
    queryFn: async () => {
      if (!accountId) return [];
      const { data } = await supabase
        .from('avivar_webhook_request_logs')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!accountId && logsOpen,
  });

  useEffect(() => { setTargetColumnId(''); }, [targetKanbanId]);

  const handleCreate = async () => {
    if (!tokenName.trim()) return;
    const result = await createToken.mutateAsync({
      name: tokenName.trim(),
      permissions: ['receive_lead'],
      target_kanban_id: targetKanbanId || undefined,
      target_column_id: targetColumnId || undefined,
    });
    setNewToken(result.rawToken);
    setNewWebhookSlug(result.webhookSlug);
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
    <div className="space-y-4">
      {/* ── Tokens de API (Collapsible) ── */}
      <Collapsible open={tokensOpen} onOpenChange={setTokensOpen}>
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-[hsl(var(--avivar-muted)/0.3)] transition-colors rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {tokensOpen ? <ChevronDown className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" /> : <ChevronRight className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />}
                  <Key className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
                  <div>
                    <CardTitle className="text-[hsl(var(--avivar-foreground))]">Tokens de API</CardTitle>
                    <CardDescription>Gere tokens para integrar sistemas externos com o CRM</CardDescription>
                  </div>
                </div>
                <Button
                  onClick={(e) => { e.stopPropagation(); setShowCreate(true); }}
                  className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Token
                </Button>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
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
                tokens.map((token) => {
                  const kanban = kanbans.find(k => k.id === token.target_kanban_id);
                  const webhookUrl = `${baseUrl}/receive-lead/${token.webhook_slug}`;
                  return (
                    <div key={token.id} className="p-4 rounded-xl border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-background))] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-[hsl(var(--avivar-foreground))]">{token.name}</p>
                          <Badge variant={token.is_active ? 'default' : 'secondary'} className="text-xs">
                            {token.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                          {kanban && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <GitBranch className="h-3 w-3" />
                              {kanban.name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={token.is_active}
                            onCheckedChange={(checked) => toggleToken.mutate({ id: token.id, is_active: checked })}
                          />
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(token.id)} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-[hsl(var(--avivar-muted))] rounded-lg p-2">
                        <Webhook className="h-3.5 w-3.5 text-[hsl(var(--avivar-primary))] shrink-0" />
                        <code className="text-xs font-mono text-[hsl(var(--avivar-foreground))] break-all flex-1">{webhookUrl}</code>
                        <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success('URL do webhook copiada!'); }}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                        Criado em {format(new Date(token.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        {token.last_used_at && ` · Último uso: ${format(new Date(token.last_used_at), "dd/MM HH:mm", { locale: ptBR })}`}
                      </p>
                    </div>
                  );
                })
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ── Log de Requisições (Collapsible) ── */}
      <Collapsible open={logsOpen} onOpenChange={setLogsOpen}>
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-[hsl(var(--avivar-muted)/0.3)] transition-colors rounded-t-lg">
              <div className="flex items-center gap-2">
                {logsOpen ? <ChevronDown className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" /> : <ChevronRight className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />}
                <ScrollText className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
                <div>
                  <CardTitle className="text-[hsl(var(--avivar-foreground))]">Log de Requisições</CardTitle>
                  <CardDescription>Veja as últimas requisições recebidas pelo webhook</CardDescription>
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-3">
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => refetchLogs()} disabled={logsLoading}>
                  <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${logsLoading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </div>
              {logsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-[hsl(var(--avivar-muted-foreground))]" />
                </div>
              ) : requestLogs.length === 0 ? (
                <div className="text-center py-8 text-[hsl(var(--avivar-muted-foreground))]">
                  <ScrollText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma requisição registrada</p>
                  <p className="text-xs mt-1">As requisições aparecerão aqui quando o webhook for chamado</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {requestLogs.map((log: any) => (
                    <RequestLogEntry key={log.id} log={log} />
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ── Documentação da API (Collapsible) ── */}
      <Collapsible open={docsOpen} onOpenChange={setDocsOpen}>
        <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-[hsl(var(--avivar-muted)/0.3)] transition-colors rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {docsOpen ? <ChevronDown className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" /> : <ChevronRight className="h-4 w-4 text-[hsl(var(--avivar-muted-foreground))]" />}
                  <BookOpen className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
                  <div>
                    <CardTitle className="text-[hsl(var(--avivar-foreground))]">Documentação da API</CardTitle>
                    <CardDescription>Referência completa dos endpoints, exemplos e webhooks</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {/* Base URL */}
              <div className="bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))] rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="h-3.5 w-3.5 text-[hsl(var(--avivar-primary))]" />
                  <p className="text-xs font-medium text-[hsl(var(--avivar-foreground))]">URL Base da API</p>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono text-[hsl(var(--avivar-primary))] bg-[hsl(var(--avivar-muted))] px-2 py-1.5 rounded break-all flex-1">{baseUrl}</code>
                  <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => { navigator.clipboard.writeText(baseUrl); toast.success('URL copiada!'); }}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="endpoint" className="w-full">
                <TabsList className="w-full grid grid-cols-5 h-auto">
                  <TabsTrigger value="endpoint" className="text-xs py-2 gap-1"><Send className="h-3 w-3" />Endpoint</TabsTrigger>
                  <TabsTrigger value="postman" className="text-xs py-2 gap-1"><TestTube className="h-3 w-3" />Postman</TabsTrigger>
                  <TabsTrigger value="examples" className="text-xs py-2 gap-1"><Code2 className="h-3 w-3" />Exemplos</TabsTrigger>
                  <TabsTrigger value="webhooks" className="text-xs py-2 gap-1"><Webhook className="h-3 w-3" />Webhooks</TabsTrigger>
                  <TabsTrigger value="auth" className="text-xs py-2 gap-1"><ShieldCheck className="h-3 w-3" />Auth</TabsTrigger>
                </TabsList>

                {/* Endpoint Tab */}
                <TabsContent value="endpoint" className="space-y-4 mt-4">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))]">
                    <Badge className="bg-green-600 text-white text-[10px] px-2 py-0.5">POST</Badge>
                    <code className="text-sm font-mono text-[hsl(var(--avivar-foreground))] break-all">{baseUrl}/receive-lead</code>
                    <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 ml-auto" onClick={() => { navigator.clipboard.writeText(`${baseUrl}/receive-lead`); toast.success('URL copiada!'); }}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>

                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                    Cria um novo lead ou atualiza existente (deduplicação por telefone/email). O lead recebe um código único (ex: L00042).
                  </p>

                  <div>
                    <p className="text-xs font-semibold text-[hsl(var(--avivar-foreground))] mb-2">Campos obrigatórios</p>
                    <FieldTable fields={[
                      { name: 'name / nome', type: 'string', desc: 'Nome completo (mín. 2 caracteres)' },
                      { name: 'phone / whatsapp', type: 'string', desc: 'Telefone/WhatsApp (10-13 dígitos)' },
                    ]} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-[hsl(var(--avivar-foreground))] mb-2">Campos opcionais</p>
                    <FieldTable fields={[
                      { name: 'email / e-mail', type: 'string', desc: 'E-mail do lead' },
                      { name: 'procedure / procedimento', type: 'string', desc: 'Procedimento de interesse' },
                      { name: 'city / cidade', type: 'string', desc: 'Cidade' },
                      { name: 'state / estado / uf', type: 'string', desc: 'UF (2 caracteres)' },
                      { name: 'source / origem', type: 'string', desc: 'Origem (padrão: "landing_page")' },
                      { name: 'utm_source', type: 'string', desc: 'UTM Source' },
                      { name: 'utm_medium', type: 'string', desc: 'UTM Medium' },
                      { name: 'utm_campaign', type: 'string', desc: 'UTM Campaign' },
                      { name: 'interest_level', type: 'string', desc: 'cold, warm, hot (padrão: warm)' },
                    ]} />
                  </div>

                  <div className="p-3 rounded-lg bg-[hsl(var(--avivar-primary)/0.1)] border border-[hsl(var(--avivar-primary)/0.2)]">
                    <p className="text-xs font-semibold text-[hsl(var(--avivar-foreground))] flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5 text-[hsl(var(--avivar-primary))]" />
                      Deduplicação automática
                    </p>
                    <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] mt-1">
                      Se um lead com o mesmo telefone ou email já existir, os dados serão atualizados ao invés de criar duplicata. 
                      A resposta indicará <code className="bg-[hsl(var(--avivar-muted))] px-1 rounded">"action": "updated"</code>.
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-[hsl(var(--avivar-foreground))] mb-2">Respostas</p>
                    <div className="space-y-2">
                      <ResponseExample status="201" label="Created" color="green" body='{ "success": true, "message": "Lead received successfully", "lead_id": "uuid", "action": "created" }' />
                      <ResponseExample status="200" label="Updated" color="green" body='{ "success": true, "message": "Lead updated (deduplicated)", "lead_id": "uuid", "action": "updated" }' />
                      <ResponseExample status="400" label="Bad Request" color="red" body='{ "error": "Name and phone are required" }' />
                      <ResponseExample status="401" label="Unauthorized" color="red" body='{ "error": "Invalid API token" }' />
                    </div>
                  </div>
                </TabsContent>

                {/* Postman Tab */}
                <TabsContent value="postman" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
                      <TestTube className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
                      Como testar no Postman
                    </h4>
                    <div className="space-y-3">
                      {[
                        { step: 1, title: 'Crie uma nova Request', desc: 'Clique em "New" → "HTTP Request"' },
                        { step: 2, title: 'Configure o método', desc: 'Selecione POST na dropdown ao lado da URL' },
                        { step: 3, title: 'Cole a URL', desc: `${baseUrl}/receive-lead/SEU_SLUG` },
                        { step: 4, title: 'Aba Body → raw → JSON', desc: 'Cole o JSON de exemplo abaixo' },
                        { step: 5, title: 'Clique Send', desc: 'Deve retornar status 201 com o lead_id' },
                      ].map(({ step, title, desc }) => (
                        <div key={step} className="flex gap-3 p-3 rounded-lg border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-background))]">
                          <div className="flex items-center justify-center h-7 w-7 rounded-full bg-[hsl(var(--avivar-primary))] text-white text-xs font-bold shrink-0">{step}</div>
                          <div>
                            <p className="text-sm font-medium text-[hsl(var(--avivar-foreground))]">{title}</p>
                            <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] whitespace-pre-line">{desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <p className="text-xs font-medium text-[hsl(var(--avivar-foreground))]">Body JSON para teste:</p>
                    <CodeBlock>{`{
  "name": "Teste Postman",
  "phone": "11999998888",
  "email": "teste@email.com",
  "procedimento": "Transplante Capilar",
  "city": "São Paulo",
  "state": "SP"
}`}</CodeBlock>
                  </div>
                </TabsContent>

                {/* Examples Tab */}
                <TabsContent value="examples" className="space-y-4 mt-4">
                  <h4 className="text-sm font-semibold text-[hsl(var(--avivar-foreground))]">Exemplos de integração</h4>

                  <div>
                    <p className="text-xs font-medium text-[hsl(var(--avivar-foreground))] mb-1">cURL:</p>
                    <CodeBlock>{`curl -X POST ${baseUrl}/receive-lead/SEU_SLUG \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Maria Silva",
    "phone": "11987654321",
    "email": "maria@email.com",
    "procedimento": "Transplante Capilar",
    "city": "São Paulo",
    "state": "SP"
  }'`}</CodeBlock>
                  </div>

                  <Separator className="bg-[hsl(var(--avivar-border))]" />

                  <div>
                    <p className="text-xs font-medium text-[hsl(var(--avivar-foreground))] mb-1">JavaScript / Fetch:</p>
                    <CodeBlock>{`const response = await fetch("${baseUrl}/receive-lead/SEU_SLUG", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "João Silva",
    phone: "11999998888",
    email: "joao@email.com",
    procedimento: "Transplante Capilar"
  })
});
const data = await response.json();
console.log(data.action); // "created" ou "updated"`}</CodeBlock>
                  </div>

                  <Separator className="bg-[hsl(var(--avivar-border))]" />

                  <div>
                    <p className="text-xs font-medium text-[hsl(var(--avivar-foreground))] mb-1">WordPress (Elementor / CF7):</p>
                    <div className="bg-[hsl(var(--avivar-muted))] rounded-lg p-3 text-xs text-[hsl(var(--avivar-muted-foreground))] space-y-1">
                      <p>Mapeie os campos do formulário para os nomes aceitos pela API:</p>
                      <p className="pl-4"><strong>Nome completo</strong> → <code className="bg-[hsl(var(--avivar-background))] px-1 rounded">name</code> ou <code className="bg-[hsl(var(--avivar-background))] px-1 rounded">nome</code></p>
                      <p className="pl-4"><strong>E-mail</strong> → <code className="bg-[hsl(var(--avivar-background))] px-1 rounded">email</code></p>
                      <p className="pl-4"><strong>WhatsApp</strong> → <code className="bg-[hsl(var(--avivar-background))] px-1 rounded">phone</code> ou <code className="bg-[hsl(var(--avivar-background))] px-1 rounded">whatsapp</code></p>
                      <p className="pl-4"><strong>Procedimento</strong> → <code className="bg-[hsl(var(--avivar-background))] px-1 rounded">procedimento</code> ou <code className="bg-[hsl(var(--avivar-background))] px-1 rounded">procedure</code></p>
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
                        Configure URLs para receber um <strong>POST automático</strong> sempre que um evento acontecer.
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-[hsl(var(--avivar-foreground))] mb-2">Eventos disponíveis</p>
                    <div className="border border-[hsl(var(--avivar-border))] rounded-lg overflow-hidden text-xs">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-[hsl(var(--avivar-muted))]">
                            <th className="text-left p-2 font-medium text-[hsl(var(--avivar-foreground))]">Evento</th>
                            <th className="text-left p-2 font-medium text-[hsl(var(--avivar-foreground))]">Descrição</th>
                          </tr>
                        </thead>
                        <tbody className="text-[hsl(var(--avivar-muted-foreground))]">
                          <tr className="border-t border-[hsl(var(--avivar-border))]"><td className="p-2 font-mono">lead.created</td><td className="p-2">Novo lead criado</td></tr>
                          <tr className="border-t border-[hsl(var(--avivar-border))]"><td className="p-2 font-mono">lead.updated</td><td className="p-2">Lead atualizado (ou deduplicado)</td></tr>
                          <tr className="border-t border-[hsl(var(--avivar-border))]"><td className="p-2 font-mono">message.received</td><td className="p-2">Mensagem recebida no WhatsApp</td></tr>
                          <tr className="border-t border-[hsl(var(--avivar-border))]"><td className="p-2 font-mono">appointment.created</td><td className="p-2">Agendamento criado</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>

                {/* Auth Tab */}
                <TabsContent value="auth" className="space-y-4 mt-4">
                  <h4 className="text-sm font-semibold text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
                    Autenticação
                  </h4>
                  <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                    A autenticação é feita pelo <strong>slug da URL</strong> do webhook (recomendado) ou pelo header <code className="bg-[hsl(var(--avivar-muted))] px-1 rounded font-mono">X-API-Key</code>.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 p-2 rounded bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))] text-xs">
                      <Badge className="bg-green-600 text-white text-[10px] shrink-0 mt-0.5">Webhook URL</Badge>
                      <p className="text-[hsl(var(--avivar-muted-foreground))]">A URL já contém o slug de autenticação. Basta enviar POST sem headers extras.</p>
                    </div>
                    <div className="flex items-start gap-2 p-2 rounded bg-[hsl(var(--avivar-background))] border border-[hsl(var(--avivar-border))] text-xs">
                      <Badge variant="secondary" className="text-[10px] shrink-0 mt-0.5">X-API-Key</Badge>
                      <p className="text-[hsl(var(--avivar-muted-foreground))]">Para integrações avançadas: <code className="bg-[hsl(var(--avivar-muted))] px-1 rounded">X-API-Key: avr_seutoken</code></p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Dialog Criar Token */}
      <Dialog open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) { setNewToken(null); setNewWebhookSlug(null); setShowToken(false); setTargetKanbanId(''); setTargetColumnId(''); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Criar Webhook</DialogTitle>
            <DialogDescription>
              Configure o destino do lead no CRM. Uma URL única será gerada para colar no WordPress.
            </DialogDescription>
          </DialogHeader>
          {newToken && newWebhookSlug ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <p className="font-medium">Webhook criado com sucesso!</p>
              </div>
              <div className="bg-[hsl(var(--avivar-muted))] rounded-lg p-3 space-y-3">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-[hsl(var(--avivar-foreground))]">🔗 URL do Webhook (cole no WordPress):</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono bg-[hsl(var(--avivar-background))] px-2 py-1.5 rounded break-all flex-1">
                      {baseUrl}/receive-lead/{newWebhookSlug}
                    </code>
                    <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => { navigator.clipboard.writeText(`${baseUrl}/receive-lead/${newWebhookSlug}`); toast.success('URL do webhook copiada!'); }}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-[10px] text-green-600 dark:text-green-400">✅ Cole esta URL como Webhook no Elementor, Contact Form 7, WPForms ou qualquer plugin.</p>
                </div>
                <Separator className="bg-[hsl(var(--avivar-border))/0.3]" />
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center gap-1 text-xs text-[hsl(var(--avivar-muted-foreground))] hover:text-[hsl(var(--avivar-foreground))]">
                    <ChevronDown className="h-3 w-3" />
                    Token para integração avançada (n8n, Postman)
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-2">
                    <div className="relative">
                      <Input readOnly value={showToken ? newToken : '••••••••••••••••••••••••••••••••••••'} className="font-mono pr-20 text-xs" />
                      <div className="absolute right-1 top-1 flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setShowToken(!showToken)}>
                          {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={copyToken}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-[10px] text-destructive">⚠️ Este token não será exibido novamente.</p>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do webhook / token</Label>
                <Input placeholder="Ex: Formulário Site Principal" value={tokenName} onChange={(e) => setTokenName(e.target.value)} />
              </div>
              <Separator className="bg-[hsl(var(--avivar-border))]" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-[hsl(var(--avivar-primary))]" />
                  Destino no CRM
                </p>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))]">
                  Leads recebidos por este webhook serão adicionados automaticamente ao funil e coluna selecionados.
                </p>
              </div>
              {kanbans.length === 0 ? (
                <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/10">
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Nenhum funil encontrado. O lead será criado apenas na lista geral de leads.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs">Funil de destino</Label>
                      <Select value={targetKanbanId} onValueChange={setTargetKanbanId}>
                        <SelectTrigger><SelectValue placeholder="Selecione o funil" /></SelectTrigger>
                        <SelectContent>
                          {kanbans.map((k) => (<SelectItem key={k.id} value={k.id}>{k.name}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Coluna de entrada</Label>
                      <Select value={targetColumnId} onValueChange={setTargetColumnId} disabled={!targetKanbanId}>
                        <SelectTrigger><SelectValue placeholder={targetKanbanId ? "Selecione a coluna" : "Selecione o funil primeiro"} /></SelectTrigger>
                        <SelectContent>
                          {columns.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {!targetKanbanId && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Sem funil selecionado, o lead será criado apenas na lista geral de leads.
                    </p>
                  )}
                </>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
                <Button onClick={handleCreate} disabled={!tokenName.trim() || createToken.isPending} className="bg-[hsl(var(--avivar-primary))] text-white">
                  {createToken.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Criar Webhook
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
            <AlertDialogDescription>Sistemas que utilizam este token perderão acesso imediatamente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) deleteToken.mutate(deleteId); setDeleteId(null); }} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ── Request Log Entry ── */
function RequestLogEntry({ log }: { log: any }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-[hsl(var(--avivar-border))] rounded-lg bg-[hsl(var(--avivar-background))] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-[hsl(var(--avivar-muted)/0.3)] transition-colors"
      >
        {log.lead_action === 'error' ? (
          <XCircle className="h-4 w-4 text-destructive shrink-0" />
        ) : log.lead_action === 'updated' ? (
          <RefreshCw className="h-4 w-4 text-amber-500 shrink-0" />
        ) : (
          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant={log.response_status < 400 ? 'default' : 'destructive'}
              className="text-[10px] px-1.5 py-0"
            >
              {log.response_status}
            </Badge>
            <span className="text-xs font-medium text-[hsl(var(--avivar-foreground))] truncate">
              {log.lead_action === 'created' ? 'Lead criado' : log.lead_action === 'updated' ? 'Lead atualizado' : 'Erro'}
            </span>
            {log.webhook_slug && (
              <span className="text-[10px] text-[hsl(var(--avivar-muted-foreground))] font-mono">/{log.webhook_slug}</span>
            )}
          </div>
        </div>
        <span className="text-[10px] text-[hsl(var(--avivar-muted-foreground))] shrink-0">
          {format(new Date(log.created_at), "dd/MM HH:mm:ss", { locale: ptBR })}
        </span>
        {expanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
      </button>
      {expanded && (
        <div className="border-t border-[hsl(var(--avivar-border))] p-3 space-y-3">
          {log.request_body && (
            <div>
              <p className="text-[10px] font-semibold text-[hsl(var(--avivar-muted-foreground))] mb-1">Request Body:</p>
              <pre className="bg-[hsl(var(--avivar-muted))] rounded p-2 text-[10px] font-mono text-[hsl(var(--avivar-foreground))] overflow-x-auto whitespace-pre-wrap break-all max-h-[200px] overflow-y-auto">
                {JSON.stringify(log.request_body, null, 2)}
              </pre>
            </div>
          )}
          {log.response_body && (
            <div>
              <p className="text-[10px] font-semibold text-[hsl(var(--avivar-muted-foreground))] mb-1">Response:</p>
              <pre className="bg-[hsl(var(--avivar-muted))] rounded p-2 text-[10px] font-mono text-[hsl(var(--avivar-foreground))] overflow-x-auto whitespace-pre-wrap break-all max-h-[200px] overflow-y-auto">
                {JSON.stringify(log.response_body, null, 2)}
              </pre>
            </div>
          )}
          {log.ip_address && (
            <p className="text-[10px] text-[hsl(var(--avivar-muted-foreground))]">IP: {log.ip_address}</p>
          )}
        </div>
      )}
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
      <Button size="icon" variant="ghost" className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => { navigator.clipboard.writeText(children); toast.success('Código copiado!'); }}>
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
