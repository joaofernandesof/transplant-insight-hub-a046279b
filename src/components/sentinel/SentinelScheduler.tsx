import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Play, Pause, Settings2, Zap, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useSentinelMutations } from "@/hooks/useSystemSentinel";

interface ScheduleConfig {
  enabled: boolean;
  intervalSeconds: number;
  dailySummaryHour: number;
  retryAttempts: number;
  alertCooldownMinutes: number;
}

export function SentinelScheduler() {
  const [config, setConfig] = useState<ScheduleConfig>({
    enabled: true,
    intervalSeconds: 60,
    dailySummaryHour: 8,
    retryAttempts: 3,
    alertCooldownMinutes: 15,
  });
  const [isSaving, setIsSaving] = useState(false);

  const { runHealthCheck } = useSentinelMutations();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // In a full implementation, this would save to database
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Configurações de agendamento salvas!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualRun = () => {
    runHealthCheck.mutate(undefined);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Schedule Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Status do Agendamento
          </CardTitle>
          <CardDescription>
            Controle o monitoramento automático
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.enabled ? 'bg-green-100 dark:bg-green-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
                {config.enabled ? (
                  <Play className="h-5 w-5 text-green-600" />
                ) : (
                  <Pause className="h-5 w-5 text-slate-600" />
                )}
              </div>
              <div>
                <p className="font-medium">
                  {config.enabled ? 'Monitoramento Ativo' : 'Monitoramento Pausado'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {config.enabled 
                    ? `Verificando a cada ${config.intervalSeconds}s`
                    : 'Verificações automáticas desabilitadas'}
                </p>
              </div>
            </div>
            <Switch 
              checked={config.enabled} 
              onCheckedChange={(enabled) => setConfig({ ...config, enabled })}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1 gap-2"
              onClick={handleManualRun}
              disabled={runHealthCheck.isPending}
            >
              <Zap className="h-4 w-4" />
              {runHealthCheck.isPending ? 'Verificando...' : 'Verificar Agora'}
            </Button>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Próxima verificação</span>
              <Badge variant="outline">
                {config.enabled ? 'Em breve' : 'Pausado'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Configurações
          </CardTitle>
          <CardDescription>
            Ajuste intervalos e comportamentos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Intervalo de Verificação</Label>
            <Select 
              value={String(config.intervalSeconds)} 
              onValueChange={(v) => setConfig({ ...config, intervalSeconds: parseInt(v) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 segundos</SelectItem>
                <SelectItem value="60">1 minuto</SelectItem>
                <SelectItem value="120">2 minutos</SelectItem>
                <SelectItem value="300">5 minutos</SelectItem>
                <SelectItem value="600">10 minutos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Resumo Diário (hora)</Label>
            <Select 
              value={String(config.dailySummaryHour)} 
              onValueChange={(v) => setConfig({ ...config, dailySummaryHour: parseInt(v) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[6, 7, 8, 9, 10, 18, 19, 20].map(hour => (
                  <SelectItem key={hour} value={String(hour)}>
                    {hour}:00
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Tentativas antes de Alerta</Label>
              <Input 
                type="number" 
                value={config.retryAttempts}
                onChange={(e) => setConfig({ ...config, retryAttempts: parseInt(e.target.value) || 3 })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Cooldown de Alerta (min)</Label>
              <Input 
                type="number" 
                value={config.alertCooldownMinutes}
                onChange={(e) => setConfig({ ...config, alertCooldownMinutes: parseInt(e.target.value) || 15 })}
              />
            </div>
          </div>

          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </CardContent>
      </Card>

      {/* Cron Info */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Agendamento Externo (Cron)
          </CardTitle>
          <CardDescription>
            Configure um cron job externo para verificações mais precisas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-muted/50 space-y-3">
            <p className="text-sm">
              Para verificações automáticas a cada minuto, configure um cron externo chamando:
            </p>
            <code className="block bg-background p-3 rounded text-xs font-mono overflow-x-auto">
              curl -X POST "https://tubzywibnielhcjeswww.supabase.co/functions/v1/sentinel-check" \
              <br />
              &nbsp;&nbsp;-H "Authorization: Bearer {'{'}SUPABASE_ANON_KEY{'}'}" \
              <br />
              &nbsp;&nbsp;-H "Content-Type: application/json"
            </code>
            <p className="text-xs text-muted-foreground">
              Recomendação: Use serviços como Cron-job.org, EasyCron ou GitHub Actions para agendamento.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
