import { useState, useRef, useCallback } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, FileSpreadsheet, Loader2, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

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

interface LeadImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (
    leads: ParsedLead[],
    onProgress?: (progress: ImportProgress) => void,
  ) => Promise<{ success: number; errors: number }>;
}

const REQUIRED_COLUMNS = ['nome', 'telefone'];

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_\s]+/g, ' ')
    .trim();
}

function findValue(normalized: Record<string, string>, possibleNames: string[]): string {
  const keys = Object.keys(normalized);
  const targets = possibleNames.map(n => normalizeHeader(n));

  for (const target of targets) {
    if (normalized[target] !== undefined) return normalized[target];
  }
  for (const target of targets) {
    const key = keys.find(k => k.startsWith(target));
    if (key) return normalized[key];
  }
  for (const target of targets) {
    const key = keys.find(k => k.includes(target));
    if (key) return normalized[key];
  }
  return '';
}

const KNOWN_FIELD_KEYWORDS = [
  'nome', 'contato', 'name',
  'telefone', 'phone', 'celular', 'whatsapp', 'fone',
  'email', 'e-mail', 'e mail', 'mail',
  'estado', 'uf', 'state',
  'cidade', 'city', 'municipio',
  'source', 'fonte', 'origem',
  'status', 'situacao',
  'id', 'codigo', 'code',
  'data', 'date', 'created', 'criado',
  'cpf', 'cnpj', 'rg', 'documento',
  'endereco', 'address', 'cep', 'bairro', 'rua', 'numero', 'complemento',
  'observacao', 'obs', 'nota', 'note', 'comment',
];

const TAG_KEYWORDS = ['tag', 'etiqueta', 'rotulo', 'label', 'marcador', 'classificacao', 'categoria', 'segmento', 'grupo'];

function collectTags(normalized: Record<string, string>): string {
  const tagParts: string[] = [];
  
  for (const [key, value] of Object.entries(normalized)) {
    if (value && TAG_KEYWORDS.some(kw => key.includes(kw))) {
      tagParts.push(value);
    }
  }
  
  if (tagParts.length > 0) return tagParts.join(', ');
  
  for (const [key, value] of Object.entries(normalized)) {
    if (!value) continue;
    const isKnown = KNOWN_FIELD_KEYWORDS.some(kw => key.includes(kw));
    if (!isKnown && key.length > 0) {
      const trimmed = value.trim();
      if (trimmed.length > 0 && trimmed.length < 200 && !/^\d+$/.test(trimmed)) {
        tagParts.push(trimmed);
      }
    }
  }
  
  return tagParts.join(', ');
}

function parseTags(raw: string): string[] {
  if (!raw) return [];
  
  const NOISE = new Set(['N/A', 'N A', 'undefined', 'null', 'none', '-', '']);
  
  let tags: string[];
  
  if (raw.includes(',') || raw.includes(';') || raw.includes('|')) {
    tags = raw.split(/[,;|]/).map(t => t.trim());
  } else if (raw.includes('#')) {
    tags = raw.match(/#[^#,;|]+/g)?.map(t => t.trim()) || [raw.trim()];
  } else {
    tags = [raw.trim()];
  }
  
  return [...new Set(tags.filter(t => t.length > 0 && !NOISE.has(t)))];
}

function mapRow(row: Record<string, any>, rowIndex?: number): ParsedLead | null {
  if (rowIndex === 0) {
    console.log('[HotLeads Import] Raw column headers:', Object.keys(row));
  }

  const normalized: Record<string, string> = {};
  Object.entries(row).forEach(([key, value]) => {
    const nk = normalizeHeader(key);
    const nv = String(value ?? '').trim();
    normalized[nk] = nv;
  });

  if (rowIndex === 0) {
    console.log('[HotLeads Import] Normalized keys:', Object.keys(normalized));
  }

  const name = findValue(normalized, ['nome', 'contato principal', 'contato', 'name']);
  const phone = findValue(normalized, ['telefone', 'telefone comercial', 'telefone comercial contato', 'phone', 'celular', 'whatsapp']);
  const email = findValue(normalized, ['email', 'email formulario', 'e-mail', 'e mail']);
  const state = findValue(normalized, ['estado', 'estado do lead', 'uf', 'state']);
  const city = findValue(normalized, ['cidade', 'cidade principal', 'city', 'municipio']);

  if (!name || !phone) return null;

  return { name, phone, email, state, city };
}

function formatNumber(n: number): string {
  return n.toLocaleString('pt-BR');
}

export function LeadImportDialog({ open, onOpenChange, onImport }: LeadImportDialogProps) {
  const [parsedLeads, setParsedLeads] = useState<ParsedLead[]>([]);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [result, setResult] = useState<{ success: number; errors: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setParsedLeads([]);
    setFileName('');
    setParseError('');
    setResult(null);
    setProgress(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const downloadTemplate = useCallback(() => {
    const templateData = [
      { 'Contato principal': 'João Silva', 'Telefone comercial (contato)': '11999998888', 'EMAIL (FORMULÁRIO)': 'joao@email.com', 'ESTADO DO LEAD': 'SP', 'CIDADE PRINCIPAL': 'São Paulo', 'Lead tags': '' },
      { 'Contato principal': 'Maria Santos', 'Telefone comercial (contato)': '21988887777', 'EMAIL (FORMULÁRIO)': 'maria@email.com', 'ESTADO DO LEAD': 'RJ', 'CIDADE PRINCIPAL': 'Rio de Janeiro', 'Lead tags': 'Oportunidade, #DISPARO_OPERAÇÃO' },
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');
    
    worksheet['!cols'] = [
      { wch: 25 }, { wch: 22 }, { wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 35 },
    ];
    
    XLSX.writeFile(workbook, 'modelo_hotleads.xlsx');
    toast.success('Modelo baixado com sucesso!');
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParseError('');
    setResult(null);
    setProgress(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

        if (json.length === 0) {
          setParseError('A planilha está vazia.');
          return;
        }

        const rawHeaders = Object.keys(json[0]);
        const headers = rawHeaders.map(normalizeHeader);
        const hasName = headers.some(h => h === 'nome' || h.includes('contato'));
        const hasPhone = headers.some(h => h.includes('telefone') || h.includes('phone') || h.includes('celular') || h.includes('whatsapp') || h.includes('fone'));
        
        if (!hasName || !hasPhone) {
          setParseError('Colunas obrigatórias ausentes: necessário "Contato principal" (ou "Nome") e "Telefone"');
          return;
        }

        const mapped = json.map((row, idx) => mapRow(row, idx)).filter(Boolean) as ParsedLead[];
        if (mapped.length === 0) {
          setParseError('Nenhum lead válido encontrado (nome e telefone são obrigatórios).');
          return;
        }

        setParsedLeads(mapped);
      } catch {
        setParseError('Erro ao ler o arquivo. Verifique o formato.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    setIsImporting(true);
    setProgress({ current: 0, total: parsedLeads.length, success: 0, errors: 0 });
    const res = await onImport(parsedLeads, (p) => setProgress(p));
    // Keep final progress visible briefly before showing result
    setProgress(prev => prev ? { ...prev, current: prev.total } : null);
    await new Promise(r => setTimeout(r, 800));
    setResult(res);
    setProgress(null);
    setIsImporting(false);

    if (res.success > 0) {
      toast.success(`${formatNumber(res.success)} leads importados com sucesso!`);
    }
    if (res.errors > 0) {
      toast.error(`${formatNumber(res.errors)} leads com erro na importação.`);
    }
  };

  const progressPercent = progress
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !isImporting) { reset(); onOpenChange(v); } }}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
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
          {/* File input */}
          {!result && !isImporting && (
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
          )}

          {/* Error */}
          {parseError && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg text-destructive text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {parseError}
            </div>
          )}

          {/* Import Progress */}
          {isImporting && progress && (
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

          {/* Preview */}
          {parsedLeads.length > 0 && !result && !isImporting && (
            <div>
              <p className="text-sm font-medium mb-2">
                {formatNumber(parsedLeads.length)} leads encontrados. Preview:
              </p>
              <div className="border rounded-lg overflow-auto max-h-60">
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
                    {parsedLeads.slice(0, 20).map((l, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2">{l.name}</td>
                        <td className="p-2">{l.phone}</td>
                        <td className="p-2">{l.email}</td>
                        <td className="p-2">{l.state}</td>
                        <td className="p-2">{l.city}</td>
                      </tr>
                    ))}
                    {parsedLeads.length > 20 && (
                      <tr className="border-t">
                        <td colSpan={5} className="p-2 text-center text-muted-foreground">
                          ... e mais {formatNumber(parsedLeads.length - 20)} leads
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="flex items-start gap-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Importação concluída!</p>
                <p className="text-muted-foreground mt-1">
                  {formatNumber(result.success)} importados com sucesso
                  {result.errors > 0 && ` • ${formatNumber(result.errors)} com erro`}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {result ? (
            <Button onClick={() => { reset(); onOpenChange(false); }}>Fechar</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isImporting}>
                Cancelar
              </Button>
              <Button
                onClick={handleImport}
                disabled={parsedLeads.length === 0 || isImporting}
              >
                {isImporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Importar {formatNumber(parsedLeads.length)} leads
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}