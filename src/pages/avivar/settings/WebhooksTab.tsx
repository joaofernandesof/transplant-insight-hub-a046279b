import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Webhook, Plus, Trash2, Loader2, ExternalLink, Eye, CheckCircle2, XCircle } from 'lucide-react';
import { useAvivarWebhooks, useAvivarWebhookLogs, WEBHOOK_EVENTS } from '@/hooks/useAvivarWebhooks';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function WebhooksTab() {
  const { webhooks, isLoading, createWebhook, updateWebhook, deleteWebhook } = useAvivarWebhooks();
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [logsWebhookId, setLogsWebhookId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', url: '', events: [] as string[], secret: '' });

  const handleCreate = async () => {
    if (!form.name || !form.url || form.events.length === 0) return;
    await createWebhook.mutateAsync(form);
    setForm({ name: '', url: '', events: [], secret: '' });
    setShowCreate(false);
  };

  const toggleEvent = (event: string) => {
    setForm(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event],
    }));
  };

  return (
    <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
              <Webhook className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
              Webhooks
            </CardTitle>
            <CardDescription>
              Configure endpoints para receber eventos do CRM em tempo real
            </CardDescription>
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Webhook
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[hsl(var(--avivar-muted-foreground))]" />
          </div>
        ) : webhooks.length === 0 ? (
          <div className="text-center py-8 text-[hsl(var(--avivar-muted-foreground))]">
            <Webhook className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum webhook configurado</p>
            <p className="text-xs mt-1">Crie um webhook para receber eventos do CRM</p>
          </div>
        ) : (
          webhooks.map((wh) => (
            <div
              key={wh.id}
              className="p-4 rounded-xl border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-background))] space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <p className="font-medium text-[hsl(var(--avivar-foreground))] truncate">{wh.name}</p>
                  <Badge variant={wh.is_active ? 'default' : 'secondary'} className="text-xs shrink-0">
                    {wh.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                  {wh.failure_count > 0 && (
                    <Badge variant="destructive" className="text-xs shrink-0">
                      {wh.failure_count} falhas
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => setLogsWebhookId(wh.id)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Switch
                    checked={wh.is_active}
                    onCheckedChange={(checked) => updateWebhook.mutate({ id: wh.id, is_active: checked })}
                  />
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(wh.id)} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] font-mono truncate flex items-center gap-1">
                <ExternalLink className="h-3 w-3 shrink-0" />
                {wh.url}
              </p>
              <div className="flex flex-wrap gap-1">
                {wh.events.map((ev) => (
                  <Badge key={ev} variant="outline" className="text-xs">
                    {WEBHOOK_EVENTS.find(e => e.value === ev)?.label || ev}
                  </Badge>
                ))}
              </div>
            </div>
          ))
        )}
      </CardContent>

      {/* Dialog Criar Webhook */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Webhook</DialogTitle>
            <DialogDescription>
              Configure um endpoint para receber eventos do CRM
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input placeholder="Ex: Meu ERP" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input placeholder="https://..." value={form.url} onChange={(e) => setForm(p => ({ ...p, url: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Secret (opcional)</Label>
              <Input placeholder="Para assinatura HMAC" value={form.secret} onChange={(e) => setForm(p => ({ ...p, secret: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Eventos</Label>
              <div className="grid grid-cols-1 gap-2">
                {WEBHOOK_EVENTS.map((ev) => (
                  <label key={ev.value} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={form.events.includes(ev.value)}
                      onCheckedChange={() => toggleEvent(ev.value)}
                    />
                    <span className="text-sm text-[hsl(var(--avivar-foreground))]">{ev.label}</span>
                    <span className="text-xs text-[hsl(var(--avivar-muted-foreground))]">({ev.value})</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button
              onClick={handleCreate}
              disabled={!form.name || !form.url || form.events.length === 0 || createWebhook.isPending}
              className="bg-[hsl(var(--avivar-primary))] text-white"
            >
              {createWebhook.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logs Sheet */}
      <WebhookLogsSheet webhookId={logsWebhookId} onClose={() => setLogsWebhookId(null)} />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Webhook</AlertDialogTitle>
            <AlertDialogDescription>O webhook e todos os logs serão removidos permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteId) deleteWebhook.mutate(deleteId); setDeleteId(null); }}
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

function WebhookLogsSheet({ webhookId, onClose }: { webhookId: string | null; onClose: () => void }) {
  const { data: logs = [], isLoading } = useAvivarWebhookLogs(webhookId || undefined);

  return (
    <Sheet open={!!webhookId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Logs de Entrega</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3 overflow-y-auto max-h-[calc(100vh-120px)]">
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum log encontrado</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-3 rounded-lg border text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">{log.event}</Badge>
                  <div className="flex items-center gap-1">
                    {log.success ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-red-500" />
                    )}
                    <span className="text-xs font-mono">{log.response_status || '—'}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                </p>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
