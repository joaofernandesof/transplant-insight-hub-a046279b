import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Upload, FileSpreadsheet, Loader2, AlertCircle, CheckCircle2, Download, Search, Copy, SkipForward, RefreshCw, Users, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';

interface ParsedLead {
  name: string;
  phone: string;
  email: string;
  state: string;
  city: string;
}

interface ImportProgress {
  current: number;
  total: number;
  success: number;
  errors: number;
}

interface ImportResult {
  success: number;
  errors: number;
  duplicatesSkipped: number;
  duplicatesOverwritten: number;
}

interface DuplicateAnalysis {
  newLeads: ParsedLead[];
  duplicates: { parsed: ParsedLead; existing: { id: string; name: string; phone: string; city: string; state: string; claimed_by: string | null } }[];
}

interface LeadImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (
    leads: ParsedLead[],
    onProgress?: (progress: ImportProgress) => void,
    duplicateAction?: 'skip' | 'overwrite',
    duplicates?: DuplicateAnalysis['duplicates'],
  ) => Promise<ImportResult>;
}

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_\s]+/g, ' ')
    .trim();
}

function findColumnIndex(normalizedHeaders: string[], possibleNames: string[]): number {
  const targets = possibleNames.map(normalizeHeader);
  for (const target of targets) {
    const idx = normalizedHeaders.indexOf(target);
    if (idx !== -1) return idx;
  }
  for (const target of targets) {
    const idx = normalizedHeaders.findIndex(h => h.startsWith(target));
    if (idx !== -1) return idx;
  }
  for (const target of targets) {
    const idx = normalizedHeaders.findIndex(h => h.includes(target));
    if (idx !== -1) return idx;
  }
  return -1;
}

function parseSheet(rawRows: any[][]): { leads: ParsedLead[]; error?: string } {
  if (!rawRows.length || rawRows.length < 2) {
    return { leads: [], error: 'A planilha está vazia.' };
  }

  const headerRow = rawRows[0].map(h => String(h ?? ''));
  const normalizedHeaders = headerRow.map(normalizeHeader);

  const nameIdx = findColumnIndex(normalizedHeaders, ['contato principal', 'nome', 'contato', 'name']);
  const phoneIdx = findColumnIndex(normalizedHeaders, ['telefone comercial', 'telefone comercial contato', 'telefone', 'phone', 'celular', 'whatsapp', 'fone']);
  const emailIdx = findColumnIndex(normalizedHeaders, ['email formulario', 'email', 'e-mail', 'e mail', 'mail']);
  const stateIdx = findColumnIndex(normalizedHeaders, ['estado do lead', 'estado', 'uf', 'state']);
  const cityIdx = findColumnIndex(normalizedHeaders, ['cidade principal', 'cidade', 'city', 'municipio']);

  if (nameIdx === -1 || phoneIdx === -1) {
    return { leads: [], error: 'Colunas obrigatórias ausentes: necessário "Contato principal" (ou "Nome") e "Telefone"' };
  }

  const leads: ParsedLead[] = [];
  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;
    const name = String(row[nameIdx] ?? '').trim();
    const phone = String(row[phoneIdx] ?? '').trim();
    const email = emailIdx >= 0 ? String(row[emailIdx] ?? '').trim() : '';
    const state = stateIdx >= 0 ? String(row[stateIdx] ?? '').trim() : '';
    const city = cityIdx >= 0 ? String(row[cityIdx] ?? '').trim() : '';
    if (!name || !phone) continue;
    leads.push({ name, phone, email, state, city });
  }

  if (leads.length === 0) {
    return { leads: [], error: 'Nenhum lead válido encontrado (nome e telefone são obrigatórios).' };
  }
  return { leads };
}

/** Normaliza telefone para apenas dígitos */
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

function formatNumber(n: number): string {
  return n.toLocaleString('pt-BR');
}

type ImportStep = 'upload' | 'analyzing' | 'review' | 'importing' | 'result';

export function LeadImportDialog({ open, onOpenChange, onImport }: LeadImportDialogProps) {
  const [parsedLeads, setParsedLeads] = useState<ParsedLead[]>([]);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');
  const [step, setStep] = useState<ImportStep>('upload');
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [analysis, setAnalysis] = useState<DuplicateAnalysis | null>(null);
  const [duplicateAction, setDuplicateAction] = useState<'skip' | 'overwrite'>('skip');
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setParsedLeads([]);
    setFileName('');
    setParseError('');
    setResult(null);
    setProgress(null);
    setAnalysis(null);
    setStep('upload');
    setDuplicateAction('skip');
    if (fileRef.current) fileRef.current.value = '';
  };

  const downloadTemplate = useCallback(() => {
    const templateData = [
      { 'Contato principal': 'João Silva', 'Telefone comercial (contato)': '11999998888', 'EMAIL (FORMULÁRIO)': 'joao@email.com', 'ESTADO DO LEAD': 'SP', 'CIDADE PRINCIPAL': 'São Paulo' },
      { 'Contato principal': 'Maria Santos', 'Telefone comercial (contato)': '21988887777', 'EMAIL (FORMULÁRIO)': 'maria@email.com', 'ESTADO DO LEAD': 'RJ', 'CIDADE PRINCIPAL': 'Rio de Janeiro' },
    ];
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');
    worksheet['!cols'] = [{ wch: 25 }, { wch: 22 }, { wch: 30 }, { wch: 15 }, { wch: 20 }];
    XLSX.writeFile(workbook, 'modelo_hotleads.xlsx');
    toast.success('Modelo baixado com sucesso!');
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParseError('');
    setResult(null);
    setProgress(null);
    setAnalysis(null);
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' });
        const { leads, error } = parseSheet(rawRows);
        if (error) { setParseError(error); return; }
        setParsedLeads(leads);
      } catch {
        setParseError('Erro ao ler o arquivo. Verifique o formato.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  /** Analyze duplicates by checking phones against existing leads in the database */
  const analyzeDuplicates = async () => {
    setStep('analyzing');
    try {
      // Get all phones from parsed leads (normalized)
      const parsedPhones = parsedLeads.map(l => normalizePhone(l.phone));
      const uniquePhones = [...new Set(parsedPhones)];

      // Fetch existing leads by phone in chunks of 200
      const existingMap = new Map<string, { id: string; name: string; phone: string; city: string; state: string; claimed_by: string | null }>();
      
      for (let i = 0; i < uniquePhones.length; i += 200) {
        const phoneChunk = uniquePhones.slice(i, i + 200);
        const { data } = await supabase
          .from('leads')
          .select('id, name, phone, city, state, claimed_by')
          .in('phone', phoneChunk);
        
        if (data) {
          data.forEach(lead => {
            const normalized = normalizePhone(lead.phone || '');
            if (normalized) existingMap.set(normalized, lead as any);
          });
        }
      }

      // Classify leads
      const newLeads: ParsedLead[] = [];
      const duplicates: DuplicateAnalysis['duplicates'] = [];

      for (const parsed of parsedLeads) {
        const normalizedPhone = normalizePhone(parsed.phone);
        const existing = existingMap.get(normalizedPhone);
        if (existing) {
          duplicates.push({ parsed, existing });
        } else {
          newLeads.push(parsed);
        }
      }

      setAnalysis({ newLeads, duplicates });
      setStep('review');
    } catch (err) {
      console.error('Error analyzing duplicates:', err);
      toast.error('Erro ao analisar duplicados');
      setStep('upload');
    }
  };

  const handleImport = async () => {
    if (!analysis) return;
    setStep('importing');
    setProgress({ current: 0, total: parsedLeads.length, success: 0, errors: 0 });

    const res = await onImport(
      analysis.newLeads,
      (p) => setProgress(p),
      duplicateAction,
      analysis.duplicates,
    );

    setProgress(prev => prev ? { ...prev, current: prev.total } : null);
    await new Promise(r => setTimeout(r, 600));
    setResult(res);
    setProgress(null);
    setStep('result');

    if (res.success > 0) {
      toast.success(`${formatNumber(res.success)} leads importados com sucesso!`);
    }
  };

  const progressPercent = progress
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && step !== 'importing') { reset(); onOpenChange(v); } }}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Importar Leads via Planilha
            </span>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Baixar Modelo
            </Button>
          </DialogTitle>
          <DialogDescription>
            Envie um arquivo .xls, .xlsx ou .csv com as colunas: Contato principal, Telefone, Email, Estado, Cidade
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Step: Upload */}
          {step === 'upload' && (
            <>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xls,.xlsx,.csv"
                  onChange={handleFile}
                  className="hidden"
                  id="import-file"
                />
                <label htmlFor="import-file" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">
                    {fileName || 'Clique para selecionar arquivo'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">.xls, .xlsx ou .csv</p>
                </label>
              </div>

              {parseError && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  {parseError}
                </div>
              )}

              {/* Preview */}
              {parsedLeads.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">
                    {formatNumber(parsedLeads.length)} leads encontrados. Preview:
                  </p>
                  <div className="border rounded-lg overflow-auto max-h-48">
                    <table className="w-full text-xs">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="text-left p-2">Nome</th>
                          <th className="text-left p-2">Telefone</th>
                          <th className="text-left p-2">Email</th>
                          <th className="text-left p-2">Estado</th>
                          <th className="text-left p-2">Cidade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedLeads.slice(0, 10).map((l, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2">{l.name}</td>
                            <td className="p-2">{l.phone}</td>
                            <td className="p-2">{l.email}</td>
                            <td className="p-2">{l.state}</td>
                            <td className="p-2">{l.city}</td>
                          </tr>
                        ))}
                        {parsedLeads.length > 10 && (
                          <tr className="border-t">
                            <td colSpan={5} className="p-2 text-center text-muted-foreground">
                              ... e mais {formatNumber(parsedLeads.length - 10)} leads
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step: Analyzing */}
          {step === 'analyzing' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Search className="h-8 w-8 text-primary animate-pulse" />
              <p className="text-sm font-medium">Analisando duplicados na base...</p>
              <p className="text-xs text-muted-foreground">Verificando {formatNumber(parsedLeads.length)} telefones</p>
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Step: Review (duplicate analysis results) */}
          {step === 'review' && analysis && (
            <div className="space-y-4">
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="border rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-primary">{formatNumber(parsedLeads.length)}</div>
                  <div className="text-xs text-muted-foreground">Total na planilha</div>
                </div>
                <div className="border rounded-lg p-3 text-center bg-green-50 dark:bg-green-900/20">
                  <div className="text-2xl font-bold text-green-600">{formatNumber(analysis.newLeads.length)}</div>
                  <div className="text-xs text-muted-foreground">Novos leads</div>
                </div>
                <div className="border rounded-lg p-3 text-center bg-amber-50 dark:bg-amber-900/20">
                  <div className="text-2xl font-bold text-amber-600">{formatNumber(analysis.duplicates.length)}</div>
                  <div className="text-xs text-muted-foreground">Duplicados</div>
                </div>
              </div>

              {/* Duplicate list preview */}
              {analysis.duplicates.length > 0 && (
                <>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <p className="text-sm font-medium">
                        {formatNumber(analysis.duplicates.length)} leads já existem na base (mesmo telefone):
                      </p>
                    </div>
                    <div className="border rounded-lg overflow-auto max-h-40">
                      <table className="w-full text-xs">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            <th className="text-left p-2">Planilha</th>
                            <th className="text-left p-2">Telefone</th>
                            <th className="text-left p-2">Já existente</th>
                            <th className="text-left p-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analysis.duplicates.slice(0, 15).map((d, i) => (
                            <tr key={i} className="border-t">
                              <td className="p-2 font-medium">{d.parsed.name}</td>
                              <td className="p-2 text-muted-foreground">{d.parsed.phone}</td>
                              <td className="p-2">{d.existing.name}</td>
                              <td className="p-2">
                                {d.existing.claimed_by ? (
                                  <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-200">Adquirido</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] text-green-600 border-green-200">Disponível</Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                          {analysis.duplicates.length > 15 && (
                            <tr className="border-t">
                              <td colSpan={4} className="p-2 text-center text-muted-foreground">
                                ... e mais {formatNumber(analysis.duplicates.length - 15)} duplicados
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Duplicate action choice */}
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <p className="text-sm font-medium mb-3">O que fazer com os {formatNumber(analysis.duplicates.length)} duplicados?</p>
                    <RadioGroup value={duplicateAction} onValueChange={(v) => setDuplicateAction(v as 'skip' | 'overwrite')} className="space-y-3">
                      <div className="flex items-start gap-3 p-3 rounded-lg border bg-background hover:border-primary/40 transition-colors cursor-pointer">
                        <RadioGroupItem value="skip" id="skip" className="mt-0.5" />
                        <Label htmlFor="skip" className="cursor-pointer flex-1">
                          <div className="flex items-center gap-2">
                            <SkipForward className="h-4 w-4 text-amber-500" />
                            <span className="font-medium text-sm">Ignorar duplicados</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Importar apenas os {formatNumber(analysis.newLeads.length)} leads novos. Os duplicados serão mantidos como estão.
                          </p>
                        </Label>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg border bg-background hover:border-primary/40 transition-colors cursor-pointer">
                        <RadioGroupItem value="overwrite" id="overwrite" className="mt-0.5" />
                        <Label htmlFor="overwrite" className="cursor-pointer flex-1">
                          <div className="flex items-center gap-2">
                            <RefreshCw className="h-4 w-4 text-blue-500" />
                            <span className="font-medium text-sm">Sobrescrever duplicados</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Atualizar os dados dos {formatNumber(analysis.duplicates.length)} leads existentes com os dados da planilha (nome, email, cidade, estado).
                          </p>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </>
              )}

              {analysis.duplicates.length === 0 && (
                <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span>Nenhum duplicado encontrado! Todos os {formatNumber(analysis.newLeads.length)} leads são novos.</span>
                </div>
              )}
            </div>
          )}

          {/* Step: Importing */}
          {step === 'importing' && progress && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Importando leads...
                </span>
                <span className="text-muted-foreground font-mono">
                  {progressPercent}%
                </span>
              </div>
              <Progress value={progressPercent} className="h-3" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {formatNumber(progress.current)} de {formatNumber(progress.total)} processados
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-green-600">✓ {formatNumber(progress.success)}</span>
                  {progress.errors > 0 && (
                    <span className="text-destructive">✗ {formatNumber(progress.errors)}</span>
                  )}
                </span>
              </div>
            </div>
          )}

          {/* Step: Result */}
          {step === 'result' && result && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Importação concluída!</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="border rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-green-600">{formatNumber(result.success)}</div>
                  <div className="text-[11px] text-muted-foreground">Importados</div>
                </div>
                {result.errors > 0 && (
                  <div className="border rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-destructive">{formatNumber(result.errors)}</div>
                    <div className="text-[11px] text-muted-foreground">Com erro</div>
                  </div>
                )}
                {result.duplicatesSkipped > 0 && (
                  <div className="border rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-amber-500">{formatNumber(result.duplicatesSkipped)}</div>
                    <div className="text-[11px] text-muted-foreground">Duplicados ignorados</div>
                  </div>
                )}
                {result.duplicatesOverwritten > 0 && (
                  <div className="border rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-blue-500">{formatNumber(result.duplicatesOverwritten)}</div>
                    <div className="text-[11px] text-muted-foreground">Atualizados</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 'result' ? (
            <Button onClick={() => { reset(); onOpenChange(false); }}>Fechar</Button>
          ) : step === 'upload' ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={analyzeDuplicates}
                disabled={parsedLeads.length === 0}
              >
                <Search className="h-4 w-4 mr-2" />
                Analisar {formatNumber(parsedLeads.length)} leads
              </Button>
            </>
          ) : step === 'review' ? (
            <>
              <Button variant="outline" onClick={() => { setStep('upload'); setAnalysis(null); }}>
                Voltar
              </Button>
              <Button onClick={handleImport}>
                <Upload className="h-4 w-4 mr-2" />
                Importar {formatNumber(
                  (analysis?.newLeads.length || 0) + (duplicateAction === 'overwrite' ? (analysis?.duplicates.length || 0) : 0)
                )} leads
              </Button>
            </>
          ) : (
            <Button variant="outline" disabled>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Importando...
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
