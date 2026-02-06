import { useState, useRef, useCallback } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, Loader2, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface ParsedLead {
  name: string;
  phone: string;
  email: string;
  state: string;
  city: string;
  tags: string[];
}

interface LeadImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (leads: ParsedLead[]) => Promise<{ success: number; errors: number }>;
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

/**
 * Find the value for a field using flexible matching against normalized keys.
 * Tries exact match, then starts-with, then contains.
 */
function findValue(normalized: Record<string, string>, possibleNames: string[]): string {
  const keys = Object.keys(normalized);
  const targets = possibleNames.map(n => normalizeHeader(n));

  // Priority 1: Exact match
  for (const target of targets) {
    if (normalized[target] !== undefined) return normalized[target];
  }

  // Priority 2: Starts with
  for (const target of targets) {
    const key = keys.find(k => k.startsWith(target));
    if (key) return normalized[key];
  }

  // Priority 3: Contains
  for (const target of targets) {
    const key = keys.find(k => k.includes(target));
    if (key) return normalized[key];
  }

  return '';
}

/**
 * Collect ALL tag-like columns from a row (some spreadsheets split tags across multiple columns).
 */
function collectTags(normalized: Record<string, string>): string {
  const tagParts: string[] = [];
  
  for (const [key, value] of Object.entries(normalized)) {
    if ((key.includes('tag') || key.includes('etiqueta')) && value) {
      tagParts.push(value);
    }
  }
  
  return tagParts.join(', ');
}

/**
 * Parse the "Lead tags" column value into an array of tags.
 * Handles comma-separated, #-separated, and space-separated tags.
 * Filters out #GRAU and empty values.
 */
function parseTags(raw: string): string[] {
  if (!raw) return [];
  
  // Split by comma, #, or semicolon
  const tags = raw
    .split(/[,;#]/)
    .map(t => t.trim())
    .filter(t => t.length > 0 && t !== 'GRAU' && t !== 'N/A' && t !== 'N A');
  
  return [...new Set(tags)]; // dedupe
}

function mapRow(row: Record<string, any>): ParsedLead | null {
  const normalized: Record<string, string> = {};
  Object.entries(row).forEach(([key, value]) => {
    normalized[normalizeHeader(key)] = String(value || '').trim();
  });

  // Map spreadsheet columns with flexible matching
  const name = findValue(normalized, ['nome', 'contato principal', 'contato', 'name']);
  const phone = findValue(normalized, ['telefone', 'telefone comercial', 'telefone comercial contato', 'phone', 'celular', 'whatsapp']);
  const email = findValue(normalized, ['email', 'email formulario', 'e-mail', 'e mail']);
  const state = findValue(normalized, ['estado', 'estado do lead', 'uf', 'state']);
  const city = findValue(normalized, ['cidade', 'cidade principal', 'city', 'municipio']);
  const tagsRaw = collectTags(normalized) || findValue(normalized, ['lead tags', 'tags', 'etiquetas', 'tag']);

  if (!name || !phone) return null;

  return { name, phone, email, state, city, tags: parseTags(tagsRaw) };
}

export function LeadImportDialog({ open, onOpenChange, onImport }: LeadImportDialogProps) {
  const [parsedLeads, setParsedLeads] = useState<ParsedLead[]>([]);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setParsedLeads([]);
    setFileName('');
    setParseError('');
    setResult(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  // Download template spreadsheet
  const downloadTemplate = useCallback(() => {
    const templateData = [
      { 'Contato principal': 'João Silva', 'Telefone comercial (contato)': '11999998888', 'EMAIL (FORMULÁRIO)': 'joao@email.com', 'ESTADO DO LEAD': 'SP', 'CIDADE PRINCIPAL': 'São Paulo', 'Lead tags': '' },
      { 'Contato principal': 'Maria Santos', 'Telefone comercial (contato)': '21988887777', 'EMAIL (FORMULÁRIO)': 'maria@email.com', 'ESTADO DO LEAD': 'RJ', 'CIDADE PRINCIPAL': 'Rio de Janeiro', 'Lead tags': 'Oportunidade, #DISPARO_OPERAÇÃO' },
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');
    
    worksheet['!cols'] = [
      { wch: 25 },
      { wch: 22 },
      { wch: 30 },
      { wch: 15 },
      { wch: 20 },
      { wch: 35 },
    ];
    
    XLSX.writeFile(workbook, 'modelo_hotleads.xlsx');
    toast.success('Modelo baixado com sucesso!');
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParseError('');
    setResult(null);
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

        // Validate required columns exist
        const headers = Object.keys(json[0]).map(normalizeHeader);
        const hasName = headers.some(h => h === 'nome' || h === 'contato principal');
        const hasPhone = headers.some(h => h.includes('telefone'));
        
        if (!hasName || !hasPhone) {
          setParseError('Colunas obrigatórias ausentes: necessário "Contato principal" (ou "Nome") e "Telefone"');
          return;
        }

        const mapped = json.map(mapRow).filter(Boolean) as ParsedLead[];
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
    const res = await onImport(parsedLeads);
    setResult(res);
    setIsImporting(false);

    if (res.success > 0) {
      toast.success(`${res.success} leads importados com sucesso!`);
    }
    if (res.errors > 0) {
      toast.error(`${res.errors} leads com erro na importação.`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
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
            Envie um arquivo .xls, .xlsx ou .csv com as colunas: Contato principal, Telefone, Email, Estado, Cidade, Lead tags
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* File input */}
          {!result && (
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

          {/* Preview */}
          {parsedLeads.length > 0 && !result && (
            <div>
              <p className="text-sm font-medium mb-2">
                {parsedLeads.length} leads encontrados. Preview:
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
                      <th className="text-left p-2">Tags</th>
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
                        <td className="p-2">
                          {l.tags.length > 0 ? l.tags.join(', ') : '-'}
                        </td>
                      </tr>
                    ))}
                    {parsedLeads.length > 20 && (
                      <tr className="border-t">
                        <td colSpan={6} className="p-2 text-center text-muted-foreground">
                          ... e mais {parsedLeads.length - 20} leads
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
                  {result.success} importados com sucesso
                  {result.errors > 0 && ` • ${result.errors} com erro`}
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
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button
                onClick={handleImport}
                disabled={parsedLeads.length === 0 || isImporting}
              >
                {isImporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Importar {parsedLeads.length} leads
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}