// KommoSettings - Configurações funcionais da integração
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, RefreshCw, CheckCircle, AlertCircle, Database, Users, GitCompare, Tag, Link2, Clock, Loader2 } from 'lucide-react';
import { useKommoSync, useKommoSyncConfig, useKommoSyncLogs, useKommoPipelines, useKommoUsers, useKommoLeads, useKommoTasks, useKommoContacts } from '../hooks/useKommoData';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function KommoSettings() {
  const { data: config, isLoading: loadingConfig } = useKommoSyncConfig();
  const { data: syncLogs = [] } = useKommoSyncLogs();
  const { data: pipelines = [] } = useKommoPipelines();
  const { data: users = [] } = useKommoUsers();
  const { data: leads = [] } = useKommoLeads();
  const { data: tasks = [] } = useKommoTasks();
  const { data: contacts = [] } = useKommoContacts();
  const syncMutation = useKommoSync();

  const isConnected = !!config && config.last_sync_status === 'success';
  const isSyncing = syncMutation.isPending;

  const handleSync = (syncType: 'full' | 'incremental' = 'full') => {
    syncMutation.mutate({ syncType });
  };

  return (
    <div className="space-y-6">
      {/* Status da Conexão */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Conexão com Kommo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border">
            {loadingConfig ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : isConnected ? (
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-500" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium">
                {isConnected ? 'Integração ativa' : 'Aguardando primeira sincronização'}
              </p>
              <p className="text-xs text-muted-foreground">
                {config?.subdomain 
                  ? `${config.subdomain}.kommo.com`
                  : 'Credenciais configuradas. Clique em sincronizar para iniciar.'}
              </p>
              {config?.last_sync_at && (
                <p className="text-xs text-muted-foreground mt-1">
                  Último sync: {formatDistanceToNow(new Date(config.last_sync_at), { addSuffix: true, locale: ptBR })}
                </p>
              )}
            </div>
            <Badge variant={isConnected ? 'default' : 'outline'} className="text-xs">
              {isConnected ? 'Conectado' : 'Pendente'}
            </Badge>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => handleSync('full')} disabled={isSyncing} className="gap-2">
              {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {isSyncing ? 'Sincronizando...' : 'Sincronização Completa'}
            </Button>
            <Button variant="outline" onClick={() => handleSync('incremental')} disabled={isSyncing} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Incremental
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dados Sincronizados */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Database className="h-4 w-4" />
            Dados Sincronizados
          </CardTitle>
        </CardHeader>
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
              <Badge variant={item.count > 0 ? 'default' : 'outline'} className="text-xs">
                {item.count > 0 ? 'OK' : 'Vazio'}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Log de Sincronizações */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Histórico de Sincronizações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {syncLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma sincronização realizada ainda.</p>
          ) : (
            <div className="space-y-2">
              {syncLogs.slice(0, 10).map(log => (
                <div key={log.id} className="flex items-center gap-3 p-2 rounded-lg border text-sm">
                  {log.status === 'completed' ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : log.status === 'failed' ? (
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium capitalize">{log.sync_type}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(log.started_at), { addSuffix: true, locale: ptBR })}
                      {log.duration_ms && ` · ${(log.duration_ms / 1000).toFixed(1)}s`}
                    </p>
                  </div>
                  {log.records_synced && Object.keys(log.records_synced).length > 0 && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {Object.values(log.records_synced).reduce((a: number, b: any) => a + (b as number), 0)} registros
                    </span>
                  )}
                  <Badge variant={log.status === 'completed' ? 'default' : log.status === 'failed' ? 'destructive' : 'secondary'} className="text-xs shrink-0">
                    {log.status === 'completed' ? 'OK' : log.status === 'failed' ? 'Falha' : 'Em andamento'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
