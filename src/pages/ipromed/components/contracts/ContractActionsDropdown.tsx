/**
 * Dropdown de ações para contratos na lista
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Eye,
  Download,
  Send,
  Edit,
  Trash2,
  UserPlus,
  FileText,
  ExternalLink,
  Copy,
  Loader2,
} from "lucide-react";

interface Contract {
  id: string;
  title: string;
  status: string;
  document_url?: string | null;
  client_id?: string | null;
}

interface ContractActionsDropdownProps {
  contract: Contract;
  onLinkClient: (contractId: string, contractTitle: string) => void;
  onSendForSignature: (contract: Contract) => void;
}

export function ContractActionsDropdown({
  contract,
  onLinkClient,
  onSendForSignature,
}: ContractActionsDropdownProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Delete contract mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      // Delete associated documents first
      await supabase
        .from("ipromed_contract_documents")
        .delete()
        .eq("contract_id", contract.id);

      // Then delete the contract
      const { error } = await supabase
        .from("ipromed_contracts")
        .delete()
        .eq("id", contract.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Documento excluído com sucesso");
      queryClient.invalidateQueries({ queryKey: ["ipromed-contracts"] });
      setDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao excluir documento");
    },
  });

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/ipromed/contracts/${contract.id}`);
  };

  const handlePreviewPdf = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (contract.document_url) {
      window.open(contract.document_url, "_blank");
    } else {
      toast.info("Este documento não possui arquivo anexado");
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (contract.document_url) {
      const link = document.createElement("a");
      link.href = contract.document_url;
      link.download = contract.title + ".pdf";
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Download iniciado");
    } else {
      toast.info("Este documento não possui arquivo anexado");
    }
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (contract.document_url) {
      navigator.clipboard.writeText(contract.document_url);
      toast.success("Link copiado para área de transferência");
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteMutation.mutateAsync();
    setIsDeleting(false);
  };

  const canSendForSignature = contract.status === "draft" && contract.document_url;
  const canLinkClient = !contract.client_id;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Ações</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleView}>
            <Eye className="h-4 w-4 mr-2" />
            Ver Detalhes
          </DropdownMenuItem>

          {contract.document_url && (
            <>
              <DropdownMenuItem onClick={handlePreviewPdf}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Visualizar PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar Link
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />

          {canLinkClient && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onLinkClient(contract.id, contract.title);
              }}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Vincular Cliente
            </DropdownMenuItem>
          )}

          <DropdownMenuItem onClick={handleView}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </DropdownMenuItem>

          {canSendForSignature && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onSendForSignature(contract);
              }}
              className="text-primary"
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar p/ Assinatura
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setDeleteDialogOpen(true);
            }}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{contract.title}"? Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
