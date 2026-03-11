import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileSpreadsheet, Upload, Loader2, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  accountId: string | null;
}

interface ParsedRow {
  resultado: string;
  produto: string;
  data_call: string;
  lead_nome: string;
  budget: number;
  authority: number;
  need: number;
  timeline: number;
  bant_total: number;
  classificacao: string;
  dor_principal: string;
  objecao: string;
  motivo_nao_fechamento: string;
  urgencia: number;
  followup: string;
  status_final: string;
  vendedor: string;
  pontos_melhoria: string;
}

function parseDate(val: any): string {
  if (!val) return new Date().toISOString();

  // Excel serial number
  if (typeof val === 'number') {
    const date = new Date((val - 25569) * 86400 * 1000);
    return date.toISOString();
  }

  // String like "12/12/2025" or "5/1/2026"
  if (typeof val === 'string') {
    const parts = val.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const year = parseInt(parts[2]);
      const date = new Date(year, month, day, 12, 0, 0);
      if (!isNaN(date.getTime())) return date.toISOString();
    }
    // Try direct parse
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  return new Date().toISOString();
}

export function ImportHistoricalCalls({ accountId }: Props) {
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: number } | null>(null);

  const handleImport = async () => {
    if (!accountId) {
      toast.error('Conta não configurada');
      return;
    }

    setIsImporting(true);
    setResult(null);
    toast.loading('Carregando planilha e importando calls...', { id: 'import-calls' });

    try {
      // Fetch XLSX file
      const response = await fetch('/data/controle-vendas.xlsx');
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];

      // Find header row (looking for "RESULTADO DA CALL" or similar pattern)
      let headerIdx = -1;
      for (let i = 0; i < Math.min(jsonData.length, 10); i++) {
        const row = jsonData[i];
        if (row && row.some((cell: any) => String(cell).includes('RESULTADO'))) {
          headerIdx = i;
          break;
        }
      }

      if (headerIdx === -1) {
        throw new Error('Não foi possível encontrar o cabeçalho da planilha');
      }

      // Parse data rows (start after header)
      const dataRows = jsonData.slice(headerIdx + 1);
      const parsedRows: ParsedRow[] = [];

      for (const row of dataRows) {
        if (!row || !row[0] || String(row[0]).trim() === '') continue;

        const resultado = String(row[0] || '').trim();
        const leadNome = String(row[3] || '').trim();
        if (!leadNome || leadNome.length < 2) continue;

        // Skip header-like rows
        if (resultado.includes('ANÁLISE') || resultado.includes('RESULTADO')) continue;

        parsedRows.push({
          resultado,
          produto: String(row[1] || '').trim(),
          data_call: parseDate(row[2]),
          lead_nome: leadNome,
          budget: parseInt(row[13]) || 0,
          authority: parseInt(row[14]) || 0,
          need: parseInt(row[15]) || 0,
          timeline: parseInt(row[16]) || 0,
          bant_total: parseInt(row[17]) || 0,
          classificacao: String(row[19] || row[18] || '').trim(),
          dor_principal: String(row[20] || '').trim(),
          objecao: String(row[21] || '').trim(),
          motivo_nao_fechamento: String(row[22] || '').trim(),
          urgencia: parseInt(row[23]) || 5,
          followup: String(row[24] || '').trim(),
          status_final: String(row[25] || '').trim(),
          vendedor: String(row[26] || row[27] || '').trim(),
          pontos_melhoria: String(row[12] || '').trim(),
        });
      }

      if (parsedRows.length === 0) {
        throw new Error('Nenhuma call válida encontrada na planilha');
      }

      toast.loading(`Importando ${parsedRows.length} calls...`, { id: 'import-calls' });

      // Send in batches of 20 to avoid timeout
      const batchSize = 20;
      let totalImported = 0;
      let totalSkipped = 0;
      let totalErrors = 0;

      for (let i = 0; i < parsedRows.length; i += batchSize) {
        const batch = parsedRows.slice(i, i + batchSize);

        const { data, error } = await supabase.functions.invoke('import-historical-calls', {
          body: { rows: batch, account_id: accountId },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        totalImported += data.imported || 0;
        totalSkipped += data.skipped || 0;
        totalErrors += data.errors || 0;

        toast.loading(`Importando... ${Math.min(i + batchSize, parsedRows.length)}/${parsedRows.length}`, { id: 'import-calls' });
      }

      setResult({ imported: totalImported, skipped: totalSkipped, errors: totalErrors });
      toast.success(`✅ Importação concluída! ${totalImported} calls importadas.`, { id: 'import-calls' });
    } catch (err: any) {
      console.error('Import error:', err);
      toast.error('Erro na importação: ' + (err.message || ''), { id: 'import-calls' });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Importar Histórico de Calls</CardTitle>
            <CardDescription>
              Importa calls da planilha de controle de vendas (IBRAMEC)
            </CardDescription>
          </div>
          {result && result.imported > 0 && (
            <Badge variant="outline" className="ml-auto text-primary border-primary/30">
              <CheckCircle2 className="h-3 w-3 mr-1" /> {result.imported} importadas
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border/50 bg-muted/30 p-4 space-y-2 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">O que será importado:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Todas as calls da planilha de controle de vendas</li>
            <li>Indicadores BANT (Budget, Authority, Need, Timeline)</li>
            <li>Classificação do lead (quente, morno, frio)</li>
            <li>Dor principal, objeções e motivo de não fechamento</li>
            <li>Estratégia de follow-up e pontos de melhoria do closer</li>
            <li>Calls duplicadas serão ignoradas automaticamente</li>
          </ul>
        </div>

        <Button
          onClick={handleImport}
          disabled={isImporting || !accountId}
          className="w-full"
          size="lg"
        >
          {isImporting ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importando...</>
          ) : (
            <><Upload className="h-4 w-4 mr-2" /> Importar Planilha de Vendas</>
          )}
        </Button>

        {result && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2 text-sm">
            <p className="font-semibold text-foreground">Resultado da importação:</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-2 rounded-lg bg-background">
                <p className="text-2xl font-bold text-primary">{result.imported}</p>
                <p className="text-xs text-muted-foreground">Importadas</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-background">
                <p className="text-2xl font-bold text-muted-foreground">{result.skipped}</p>
                <p className="text-xs text-muted-foreground">Já existentes</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-background">
                <p className="text-2xl font-bold text-destructive">{result.errors}</p>
                <p className="text-xs text-muted-foreground">Erros</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
