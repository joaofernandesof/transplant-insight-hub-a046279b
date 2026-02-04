/**
 * Dialog para vincular cliente a um documento/contrato após upload
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Search, User, FileText, Check, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface LinkClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
  contractTitle: string;
  onSuccess?: () => void;
}

export function LinkClientDialog({
  open,
  onOpenChange,
  contractId,
  contractTitle,
  onSuccess,
}: LinkClientDialogProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Fetch clients
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["ipromed-clients-link", search],
    queryFn: async () => {
      let query = supabase
        .from("ipromed_legal_clients")
        .select("id, name, email, client_type")
        .order("name");

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data, error } = await query.limit(20);
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Link client mutation
  const linkClient = useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await supabase
        .from("ipromed_contracts")
        .update({ client_id: clientId })
        .eq("id", contractId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cliente vinculado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["ipromed-contracts"] });
      onOpenChange(false);
      setSelectedClientId(null);
      setSearch("");
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao vincular cliente");
    },
  });

  const handleLink = () => {
    if (!selectedClientId) {
      toast.error("Selecione um cliente");
      return;
    }
    linkClient.mutate(selectedClientId);
  };

  const handleSkip = () => {
    onOpenChange(false);
    setSelectedClientId(null);
    setSearch("");
    toast.info("Documento salvo como rascunho sem cliente vinculado");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Vincular Cliente ao Documento
          </DialogTitle>
          <DialogDescription>
            Selecione um cliente para vincular ao documento "{contractTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Client List */}
          <ScrollArea className="h-[280px] border rounded-lg">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : clients.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <User className="h-8 w-8 mb-2" />
                <p className="text-sm">Nenhum cliente encontrado</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    onClick={() => setSelectedClientId(client.id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                      selectedClientId === client.id
                        ? "bg-primary/10 border border-primary"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{client.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {client.email || "Sem email"}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {client.client_type === "pf" ? "PF" : "PJ"}
                    </Badge>
                    {selectedClientId === client.id && (
                      <Check className="h-5 w-5 text-primary shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Create new client hint */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserPlus className="h-4 w-4" />
            <span>Não encontrou? Você pode criar um cliente depois.</span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={handleSkip}>
            Pular (Sem cliente)
          </Button>
          <Button
            onClick={handleLink}
            disabled={!selectedClientId || linkClient.isPending}
          >
            {linkClient.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Vincular Cliente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
