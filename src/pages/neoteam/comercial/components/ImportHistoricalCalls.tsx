import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileSpreadsheet, Upload, Loader2, CheckCircle2, AlertTriangle, ArrowRight, X } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  accountId: string | null;
}

// Target fields for the import
const TARGET_FIELDS = [
  { key: 'lead_nome', label: 'Nome do Lead', required: true },
  { key: 'data_call', label: 'Data da Call', required: true },
  { key: 'resultado', label: 'Resultado da Call', required: false },
  { key: 'produto', label: 'Produto', required: false },
  { key: 'vendedor', label: 'Closer/Vendedor', required: false },
  { key: 'budget', label: 'BANT - Budget', required: false },
  { key: 'authority', label: 'BANT - Authority', required: false },
  { key: 'need', label: 'BANT - Need', required: false },
  { key: 'timeline', label: 'BANT - Timeline', required: false },
  { key: 'bant_total', label: 'BANT - Total', required: false },
  { key: 'classificacao', label: 'Classificação do Lead', required: false },
  { key: 'dor_principal', label: 'Dor Principal', required: false },
  { key: 'objecao', label: 'Objeção', required: false },
  { key: 'motivo_nao_fechamento', label: 'Motivo Não Fechamento', required: false },
  { key: 'urgencia', label: 'Urgência', required: false },
  { key: 'followup', label: 'Follow-up', required: false },
  { key: 'status_final', label: 'Status Final', required: false },
  { key: 'pontos_melhoria', label: 'Pontos de Melhoria', required: false },
];

// Auto-detect column mapping based on header text
function autoDetectMapping(headers: string[]): Record<string, number> {
  const mapping: Record<string, number> = {};
  const patterns: Record<string, RegExp[]> = {
    lead_nome: [/lead|nome.*lead|cliente|nome.*cliente|paciente/i, /^nome$/i],
    data_call: [/data.*call|data.*liga|data.*reuni|data/i],
    resultado: [/resultado|status.*call|resultado.*call/i],
    produto: [/produto|curso|servi[cç]o|oferta/i],
    vendedor: [/vendedor|closer|respons[aá]vel|consultor/i],
    budget: [/budget|or[cç]amento/i, /^b$/i],
    authority: [/authority|autoridade/i, /^a$/i],
    need: [/need|necessidade/i, /^n$/i],
    timeline: [/timeline|prazo|tempo/i, /^t$/i],
    bant_total: [/bant.*total|total.*bant|pontua[cç][aã]o/i],
    classificacao: [/classifica|temperatura|perfil/i],
    dor_principal: [/dor.*princip|dor|principal.*dor/i],
    objecao: [/obje[cç][aã]o|obje[cç][oõ]es/i],
    motivo_nao_fechamento: [/motivo.*n[aã]o|n[aã]o.*fech/i],
    urgencia: [/urg[eê]ncia/i],
    followup: [/follow|acompanhamento/i],
    status_final: [/status.*final/i],
    pontos_melhoria: [/ponto.*melhor|melhoria|feedback/i],
  };

  for (const [field, regexList] of Object.entries(patterns)) {
    for (const regex of regexList) {
      const idx = headers.findIndex(h => regex.test(h));
      if (idx !== -1 && !Object.values(mapping).includes(idx)) {
        mapping[field] = idx;
        break;
      }
    }
  }
  return mapping;
}

function parseDate(val: any): string {
  if (!val) return new Date().toISOString();
  if (typeof val === 'number') {
    const date = new Date((val - 25569) * 86400 * 1000);
    return date.toISOString();
  }
  if (typeof val === 'string') {
    const parts = val.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const year = parseInt(parts[2]);
      const date = new Date(year, month, day, 12, 0, 0);
      if (!isNaN(date.getTime())) return date.toISOString();
    }
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
}

type Step = 'upload' | 'mapping' | 'importing' | 'result';

interface ImportResult {
  imported: number;
  skipped: number;
  errors: number;
  errorDetails: string[];
}

export function ImportHistoricalCalls({ accountId }: Props) {
  const [step, setStep] = useState<Step>('upload');
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [dataRows, setDataRows] = useState<any[][]>([]);
  const [mapping, setMapping] = useState<Record<string, number>>({});
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];

        // Find header row
        let headerIdx = -1;
        for (let i = 0; i < Math.min(jsonData.length, 15); i++) {
          const row = jsonData[i];
          if (row && row.filter((cell: any) => String(cell).trim()).length >= 3) {
            headerIdx = i;
            break;
          }
        }

        if (headerIdx === -1) {
          toast.error('Não foi possível encontrar o cabeçalho da planilha');
          return;
        }

        const rawHeaders = jsonData[headerIdx].map((h: any) => String(h).trim());
        const rows = jsonData.slice(headerIdx + 1).filter(row =>
          row && row.some((cell: any) => String(cell).trim())
        );

        setHeaders(rawHeaders);
        setDataRows(rows);
        setMapping(autoDetectMapping(rawHeaders));
        setStep('mapping');
        toast.success(`${rows.length} linhas encontradas em "${file.name}"`);
      } catch (err: any) {
        toast.error('Erro ao ler arquivo: ' + (err.message || ''));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const updateMapping = (field: string, colIdx: string) => {
    setMapping(prev => {
      const next = { ...prev };
      if (colIdx === '__none__') {
        delete next[field];
      } else {
        next[field] = parseInt(colIdx);
      }
      return next;
    });
  };

  const handleImport = async () => {
    if (!accountId) { toast.error('Conta não configurada'); return; }
    if (!mapping.lead_nome && mapping.lead_nome !== 0) {
      toast.error('Mapeie pelo menos a coluna "Nome do Lead"');
      return;
    }

    setStep('importing');
    setIsImporting(true);
    setResult(null);

    try {
      // Build parsed rows from mapping
      const parsedRows = [];
      for (const row of dataRows) {
        const getValue = (key: string) => {
          const idx = mapping[key];
          if (idx === undefined || idx === null) return '';
          return String(row[idx] || '').trim();
        };
        const getNum = (key: string) => {
          const v = getValue(key);
          return parseInt(v) || 0;
        };

        const leadNome = getValue('lead_nome');
        if (!leadNome || leadNome.length < 2) continue;
        // Skip header-like rows
        if (/resultado|an[aá]lise/i.test(leadNome)) continue;

        parsedRows.push({
          lead_nome: leadNome,
          data_call: parseDate(mapping.data_call !== undefined ? row[mapping.data_call] : ''),
          resultado: getValue('resultado'),
          produto: getValue('produto'),
          vendedor: getValue('vendedor'),
          budget: getNum('budget'),
          authority: getNum('authority'),
          need: getNum('need'),
          timeline: getNum('timeline'),
          bant_total: getNum('bant_total'),
          classificacao: getValue('classificacao'),
          dor_principal: getValue('dor_principal'),
          objecao: getValue('objecao'),
          motivo_nao_fechamento: getValue('motivo_nao_fechamento'),
          urgencia: getNum('urgencia') || 5,
          followup: getValue('followup'),
          status_final: getValue('status_final'),
          pontos_melhoria: getValue('pontos_melhoria'),
        });
      }

      if (parsedRows.length === 0) {
        toast.error('Nenhuma call válida encontrada');
        setStep('mapping');
        setIsImporting(false);
        return;
      }

      toast.loading(`Importando ${parsedRows.length} calls...`, { id: 'import-calls' });

      const batchSize = 20;
      let totalImported = 0;
      let totalSkipped = 0;
      let totalErrors = 0;
      const errorDetails: string[] = [];

      for (let i = 0; i < parsedRows.length; i += batchSize) {
        const batch = parsedRows.slice(i, i + batchSize);

        const { data, error } = await supabase.functions.invoke('import-historical-calls', {
          body: { rows: batch, account_id: accountId },
        });

        if (error) {
          totalErrors += batch.length;
          errorDetails.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message || 'Erro desconhecido'}`);
          continue;
        }
        if (data?.error) {
          totalErrors += batch.length;
          errorDetails.push(`Batch ${Math.floor(i / batchSize) + 1}: ${data.error}`);
          continue;
        }

        totalImported += data.imported || 0;
        totalSkipped += data.skipped || 0;
        totalErrors += data.errors || 0;

        toast.loading(`Importando... ${Math.min(i + batchSize, parsedRows.length)}/${parsedRows.length}`, { id: 'import-calls' });
      }

      setResult({ imported: totalImported, skipped: totalSkipped, errors: totalErrors, errorDetails });
      setStep('result');
      toast.success(`Importação concluída! ${totalImported} calls importadas.`, { id: 'import-calls' });
    } catch (err: any) {
      toast.error('Erro na importação: ' + (err.message || ''), { id: 'import-calls' });
      setStep('mapping');
    } finally {
      setIsImporting(false);
    }
  };

  const reset = () => {
    setStep('upload');
    setResult(null);
    setHeaders([]);
    setDataRows([]);
    setMapping({});
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
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
            <CardDescription>Faça upload de uma planilha Excel (.xlsx/.xls) com os dados das calls</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* STEP 1: Upload */}
        {step === 'upload' && (
          <>
            <div className="rounded-lg border-2 border-dashed border-border/60 bg-muted/20 p-8 text-center">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium mb-1">Selecione um arquivo Excel</p>
              <p className="text-xs text-muted-foreground mb-4">.xlsx ou .xls — as colunas serão detectadas automaticamente</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="gap-2">
                <Upload className="h-4 w-4" /> Selecionar Arquivo
              </Button>
            </div>
          </>
        )}

        {/* STEP 2: Mapping */}
        {step === 'mapping' && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">📄 {fileName}</p>
                <p className="text-xs text-muted-foreground">{dataRows.length} linhas · {headers.length} colunas detectadas</p>
              </div>
              <Button variant="ghost" size="sm" onClick={reset}>
                <X className="h-4 w-4 mr-1" /> Trocar arquivo
              </Button>
            </div>

            <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
              <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Mapeamento De → Para</p>
              <p className="text-xs text-muted-foreground mb-3">Verifique se as colunas foram detectadas corretamente. Ajuste se necessário.</p>

              <div className="space-y-2">
                {TARGET_FIELDS.map(field => (
                  <div key={field.key} className="flex items-center gap-2">
                    <div className="w-[200px] text-xs font-medium flex items-center gap-1">
                      {field.label}
                      {field.required && <span className="text-destructive">*</span>}
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    <Select
                      value={mapping[field.key] !== undefined ? String(mapping[field.key]) : '__none__'}
                      onValueChange={(v) => updateMapping(field.key, v)}
                    >
                      <SelectTrigger className="h-8 text-xs flex-1">
                        <SelectValue placeholder="Não mapeado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— Não mapeado —</SelectItem>
                        {headers.map((h, i) => (
                          <SelectItem key={i} value={String(i)}>
                            Col {i + 1}: {h || `(sem nome)`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview first 3 rows */}
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <p className="text-xs font-semibold p-2 bg-muted/40 text-muted-foreground uppercase tracking-wide">Prévia das primeiras 3 linhas</p>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {TARGET_FIELDS.filter(f => mapping[f.key] !== undefined).map(f => (
                        <TableHead key={f.key} className="text-[10px] whitespace-nowrap">{f.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataRows.slice(0, 3).map((row, ri) => (
                      <TableRow key={ri}>
                        {TARGET_FIELDS.filter(f => mapping[f.key] !== undefined).map(f => (
                          <TableCell key={f.key} className="text-[10px] max-w-[150px] truncate">
                            {String(row[mapping[f.key]] || '—')}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <Button onClick={handleImport} disabled={!accountId} className="w-full" size="lg">
              <Upload className="h-4 w-4 mr-2" /> Importar {dataRows.length} Calls
            </Button>
          </>
        )}

        {/* STEP 3: Importing */}
        {step === 'importing' && (
          <div className="py-8 text-center space-y-3">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <p className="text-sm font-medium">Importando calls...</p>
            <p className="text-xs text-muted-foreground">Isso pode levar alguns segundos</p>
          </div>
        )}

        {/* STEP 4: Result */}
        {step === 'result' && result && (
          <>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <p className="font-semibold text-foreground">Importação concluída!</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-lg bg-background border">
                  <p className="text-2xl font-bold text-primary">{result.imported}</p>
                  <p className="text-xs text-muted-foreground">Importadas</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-background border">
                  <p className="text-2xl font-bold text-amber-600">{result.skipped}</p>
                  <p className="text-xs text-muted-foreground">Duplicadas (ignoradas)</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-background border">
                  <p className="text-2xl font-bold text-destructive">{result.errors}</p>
                  <p className="text-xs text-muted-foreground">Erros</p>
                </div>
              </div>

              {result.errorDetails.length > 0 && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 space-y-1">
                  <div className="flex items-center gap-1 text-destructive text-xs font-medium">
                    <AlertTriangle className="h-3 w-3" /> Detalhes dos erros:
                  </div>
                  {result.errorDetails.map((err, i) => (
                    <p key={i} className="text-[10px] text-muted-foreground">• {err}</p>
                  ))}
                </div>
              )}
            </div>

            <Button onClick={reset} variant="outline" className="w-full">
              Importar outra planilha
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
