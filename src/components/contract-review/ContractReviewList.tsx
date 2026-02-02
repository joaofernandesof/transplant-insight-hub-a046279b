/**
 * Lista de solicitações de conferência contratual
 */

import { useState } from "react";
import { format, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useContractReviewRequests, CONTRACT_TYPES, CONTRACT_STATUS_CONFIG, ContractReviewStatus } from "@/hooks/useContractReview";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ContractReviewDetailDialog } from "./ContractReviewDetailDialog";
import { Eye, Search, AlertTriangle, Clock } from "lucide-react";
import type { ContractReviewRequest } from "@/hooks/useContractReview";

export function ContractReviewList() {
  const { data: requests, isLoading } = useContractReviewRequests();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<ContractReviewRequest | null>(null);

  const filteredRequests = requests?.filter((req) => {
    const matchesSearch = 
      req.nome_outra_parte.toLowerCase().includes(search.toLowerCase()) ||
      req.request_number.toLowerCase().includes(search.toLowerCase()) ||
      req.area_empresa.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número, parte ou área..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(CONTRACT_STATUS_CONFIG).map(([value, { label }]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Outra Parte</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Área</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>SLA</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Nenhuma solicitação encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests?.map((request) => {
                const typeLabel = CONTRACT_TYPES.find(t => t.value === request.tipo_contrato)?.label || request.tipo_contrato;
                const statusConfig = CONTRACT_STATUS_CONFIG[request.status];
                const isSlaExpired = request.sla_deadline && isPast(new Date(request.sla_deadline));
                
                return (
                  <TableRow key={request.id}>
                    <TableCell className="font-mono text-xs">
                      {request.request_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{request.nome_outra_parte}</p>
                        {request.classificacao === 'estrategico' && (
                          <Badge variant="outline" className="text-xs mt-1">⭐ Estratégico</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{typeLabel}</TableCell>
                    <TableCell>{request.area_empresa}</TableCell>
                    <TableCell>
                      <Badge className={statusConfig.color}>
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {request.sla_deadline ? (
                        <div className={`flex items-center gap-1 text-xs ${isSlaExpired ? 'text-destructive' : ''}`}>
                          {isSlaExpired && <AlertTriangle className="h-3 w-3" />}
                          <Clock className="h-3 w-3" />
                          <span>{format(new Date(request.sla_deadline), "dd/MM HH:mm")}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {format(new Date(request.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedRequest(request)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de detalhes */}
      {selectedRequest && (
        <ContractReviewDetailDialog
          request={selectedRequest}
          open={!!selectedRequest}
          onOpenChange={(open) => !open && setSelectedRequest(null)}
        />
      )}
    </div>
  );
}
