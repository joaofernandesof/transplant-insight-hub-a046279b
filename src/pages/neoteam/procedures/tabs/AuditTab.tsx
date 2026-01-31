/**
 * Audit Tab - Audit logs and divergences
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Search, 
  FileSearch,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DIVERGENCE_STATUS_LABELS, ConsumptionDivergenceStatus } from '../types';

const DIVERGENCE_ICONS: Record<ConsumptionDivergenceStatus, React.ReactNode> = {
  pendente: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  aprovado: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  rejeitado: <XCircle className="h-4 w-4 text-red-500" />
};

// Mock data for demonstration
const MOCK_DIVERGENCES = [
  {
    id: '1',
    date: new Date(),
    patient: 'João Silva',
    procedure: 'Mesoterapia Capilar',
    item: 'Minoxidil 5%',
    expected: 2,
    used: 3,
    reason: 'Área maior que o previsto',
    status: 'pendente' as ConsumptionDivergenceStatus,
    user: 'Maria Enfermeira'
  },
  {
    id: '2',
    date: new Date(Date.now() - 86400000),
    patient: 'Pedro Santos',
    procedure: 'Transplante Capilar',
    item: 'Anestésico Local',
    expected: 5,
    used: 4,
    reason: 'Sobra de material',
    status: 'aprovado' as ConsumptionDivergenceStatus,
    user: 'Carlos Técnico'
  },
  {
    id: '3',
    date: new Date(Date.now() - 172800000),
    patient: 'Ana Costa',
    procedure: 'Laser Terapia',
    item: 'Gel Condutor',
    expected: 1,
    used: 2,
    reason: 'Erro de preparo',
    status: 'rejeitado' as ConsumptionDivergenceStatus,
    user: 'Maria Enfermeira'
  }
];

export function AuditTab() {
  const [search, setSearch] = useState('');

  const filteredDivergences = MOCK_DIVERGENCES.filter(d =>
    d.patient.toLowerCase().includes(search.toLowerCase()) ||
    d.procedure.toLowerCase().includes(search.toLowerCase()) ||
    d.item.toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = MOCK_DIVERGENCES.filter(d => d.status === 'pendente').length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Divergências Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">{pendingCount}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aprovadas (7 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">12</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rejeitadas (7 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold">3</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar divergências..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Divergences Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSearch className="h-5 w-5" />
            Divergências e Justificativas
          </CardTitle>
          <CardDescription>
            Histórico de divergências no consumo de materiais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Procedimento</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Esperado</TableHead>
                <TableHead>Usado</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Responsável</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDivergences.map((div) => (
                <TableRow key={div.id}>
                  <TableCell>
                    {format(div.date, 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell className="font-medium">
                    {div.patient}
                  </TableCell>
                  <TableCell>{div.procedure}</TableCell>
                  <TableCell>{div.item}</TableCell>
                  <TableCell className="text-center">{div.expected}</TableCell>
                  <TableCell className="text-center">
                    <span className={div.used > div.expected ? 'text-red-500' : 'text-green-500'}>
                      {div.used}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {div.reason}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={div.status === 'aprovado' ? 'default' : div.status === 'rejeitado' ? 'destructive' : 'secondary'}
                      className="flex items-center gap-1 w-fit"
                    >
                      {DIVERGENCE_ICONS[div.status]}
                      {DIVERGENCE_STATUS_LABELS[div.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {div.user}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
