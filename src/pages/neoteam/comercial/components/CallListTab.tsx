import { useState } from 'react';
import type { SalesCall, CallAnalysisRecord } from '@/hooks/useCallIntelligence';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, Eye, Loader2, Search, Flame, Snowflake, Sun } from 'lucide-react';
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
};

export function CallListTab({ calls, analyses, isLoading, isAnalyzing, onAnalyze, onViewAnalysis }: Props) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterClassificacao, setFilterClassificacao] = useState<string>('all');

  const getAnalysis = (callId: string) => analyses.find(a => a.call_id === callId);

  const filtered = calls.filter(c => {
    const matchSearch = !search ||
      c.lead_nome.toLowerCase().includes(search.toLowerCase()) ||
      c.closer_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.produto?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.status_call === filterStatus;
    const analysis = getAnalysis(c.id);
    const matchClassificacao = filterClassificacao === 'all' || analysis?.classificacao_lead === filterClassificacao;
    return matchSearch && matchStatus && matchClassificacao;
  });

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
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por lead, closer ou produto..."
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="fechou">Fechou</SelectItem>
            <SelectItem value="followup">Follow-up</SelectItem>
            <SelectItem value="perdido">Perdido</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterClassificacao} onValueChange={setFilterClassificacao}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Classificação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas classificações</SelectItem>
            <SelectItem value="quente">🔥 Quente</SelectItem>
            <SelectItem value="morno">☀️ Morno</SelectItem>
            <SelectItem value="frio">❄️ Frio</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Closer</TableHead>
                <TableHead>Lead</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Fonte</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">BANT</TableHead>
                <TableHead>Lead</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {calls.length === 0 ? 'Nenhuma call registrada ainda' : 'Nenhuma call encontrada com os filtros'}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(call => {
                  const analysis = getAnalysis(call.id);
                  const status = STATUS_LABELS[call.status_call] || { label: call.status_call, color: 'bg-muted' };
                  return (
                    <TableRow key={call.id}>
                      <TableCell className="text-sm whitespace-nowrap">
                        {format(new Date(call.data_call), 'dd/MM/yy HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-medium text-sm">{call.closer_name || '—'}</TableCell>
                      <TableCell className="font-medium text-sm">{call.lead_nome}</TableCell>
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
