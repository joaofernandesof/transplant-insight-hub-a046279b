import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, FileSpreadsheet, BarChart3, Database, Copy, Check, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

export function SentinelExportPanel() {
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const apiEndpoint = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/system_metrics_daily`;

  const handleCopyEndpoint = async () => {
    await navigator.clipboard.writeText(apiEndpoint);
    setCopied(true);
    toast.success('Endpoint copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      // Fetch all data
      const { data: systems } = await supabase
        .from('monitored_systems')
        .select('id, name, type, url');
      
      const { data: healthChecks } = await supabase
        .from('system_health_checks')
        .select('*')
        .order('checked_at', { ascending: false })
        .limit(1000);

      const { data: alerts } = await supabase
        .from('system_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      // Create CSV for systems
      const systemsCSV = [
        ['ID', 'Nome', 'Tipo', 'URL'].join(','),
        ...(systems || []).map(s => [s.id, s.name, s.type, s.url].join(','))
      ].join('\n');

      // Create CSV for health checks
      const checksCSV = [
        ['ID', 'Sistema ID', 'Status', 'Tempo Resposta (ms)', 'Código HTTP', 'Erro', 'Data'].join(','),
        ...(healthChecks || []).map(h => [
          h.id, 
          h.system_id, 
          h.status, 
          h.response_time_ms || '', 
          h.status_code || '',
          h.error_message?.replace(/,/g, ';') || '',
          h.checked_at
        ].join(','))
      ].join('\n');

      // Create CSV for alerts
      const alertsCSV = [
        ['ID', 'Sistema ID', 'Severidade', 'Tipo', 'Mensagem', 'Resolvido', 'Data'].join(','),
        ...(alerts || []).map(a => [
          a.id,
          a.system_id,
          a.severity,
          a.type,
          a.message?.replace(/,/g, ';') || '',
          a.resolved ? 'Sim' : 'Não',
          a.created_at
        ].join(','))
      ].join('\n');

      // Download files
      const downloadCSV = (content: string, filename: string) => {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
      };

      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
      downloadCSV(systemsCSV, `sentinel_sistemas_${timestamp}.csv`);
      downloadCSV(checksCSV, `sentinel_health_checks_${timestamp}.csv`);
      downloadCSV(alertsCSV, `sentinel_alertas_${timestamp}.csv`);

      toast.success('Arquivos exportados com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar dados');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      const { data: systems } = await supabase
        .from('monitored_systems')
        .select('*');
      
      const { data: healthChecks } = await supabase
        .from('system_health_checks')
        .select('*')
        .order('checked_at', { ascending: false })
        .limit(1000);

      const { data: alerts } = await supabase
        .from('system_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      const exportData = {
        exported_at: new Date().toISOString(),
        systems,
        health_checks: healthChecks,
        alerts,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `sentinel_export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.json`;
      link.click();

      toast.success('Exportação JSON concluída!');
    } catch (error) {
      toast.error('Erro ao exportar dados');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* API Endpoint */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4" />
            API REST para BI
          </CardTitle>
          <CardDescription>
            Conecte seu Power BI, Looker ou Metabase diretamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Endpoint de Métricas Diárias</Label>
            <div className="flex gap-2">
              <Input 
                readOnly 
                value={apiEndpoint}
                className="text-xs font-mono"
              />
              <Button variant="outline" size="icon" onClick={handleCopyEndpoint}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <div className="p-3 rounded-lg bg-muted/50 text-xs space-y-2">
            <p className="font-medium">Autenticação:</p>
            <code className="block bg-background p-2 rounded text-[10px]">
              Authorization: Bearer {'{'}SUPABASE_ANON_KEY{'}'}
              <br />
              apikey: {'{'}SUPABASE_ANON_KEY{'}'}
            </code>
          </div>

          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">REST API</Badge>
            <Badge variant="outline" className="text-xs">JSON</Badge>
            <Badge variant="outline" className="text-xs">Real-time</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar Dados
          </CardTitle>
          <CardDescription>
            Baixe relatórios em diferentes formatos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full justify-start gap-3"
            onClick={handleExportCSV}
            disabled={isExporting}
          >
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
            <div className="text-left">
              <p className="font-medium">CSV / Excel</p>
              <p className="text-xs text-muted-foreground">Sistemas, Health Checks, Alertas</p>
            </div>
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start gap-3"
            onClick={handleExportJSON}
            disabled={isExporting}
          >
            <Database className="h-4 w-4 text-blue-600" />
            <div className="text-left">
              <p className="font-medium">JSON Completo</p>
              <p className="text-xs text-muted-foreground">Todos os dados estruturados</p>
            </div>
          </Button>

          <Button 
            variant="outline" 
            className="w-full justify-start gap-3"
            asChild
          >
            <a href="https://lookerstudio.google.com" target="_blank" rel="noopener noreferrer">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              <div className="text-left flex-1">
                <p className="font-medium">Abrir Looker Studio</p>
                <p className="text-xs text-muted-foreground">Use a API REST como fonte</p>
              </div>
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
