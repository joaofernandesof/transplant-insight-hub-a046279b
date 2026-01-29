/**
 * IPROMED - Gestão de Contratos
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Plus,
  Search,
  FileSignature,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Send,
  Download,
  Filter,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import NewContractDialog from "./components/contracts/NewContractDialog";

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Rascunho', color: 'bg-gray-500', icon: FileSignature },
  pending_signature: { label: 'Aguard. Assinatura', color: 'bg-amber-500', icon: Clock },
  signed: { label: 'Assinado', color: 'bg-emerald-500', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'bg-rose-500', icon: XCircle },
};

export default function IpromedContracts() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['ipromed-contracts', searchTerm, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('ipromed_contracts')
        .select(`
          *,
          client:ipromed_legal_clients!ipromed_contracts_client_id_fkey(id, name, email)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as 'draft' | 'pending_signature' | 'signed' | 'cancelled' | 'pending_approval' | 'pending_review' | 'expired' | 'terminated' | 'active');
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,contract_number.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/ipromed')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">IPROMED</span>
          </Button>
          <span className="text-muted-foreground hidden sm:inline">/</span>
          <span className="font-medium text-sm sm:text-base">Contratos</span>
        </div>
        <Button onClick={() => setIsNewDialogOpen(true)} size="sm" className="sm:size-default">
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Novo Contrato</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </div>

      <NewContractDialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen} />

      {/* Stats Cards - Grid responsivo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:pt-6 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 bg-primary/10 rounded-lg sm:rounded-xl">
                <FileSignature className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold">{contracts.length}</p>
                <p className="text-[10px] sm:text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:pt-6 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg sm:rounded-xl">
                <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold">
                  {contracts.filter(c => c.status === 'pending_signature').length}
                </p>
                <p className="text-[10px] sm:text-sm text-muted-foreground">Aguardando</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:pt-6 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg sm:rounded-xl">
                <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold">
                  {contracts.filter(c => c.status === 'signed').length}
                </p>
                <p className="text-[10px] sm:text-sm text-muted-foreground">Assinados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:pt-6 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 bg-gray-100 dark:bg-gray-900/30 rounded-lg sm:rounded-xl">
                <FileSignature className="h-4 w-4 sm:h-6 sm:w-6 text-gray-600" />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold">
                  {contracts.filter(c => c.status === 'draft').length}
                </p>
                <p className="text-[10px] sm:text-sm text-muted-foreground">Rascunhos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título ou número..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="pending_signature">Aguardando Assinatura</SelectItem>
                <SelectItem value="signed">Assinado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Contratos</CardTitle>
          <CardDescription>Gerencie todos os contratos do IPROMED</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-12">
              <FileSignature className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum contrato encontrado</h3>
              <p className="text-muted-foreground mb-4">Comece criando o primeiro contrato</p>
              <Button onClick={() => setIsNewDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Contrato
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract: any) => {
                  const status = statusConfig[contract.status] || statusConfig.draft;
                  const StatusIcon = status.icon;
                  return (
                    <TableRow key={contract.id}>
                      <TableCell className="font-mono text-sm">
                        {contract.contract_number || '-'}
                      </TableCell>
                      <TableCell className="font-medium">{contract.title}</TableCell>
                      <TableCell>
                        {contract.client?.name || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{contract.contract_type || 'Prestação de Serviço'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${status.color} text-white`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(contract.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" title="Ver">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {contract.status === 'draft' && (
                            <Button variant="ghost" size="icon" title="Enviar para assinatura">
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          {contract.status === 'signed' && (
                            <Button variant="ghost" size="icon" title="Download">
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
