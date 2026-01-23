import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { 
  Settings, User, Bell, Shield, Clock,
  Camera, Save, Building2, Plus, Trash2, Edit, Loader2,
  Sun, Moon, Monitor, Palette
} from 'lucide-react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useNeoTeamBranches, Branch, NewBranch } from '@/neohub/hooks/useNeoTeamBranches';
import { NeoTeamBreadcrumb } from '@/neohub/components/NeoTeamBreadcrumb';
import { useTheme } from 'next-themes';

export default function NeoTeamSettings() {
  const { user } = useUnifiedAuth();
  const { branches, isLoading, createBranch, updateBranch, deleteBranch } = useNeoTeamBranches();
  const { theme, setTheme } = useTheme();
  
  const [branchDialogOpen, setBranchDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null);
  const [newBranch, setNewBranch] = useState<NewBranch>({ code: '', name: '', address: '', phone: '' });
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveBranch = async () => {
    try {
      setIsSaving(true);
      if (editingBranch) {
        await updateBranch(editingBranch.id, {
          name: newBranch.name,
          address: newBranch.address,
          phone: newBranch.phone,
        });
      } else {
        await createBranch(newBranch);
      }
      setBranchDialogOpen(false);
      setEditingBranch(null);
      setNewBranch({ code: '', name: '', address: '', phone: '' });
    } catch (error) {
      // Error handled in hook
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditBranch = (branch: Branch) => {
    setEditingBranch(branch);
    setNewBranch({
      code: branch.code,
      name: branch.name,
      address: branch.address || '',
      phone: branch.phone || '',
    });
    setBranchDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deletingBranch) {
      await deleteBranch(deletingBranch.id);
      setDeletingBranch(null);
    }
  };

  const openNewBranchDialog = () => {
    setEditingBranch(null);
    setNewBranch({ code: '', name: '', address: '', phone: '' });
    setBranchDialogOpen(true);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl">
      <NeoTeamBreadcrumb />
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Configurações
        </h1>
        <p className="text-muted-foreground">Gerencie suas preferências e configurações do sistema</p>
      </div>

      {/* Branches */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Filiais
              </CardTitle>
              <CardDescription>Gerencie as filiais da clínica</CardDescription>
            </div>
            <Dialog open={branchDialogOpen} onOpenChange={setBranchDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewBranchDialog} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nova Filial
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingBranch ? 'Editar Filial' : 'Nova Filial'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingBranch 
                      ? 'Atualize as informações da filial' 
                      : 'Preencha os dados para criar uma nova filial'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Código *</Label>
                    <Input
                      placeholder="Ex: fortaleza, juazeiro"
                      value={newBranch.code}
                      onChange={(e) => setNewBranch({ ...newBranch, code: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                      disabled={!!editingBranch}
                    />
                    <p className="text-xs text-muted-foreground">
                      Identificador único, sem espaços ou caracteres especiais
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input
                      placeholder="Ex: Filial Fortaleza"
                      value={newBranch.name}
                      onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Endereço</Label>
                    <Input
                      placeholder="Endereço completo"
                      value={newBranch.address || ''}
                      onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input
                      placeholder="(00) 0000-0000"
                      value={newBranch.phone || ''}
                      onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={() => setBranchDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleSaveBranch}
                      disabled={!newBranch.code || !newBranch.name || isSaving}
                    >
                      {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {editingBranch ? 'Salvar' : 'Criar'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : branches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma filial cadastrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branches.map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell>
                      <Badge variant="outline">{branch.code}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{branch.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {branch.address || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {branch.phone || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditBranch(branch)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => setDeletingBranch(branch)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Perfil
          </CardTitle>
          <CardDescription>Suas informações pessoais</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user?.avatarUrl} />
                <AvatarFallback className="text-xl bg-primary/10 text-primary">
                  {user?.fullName?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <Button 
                size="icon" 
                variant="outline" 
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-lg">{user?.fullName}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="text-xs text-muted-foreground">Colaborador</p>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input id="name" defaultValue={user?.fullName || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={user?.email || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" defaultValue={user?.phone || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Função</Label>
              <Input id="role" defaultValue="Recepcionista" disabled />
            </div>
          </div>

          <Button className="gap-2">
            <Save className="h-4 w-4" />
            Salvar Alterações
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
          </CardTitle>
          <CardDescription>Configure como deseja receber alertas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Alerta de Tempo de Espera</p>
              <p className="text-sm text-muted-foreground">Som quando paciente aguarda mais de 15 min</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Novos Pacientes</p>
              <p className="text-sm text-muted-foreground">Notificar quando paciente chegar</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Cancelamentos</p>
              <p className="text-sm text-muted-foreground">Notificar sobre cancelamentos</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Aparência
          </CardTitle>
          <CardDescription>Personalize a aparência do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              className="h-20 flex-col gap-2"
              onClick={() => setTheme('light')}
            >
              <Sun className="h-5 w-5" />
              Claro
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              className="h-20 flex-col gap-2"
              onClick={() => setTheme('dark')}
            >
              <Moon className="h-5 w-5" />
              Escuro
            </Button>
            <Button
              variant={theme === 'system' ? 'default' : 'outline'}
              className="h-20 flex-col gap-2"
              onClick={() => setTheme('system')}
            >
              <Monitor className="h-5 w-5" />
              Sistema
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Work Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horário de Trabalho
          </CardTitle>
          <CardDescription>Configure seu expediente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Entrada</Label>
              <Input type="time" defaultValue="08:00" />
            </div>
            <div className="space-y-2">
              <Label>Saída</Label>
              <Input type="time" defaultValue="18:00" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Segurança
          </CardTitle>
          <CardDescription>Configurações de acesso e senha</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline">Alterar Senha</Button>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Autenticação em Duas Etapas</p>
              <p className="text-sm text-muted-foreground">Adicione uma camada extra de segurança</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingBranch} onOpenChange={() => setDeletingBranch(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Filial</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a filial "{deletingBranch?.name}"? 
              Esta ação pode ser desfeita posteriormente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
