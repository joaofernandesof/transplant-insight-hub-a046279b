/**
 * Tabela de contratos/documentos com ações rápidas
 */

import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FileSignature,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Eye,
  Download,
  Send,
  ExternalLink,
  Loader2,
  User,
} from "lucide-react";
import { ContractActionsDropdown } from "./ContractActionsDropdown";
import { cn } from "@/lib/utils";

interface Contract {
  id: string;
  title: string;
  contract_number?: string;
  contract_type?: string;
  status: string;
  document_url?: string | null;
  client_id?: string | null;
  client?: { id: string; name: string; email?: string } | null;
  created_at: string;
}

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  draft: { label: "Rascunho", color: "bg-gray-500", icon: FileText },
  pending_signature: { label: "Em processo", color: "bg-amber-500", icon: Clock },
  signed: { label: "Finalizado", color: "bg-emerald-500", icon: CheckCircle },
  cancelled: { label: "Cancelado", color: "bg-rose-500", icon: XCircle },
  active: { label: "Ativo", color: "bg-emerald-500", icon: CheckCircle },
};

interface ContractsTableProps {
  contracts: Contract[];
  isLoading: boolean;
  onSendForSignature: (contract: Contract) => void;
  onLinkClient: (contractId: string, contractTitle: string) => void;
  sendingId?: string | null;
}

export function ContractsTable({
  contracts,
  isLoading,
  onSendForSignature,
  onLinkClient,
  sendingId,
}: ContractsTableProps) {
  // Hook must be called unconditionally before any early returns
  const navigate = useNavigate();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Empty state
  if (contracts.length === 0) {
    return (
      <div className="text-center py-12">
        <FileSignature className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Nenhum documento encontrado</h3>
        <p className="text-muted-foreground">
          Faça upload de um documento ou crie um novo contrato
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Número</TableHead>
            <TableHead>Título</TableHead>
            <TableHead className="w-[180px]">Cliente</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[100px]">Data</TableHead>
            <TableHead className="w-[140px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.map((contract) => {
            const status = statusConfig[contract.status] || statusConfig.draft;
            const StatusIcon = status.icon;
            const isDraft = contract.status === "draft";
            const hasDocument = !!contract.document_url;
            const isSending = sendingId === contract.id;

            return (
              <TableRow
                key={contract.id}
                className="cursor-pointer hover:bg-muted/50 group"
                onClick={() => navigate(`/ipromed/contracts/${contract.id}`)}
              >
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {contract.contract_number || "-"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium truncate max-w-[200px]">
                      {contract.title}
                    </span>
                    {!hasDocument && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        Sem arquivo
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {contract.client ? (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate max-w-[140px]">
                        {contract.client.name}
                      </span>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLinkClient(contract.id, contract.title);
                      }}
                    >
                      + Vincular cliente
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={cn(status.color, "text-white gap-1")}>
                    <StatusIcon className="h-3 w-3" />
                    {status.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {format(new Date(contract.created_at), "dd/MM/yy", {
                    locale: ptBR,
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <div
                    className="flex justify-end gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Quick actions */}
                    {hasDocument && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              window.open(contract.document_url!, "_blank")
                            }
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Visualizar PDF</TooltipContent>
                      </Tooltip>
                    )}

                    {isDraft && hasDocument && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary"
                            onClick={() => onSendForSignature(contract)}
                            disabled={isSending}
                          >
                            {isSending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Enviar p/ Assinatura</TooltipContent>
                      </Tooltip>
                    )}

                    {/* More actions dropdown */}
                    <ContractActionsDropdown
                      contract={contract}
                      onLinkClient={onLinkClient}
                      onSendForSignature={onSendForSignature}
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TooltipProvider>
  );
}
