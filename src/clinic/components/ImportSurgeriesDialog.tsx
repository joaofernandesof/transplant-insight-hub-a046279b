import React, { useState, useRef, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, Trash2, History, Package, Eye, ArrowLeft, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { useNeoTeamBranches } from '@/neohub/hooks/useNeoTeamBranches';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

interface ImportSurgeriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface ImportBatch {
  import_batch_id: string;
  count: number;
  branch: string;
  created_at: string;
}

interface ParsedRecord {
  patient_name: string | null;
  medical_record: string | null;
  procedure: string | null;
  category: string | null;
  grade: number | null;
  surgery_date: string | null;
  surgery_time: string | null;
  surgery_confirmed: boolean;
  companion_name: string | null;
  vgv: number | null;
  doctor_on_duty: string | null;
  notes: string | null;
}

// Client-side parsing helpers (mirrors edge function logic)
function parseBool(val: string | undefined): boolean {
  return val?.trim()?.toUpperCase() === "SIM";
}

function parseGrade(val: string | undefined): number | null {
  if (!val || val.trim() === "" || val.trim() === "-" || val.includes("NÃO INFORMADO")) return null;
  const n = parseInt(val.trim());
  return isNaN(n) ? null : n;
}

function parseVgv(val: string | undefined): number | null {
  if (!val || val.trim() === "" || val.trim() === "-") return null;
  const cleaned = val.replace(/[R$\s.]/g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function parseDate(val: string | undefined): string | null {
  if (!val || val.trim() === "" || val.trim() === "-") return null;
  const match = val.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function parseTime(val: string | undefined): string | null {
  if (!val || val.trim() === "" || val.trim() === "-") return null;
  const t = val.trim();
  if (/^\d{1,2}:\d{2}$/.test(t)) return t;
  return null;
}

function textOrNull(val: string | undefined): string | null {
  if (!val || val.trim() === "" || val.trim() === "-") return null;
  return val.trim();
}

// Header keyword patterns for smart column detection
const HEADER_PATTERNS: Record<string, RegExp> = {
  date: /^data$/i,
  time: /hor[áa]rio\s*(da\s*)?cirurgia/i,
  patient: /paciente/i,
  category: /categoria/i,
  procedure: /procedimento/i,
  grade: /grau/i,
  vgv: /vgv\s*(final|inicial)?/i,
  vgv_final: /vgv\s*final/i,
  companion: /acompanhante/i,
  confirmed: /contrato\s*assinado/i,
  notes: /observa[çc][õo]es$/i,
  doctor: /m[ée]dico|plantonista/i,
  medical_record: /pront/i,
  tricotomia: /tricotomia/i,
};

interface ColumnMap {
  date: number;
  time: number;
  patient: number;
  category: number;
  procedure: number;
  grade: number;
  vgv: number;
  companion: number;
  confirmed: number;
  notes: number;
  doctor: number;
  medical_record: number;
}

function detectColumns(headers: string[]): ColumnMap | null {
  const normalized = headers.map(h => String(h ?? '').trim());
  
  const find = (pattern: RegExp, priority?: RegExp): number => {
    // Try priority pattern first
    if (priority) {
      const idx = normalized.findIndex(h => priority.test(h));
      if (idx >= 0) return idx;
    }
    return normalized.findIndex(h => pattern.test(h));
  };

  const patient = find(HEADER_PATTERNS.patient);
  if (patient < 0) return null; // Can't import without patient column

  // For VGV, prefer VGV FINAL over VGV INICIAL
  const vgvFinal = find(HEADER_PATTERNS.vgv_final);
  const vgvAny = find(HEADER_PATTERNS.vgv);
  
  return {
    date: find(HEADER_PATTERNS.date),
    time: find(HEADER_PATTERNS.time),
    patient,
    category: find(HEADER_PATTERNS.category),
    procedure: find(HEADER_PATTERNS.procedure),
    grade: find(HEADER_PATTERNS.grade),
    vgv: vgvFinal >= 0 ? vgvFinal : vgvAny,
    companion: find(HEADER_PATTERNS.companion),
    confirmed: find(HEADER_PATTERNS.confirmed),
    notes: find(HEADER_PATTERNS.notes),
    doctor: find(HEADER_PATTERNS.doctor),
    medical_record: find(HEADER_PATTERNS.medical_record),
  };
}

// Stored column map (set when file is loaded)
let _columnMap: ColumnMap | null = null;

function setColumnMap(map: ColumnMap | null) {
  _columnMap = map;
}

function getVal(f: string[], idx: number): string | undefined {
  return idx >= 0 && idx < f.length ? f[idx] : undefined;
}

function parseRowClient(fields: string[]): ParsedRecord | null {
  const f = fields;
  const m = _columnMap;
  if (!m) return null;

  const patient = textOrNull(getVal(f, m.patient));
  if (!patient) return null;
  if (patient === "PACIENTE" || patient.includes("CURSO FORMAÇÃO")) return null;

  return {
    patient_name: patient,
    medical_record: textOrNull(getVal(f, m.medical_record)),
    procedure: textOrNull(getVal(f, m.procedure)) || "CABELO",
    category: textOrNull(getVal(f, m.category)),
    grade: parseGrade(getVal(f, m.grade)),
    surgery_date: parseDate(getVal(f, m.date)),
    surgery_time: parseTime(getVal(f, m.time)),
    surgery_confirmed: parseBool(getVal(f, m.confirmed)),
    companion_name: textOrNull(getVal(f, m.companion)),
    vgv: parseVgv(getVal(f, m.vgv)),
    doctor_on_duty: textOrNull(getVal(f, m.doctor)),
    notes: textOrNull(getVal(f, m.notes)),
  };
}

function formatDateBR(dateStr: string | null): string {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function formatVgv(val: number | null): string {
  if (val === null) return '-';
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function ImportSurgeriesDialog({ open, onOpenChange, onSuccess }: ImportSurgeriesDialogProps) {
  const { branches } = useNeoTeamBranches();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [branch, setBranch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deletingBatch, setDeletingBatch] = useState<string | null>(null);
  const [result, setResult] = useState<{ success: boolean; inserted?: number; errors?: string[] } | null>(null);
  const [activeTab, setActiveTab] = useState('import');
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [headerRow, setHeaderRow] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (branches.length > 0 && !branch) {
      setBranch(branches[0].name);
    }
  }, [branches, branch]);

  // Parse preview data
  const previewData = useMemo(() => {
    if (rawRows.length === 0) return [];
    return rawRows
      .map(row => {
        const fields = row.map(c => String(c ?? ''));
        return parseRowClient(fields);
      })
      .filter(Boolean) as ParsedRecord[];
  }, [rawRows]);

  // Fetch import batches
  const { data: importBatches = [], isLoading: loadingBatches, refetch: refetchBatches } = useQuery({
    queryKey: ['import-batches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clinic_surgeries')
        .select('import_batch_id, branch, created_at')
        .not('import_batch_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const batchMap = new Map<string, ImportBatch>();
      for (const row of data || []) {
        const batchId = row.import_batch_id as string;
        if (!batchMap.has(batchId)) {
          batchMap.set(batchId, {
            import_batch_id: batchId,
            count: 0,
            branch: row.branch || 'N/A',
            created_at: row.created_at,
          });
        }
        batchMap.get(batchId)!.count++;
      }

      return Array.from(batchMap.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    enabled: open,
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setResult(null);
    setShowPreview(false);

    // Parse file immediately for preview
    try {
      const data = await selected.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      if (jsonRows.length >= 2) {
        // Detect columns from header row
        const headers = jsonRows[0].map((c: any) => String(c ?? ''));
        const colMap = detectColumns(headers);
        if (!colMap) {
          toast.error('Não foi possível identificar as colunas. Verifique se a planilha possui cabeçalhos como PACIENTE, DATA, etc.');
          setRawRows([]);
          return;
        }
        setColumnMap(colMap);
        console.log('[Import] Column mapping detected:', colMap);
        setHeaderRow(headers);
        setRawRows(jsonRows.slice(1));
        setShowPreview(true);
      } else {
        toast.error('Planilha vazia ou sem dados válidos');
        setRawRows([]);
      }
    } catch {
      toast.error('Erro ao ler o arquivo');
      setRawRows([]);
    }
  };

  const handleImport = async () => {
    if (!file || rawRows.length === 0) return;

    setIsLoading(true);
    setResult(null);

    try {
      // Send raw arrays with header row for column detection
      const arrayRows = rawRows.map(row => row.map((cell: any) => String(cell ?? '')));

      const { data: response, error } = await supabase.functions.invoke('import-surgeries', {
        body: { rows: arrayRows, branch, headers: headerRow },
      });

      if (error) throw error;

      setResult({
        success: true,
        inserted: response?.inserted || 0,
        errors: response?.errors,
      });
      setShowPreview(false);

      toast.success(`${response?.inserted || 0} registros importados com sucesso!`);
      refetchBatches();
      queryClient.invalidateQueries({ queryKey: ['clinic-surgeries'] });
      queryClient.invalidateQueries({ queryKey: ['no-date-patients'] });
      queryClient.invalidateQueries({ queryKey: ['clinic-patients'] });
      onSuccess?.();
    } catch (err: any) {
      console.error('Import error:', err);
      setResult({ success: false, errors: [err.message || 'Erro desconhecido'] });
      toast.error('Erro ao importar: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    setDeletingBatch(batchId);
    try {
      const { error } = await supabase
        .from('clinic_surgeries')
        .delete()
        .eq('import_batch_id', batchId);

      if (error) throw error;

      toast.success('Importação removida com sucesso!');
      refetchBatches();
      queryClient.invalidateQueries({ queryKey: ['clinic-surgeries'] });
      onSuccess?.();
    } catch (err: any) {
      console.error('Delete batch error:', err);
      toast.error('Erro ao remover: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setDeletingBatch(null);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setRawRows([]);
    setShowPreview(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={showPreview ? "sm:max-w-4xl max-h-[90vh]" : "sm:max-w-lg"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Importar Agenda Cirúrgica
          </DialogTitle>
          {!showPreview && (
            <DialogDescription>
              Importe dados ou gerencie importações anteriores.
            </DialogDescription>
          )}
        </DialogHeader>

        {showPreview ? (
          /* ===== PREVIEW VIEW ===== */
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)} className="gap-1.5">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Voltar
                </Button>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Pré-visualização</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {previewData.length} registros reconhecidos
                </Badge>
                {rawRows.length - previewData.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {rawRows.length - previewData.length} ignorados
                  </Badge>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-2.5 text-xs text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              Confira como o sistema interpretou os dados antes de confirmar a importação para <strong className="text-foreground">{branch}</strong>.
            </div>

            <ScrollArea className="h-[400px] rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs font-semibold w-[30px]">#</TableHead>
                    <TableHead className="text-xs font-semibold min-w-[140px]">Paciente</TableHead>
                    <TableHead className="text-xs font-semibold">Prontuário</TableHead>
                    <TableHead className="text-xs font-semibold">Procedimento</TableHead>
                    <TableHead className="text-xs font-semibold">Categoria</TableHead>
                    <TableHead className="text-xs font-semibold">Grau</TableHead>
                    <TableHead className="text-xs font-semibold">Data</TableHead>
                    <TableHead className="text-xs font-semibold">Horário</TableHead>
                    <TableHead className="text-xs font-semibold">Confirmado</TableHead>
                    <TableHead className="text-xs font-semibold">VGV</TableHead>
                    <TableHead className="text-xs font-semibold">Médico</TableHead>
                    <TableHead className="text-xs font-semibold">Acompanhante</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, i) => (
                    <TableRow key={i} className="hover:bg-muted/30">
                      <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="text-xs font-medium">{row.patient_name || '-'}</TableCell>
                      <TableCell className="text-xs">{row.medical_record || '-'}</TableCell>
                      <TableCell className="text-xs">{row.procedure || '-'}</TableCell>
                      <TableCell className="text-xs">{row.category || '-'}</TableCell>
                      <TableCell className="text-xs">{row.grade ?? '-'}</TableCell>
                      <TableCell className="text-xs">{formatDateBR(row.surgery_date)}</TableCell>
                      <TableCell className="text-xs">{row.surgery_time || '-'}</TableCell>
                      <TableCell className="text-xs">
                        {row.surgery_confirmed ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <X className="h-3.5 w-3.5 text-muted-foreground/40" />
                        )}
                      </TableCell>
                      <TableCell className="text-xs">{formatVgv(row.vgv)}</TableCell>
                      <TableCell className="text-xs">{row.doctor_on_duty || '-'}</TableCell>
                      <TableCell className="text-xs">{row.companion_name || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button onClick={handleImport} disabled={previewData.length === 0 || isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-1.5" />
                    Confirmar Importação ({previewData.length})
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* ===== TABS VIEW ===== */
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="import" className="flex-1 gap-1.5">
                <Upload className="h-3.5 w-3.5" />
                Importar
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-1 gap-1.5">
                <History className="h-3.5 w-3.5" />
                Histórico
                {importBatches.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1 text-xs">
                    {importBatches.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Import Tab */}
            <TabsContent value="import" className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Filial</Label>
                <Select value={branch} onValueChange={setBranch}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map(b => (
                      <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Arquivo</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                >
                  {file && !showPreview ? (
                    <>
                      <FileSpreadsheet className="h-8 w-8 text-primary" />
                      <span className="text-sm font-medium truncate max-w-full">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB — Clique para trocar
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Clique para selecionar o arquivo</span>
                      <span className="text-xs text-muted-foreground">.xlsx, .xls ou .csv</span>
                    </>
                  )}
                </div>
              </div>

              {result && (
                <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                  result.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                    : 'bg-destructive/10 text-destructive'
                }`}>
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  )}
                  <div>
                    {result.success ? (
                      <p>{result.inserted} registros importados com sucesso.</p>
                    ) : (
                      <p>Erro na importação.</p>
                    )}
                    {result.errors?.map((e, i) => (
                      <p key={i} className="text-xs mt-1 opacity-80">{e}</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                  {result?.success ? 'Fechar' : 'Cancelar'}
                </Button>
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="mt-4">
              {loadingBatches ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Carregando...
                </div>
              ) : importBatches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                  <Package className="h-10 w-10 opacity-40" />
                  <p className="text-sm">Nenhuma importação encontrada</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {importBatches.map((batch) => (
                    <div
                      key={batch.import_batch_id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs shrink-0">
                            {batch.count} registros
                          </Badge>
                          <span className="text-xs text-muted-foreground truncate">
                            {batch.branch}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(batch.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                            disabled={deletingBatch === batch.import_batch_id}
                          >
                            {deletingBatch === batch.import_batch_id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir importação?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Isso removerá permanentemente <strong>{batch.count} registros</strong> importados 
                              em {format(new Date(batch.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} 
                              para <strong>{batch.branch}</strong>. Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteBatch(batch.import_batch_id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir {batch.count} registros
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button variant="outline" onClick={handleClose}>
                  Fechar
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
