import { useState, useMemo } from 'react';
import type { SalesCall, CallAnalysisRecord } from '@/hooks/useCallIntelligence';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, Eye, Loader2, Search, Flame, Snowflake, Sun, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  calls: SalesCall[];
  analyses: CallAnalysisRecord[];
  isLoading: boolean;
  isAnalyzing: boolean;
  onAnalyze: (callId: string) => void;
  onViewAnalysis: (callId: string) => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  fechou: { label: 'Fechou ✅', color: 'bg-emerald-100 text-emerald-800' },
  followup: { label: 'Follow-up 📋', color: 'bg-amber-100 text-amber-800' },
  perdido: { label: 'Perdido ❌', color: 'bg-red-100 text-red-800' },
};

const PRODUCT_COLORS: Record<string, string> = {
  'Formação 360': 'bg-blue-100 text-blue-800',
  'BROWS 360': 'bg-purple-100 text-purple-800',
  'Brows Transplant 360': 'bg-purple-100 text-purple-800',
  'Conecta Capilar': 'bg-teal-100 text-teal-800',
  'Fellowship': 'bg-indigo-100 text-indigo-800',
  'Licença': 'bg-orange-100 text-orange-800',
  'Avivar': 'bg-rose-100 text-rose-800',
};

function getProductColor(product: string): string {
  if (!product || product === '—') return '';
  for (const [key, color] of Object.entries(PRODUCT_COLORS)) {
    if (product.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return 'bg-muted text-muted-foreground';
}

type SortKey = 'data_call' | 'closer_name' | 'lead_nome' | 'lead_extracted' | 'produto' | 'status_call' | 'bant_b' | 'bant_a' | 'bant_n' | 'bant_t' | 'bant_total' | 'classificacao' | 'cl_impacto' | 'cl_spin' | 'cl_emocional' | 'cl_pitch' | 'cl_gatilhos' | 'cl_fala' | 'cl_fechamento' | 'cl_total';
type SortDir = 'asc' | 'desc';

function extractLeadName(title: string): string {
  if (!title) return '—';
  const parts = title.split(' - ');
  let leadPart = '';
  if (parts.length >= 3) {
    leadPart = parts[1].trim();
  } else if (parts.length === 2) {
    const secondHasCurso = /curso/i.test(parts[1]);
    leadPart = secondHasCurso ? parts[0].trim() : parts[1].trim();
  } else {
    leadPart = title;
  }
  leadPart = leadPart.replace(/\s*[-–]\s*Curso\s.*/i, '').trim();
  leadPart = leadPart.replace(/\s*Curso\s.*/i, '').trim();
  const cleanName = leadPart.replace(/^(Dr\(a\)\.\s*|Dra?\.\s*)/i, '').trim();
  return cleanName || leadPart || '—';
}

/** Extract product from call title or transcription */
function extractProduct(call: SalesCall): string {
  // First check if produto is already set
  if (call.produto && call.produto.trim()) return call.produto;

  const title = call.lead_nome || '';
  const transcript = call.transcricao || '';
  const resumo = call.resumo_manual || '';
  const allText = `${title} ${transcript.slice(0, 2000)} ${resumo}`;

  // Known product patterns
  const productPatterns = [
    /Curso\s+(Formação\s+360)/i,
    /Curso\s+(BROWS\s+360)/i,
    /Curso\s+(Harmonização)/i,
    /(Formação\s+360)/i,
    /(BROWS\s+360)/i,
    /(Harmonização\s+Orofacial)/i,
    /(Harmonização)/i,
    /(Botox)/i,
    /(Preenchimento)/i,
    /Curso\s+([A-ZÀ-Ú][a-zà-ú]*(?:\s+[A-ZÀ-Ú0-9][a-zà-ú0-9]*){0,3})/,
  ];

  for (const pattern of productPatterns) {
    const match = allText.match(pattern);
    if (match && match[1]) return match[1].trim();
  }

  // Try extracting "Curso ..." from title parts
  for (const part of title.split(' - ')) {
    const cursoMatch = part.trim().match(/^Curso\s+(.+)/i);
    if (cursoMatch) return cursoMatch[1].trim();
  }

  return '—';
}

export function CallListTab({ calls, analyses, isLoading, isAnalyzing, onAnalyze, onViewAnalysis }: Props) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterClassificacao, setFilterClassificacao] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('data_call');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const getAnalysis = (callId: string) => analyses.find(a => a.call_id === callId);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 ml-0.5 opacity-30" />;
    return sortDir === 'asc'
      ? <ArrowUp className="h-3 w-3 ml-0.5 text-primary" />
      : <ArrowDown className="h-3 w-3 ml-0.5 text-primary" />;
  };

  const SortableHeader = ({ col, label, className }: { col: SortKey; label: string; className?: string }) => (
    <button onClick={() => toggleSort(col)} className={`flex items-center text-xs font-semibold hover:text-primary transition-colors whitespace-nowrap ${className || ''}`}>
      {label} <SortIcon col={col} />
    </button>
  );

  const filtered = useMemo(() => {
    let result = calls.filter(c => {
      const extracted = extractLeadName(c.lead_nome);
      const product = extractProduct(c);
      const matchSearch = !search ||
        c.lead_nome.toLowerCase().includes(search.toLowerCase()) ||
        extracted.toLowerCase().includes(search.toLowerCase()) ||
        c.closer_name?.toLowerCase().includes(search.toLowerCase()) ||
        product.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'all' || c.status_call === filterStatus;
      const analysis = getAnalysis(c.id);
      const matchClassificacao = filterClassificacao === 'all' || analysis?.classificacao_lead === filterClassificacao;
      return matchSearch && matchStatus && matchClassificacao;
    });

    result.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      const aA = getAnalysis(a.id);
      const bA = getAnalysis(b.id);
      switch (sortKey) {
        case 'data_call':
          return dir * (new Date(a.data_call).getTime() - new Date(b.data_call).getTime());
        case 'closer_name':
          return dir * (a.closer_name || '').localeCompare(b.closer_name || '');
        case 'lead_nome':
          return dir * a.lead_nome.localeCompare(b.lead_nome);
        case 'lead_extracted':
          return dir * extractLeadName(a.lead_nome).localeCompare(extractLeadName(b.lead_nome));
        case 'produto':
          return dir * extractProduct(a).localeCompare(extractProduct(b));
        case 'status_call':
          return dir * a.status_call.localeCompare(b.status_call);
        case 'bant_b':
          return dir * ((aA?.bant_budget || 0) - (bA?.bant_budget || 0));
        case 'bant_a':
          return dir * ((aA?.bant_authority || 0) - (bA?.bant_authority || 0));
        case 'bant_n':
          return dir * ((aA?.bant_need || 0) - (bA?.bant_need || 0));
        case 'bant_t':
          return dir * ((aA?.bant_timeline || 0) - (bA?.bant_timeline || 0));
        case 'bant_total':
          return dir * ((aA?.bant_total || 0) - (bA?.bant_total || 0));
        case 'classificacao': {
          const order = { quente: 3, morno: 2, frio: 1 };
          return dir * ((order[aA?.classificacao_lead as keyof typeof order] || 0) - (order[bA?.classificacao_lead as keyof typeof order] || 0));
        }
        case 'cl_impacto':
          return dir * ((aA?.closer_primeiro_impacto || 0) - (bA?.closer_primeiro_impacto || 0));
        case 'cl_spin':
          return dir * ((aA?.closer_exploracao_spin || 0) - (bA?.closer_exploracao_spin || 0));
        case 'cl_emocional':
          return dir * ((aA?.closer_conexao_emocional || 0) - (bA?.closer_conexao_emocional || 0));
        case 'cl_pitch':
          return dir * ((aA?.closer_clareza_pitch || 0) - (bA?.closer_clareza_pitch || 0));
        case 'cl_gatilhos':
          return dir * ((aA?.closer_gatilhos_mentais || 0) - (bA?.closer_gatilhos_mentais || 0));
        case 'cl_fala':
          return dir * ((aA?.closer_gestao_fala || 0) - (bA?.closer_gestao_fala || 0));
        case 'cl_fechamento':
          return dir * ((aA?.closer_fechamento || 0) - (bA?.closer_fechamento || 0));
        case 'cl_total':
          return dir * ((aA?.closer_score_total || 0) - (bA?.closer_score_total || 0));
        default:
          return 0;
      }
    });

    return result;
  }, [calls, analyses, search, filterStatus, filterClassificacao, sortKey, sortDir]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const BantCell = ({ value }: { value: number | undefined }) => {
    if (value === undefined || value === null) return <span className="text-muted-foreground">—</span>;
    const color = value >= 8 ? 'text-emerald-700' : value >= 5 ? 'text-amber-700' : 'text-red-700';
    return <span className={`text-xs font-semibold ${color}`}>{value}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por lead, closer ou produto..."
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[110px]"><SortableHeader col="data_call" label="Data" /></TableHead>
                  <TableHead className="w-[130px]"><SortableHeader col="closer_name" label="Closer" /></TableHead>
                  <TableHead className="w-[160px]"><SortableHeader col="lead_extracted" label="Lead" /></TableHead>
                  <TableHead className="w-[220px]"><SortableHeader col="lead_nome" label="Título" /></TableHead>
                  <TableHead className="w-[140px]"><SortableHeader col="produto" label="Produto" /></TableHead>
                  <TableHead className="w-[100px]">
                    <div className="space-y-1">
                      <SortableHeader col="status_call" label="Status" />
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="h-6 text-[10px] w-[90px] border-dashed">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="fechou">Fechou</SelectItem>
                          <SelectItem value="followup">Follow-up</SelectItem>
                          <SelectItem value="perdido">Perdido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableHead>
                  <TableHead className="w-[40px]"><SortableHeader col="bant_b" label="B" /></TableHead>
                  <TableHead className="w-[40px]"><SortableHeader col="bant_a" label="A" /></TableHead>
                  <TableHead className="w-[40px]"><SortableHeader col="bant_n" label="N" /></TableHead>
                  <TableHead className="w-[40px]"><SortableHeader col="bant_t" label="T" /></TableHead>
                  <TableHead className="w-[50px]"><SortableHeader col="bant_total" label="Total" /></TableHead>
                  <TableHead className="w-[100px]">
                    <div className="space-y-1">
                      <SortableHeader col="classificacao" label="Class." />
                      <Select value={filterClassificacao} onValueChange={setFilterClassificacao}>
                        <SelectTrigger className="h-6 text-[10px] w-[90px] border-dashed">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="quente">🔥 Quente</SelectItem>
                          <SelectItem value="morno">☀️ Morno</SelectItem>
                          <SelectItem value="frio">❄️ Frio</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableHead>
                  <TableHead className="w-[40px]"><SortableHeader col="cl_impacto" label="Imp." /></TableHead>
                  <TableHead className="w-[40px]"><SortableHeader col="cl_spin" label="SPIN" /></TableHead>
                  <TableHead className="w-[40px]"><SortableHeader col="cl_emocional" label="Emo." /></TableHead>
                  <TableHead className="w-[40px]"><SortableHeader col="cl_pitch" label="Pitch" /></TableHead>
                  <TableHead className="w-[40px]"><SortableHeader col="cl_gatilhos" label="Gat." /></TableHead>
                  <TableHead className="w-[40px]"><SortableHeader col="cl_fala" label="Fala" /></TableHead>
                  <TableHead className="w-[40px]"><SortableHeader col="cl_fechamento" label="Fech." /></TableHead>
                  <TableHead className="w-[50px]"><SortableHeader col="cl_total" label="Score" /></TableHead>
                  <TableHead className="w-[80px] text-xs font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={21} className="text-center py-8 text-muted-foreground">
                      {calls.length === 0 ? 'Nenhuma call registrada ainda' : 'Nenhuma call encontrada com os filtros'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(call => {
                    const analysis = getAnalysis(call.id);
                    const status = STATUS_LABELS[call.status_call] || { label: call.status_call, color: 'bg-muted' };
                    const extractedLead = extractLeadName(call.lead_nome);
                    const product = extractProduct(call);
                    return (
                      <TableRow key={call.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {format(new Date(call.data_call), 'dd/MM/yy HH:mm', { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-xs font-medium">{call.closer_name || '—'}</TableCell>
                        <TableCell className="text-xs font-medium text-primary">{extractedLead}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[220px] truncate" title={call.lead_nome}>
                          {call.lead_nome}
                        </TableCell>
                        <TableCell className="text-xs">{product}</TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] ${status.color}`} variant="secondary">{status.label}</Badge>
                        </TableCell>
                        <TableCell><BantCell value={analysis?.bant_budget} /></TableCell>
                        <TableCell><BantCell value={analysis?.bant_authority} /></TableCell>
                        <TableCell><BantCell value={analysis?.bant_need} /></TableCell>
                        <TableCell><BantCell value={analysis?.bant_timeline} /></TableCell>
                        <TableCell>
                          {analysis ? (
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-bold ${
                              (analysis.bant_total || 0) >= 30 ? 'bg-emerald-100 text-emerald-700' :
                              (analysis.bant_total || 0) >= 20 ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {analysis.bant_total}
                            </span>
                          ) : <span className="text-muted-foreground text-xs">—</span>}
                        </TableCell>
                        <TableCell>
                          {analysis ? (
                            <span className="flex items-center gap-1 text-xs whitespace-nowrap">
                              {analysis.classificacao_lead === 'quente' && <><Flame className="h-3 w-3 text-red-500" /> Quente</>}
                              {analysis.classificacao_lead === 'morno' && <><Sun className="h-3 w-3 text-amber-500" /> Morno</>}
                              {analysis.classificacao_lead === 'frio' && <><Snowflake className="h-3 w-3 text-blue-500" /> Frio</>}
                            </span>
                          ) : <span className="text-muted-foreground text-xs">—</span>}
                        </TableCell>
                        <TableCell><BantCell value={analysis?.closer_primeiro_impacto} /></TableCell>
                        <TableCell><BantCell value={analysis?.closer_exploracao_spin} /></TableCell>
                        <TableCell><BantCell value={analysis?.closer_conexao_emocional} /></TableCell>
                        <TableCell><BantCell value={analysis?.closer_clareza_pitch} /></TableCell>
                        <TableCell><BantCell value={analysis?.closer_gatilhos_mentais} /></TableCell>
                        <TableCell><BantCell value={analysis?.closer_gestao_fala} /></TableCell>
                        <TableCell><BantCell value={analysis?.closer_fechamento} /></TableCell>
                        <TableCell>
                          {analysis?.closer_score_total ? (
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-bold ${
                              analysis.closer_score_total >= 50 ? 'bg-emerald-100 text-emerald-700' :
                              analysis.closer_score_total >= 35 ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {analysis.closer_score_total}
                            </span>
                          ) : <span className="text-muted-foreground text-xs">—</span>}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {call.has_analysis ? (
                              <Button size="sm" variant="outline" className="gap-1 text-[10px] h-7 px-2" onClick={() => onViewAnalysis(call.id)}>
                                <Eye className="h-3 w-3" /> Ver
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                className="gap-1 text-[10px] h-7 px-2"
                                disabled={isAnalyzing || !(call.transcricao || call.resumo_manual)}
                                onClick={() => onAnalyze(call.id)}
                              >
                                {isAnalyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Brain className="h-3 w-3" />}
                                Analisar
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
