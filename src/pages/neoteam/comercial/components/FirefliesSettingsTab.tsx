import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ImportHistoricalCalls } from './ImportHistoricalCalls';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Flame, Save, Eye, EyeOff, RefreshCw, CheckCircle2, AlertCircle, Download, Loader2, Trash2 } from 'lucide-react';

interface Props {
  accountId: string | null;
}

export function FirefliesSettingsTab({ accountId }: Props) {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [lastSyncResult, setLastSyncResult] = useState<{ imported: number; skipped: number; analyzed: number } | null>(null);

  // Load saved key status
  useEffect(() => {
    if (!accountId) return;
    supabase
      .from('avivar_account_settings')
      .select('setting_value')
      .eq('account_id', accountId)
      .eq('setting_key', 'fireflies_api_key')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.setting_value) {
          setIsSaved(true);
          const val = data.setting_value as any;
          if (typeof val === 'string') setApiKey(val);
          else if (val?.key) setApiKey(val.key);
        }
      });
  }, [accountId]);

  const handleSave = async () => {
    if (!accountId || !apiKey.trim()) {
      toast.error('Insira uma API Key válida');
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('avivar_account_settings')
        .upsert({
          account_id: accountId,
          setting_key: 'fireflies_api_key',
          setting_value: { key: apiKey.trim() } as any,
        }, { onConflict: 'account_id,setting_key' });
      if (error) throw error;
      setIsSaved(true);
      toast.success('API Key do Fireflies salva com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao salvar: ' + (err.message || ''));
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!apiKey.trim()) {
      toast.error('Insira a API Key antes de testar');
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('fireflies-test-connection', {
        body: { api_key: apiKey.trim() },
      });
      if (error) throw error;
      if (data?.success) {
        setTestResult('success');
        toast.success(`Conexão OK! ${data.transcripts_count || 0} transcrições encontradas com filtro "Reunião com".`);
      } else {
        setTestResult('error');
        toast.error(data?.error || 'Falha na conexão');
      }
    } catch (err: any) {
      setTestResult('error');
      toast.error('Erro ao testar: ' + (err.message || ''));
    } finally {
      setIsTesting(false);
    }
  };

  const handleSync = async () => {
    if (!accountId || !user) {
      toast.error('Conta ou usuário não configurado');
      return;
    }
    setIsSyncing(true);
    setLastSyncResult(null);
    toast.loading('Sincronizando calls do Fireflies e analisando com IA...', { id: 'fireflies-sync' });

    try {
      const { data, error } = await supabase.functions.invoke('fireflies-sync-calls', {
        body: { account_id: accountId, user_id: user.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setLastSyncResult({
        imported: data.imported || 0,
        skipped: data.skipped || 0,
        analyzed: data.analyzed || 0,
      });

      if (data.imported > 0) {
        toast.success(`✅ ${data.imported} calls importadas e analisadas com IA!`, { id: 'fireflies-sync' });
      } else {
        toast.success(`Nenhuma call nova para importar. ${data.skipped || 0} já sincronizadas.`, { id: 'fireflies-sync' });
      }
    } catch (err: any) {
      toast.error('Erro na sincronização: ' + (err.message || ''), { id: 'fireflies-sync' });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Flame className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Integração Fireflies.ai</CardTitle>
              <CardDescription>
                Sincronização automática de transcrições de calls de vendas
              </CardDescription>
            </div>
            {isSaved && (
              <Badge variant="outline" className="ml-auto text-primary border-primary/30">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Configurado
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border/50 bg-muted/30 p-4 space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Como funciona:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>O sistema busca automaticamente transcrições do Fireflies</li>
              <li>Filtra apenas reuniões que começam com <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">"Reunião com"</span></li>
              <li>Registra a call e dispara análise com IA automaticamente</li>
              <li>Calls já importadas são ignoradas (sem duplicatas)</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fireflies-key">API Key do Fireflies</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="fireflies-key"
                  type={showKey ? 'text' : 'password'}
                  placeholder="Cole sua API Key aqui..."
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setTestResult(null);
                  }}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Encontre sua API Key em{' '}
              <a
                href="https://app.fireflies.ai/integrations/custom/fireflies"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Fireflies → Settings → Developer Settings
              </a>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave} disabled={isSaving || !apiKey.trim()}>
              <Save className="h-4 w-4 mr-1.5" />
              {isSaving ? 'Salvando...' : 'Salvar API Key'}
            </Button>
            <Button variant="outline" onClick={handleTest} disabled={isTesting || !apiKey.trim()}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${isTesting ? 'animate-spin' : ''}`} />
              {isTesting ? 'Testando...' : 'Testar Conexão'}
            </Button>
          </div>

          {testResult && (
            <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
              testResult === 'success'
                ? 'bg-primary/10 text-primary'
                : 'bg-destructive/10 text-destructive'
            }`}>
              {testResult === 'success' ? (
                <><CheckCircle2 className="h-4 w-4" /> Conexão com Fireflies funcionando!</>
              ) : (
                <><AlertCircle className="h-4 w-4" /> Falha na conexão. Verifique sua API Key.</>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Card */}
      {isSaved && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Download className="h-5 w-5" />
              Sincronizar Calls
            </CardTitle>
            <CardDescription>
              Importa todas as reuniões do Fireflies que começam com "Reunião com" e analisa automaticamente com IA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleSync}
              disabled={isSyncing}
              className="w-full"
              size="lg"
            >
              {isSyncing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sincronizando e analisando...</>
              ) : (
                <><Download className="h-4 w-4 mr-2" /> Sincronizar Agora</>
              )}
            </Button>

            {lastSyncResult && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2 text-sm">
                <p className="font-semibold text-foreground">Resultado da sincronização:</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 rounded-lg bg-background">
                    <p className="text-2xl font-bold text-primary">{lastSyncResult.imported}</p>
                    <p className="text-xs text-muted-foreground">Importadas</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-background">
                    <p className="text-2xl font-bold text-muted-foreground">{lastSyncResult.skipped}</p>
                    <p className="text-xs text-muted-foreground">Já existentes</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-background">
                    <p className="text-2xl font-bold text-primary">{lastSyncResult.analyzed}</p>
                    <p className="text-xs text-muted-foreground">Analisadas IA</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import Historical Calls */}
      <ImportHistoricalCalls accountId={accountId} />
    </div>
  );
}
