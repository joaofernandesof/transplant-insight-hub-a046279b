// ============================================
// ModuleOverridesAdmin - Painel de Overrides
// ============================================
// Permite administradores liberarem acesso manual a módulos.

import React, { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useModuleOverrides, CreateOverrideData } from '@/hooks/useModuleOverrides';
import { ACADEMY_MODULES, ACADEMY_MODULE_INFO, AcademyModuleCode } from '@/lib/permissions';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Plus,
  Search,
  Trash2,
  Shield,
  Eye,
  Pencil,
  Trash,
  Clock,
  User,
  Loader2,
  GraduationCap,
} from 'lucide-react';

interface UserSearchResult {
  id: string;
  full_name: string;
  email: string;
}

export default function ModuleOverridesAdmin() {
  const { overrides, isLoading, upsertOverride, revokeOverride, refetch } = useModuleOverrides();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
  const [selectedOverrideId, setSelectedOverrideId] = useState<string | null>(null);
  
  // Form state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [canRead, setCanRead] = useState(true);
  const [canWrite, setCanWrite] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Filtros da tabela
  const [filterModule, setFilterModule] = useState<string>('all');
  const [filterSearch, setFilterSearch] = useState('');

  // Buscar usuários
  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('neohub_users')
        .select('id, full_name, email')
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);
      
      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Resetar form
  const resetForm = () => {
    setSelectedUser(null);
    setSelectedModule('');
    setCanRead(true);
    setCanWrite(false);
    setCanDelete(false);
    setExpiresAt('');
    setReason('');
    setSearchQuery('');
    setSearchResults([]);
  };

  // Salvar override
  const handleSave = async () => {
    if (!selectedUser || !selectedModule) return;
    
    setIsSaving(true);
    const data: CreateOverrideData = {
      user_id: selectedUser.id,
      module_code: selectedModule,
      can_read: canRead,
      can_write: canWrite,
      can_delete: canDelete,
      expires_at: expiresAt || null,
      reason: reason || undefined,
    };
    
    const result = await upsertOverride(data);
    setIsSaving(false);
    
    if (result.success) {
      setIsDialogOpen(false);
      resetForm();
    }
  };

  // Confirmar revogação
  const handleRevoke = async () => {
    if (!selectedOverrideId) return;
    await revokeOverride(selectedOverrideId);
    setIsRevokeDialogOpen(false);
    setSelectedOverrideId(null);
  };

  // Overrides filtrados
  const filteredOverrides = useMemo(() => {
    return overrides.filter(o => {
      const matchesModule = filterModule === 'all' || o.module_code === filterModule;
      const matchesSearch = !filterSearch || 
        o.user_name?.toLowerCase().includes(filterSearch.toLowerCase()) ||
        o.user_email?.toLowerCase().includes(filterSearch.toLowerCase());
      return matchesModule && matchesSearch;
    });
  }, [overrides, filterModule, filterSearch]);

  // Módulos disponíveis para seleção
  const moduleOptions = Object.entries(ACADEMY_MODULES).map(([key, code]) => ({
    code,
    name: ACADEMY_MODULE_INFO[code as AcademyModuleCode]?.name || key,
  }));

  return (
    <AdminLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Liberações de Acesso
            </h1>
            <p className="text-muted-foreground">
              Gerencie overrides manuais de permissões por usuário
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Liberação
          </Button>
        </div>

        {/* Info Card */}
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <GraduationCap className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-500">Como funciona?</p>
                <p className="text-muted-foreground">
                  Cada perfil acessa automaticamente apenas o Academy da sua empresa.
                  Use esta tela para liberar acesso manual a Academies adicionais.
                  Overrides têm prioridade sobre permissões de perfil.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={filterModule} onValueChange={setFilterModule}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por módulo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os módulos</SelectItem>
                  {moduleOptions.map(m => (
                    <SelectItem key={m.code} value={m.code}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Liberações Ativas</CardTitle>
            <CardDescription>
              {filteredOverrides.length} liberação(ões) encontrada(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredOverrides.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma liberação encontrada
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Permissões</TableHead>
                    <TableHead>Expiração</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead className="w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOverrides.map((override) => (
                    <TableRow key={override.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{override.user_name || 'N/A'}</div>
                            <div className="text-xs text-muted-foreground">{override.user_email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {ACADEMY_MODULE_INFO[override.module_code as AcademyModuleCode]?.name || override.module_code}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {override.can_read && (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                              <Eye className="h-3 w-3 mr-1" />
                              Ler
                            </Badge>
                          )}
                          {override.can_write && (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                              <Pencil className="h-3 w-3 mr-1" />
                              Editar
                            </Badge>
                          )}
                          {override.can_delete && (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                              <Trash className="h-3 w-3 mr-1" />
                              Excluir
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {override.expires_at ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3" />
                            {format(new Date(override.expires_at), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Permanente</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground truncate max-w-[150px] block">
                          {override.reason || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setSelectedOverrideId(override.id);
                            setIsRevokeDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog: Nova Liberação */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Liberação de Acesso</DialogTitle>
            <DialogDescription>
              Libere acesso manual a um módulo Academy para um usuário específico.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Buscar Usuário */}
            <div className="space-y-2">
              <Label>Usuário</Label>
              {selectedUser ? (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                  <div>
                    <div className="font-medium">{selectedUser.full_name}</div>
                    <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                    Alterar
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome ou email..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        searchUsers(e.target.value);
                      }}
                      className="pl-9"
                    />
                  </div>
                  {isSearching && (
                    <div className="text-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </div>
                  )}
                  {searchResults.length > 0 && (
                    <div className="border rounded-lg max-h-[150px] overflow-y-auto">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors"
                          onClick={() => {
                            setSelectedUser(user);
                            setSearchQuery('');
                            setSearchResults([]);
                          }}
                        >
                          <div className="font-medium">{user.full_name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Módulo */}
            <div className="space-y-2">
              <Label>Academy</Label>
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o Academy" />
                </SelectTrigger>
                <SelectContent>
                  {moduleOptions.map(m => (
                    <SelectItem key={m.code} value={m.code}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Permissões */}
            <div className="space-y-3">
              <Label>Permissões</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span>Visualizar</span>
                  </div>
                  <Switch checked={canRead} onCheckedChange={setCanRead} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                    <span>Editar</span>
                  </div>
                  <Switch checked={canWrite} onCheckedChange={setCanWrite} disabled={!canRead} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trash className="h-4 w-4 text-muted-foreground" />
                    <span>Excluir</span>
                  </div>
                  <Switch checked={canDelete} onCheckedChange={setCanDelete} disabled={!canRead} />
                </div>
              </div>
            </div>

            {/* Expiração */}
            <div className="space-y-2">
              <Label>Expiração (opcional)</Label>
              <Input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Deixe em branco para acesso permanente
              </p>
            </div>

            {/* Motivo */}
            <div className="space-y-2">
              <Label>Motivo da liberação</Label>
              <Textarea
                placeholder="Descreva o motivo desta liberação..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!selectedUser || !selectedModule || isSaving}
            >
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar Liberação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirmar Revogação */}
      <AlertDialog open={isRevokeDialogOpen} onOpenChange={setIsRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar Liberação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá o acesso especial deste usuário ao módulo.
              Ele manterá apenas as permissões padrão do seu perfil.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevoke} className="bg-destructive text-destructive-foreground">
              Revogar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
