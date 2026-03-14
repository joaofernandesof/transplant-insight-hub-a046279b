// KommoSettings - Configurações com auto-sync e alertas
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, RefreshCw, CheckCircle, AlertCircle, Database, Users, GitCompare, Tag, Link2, Clock, Loader2, Bell, Webhook, Plus, Trash2 } from 'lucide-react';
import { useKommoSync, useKommoSyncConfig, useKommoSyncLogs, useKommoPipelines, useKommoUsers, useKommoLeads, useKommoTasks, useKommoContacts } from '../hooks/useKommoData';
import { useKommoAlertRules, useCreateAlertRule, useToggleAlertRule, useDeleteAlertRule } from '../hooks/useKommoAlerts';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const METRIC_OPTIONS = [
  { value: 'stale_leads', label: 'Leads sem atividade (7d+)' },
  { value: 'loss_rate', label: 'Taxa de perda (%)' },
  { value: 'overdue_tasks', label: 'Tarefas atrasadas' },
  { value: 'conversion_rate', label: 'Taxa de conversão (%)' },
  { value: 'open_leads', label: 'Leads em aberto' },
];

const CONDITION_OPTIONS = [
  { value: 'gt', label: 'Maior que' },
  { value: 'lt', label: 'Menor que' },
  { value: 'gte', label: 'Maior ou igual' },
  { value: 'lte', label: 'Menor ou igual' },
];

export default function KommoSettings() {
  const { data: config, isLoading: loadingConfig } = useKommoSyncConfig();
  const { data: syncLogs = [] } = useKommoSyncLogs();
  const { data: pipelines = [] } = useKommoPipelines();
  const { data: users = [] } = useKommoUsers();
  const { data: leads = [] } = useKommoLeads();
  const { data: tasks = [] } = useKommoTasks();
  const { data: contacts = [] } = useKommoContacts();
  const { data: alertRules = [] } = useKommoAlertRules();
  const syncMutation = useKommoSync();
  const createAlert = useCreateAlertRule();
  const toggleAlert = useToggleAlertRule();
  const deleteAlert = useDeleteAlertRule();

  const [autoSync, setAutoSync] = useState(config?.auto_sync_enabled ?? false);
  const [showNewAlert, setShowNewAlert] = useState(false);
  const [newAlert, setNewAlert] = useState({ name: '', metric_key: 'stale_leads', condition: 'gt', threshold_value: 10, severity: 'warning' });

  const isConnected = !!config && config.last_sync_status === 'success';
  const isSyncing = syncMutation.isPending;

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kommo-webhook`;

  const handleAutoSyncToggle = async (enabled: boolean) => {
    setAutoSync(enabled);
    if (config?.id) {
      await supabase
        .from('kommo_sync_config')
        .update({ auto_sync_enabled: enabled } as any)
        .eq('id', config.id);
      toast.success(enabled ? 'Auto-sync ativado' : 'Auto-sync desativado');
    }
  };

  const handleCreateAlert = () => {
    if (!newAlert.name) return;
    createAlert.mutate(newAlert as any);
    setShowNewAlert(false);
    setNewAlert({ name: '', metric_key: 'stale_leads', condition: 'gt', threshold_value: 10, severity: 'warning' });
  };

  return (
    <div className="space-y-6">
      {/* Conexão */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Link2 className="h-4 w-4" /> Conexão com Kommo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border">
            {loadingConfig ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : isConnected ? <CheckCircle className="h-5 w-5 text-emerald-500" /> : <AlertCircle className="h-5 w-5 text-amber-500" />}
            <div className="flex-1">
              <p className="text-sm font-medium">{isConnected ? 'Integração ativa' : 'Aguardando primeira sincronização'}</p>
              <p className="text-xs text-muted-foreground">{config?.subdomain ? `${config.subdomain}.kommo.com` : 'Credenciais configuradas. Clique em sincronizar para iniciar.'}</p>
              {config?.last_sync_at && <p className="text-xs text-muted-foreground mt-1">Último sync: {formatDistanceToNow(new Date(config.last_sync_at), { addSuffix: true, locale: ptBR })}</p>}
            </div>
            <Badge variant={isConnected ? 'default' : 'outline'} className="text-xs">{isConnected ? 'Conectado' : 'Pendente'}</Badge>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => syncMutation.mutate({ syncType: 'full' })} disabled={isSyncing} className="gap-2">
              {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {isSyncing ? 'Sincronizando...' : 'Sync Completo'}
            </Button>
            <Button variant="outline" onClick={() => syncMutation.mutate({ syncType: 'incremental' })} disabled={isSyncing} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Incremental
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Auto-Sync + Webhook */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Webhook className="h-4 w-4" /> Sincronização Automática
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <Label className="text-sm font-medium">Auto-Sync Periódico</Label>
              <p className="text-xs text-muted-foreground">Sincroniza automaticamente a cada hora</p>
            </div>
            <Switch checked={autoSync} onCheckedChange={handleAutoSyncToggle} />
          </div>

          <div className="p-3 rounded-lg border space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Webhook className="h-3.5 w-3.5" /> URL do Webhook
            </Label>
            <p className="text-xs text-muted-foreground">Configure esta URL no Kommo para receber atualizações em tempo real.</p>
            <div className="flex gap-2">
              <Input value={webhookUrl} readOnly className="text-xs font-mono" />
              <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success('URL copiada!'); }}>
                Copiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertas Configuráveis */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4" /> Regras de Alerta
            </CardTitle>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setShowNewAlert(true)}>
              <Plus className="h-3 w-3" /> Nova Regra
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showNewAlert && (
            <div className="p-3 rounded-lg border bg-muted/20 space-y-3">
              <Input placeholder="Nome do alerta" value={newAlert.name} onChange={e => setNewAlert(p => ({ ...p, name: e.target.value }))} className="text-sm" />
              <div className="grid grid-cols-3 gap-2">
                <Select value={newAlert.metric_key} onValueChange={v => setNewAlert(p => ({ ...p, metric_key: v }))}>
                  <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{METRIC_OPTIONS.map(m => <SelectItem key={m.value} value={m.value} className="text-xs">{m.label}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={newAlert.condition} onValueChange={v => setNewAlert(p => ({ ...p, condition: v }))}>
                  <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{CONDITION_OPTIONS.map(c => <SelectItem key={c.value} value={c.value} className="text-xs">{c.label}</SelectItem>)}</SelectContent>
                </Select>
                <Input type="number" value={newAlert.threshold_value} onChange={e => setNewAlert(p => ({ ...p, threshold_value: Number(e.target.value) }))} className="text-xs" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="text-xs" onClick={handleCreateAlert} disabled={!newAlert.name}>Criar</Button>
                <Button size="sm" variant="ghost" className="text-xs" onClick={() => setShowNewAlert(false)}>Cancelar</Button>
              </div>
            </div>
          )}

          {alertRules.length === 0 && !showNewAlert && (
            <p className="text-sm text-muted-foreground">Nenhuma regra de alerta configurada.</p>
          )}

          {alertRules.map(rule => (
            <div key={rule.id} className="flex items-center gap-3 p-2 rounded-lg border">
              <Switch checked={rule.is_active} onCheckedChange={v => toggleAlert.mutate({ id: rule.id, is_active: v })} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{rule.name}</p>
                <p className="text-xs text-muted-foreground">
                  {METRIC_OPTIONS.find(m => m.value === rule.metric_key)?.label || rule.metric_key} {rule.condition} {rule.threshold_value}
                </p>
              </div>
              <Badge variant={rule.severity === 'danger' ? 'destructive' : 'secondary'} className="text-xs">{rule.severity}</Badge>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => deleteAlert.mutate(rule.id)}>
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Dados Sincronizados */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Database className="h-4 w-4" /> Dados Sincronizados</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[
            { icon: GitCompare, label: 'Funis (Pipelines)', count: pipelines.length },
            { icon: Users, label: 'Leads', count: leads.length },
            { icon: Users, label: 'Contatos', count: contacts.length },
            { icon: Users, label: 'Usuários', count: users.length },
            { icon: Tag, label: 'Tarefas', count: tasks.length },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg border">
              <item.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium flex-1">{item.label}</span>
              <span className="text-sm font-semibold">{item.count.toLocaleString()}</span>
              <Badge variant={item.count > 0 ? 'default' : 'outline'} className="text-xs">{item.count > 0 ? 'OK' : 'Vazio'}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Histórico */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Clock className="h-4 w-4" /> Histórico de Sincronizações</CardTitle></CardHeader>
        <CardContent>
          {syncLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma sincronização realizada ainda.</p>
          ) : (
            <div className="space-y-2">
              {syncLogs.slice(0, 10).map(log => (
                <div key={log.id} className="flex items-center gap-3 p-2 rounded-lg border text-sm">
                  {log.status === 'completed' ? <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" /> : log.status === 'failed' ? <AlertCircle className="h-4 w-4 text-destructive shrink-0" /> : <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium capitalize">{log.sync_type}</p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(log.started_at), { addSuffix: true, locale: ptBR })}{log.duration_ms && ` · ${(log.duration_ms / 1000).toFixed(1)}s`}</p>
                  </div>
                  {log.records_synced && Object.keys(log.records_synced).length > 0 && (
                    <span className="text-xs text-muted-foreground shrink-0">{Object.values(log.records_synced).reduce((a: number, b: any) => a + (b as number), 0)} registros</span>
                  )}
                  <Badge variant={log.status === 'completed' ? 'default' : log.status === 'failed' ? 'destructive' : 'secondary'} className="text-xs shrink-0">{log.status === 'completed' ? 'OK' : log.status === 'failed' ? 'Falha' : 'Em andamento'}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
