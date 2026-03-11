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

const FONTE_LABELS: Record<string, string> = {
  whatsapp: '📱 WhatsApp',
  zoom: '💻 Zoom',
  meet: '🎥 Meet',
  telefone: '📞 Telefone',
  presencial: '🏢 Presencial',
  fireflies: '🔥 Fireflies',
};

type SortKey = 'data_call' | 'closer_name' | 'lead_nome' | 'lead_extracted' | 'produto' | 'fonte_call' | 'status_call' | 'bant' | 'classificacao';
type SortDir = 'asc' | 'desc';

/**
 * Extracts the lead name from a call title.
 * Patterns:
 * - "Dr. Hygor Guerreiro - Dr(a). Rogério Cardoso..." → "Rogério Cardoso..."
 * - "Dr(a). Douglas Aquino - Curso BROWS 360" → "Douglas Aquino"
 * - "Dra. Cassia Senger - Curso Formação 360..." → "Cassia Senger"
 * - Plain name → returns as-is
 */
function extractLeadName(title: string): string {
  if (!title) return '—';

  // If title has " - ", split and try to extract the lead part
  const parts = title.split(' - ');

  // For fireflies pattern: "Closer - Lead - Curso..."
  // Try to find a part that looks like a lead name (has Dr/Dra prefix or is a person name)
  let leadPart = '';

  if (parts.length >= 3) {
    // "Dr. Hygor Guerreiro - Dr(a). Rogério Cardoso - Curso..."
    // The second part is likely the lead
    leadPart = parts[1].trim();
  } else if (parts.length === 2) {
    // Could be "Lead - Curso..." or "Closer - Lead..."
    const firstHasTitle = /^(dr|dra|dr\(a\))\b/i.test(parts[0].trim());
    const secondHasCurso = /curso/i.test(parts[1]);

    if (secondHasCurso) {
      leadPart = parts[0].trim();
    } else {
      leadPart = parts[1].trim();
    }
  } else {
    leadPart = title;
  }

  // Remove "Curso ..." suffix if still present
  leadPart = leadPart.replace(/\s*[-–]\s*Curso\s.*/i, '').trim();
  leadPart = leadPart.replace(/\s*Curso\s.*/i, '').trim();

  // Clean up Dr/Dra/Dr(a) prefix for display
  const cleanName = leadPart
    .replace(/^(Dr\(a\)\.\s*|Dra?\.\s*)/i, '')
    .trim();

  return cleanName || leadPart || '—';
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
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-30" />;
    return sortDir === 'asc'
      ? <ArrowUp className="h-3 w-3 ml-1 text-primary" />
      : <ArrowDown className="h-3 w-3 ml-1 text-primary" />;
  };

  const filtered = useMemo(() => {
    let result = calls.filter(c => {
      const extracted = extractLeadName(c.lead_nome);
      const matchSearch = !search ||
        c.lead_nome.toLowerCase().includes(search.toLowerCase()) ||
        extracted.toLowerCase().includes(search.toLowerCase()) ||
        c.closer_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.produto?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'all' || c.status_call === filterStatus;
      const analysis = getAnalysis(c.id);
      const matchClassificacao = filterClassificacao === 'all' || analysis?.classificacao_lead === filterClassificacao;
      return matchSearch && matchStatus && matchClassificacao;
    });

    result.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
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
          return dir * (a.produto || '').localeCompare(b.produto || '');
        case 'fonte_call':
          return dir * a.fonte_call.localeCompare(b.fonte_call);
        case 'status_call':
          return dir * a.status_call.localeCompare(b.status_call);
        case 'bant': {
          const bantA = getAnalysis(a.id)?.bant_total || 0;
          const bantB = getAnalysis(b.id)?.bant_total || 0;
          return dir * (bantA - bantB);
        }
        case 'classificacao': {
          const order = { quente: 3, morno: 2, frio: 1 };
          const cA = order[getAnalysis(a.id)?.classificacao_lead as keyof typeof order] || 0;
          const cB = order[getAnalysis(b.id)?.classificacao_lead as keyof typeof order] || 0;
          return dir * (cA - cB);
        }
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button onClick={() => toggleSort('data_call')} className="flex items-center text-xs font-semibold hover:text-primary transition-colors">
                    Data <SortIcon col="data_call" />
                  </button>
                </TableHead>
                <TableHead>
                  <button onClick={() => toggleSort('closer_name')} className="flex items-center text-xs font-semibold hover:text-primary transition-colors">
                    Closer <SortIcon col="closer_name" />
                  </button>
                </TableHead>
                <TableHead>
                  <button onClick={() => toggleSort('lead_extracted')} className="flex items-center text-xs font-semibold hover:text-primary transition-colors">
                    Lead <SortIcon col="lead_extracted" />
                  </button>
                </TableHead>
                <TableHead>
                  <button onClick={() => toggleSort('lead_nome')} className="flex items-center text-xs font-semibold hover:text-primary transition-colors">
                    Título <SortIcon col="lead_nome" />
                  </button>
                </TableHead>
                <TableHead>
                  <button onClick={() => toggleSort('produto')} className="flex items-center text-xs font-semibold hover:text-primary transition-colors">
                    Produto <SortIcon col="produto" />
                  </button>
                </TableHead>
                <TableHead>
                  <button onClick={() => toggleSort('fonte_call')} className="flex items-center text-xs font-semibold hover:text-primary transition-colors">
                    Fonte <SortIcon col="fonte_call" />
                  </button>
                </TableHead>
                <TableHead>
                  <div className="space-y-1">
                    <button onClick={() => toggleSort('status_call')} className="flex items-center text-xs font-semibold hover:text-primary transition-colors">
                      Status <SortIcon col="status_call" />
                    </button>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="h-6 text-[10px] w-[100px] border-dashed">
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
                <TableHead className="text-center">
                  <button onClick={() => toggleSort('bant')} className="flex items-center justify-center text-xs font-semibold hover:text-primary transition-colors mx-auto">
                    BANT <SortIcon col="bant" />
                  </button>
                </TableHead>
                <TableHead>
                  <div className="space-y-1">
                    <button onClick={() => toggleSort('classificacao')} className="flex items-center text-xs font-semibold hover:text-primary transition-colors">
                      Class. <SortIcon col="classificacao" />
                    </button>
                    <Select value={filterClassificacao} onValueChange={setFilterClassificacao}>
                      <SelectTrigger className="h-6 text-[10px] w-[100px] border-dashed">
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
                <TableHead className="text-right text-xs font-semibold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    {calls.length === 0 ? 'Nenhuma call registrada ainda' : 'Nenhuma call encontrada com os filtros'}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(call => {
                  const analysis = getAnalysis(call.id);
                  const status = STATUS_LABELS[call.status_call] || { label: call.status_call, color: 'bg-muted' };
                  const extractedLead = extractLeadName(call.lead_nome);
                  return (
                    <TableRow key={call.id}>
                      <TableCell className="text-sm whitespace-nowrap">
                        {format(new Date(call.data_call), 'dd/MM/yy HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-medium text-sm">{call.closer_name || '—'}</TableCell>
                      <TableCell className="font-medium text-sm text-primary">{extractedLead}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[250px] truncate" title={call.lead_nome}>
                        {call.lead_nome}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{call.produto || '—'}</TableCell>
                      <TableCell className="text-xs">{FONTE_LABELS[call.fonte_call] || call.fonte_call}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${status.color}`} variant="secondary">{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {analysis ? (
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                            (analysis.bant_total || 0) >= 30 ? 'bg-emerald-100 text-emerald-700' :
                            (analysis.bant_total || 0) >= 20 ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {analysis.bant_total}
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        {analysis ? (
                          <span className="flex items-center gap-1 text-xs">
                            {analysis.classificacao_lead === 'quente' && <><Flame className="h-3 w-3 text-red-500" /> Quente</>}
                            {analysis.classificacao_lead === 'morno' && <><Sun className="h-3 w-3 text-amber-500" /> Morno</>}
                            {analysis.classificacao_lead === 'frio' && <><Snowflake className="h-3 w-3 text-blue-500" /> Frio</>}
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1.5 justify-end">
                          {call.has_analysis ? (
                            <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => onViewAnalysis(call.id)}>
                              <Eye className="h-3 w-3" /> Ver
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="gap-1 text-xs"
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
        </CardContent>
      </Card>
    </div>
  );
}
