import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Users, Plus, Shield, Search, Loader2, UserCheck, Stethoscope, Building2,
} from 'lucide-react';
import {
  useNeoTeamRBAC, NeoTeamRole, ROLE_CONFIG, AvailableUser,
} from '@/neohub/hooks/useNeoTeamRBAC';

interface TeamManagementTabProps {
  onSelectMember: (memberId: string) => void;
}

export function TeamManagementTab({ onSelectMember }: TeamManagementTabProps) {
  const {
    members, isLoading, myRole, isAdminOrAbove, isMaster, hasNoMembers,
    addMember, updateMemberRole, toggleMemberActive,
    searchAvailableUsers, fetchAvailableDoctors, fetchAvailableBranches, bootstrapMaster,
  } = useNeoTeamRBAC();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [roleChangeDialog, setRoleChangeDialog] = useState<{ memberId: string; currentRole: NeoTeamRole; newRole: NeoTeamRole } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AvailableUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AvailableUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<NeoTeamRole>('OPERACIONAL');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('active');

  useEffect(() => {
    if (addDialogOpen) {
      fetchAvailableDoctors().then(setDoctors);
      fetchAvailableBranches().then(setBranches);
    }
  }, [addDialogOpen, fetchAvailableDoctors, fetchAvailableBranches]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        const results = await searchAvailableUsers(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchAvailableUsers]);

  const handleAdd = async () => {
    if (!selectedUser) return;
    setIsSaving(true);
    const success = await addMember(
      selectedUser.user_id,
      selectedRole,
      selectedDoctorId || undefined,
      selectedBranchId || undefined
    );
    setIsSaving(false);
    if (success) {
      setAddDialogOpen(false);
      setSelectedUser(null);
      setSearchQuery('');
      setSelectedRole('OPERACIONAL');
      setSelectedDoctorId('');
      setSelectedBranchId('');
    }
  };

  const handleRoleChange = async () => {
    if (!roleChangeDialog) return;
    setIsSaving(true);
    await updateMemberRole(roleChangeDialog.memberId, roleChangeDialog.newRole);
    setIsSaving(false);
    setRoleChangeDialog(null);
  };

  const filteredMembers = members.filter(m => {
    if (filterStatus === 'active') return m.is_active;
    if (filterStatus === 'inactive') return !m.is_active;
    return true;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Equipe
            </CardTitle>
            <CardDescription>
              {members.length} membro{members.length !== 1 ? 's' : ''} cadastrado{members.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
            {isAdminOrAbove && (
              <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">Nenhum membro encontrado</p>
            <p className="text-sm mt-1">
              {hasNoMembers
                ? 'Inicialize a equipe para começar a gerenciar permissões'
                : 'Adicione membros à equipe para gerenciar permissões'}
            </p>
            {hasNoMembers && (
              <Button className="mt-4" onClick={bootstrapMaster}>
                <UserCheck className="h-4 w-4 mr-2" />
                Inicializar Equipe (você como Master)
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                 <TableHead>Membro</TableHead>
                   <TableHead>Papel</TableHead>
                   <TableHead>Filial</TableHead>
                   <TableHead>Profissional</TableHead>
                   <TableHead>Status</TableHead>
                  {isAdminOrAbove && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id} className={!member.is_active ? 'opacity-50' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={member.user_avatar || undefined} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {member.user_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm leading-none">{member.user_name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{member.user_email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isAdminOrAbove ? (
                        <Select
                          value={member.role}
                          onValueChange={(newRole) => {
                            if (newRole !== member.role) {
                              setRoleChangeDialog({
                                memberId: member.id,
                                currentRole: member.role,
                                newRole: newRole as NeoTeamRole,
                              });
                            }
                          }}
                        >
                          <SelectTrigger className="w-[160px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                              <SelectItem key={key} value={key} disabled={key === 'MASTER' && !isMaster}>
                                <span className="flex items-center gap-2">
                                  <span>{config.icon}</span>
                                  <span>{config.label}</span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline" className={`${ROLE_CONFIG[member.role].color} border`}>
                          {ROLE_CONFIG[member.role].icon} {ROLE_CONFIG[member.role].label}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {member.branch_name ? (
                        <div className="flex items-center gap-1.5 text-sm">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{member.branch_name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {member.doctor_name ? (
                        <div className="flex items-center gap-1.5 text-sm">
                          <Stethoscope className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{member.doctor_name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isAdminOrAbove ? (
                        <Switch
                          checked={member.is_active}
                          onCheckedChange={() => toggleMemberActive(member.id)}
                        />
                      ) : (
                        <Badge variant={member.is_active ? 'default' : 'secondary'}>
                          {member.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      )}
                    </TableCell>
                    {isAdminOrAbove && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSelectMember(member.id)}
                        >
                          <Shield className="h-4 w-4 mr-1" />
                          Permissões
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Add Member Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Adicionar Membro
            </DialogTitle>
            <DialogDescription>
              Busque um usuário cadastrado no NeoHub para adicioná-lo à equipe
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Search */}
            <div className="space-y-2">
              <Label>Buscar Usuário</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nome ou email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              {isSearching && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Buscando...
                </div>
              )}
              {searchResults.length > 0 && !selectedUser && (
                <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                  {searchResults.map(u => (
                    <button
                      key={u.user_id}
                      className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 text-left transition-colors"
                      onClick={() => { setSelectedUser(u); setSearchQuery(u.full_name); }}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={u.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">{u.full_name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{u.full_name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {selectedUser && (
                <div className="flex items-center gap-3 p-3 border rounded-md bg-muted/30">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedUser.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">{selectedUser.full_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{selectedUser.full_name}</p>
                    <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedUser(null); setSearchQuery(''); }}>
                    Trocar
                  </Button>
                </div>
              )}
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label>Papel</Label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as NeoTeamRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key} disabled={key === 'MASTER' && !isMaster}>
                      <span className="flex items-center gap-2">
                        <span>{config.icon}</span>
                        <span>{config.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Doctor link */}
            {(selectedRole === 'PROFISSIONAL') && doctors.length > 0 && (
              <div className="space-y-2">
                <Label>Vincular a Profissional (opcional)</Label>
                <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhum vínculo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum vínculo</SelectItem>
                    {doctors.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Branch link */}
            {branches.length > 0 && (
              <div className="space-y-2">
                <Label>Filial</Label>
                <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a filial" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem filial</SelectItem>
                    {branches.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAdd} disabled={!selectedUser || isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Adicionar Membro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Change Confirmation */}
      <AlertDialog open={!!roleChangeDialog} onOpenChange={() => setRoleChangeDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterar Papel</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja alterar o papel de{' '}
              <strong>{ROLE_CONFIG[roleChangeDialog?.currentRole || 'OPERACIONAL'].label}</strong> para{' '}
              <strong>{ROLE_CONFIG[roleChangeDialog?.newRole || 'OPERACIONAL'].label}</strong>?
              <br />
              <span className="text-xs mt-2 block">Esta ação será registrada na auditoria.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRoleChange} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
