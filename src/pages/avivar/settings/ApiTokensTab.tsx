import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Key, Plus, Trash2, Copy, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useAvivarApiTokens } from '@/hooks/useAvivarApiTokens';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export function ApiTokensTab() {
  const { tokens, isLoading, createToken, deleteToken, toggleToken } = useAvivarApiTokens();
  const [showCreate, setShowCreate] = useState(false);
  const [tokenName, setTokenName] = useState('');
  const [newToken, setNewToken] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!tokenName.trim()) return;
    const raw = await createToken.mutateAsync({ name: tokenName.trim(), permissions: ['receive_lead'] });
    setNewToken(raw);
    setTokenName('');
  };

  const copyToken = () => {
    if (newToken) {
      navigator.clipboard.writeText(newToken);
      toast.success('Token copiado!');
    }
  };

  return (
    <Card className="bg-[hsl(var(--avivar-card))] border-[hsl(var(--avivar-border))]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-[hsl(var(--avivar-foreground))] flex items-center gap-2">
              <Key className="h-5 w-5 text-[hsl(var(--avivar-primary))]" />
              Tokens de API
            </CardTitle>
            <CardDescription>
              Gere tokens para integrar sistemas externos com o CRM
            </CardDescription>
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            className="bg-[hsl(var(--avivar-primary))] hover:bg-[hsl(var(--avivar-accent))] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Token
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[hsl(var(--avivar-muted-foreground))]" />
          </div>
        ) : tokens.length === 0 ? (
          <div className="text-center py-8 text-[hsl(var(--avivar-muted-foreground))]">
            <Key className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum token criado</p>
            <p className="text-xs mt-1">Crie um token para começar a receber leads via API</p>
          </div>
        ) : (
          tokens.map((token) => (
            <div
              key={token.id}
              className="flex items-center justify-between p-4 rounded-xl border border-[hsl(var(--avivar-border))] bg-[hsl(var(--avivar-background))]"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-[hsl(var(--avivar-foreground))]">{token.name}</p>
                  <Badge variant={token.is_active ? 'default' : 'secondary'} className="text-xs">
                    {token.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] font-mono mt-1">
                  {token.token_prefix}••••••••
                </p>
                <p className="text-xs text-[hsl(var(--avivar-muted-foreground))] mt-1">
                  Criado em {format(new Date(token.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  {token.last_used_at && ` · Último uso: ${format(new Date(token.last_used_at), "dd/MM HH:mm", { locale: ptBR })}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={token.is_active}
                  onCheckedChange={(checked) => toggleToken.mutate({ id: token.id, is_active: checked })}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteId(token.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}

        {/* Instruções de uso */}
        <Separator className="bg-[hsl(var(--avivar-border))]" />
        <div className="text-xs text-[hsl(var(--avivar-muted-foreground))] space-y-1">
          <p className="font-medium">Como usar:</p>
          <p>Envie o header <code className="bg-[hsl(var(--avivar-muted))] px-1 rounded">X-API-Key: avr_seutoken</code> nas requisições para os endpoints da API.</p>
        </div>
      </CardContent>

      {/* Dialog Criar Token */}
      <Dialog open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) { setNewToken(null); setShowToken(false); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Token de API</DialogTitle>
            <DialogDescription>
              O token será exibido apenas uma vez. Copie e guarde em local seguro.
            </DialogDescription>
          </DialogHeader>
          {newToken ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <p className="font-medium">Token criado com sucesso!</p>
              </div>
              <div className="relative">
                <Input
                  readOnly
                  value={showToken ? newToken : '••••••••••••••••••••••••••••••••••••'}
                  className="font-mono pr-20"
                />
                <div className="absolute right-1 top-1 flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setShowToken(!showToken)}>
                    {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={copyToken}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-destructive">⚠️ Este token não será exibido novamente.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do token</Label>
                <Input
                  placeholder="Ex: Integração Landing Page"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
                <Button
                  onClick={handleCreate}
                  disabled={!tokenName.trim() || createToken.isPending}
                  className="bg-[hsl(var(--avivar-primary))] text-white"
                >
                  {createToken.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Gerar Token
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Token</AlertDialogTitle>
            <AlertDialogDescription>
              Sistemas que utilizam este token perderão acesso imediatamente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteId) deleteToken.mutate(deleteId); setDeleteId(null); }}
              className="bg-destructive text-destructive-foreground"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
