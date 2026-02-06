/**
 * CPG Advocacia Médica - Listagem de Propostas Comerciais
 * Painel para visualizar, buscar e criar propostas
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Send,
  MoreHorizontal,
  Trash2,
  Eye,
  Edit,
  FileSignature,
  TrendingUp,
  Users,
  DollarSign,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { useProposals, useDeleteProposal, type Proposal } from "./hooks/useIpromedProposals";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Cores da identidade CPG
const CPG_COLORS = {
  green: "#3d5a47",
  gold: "#c9a55c",
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  draft: { label: "Rascunho", icon: Clock, color: "bg-muted text-muted-foreground" },
  sent: { label: "Enviada", icon: Send, color: "bg-blue-100 text-blue-700" },
  accepted: { label: "Aceita", icon: CheckCircle2, color: "bg-green-100 text-green-700" },
  rejected: { label: "Recusada", icon: XCircle, color: "bg-red-100 text-red-700" },
};

export default function IpromedProposalsList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const { data: proposals, isLoading } = useProposals(searchQuery);
  const deleteProposal = useDeleteProposal();

  const recentProposals = proposals?.slice(0, 5) || [];
  
  // Métricas
  const totalProposals = proposals?.length || 0;
  const acceptedProposals = proposals?.filter(p => p.status === "accepted").length || 0;
  const totalValue = proposals?.reduce((sum, p) => sum + Number(p.monthly_value), 0) || 0;
  const conversionRate = totalProposals > 0 ? ((acceptedProposals / totalProposals) * 100).toFixed(0) : 0;

  const handleDelete = async () => {
    if (deleteId) {
      await deleteProposal.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
    const Icon = config.icon;
    return (
      <Badge variant="secondary" className={`${config.color} gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="h-10 w-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: CPG_COLORS.green }}
          >
            <FileSignature className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: CPG_COLORS.green }}>
              Propostas Comerciais
            </h1>
            <p className="text-sm text-muted-foreground">
              Gerencie e crie propostas personalizadas para seus clientes
            </p>
          </div>
        </div>
        <Button 
          onClick={() => navigate("/ipromed/proposals/new")}
          style={{ backgroundColor: CPG_COLORS.green }}
          className="hover:opacity-90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Proposta
        </Button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Propostas</p>
                <p className="text-2xl font-bold">{totalProposals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Propostas Aceitas</p>
                <p className="text-2xl font-bold">{acceptedProposals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                <p className="text-2xl font-bold">{conversionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div 
                className="h-10 w-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${CPG_COLORS.gold}20` }}
              >
                <DollarSign className="h-5 w-5" style={{ color: CPG_COLORS.gold }} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Total/Mês</p>
                <p className="text-2xl font-bold">
                  R$ {totalValue.toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, código ou plano..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Últimas Propostas */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Últimas Propostas</CardTitle>
              <CardDescription>Propostas criadas recentemente</CardDescription>
            </div>
            {proposals && proposals.length > 5 && (
              <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")}>
                Ver todas ({proposals.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : recentProposals.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-1">Nenhuma proposta encontrada</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery 
                  ? "Tente ajustar sua busca ou limpe o filtro"
                  : "Crie sua primeira proposta comercial"}
              </p>
              {!searchQuery && (
                <Button onClick={() => navigate("/ipromed/proposals/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Proposta
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {(searchQuery ? proposals : recentProposals)?.map((proposal) => (
                <div
                  key={proposal.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/ipromed/proposals/${proposal.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="h-10 w-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${CPG_COLORS.green}15` }}
                    >
                      <FileText className="h-5 w-5" style={{ color: CPG_COLORS.green }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{proposal.client_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {proposal.proposal_code}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{proposal.plan_name}</span>
                        <span>•</span>
                        <span className="font-medium" style={{ color: CPG_COLORS.gold }}>
                          R$ {Number(proposal.monthly_value).toLocaleString("pt-BR")}/mês
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(proposal.created_at), "dd MMM yyyy", { locale: ptBR })}
                    </span>
                    {getStatusBadge(proposal.status)}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/ipromed/proposals/${proposal.id}`);
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/ipromed/proposals/${proposal.id}?preview=true`);
                        }}>
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(proposal.id);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir proposta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A proposta será permanentemente excluída.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
