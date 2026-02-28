/**
 * CPG Advocacia - Gestão de Acessos
 * Apenas administradores podem acessar
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Shield, Users, UserCog, Search, Loader2, CheckCircle2, XCircle, AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { toast } from "sonner";
import { ipromedTeam } from "./components/IpromedTeamProfiles";

interface CpgUser {
  neohub_user_id: string;
  user_id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  profiles: string[];
  allowed_portals: string[];
}

interface ModulePermission {
  id: string;
  module_code: string;
  module_name: string;
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
}

export default function IpromedAccessManagement() {
  const { isAdmin } = useUnifiedAuth();
  const [users, setUsers] = useState<CpgUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<CpgUser | null>(null);
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [permDialogOpen, setPermDialogOpen] = useState(false);
  const [permLoading, setPermLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);

    // Get all users that have ipromed profile
    const { data: profileData } = await supabase
      .from("neohub_user_profiles")
      .select("neohub_user_id, profile, is_active")
      .eq("profile", "ipromed")
      .eq("is_active", true);

    if (!profileData || profileData.length === 0) {
      setUsers([]);
      setLoading(false);
      return;
    }

    const neohubUserIds = profileData.map(p => p.neohub_user_id);

    const { data: usersData } = await supabase
      .from("neohub_users")
      .select("id, user_id, email, full_name, is_active, allowed_portals")
      .in("id", neohubUserIds);

    if (!usersData) {
      setUsers([]);
      setLoading(false);
      return;
    }

    // Get all profiles for these users
    const { data: allProfiles } = await supabase
      .from("neohub_user_profiles")
      .select("neohub_user_id, profile")
      .in("neohub_user_id", neohubUserIds)
      .eq("is_active", true);

    const profileMap = new Map<string, string[]>();
    allProfiles?.forEach(p => {
      const existing = profileMap.get(p.neohub_user_id) || [];
      existing.push(p.profile);
      profileMap.set(p.neohub_user_id, existing);
    });

    const mapped: CpgUser[] = usersData.map(u => ({
      neohub_user_id: u.id,
      user_id: u.user_id,
      email: u.email || "",
      full_name: u.full_name || "",
      is_active: u.is_active ?? true,
      profiles: profileMap.get(u.id) || [],
      allowed_portals: (u.allowed_portals as string[]) || [],
    }));

    setUsers(mapped);
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const toggleUserActive = async (user: CpgUser) => {
    const newActive = !user.is_active;
    const { error } = await supabase
      .from("neohub_users")
      .update({ is_active: newActive })
      .eq("id", user.neohub_user_id);

    if (error) {
      toast.error("Erro ao atualizar status");
      return;
    }
    toast.success(newActive ? "Usuário ativado" : "Usuário desativado");
    loadUsers();
  };

  const openPermissions = async (user: CpgUser) => {
    setSelectedUser(user);
    setPermLoading(true);
    setPermDialogOpen(true);

    // Get default module permissions for ipromed portal
    const { data: defaults } = await supabase
      .from("neohub_module_permissions")
      .select("module_code, module_name, can_read, can_write, can_delete")
      .eq("portal", "ipromed")
      .eq("profile", "ipromed");

    const merged: ModulePermission[] = (defaults || []).map(d => ({
      id: "",
      module_code: d.module_code,
      module_name: d.module_name,
      can_read: d.can_read,
      can_write: d.can_write,
      can_delete: d.can_delete,
    }));

    setPermissions(merged);
    setPermLoading(false);
  };

  const updatePermission = async (perm: ModulePermission, field: "can_read" | "can_write" | "can_delete", value: boolean) => {
    if (!selectedUser) return;

    const updated = { ...perm, [field]: value };

    // Update the default permission for this profile/module combo
    await supabase
      .from("neohub_module_permissions")
      .update({ [field]: value })
      .eq("portal", "ipromed")
      .eq("profile", "ipromed")
      .eq("module_code", perm.module_code);

    setPermissions(prev => prev.map(p => p.module_code === perm.module_code ? updated : p));
    toast.success("Permissão atualizada");
  };

  const getTeamPhoto = (name: string) => {
    const member = ipromedTeam.find(m =>
      name.toLowerCase().includes(m.name.split(" ")[0].toLowerCase())
    );
    return member?.photo;
  };

  const getTeamColor = (name: string) => {
    const member = ipromedTeam.find(m =>
      name.toLowerCase().includes(m.name.split(" ")[0].toLowerCase())
    );
    return member?.color || "bg-muted text-muted-foreground";
  };

  const filteredUsers = users.filter(u =>
    !search || u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Shield className="h-16 w-16 mb-4 text-destructive/50" />
        <h2 className="text-xl font-semibold text-foreground">Acesso Restrito</h2>
        <p className="mt-2">Apenas administradores podem gerenciar acessos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Gestão de Acessos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie permissões e acessos dos usuários do portal CPG
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{users.length}</p>
              <p className="text-xs text-muted-foreground">Total de Usuários</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{users.filter(u => u.is_active).length}</p>
              <p className="text-xs text-muted-foreground">Ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{users.filter(u => !u.is_active).length}</p>
              <p className="text-xs text-muted-foreground">Inativos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card className="border shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Perfis</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center w-[100px]">Ativo</TableHead>
                  <TableHead className="w-[120px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(user => (
                  <TableRow key={user.neohub_user_id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={getTeamPhoto(user.full_name)} className="object-cover" />
                          <AvatarFallback className={`text-xs ${getTeamColor(user.full_name)}`}>
                            {user.full_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{user.full_name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {user.profiles.map(p => (
                          <Badge key={p} variant="outline" className="text-[10px] capitalize">
                            {p}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {user.is_active ? (
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                          Inativo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={user.is_active}
                        onCheckedChange={() => toggleUserActive(user)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => openPermissions(user)}
                      >
                        <UserCog className="h-3.5 w-3.5" />
                        Permissões
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Permissions Dialog */}
      <Dialog open={permDialogOpen} onOpenChange={setPermDialogOpen}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedUser && (
                <>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={getTeamPhoto(selectedUser.full_name)} className="object-cover" />
                    <AvatarFallback className={`text-xs ${getTeamColor(selectedUser.full_name)}`}>
                      {selectedUser.full_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span>{selectedUser.full_name}</span>
                    <p className="text-xs text-muted-foreground font-normal">{selectedUser.email}</p>
                  </div>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {permLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : permissions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              <p>Nenhum módulo de permissão encontrado para este portal.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Módulo</TableHead>
                  <TableHead className="text-center w-[80px]">Ler</TableHead>
                  <TableHead className="text-center w-[80px]">Editar</TableHead>
                  <TableHead className="text-center w-[80px]">Excluir</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.map(perm => (
                  <TableRow key={perm.module_code}>
                    <TableCell className="font-medium text-sm">{perm.module_name || perm.module_code}</TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={perm.can_read}
                        onCheckedChange={v => updatePermission(perm, "can_read", v)}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={perm.can_write}
                        onCheckedChange={v => updatePermission(perm, "can_write", v)}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={perm.can_delete}
                        onCheckedChange={v => updatePermission(perm, "can_delete", v)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPermDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
