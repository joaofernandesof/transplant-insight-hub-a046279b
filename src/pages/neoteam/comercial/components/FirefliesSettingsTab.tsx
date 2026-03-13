import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ImportHistoricalCalls } from './ImportHistoricalCalls';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays, subMonths, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Flame, Save, Eye, EyeOff, RefreshCw, CheckCircle2, AlertCircle, Download, Loader2, Search, CheckSquare, Webhook, Copy, ExternalLink, MessageSquare, Clock } from 'lucide-react';

interface Props {
  accountId: string | null;
}

interface FirefliesTranscript {
  id: string;
  title: string;
  date: string | null;
  duration: number | null;
  participants: string[];
  organizer_email: string | null;
  users: { name: string; email: string }[];
  already_imported: boolean;
}

export function FirefliesSettingsTab({ accountId }: Props) {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  // Filter keywords state
  const [filterKeywords, setFilterKeywords] = useState<string[]>(['Reunião com']);
  const [newKeyword, setNewKeyword] = useState('');
  const [filterMode, setFilterMode] = useState<'include' | 'all'>('include');
  const [isSavingFilter, setIsSavingFilter] = useState(false);

  // Browse dialog state
  const [browseOpen, setBrowseOpen] = useState(false);
  const [isLoadingCalls, setIsLoadingCalls] = useState(false);
  const [allCalls, setAllCalls] = useState<FirefliesTranscript[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchFilter, setSearchFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [hideImported, setHideImported] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
    errors: number;
    error_details: string[];
    analyzed: number;
  } | null>(null);

  // WhatsApp group config
  const [whatsappGroupId, setWhatsappGroupId] = useState('');
  const [isSavingGroup, setIsSavingGroup] = useState(false);
  const [isGroupSaved, setIsGroupSaved] = useState(false);

  // Load saved key and filter settings
  useEffect(() => {
    if (!accountId) return;
    // Load API key
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
    // Load filter config
    supabase
      .from('avivar_account_settings')
      .select('setting_value')
      .eq('account_id', accountId)
      .eq('setting_key', 'fireflies_filter_config')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.setting_value) {
          const val = data.setting_value as any;
          if (val?.keywords && Array.isArray(val.keywords)) setFilterKeywords(val.keywords);
          if (val?.mode) setFilterMode(val.mode);
        }
      });
    // Load WhatsApp group config
    supabase
      .from('avivar_account_settings')
      .select('setting_value')
      .eq('account_id', accountId)
      .eq('setting_key', 'call_intelligence_whatsapp_group')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.setting_value) {
          const val = data.setting_value as any;
          const gid = typeof val === 'string' ? val : val?.group_id;
          if (gid) {
            setWhatsappGroupId(gid);
            setIsGroupSaved(true);
          }
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
        toast.success(`Conexão OK! ${data.transcripts_count || 0} transcrições encontradas no Fireflies.`);
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

  const handleOpenBrowse = async () => {
    setBrowseOpen(true);
    setSelectedIds(new Set());
    setImportResult(null);
    setSearchFilter('');
    setPeriodFilter('all');
    setDateFrom('');
    setDateTo('');
    setIsLoadingCalls(true);

    try {
      const { data, error } = await supabase.functions.invoke('fireflies-list-calls', {
        body: { account_id: accountId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAllCalls(data.transcripts || []);
    } catch (err: any) {
      toast.error('Erro ao buscar calls: ' + (err.message || ''));
      setAllCalls([]);
    } finally {
      setIsLoadingCalls(false);
    }
  };

  // Filter logic
  const filteredCalls = useMemo(() => {
    let result = [...allCalls];

    if (hideImported) {
      result = result.filter(c => !c.already_imported);
    }

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      result = result.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.participants?.some(p => p.toLowerCase().includes(q)) ||
        c.organizer_email?.toLowerCase().includes(q)
      );
    }

    // Period filter
    if (periodFilter !== 'all' && periodFilter !== 'custom') {
      const now = new Date();
      let cutoff: Date;
      switch (periodFilter) {
        case '7d': cutoff = subDays(now, 7); break;
        case '15d': cutoff = subDays(now, 15); break;
        case '30d': cutoff = subDays(now, 30); break;
        case '60d': cutoff = subDays(now, 60); break;
        case '90d': cutoff = subDays(now, 90); break;
        case '6m': cutoff = subMonths(now, 6); break;
        default: cutoff = subDays(now, 9999);
      }
      result = result.filter(c => c.date && isAfter(new Date(c.date), cutoff));
    }

    if (periodFilter === 'custom') {
      if (dateFrom) {
        const from = startOfDay(new Date(dateFrom));
        result = result.filter(c => c.date && isAfter(new Date(c.date), from));
      }
      if (dateTo) {
        const to = endOfDay(new Date(dateTo));
        result = result.filter(c => c.date && isBefore(new Date(c.date), to));
      }
    }

    return result;
  }, [allCalls, searchFilter, periodFilter, dateFrom, dateTo, hideImported]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const selectableCalls = filteredCalls.filter(c => !c.already_imported);
    if (selectedIds.size === selectableCalls.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableCalls.map(c => c.id)));
    }
  };

  const handleImportSelected = async () => {
    if (selectedIds.size === 0) {
      toast.error('Selecione pelo menos uma call');
      return;
    }
    setIsImporting(true);
    setImportResult(null);
    toast.loading(`Importando ${selectedIds.size} calls...`, { id: 'ff-import' });

    try {
      const { data, error } = await supabase.functions.invoke('fireflies-import-selected', {
        body: {
          account_id: accountId,
          user_id: user?.id,
          transcript_ids: Array.from(selectedIds),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setImportResult({
        imported: data.imported || 0,
        skipped: data.skipped || 0,
        errors: data.errors || 0,
        error_details: data.error_details || [],
        analyzed: data.analyzed || 0,
      });

      // Update imported status locally
      setAllCalls(prev => prev.map(c =>
        selectedIds.has(c.id) ? { ...c, already_imported: true } : c
      ));
      setSelectedIds(new Set());

      if (data.imported > 0) {
        toast.success(`✅ ${data.imported} calls importadas!`, { id: 'ff-import' });
      } else {
        toast.success(`Nenhuma call nova importada. ${data.skipped || 0} já existentes.`, { id: 'ff-import' });
      }
    } catch (err: any) {
      toast.error('Erro: ' + (err.message || ''), { id: 'ff-import' });
    } finally {
      setIsImporting(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m${secs > 0 ? ` ${secs}s` : ''}`;
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
              <li>O sistema busca todas as transcrições do Fireflies</li>
              <li>Você filtra por data, período e seleciona quais importar</li>
              <li>Registra a call e dispara análise com IA automaticamente</li>
              <li>Calls já importadas são identificadas (sem duplicatas)</li>
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

          {/* Filter Keywords Config */}
          {isSaved && (
            <div className="mt-6 pt-4 border-t border-border/50 space-y-3">
              <div>
                <Label className="text-sm font-semibold">Filtro de importação automática</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Defina quais palavras-chave no título da call determinam se ela será importada na sincronização automática.
                </p>
              </div>

              <div className="flex gap-2 items-center">
                <Select value={filterMode} onValueChange={(v: 'include' | 'all') => setFilterMode(v)}>
                  <SelectTrigger className="w-[220px] h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="include">Importar apenas com palavras-chave</SelectItem>
                    <SelectItem value="all">Importar TODAS as calls</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filterMode === 'include' && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {filterKeywords.map((kw, i) => (
                      <Badge key={i} variant="secondary" className="gap-1 text-xs pr-1">
                        {kw}
                        <button
                          onClick={() => setFilterKeywords(prev => prev.filter((_, idx) => idx !== i))}
                          className="ml-0.5 hover:text-destructive transition-colors rounded-full p-0.5"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                    {filterKeywords.length === 0 && (
                      <span className="text-xs text-muted-foreground italic">Nenhuma palavra-chave (nada será importado)</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ex: Reunião com, REUNIÃO -, Dr., Dra."
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      className="h-8 text-sm flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newKeyword.trim()) {
                          e.preventDefault();
                          if (!filterKeywords.includes(newKeyword.trim())) {
                            setFilterKeywords(prev => [...prev, newKeyword.trim()]);
                          }
                          setNewKeyword('');
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      disabled={!newKeyword.trim()}
                      onClick={() => {
                        if (newKeyword.trim() && !filterKeywords.includes(newKeyword.trim())) {
                          setFilterKeywords(prev => [...prev, newKeyword.trim()]);
                        }
                        setNewKeyword('');
                      }}
                    >
                      Adicionar
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    A call será importada se o título <strong>contiver</strong> qualquer uma dessas palavras-chave (case-insensitive). Pressione Enter para adicionar.
                  </p>
                </div>
              )}

              <Button
                size="sm"
                onClick={async () => {
                  if (!accountId) return;
                  setIsSavingFilter(true);
                  try {
                    const { error } = await supabase
                      .from('avivar_account_settings')
                      .upsert({
                        account_id: accountId,
                        setting_key: 'fireflies_filter_config',
                        setting_value: { mode: filterMode, keywords: filterKeywords } as any,
                      }, { onConflict: 'account_id,setting_key' });
                    if (error) throw error;
                    toast.success('Filtro salvo com sucesso!');
                  } catch (err: any) {
                    toast.error('Erro ao salvar filtro: ' + (err.message || ''));
                  } finally {
                    setIsSavingFilter(false);
                  }
                }}
                disabled={isSavingFilter}
              >
                <Save className="h-3.5 w-3.5 mr-1.5" />
                {isSavingFilter ? 'Salvando...' : 'Salvar Filtro'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhook URL Card - for automatic real-time sync */}
      {isSaved && accountId && (
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Webhook className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Sincronização Automática (Webhook)</CardTitle>
                <CardDescription>
                  Receba calls automaticamente assim que o Fireflies finalizar a transcrição
                </CardDescription>
              </div>
              <Badge variant="outline" className="ml-auto text-emerald-600 border-emerald-300 bg-emerald-50">
                Tempo Real
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border/50 bg-muted/30 p-4 space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Como configurar:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Copie a URL do webhook abaixo</li>
                <li>Acesse <a href="https://app.fireflies.ai/integrations/custom/webhooks" target="_blank" rel="noopener noreferrer" className="text-primary underline">Fireflies → Integrations → Webhooks</a></li>
                <li>Cole a URL e ative o evento <strong>"Transcription completed"</strong></li>
                <li>Pronto! As calls serão importadas e analisadas automaticamente</li>
              </ol>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">URL do Webhook</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fireflies-webhook?account_id=${accountId}`}
                  className="font-mono text-xs bg-muted/50"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fireflies-webhook?account_id=${accountId}`
                    );
                    toast.success('URL copiada!');
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                O webhook respeita os filtros de palavras-chave configurados acima. Calls duplicadas são ignoradas automaticamente.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://app.fireflies.ai/integrations/custom/webhooks', '_blank')}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Abrir Configuração de Webhooks no Fireflies
            </Button>
          </CardContent>
        </Card>
      )}

      {isSaved && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Download className="h-5 w-5" />
              Importar Calls do Fireflies
            </CardTitle>
            <CardDescription>
              Navegue por todas as calls do Fireflies, filtre por período e selecione quais importar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleOpenBrowse}
              className="w-full"
              size="lg"
            >
              <Search className="h-4 w-4 mr-2" /> Abrir Calls do Fireflies
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Browse Dialog */}
      <Dialog open={browseOpen} onOpenChange={setBrowseOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-primary" />
              Calls do Fireflies
              {!isLoadingCalls && (
                <Badge variant="secondary" className="text-xs">
                  {filteredCalls.length} de {allCalls.length}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Filters */}
          <div className="space-y-3 shrink-0">
            <div className="flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label className="text-xs mb-1 block">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por título, participante..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>
              </div>
              <div className="min-w-[140px]">
                <Label className="text-xs mb-1 block">Período</Label>
                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="7d">Últimos 7 dias</SelectItem>
                    <SelectItem value="15d">Últimos 15 dias</SelectItem>
                    <SelectItem value="30d">Últimos 30 dias</SelectItem>
                    <SelectItem value="60d">Últimos 60 dias</SelectItem>
                    <SelectItem value="90d">Últimos 90 dias</SelectItem>
                    <SelectItem value="6m">Últimos 6 meses</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {periodFilter === 'custom' && (
                <>
                  <div>
                    <Label className="text-xs mb-1 block">De</Label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="h-9 text-sm w-[140px]"
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Até</Label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="h-9 text-sm w-[140px]"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={hideImported}
                  onCheckedChange={(v) => setHideImported(!!v)}
                />
                Ocultar já importadas
              </label>
              {filteredCalls.filter(c => !c.already_imported).length > 0 && (
                <Button variant="ghost" size="sm" onClick={toggleSelectAll} className="text-xs h-7">
                  <CheckSquare className="h-3.5 w-3.5 mr-1" />
                  {selectedIds.size === filteredCalls.filter(c => !c.already_imported).length
                    ? 'Desmarcar todas'
                    : 'Selecionar todas'}
                </Button>
              )}
            </div>
          </div>

          {/* Call List */}
          <div className="flex-1 min-h-0 overflow-auto rounded-lg border">
            {isLoadingCalls ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Carregando calls do Fireflies...</span>
              </div>
            ) : filteredCalls.length === 0 ? (
              <div className="text-center py-16 text-sm text-muted-foreground">
                Nenhuma call encontrada com os filtros aplicados
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur">
                  <tr>
                    <th className="w-10 py-2 px-3"></th>
                    <th className="text-left py-2 px-3 font-medium text-xs text-muted-foreground">Título</th>
                    <th className="text-left py-2 px-3 font-medium text-xs text-muted-foreground">Data</th>
                    <th className="text-left py-2 px-3 font-medium text-xs text-muted-foreground hidden md:table-cell">Duração</th>
                    <th className="text-left py-2 px-3 font-medium text-xs text-muted-foreground hidden sm:table-cell">Participantes</th>
                    <th className="text-left py-2 px-3 font-medium text-xs text-muted-foreground w-24">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCalls.map(call => (
                    <tr
                      key={call.id}
                      className={`border-b last:border-0 transition-colors cursor-pointer ${
                        call.already_imported
                          ? 'opacity-50 bg-muted/20'
                          : selectedIds.has(call.id)
                            ? 'bg-primary/5'
                            : 'hover:bg-muted/30'
                      }`}
                      onClick={() => !call.already_imported && toggleSelect(call.id)}
                    >
                      <td className="py-2 px-3 text-center">
                        {!call.already_imported && (
                          <Checkbox
                            checked={selectedIds.has(call.id)}
                            onCheckedChange={() => toggleSelect(call.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                      </td>
                      <td className="py-2 px-3 font-medium break-words max-w-[250px]">
                        {call.title}
                      </td>
                      <td className="py-2 px-3 text-muted-foreground whitespace-nowrap text-xs">
                        {call.date
                          ? format(new Date(call.date), 'dd/MM/yy HH:mm', { locale: ptBR })
                          : '—'}
                      </td>
                      <td className="py-2 px-3 text-muted-foreground text-xs hidden md:table-cell">
                        {formatDuration(call.duration)}
                      </td>
                      <td className="py-2 px-3 hidden sm:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {(call.participants || []).slice(0, 3).map((p, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px]">
                              {p}
                            </Badge>
                          ))}
                          {(call.participants || []).length > 3 && (
                            <Badge variant="outline" className="text-[10px]">
                              +{call.participants.length - 3}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        {call.already_imported ? (
                          <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                            <CheckCircle2 className="h-3 w-3 mr-0.5" /> Importada
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            Disponível
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Import Result */}
          {importResult && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3 text-sm shrink-0">
              <p className="font-semibold text-foreground">Resultado da importação:</p>
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-2 rounded-lg bg-background">
                  <p className="text-xl font-bold text-primary">{importResult.imported}</p>
                  <p className="text-[10px] text-muted-foreground">Importadas</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-background">
                  <p className="text-xl font-bold text-muted-foreground">{importResult.skipped}</p>
                  <p className="text-[10px] text-muted-foreground">Duplicadas</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-background">
                  <p className="text-xl font-bold text-destructive">{importResult.errors}</p>
                  <p className="text-[10px] text-muted-foreground">Erros</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-background">
                  <p className="text-xl font-bold text-primary">{importResult.analyzed}</p>
                  <p className="text-[10px] text-muted-foreground">Analisadas IA</p>
                </div>
              </div>
              {importResult.error_details.length > 0 && (
                <div className="mt-2 p-2 rounded bg-destructive/5 border border-destructive/20 text-xs text-destructive space-y-1 max-h-24 overflow-auto">
                  <p className="font-semibold">Detalhes dos erros:</p>
                  {importResult.error_details.map((e, i) => (
                    <p key={i}>• {e}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <DialogFooter className="shrink-0">
            <div className="flex items-center justify-between w-full">
              <p className="text-xs text-muted-foreground">
                {selectedIds.size} call{selectedIds.size !== 1 ? 's' : ''} selecionada{selectedIds.size !== 1 ? 's' : ''}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setBrowseOpen(false)}>
                  Fechar
                </Button>
                <Button
                  onClick={handleImportSelected}
                  disabled={isImporting || selectedIds.size === 0}
                >
                  {isImporting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importando...</>
                  ) : (
                    <><Download className="h-4 w-4 mr-2" /> Importar {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}</>
                  )}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Group Auto-Send Config */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <MessageSquare className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Envio Automático para Grupo WhatsApp</CardTitle>
              <CardDescription>
                Envie o Relatório WhatsApp automaticamente para um grupo após cada análise de call
              </CardDescription>
            </div>
            {isGroupSaved && (
              <Badge variant="outline" className="ml-auto text-emerald-600 border-emerald-300">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Ativo
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border/50 bg-muted/30 p-4 space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Como encontrar o ID do grupo:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Abra o WhatsApp Web e acesse o grupo desejado</li>
              <li>O ID do grupo geralmente tem o formato: <code className="text-xs bg-muted px-1 py-0.5 rounded">5511999999999-1234567890@g.us</code></li>
              <li>Ou peça à API do UazAPI para listar seus grupos</li>
            </ol>
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp-group">ID do Grupo WhatsApp</Label>
            <div className="flex gap-2">
              <Input
                id="whatsapp-group"
                placeholder="Ex: 5511999999999-1234567890@g.us"
                value={whatsappGroupId}
                onChange={(e) => setWhatsappGroupId(e.target.value)}
                className="font-mono text-xs"
              />
              <Button
                onClick={async () => {
                  if (!accountId) return;
                  setIsSavingGroup(true);
                  try {
                    if (!whatsappGroupId.trim()) {
                      // Remove config
                      await supabase
                        .from('avivar_account_settings')
                        .delete()
                        .eq('account_id', accountId)
                        .eq('setting_key', 'call_intelligence_whatsapp_group');
                      setIsGroupSaved(false);
                      toast.success('Envio automático desativado');
                    } else {
                      const { error } = await supabase
                        .from('avivar_account_settings')
                        .upsert({
                          account_id: accountId,
                          setting_key: 'call_intelligence_whatsapp_group',
                          setting_value: { group_id: whatsappGroupId.trim() } as any,
                        }, { onConflict: 'account_id,setting_key' });
                      if (error) throw error;
                      setIsGroupSaved(true);
                      toast.success('Grupo do WhatsApp salvo! Relatórios serão enviados automaticamente.');
                    }
                  } catch (err: any) {
                    toast.error('Erro: ' + (err.message || ''));
                  } finally {
                    setIsSavingGroup(false);
                  }
                }}
                disabled={isSavingGroup}
              >
                <Save className="h-4 w-4 mr-1.5" />
                {isSavingGroup ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              O relatório inclui: resumo da call, link do Fireflies, BANT, classificação, conduta de tarefas e próximos passos. Deixe vazio para desativar.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Import Historical Calls */}
      <ImportHistoricalCalls accountId={accountId} />
    </div>
  );
}
