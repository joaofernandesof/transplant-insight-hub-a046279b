import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Share2, Copy, Check, Link2, Trash2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ShareDashboardButtonProps {
  dashboardType: string;
  dashboardConfig?: Record<string, unknown>;
  title?: string;
  description?: string;
}

interface SharedLink {
  id: string;
  token: string;
  title: string | null;
  expires_at: string | null;
  is_active: boolean;
  view_count: number;
  created_at: string;
}

export function ShareDashboardButton({
  dashboardType,
  dashboardConfig = {},
  title = "Dashboard Compartilhado",
  description,
}: ShareDashboardButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [linkTitle, setLinkTitle] = useState(title);
  const [expiresIn, setExpiresIn] = useState<string>("never");
  const [newLinkToken, setNewLinkToken] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Buscar links existentes
  const { data: existingLinks, isLoading } = useQuery({
    queryKey: ["shared-dashboard-links", dashboardType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shared_dashboard_links")
        .select("id, token, title, expires_at, is_active, view_count, created_at")
        .eq("dashboard_type", dashboardType)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SharedLink[];
    },
    enabled: open,
  });

  // Criar novo link
  const createLinkMutation = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Usuário não autenticado");

      let expiresAt: string | null = null;
      if (expiresIn !== "never") {
        const now = new Date();
        switch (expiresIn) {
          case "1h":
            expiresAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
            break;
          case "24h":
            expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
            break;
          case "7d":
            expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
            break;
          case "30d":
            expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
            break;
        }
      }

      const { data, error } = await supabase
        .from("shared_dashboard_links")
        .insert([{
          dashboard_type: dashboardType,
          dashboard_config: dashboardConfig as unknown as Record<string, never>,
          title: linkTitle,
          description,
          created_by: userData.user.id,
          expires_at: expiresAt,
        }])
        .select("token")
        .single();

      if (error) throw error;
      return data.token;
    },
    onSuccess: (token) => {
      setNewLinkToken(token);
      queryClient.invalidateQueries({ queryKey: ["shared-dashboard-links"] });
      toast.success("Link criado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao criar link");
    },
  });

  // Deletar link
  const deleteLinkMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("shared_dashboard_links")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shared-dashboard-links"] });
      toast.success("Link removido");
    },
  });

  // Toggle ativo/inativo
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("shared_dashboard_links")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shared-dashboard-links"] });
    },
  });

  const getShareUrl = (token: string) => {
    return `${window.location.origin}/public/dashboard/${token}`;
  };

  const copyToClipboard = async (token: string) => {
    const url = getShareUrl(token);
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          Compartilhar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Compartilhar Dashboard
          </DialogTitle>
          <DialogDescription>
            Crie links públicos para compartilhar este dashboard com pessoas externas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Criar novo link */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-sm">Criar novo link</h4>
            
            <div className="space-y-2">
              <Label htmlFor="link-title">Título do link</Label>
              <Input
                id="link-title"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="Ex: Dashboard Jurídico - Janeiro 2026"
              />
            </div>

            <div className="space-y-2">
              <Label>Expiração</Label>
              <Select value={expiresIn} onValueChange={setExpiresIn}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Nunca expira</SelectItem>
                  <SelectItem value="1h">1 hora</SelectItem>
                  <SelectItem value="24h">24 horas</SelectItem>
                  <SelectItem value="7d">7 dias</SelectItem>
                  <SelectItem value="30d">30 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => createLinkMutation.mutate()}
              disabled={createLinkMutation.isPending}
              className="w-full"
            >
              {createLinkMutation.isPending ? "Criando..." : "Gerar Link Público"}
            </Button>

            {newLinkToken && (
              <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <Input
                  value={getShareUrl(newLinkToken)}
                  readOnly
                  className="text-xs"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => copyToClipboard(newLinkToken)}
                >
                  {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>

          {/* Links existentes */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Links existentes</h4>
            
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : existingLinks?.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum link criado ainda.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {existingLinks?.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-3 bg-card border rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {link.title || "Sem título"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Eye className="h-3 w-3" />
                        <span>{link.view_count} views</span>
                        <span>•</span>
                        <span>
                          {link.expires_at
                            ? `Expira ${format(new Date(link.expires_at), "dd/MM/yyyy", { locale: ptBR })}`
                            : "Sem expiração"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={link.is_active}
                        onCheckedChange={(checked) =>
                          toggleActiveMutation.mutate({ id: link.id, isActive: checked })
                        }
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => copyToClipboard(link.token)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteLinkMutation.mutate(link.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
