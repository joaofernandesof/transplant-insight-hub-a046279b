import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, UserPlus, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const PROFILES = [
  { value: 'administrador', label: 'Administrador' },
  { value: 'licenciado', label: 'Licenciado' },
  { value: 'colaborador', label: 'Colaborador' },
  { value: 'aluno', label: 'Aluno' },
  { value: 'medico', label: 'Médico' },
  { value: 'paciente', label: 'Paciente' },
  { value: 'cliente_avivar', label: 'Cliente Avivar' },
  { value: 'ipromed', label: 'IproMed' },
];

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddUserDialog({ open, onOpenChange, onSuccess }: AddUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    cpf: '',
  });
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);

  const resetForm = () => {
    setForm({ full_name: '', email: '', password: '', phone: '', cpf: '' });
    setSelectedProfiles([]);
    setShowPassword(false);
  };

  const toggleProfile = (profile: string) => {
    setSelectedProfiles(prev =>
      prev.includes(profile)
        ? prev.filter(p => p !== profile)
        : [...prev, profile]
    );
  };

  const handleSubmit = async () => {
    if (!form.full_name || !form.email || !form.password) {
      toast.error('Nome, email e senha são obrigatórios');
      return;
    }

    if (form.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: form.email,
          password: form.password,
          full_name: form.full_name,
          phone: form.phone || null,
          cpf: form.cpf || null,
          profiles: selectedProfiles,
          allowed_portals: [],
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`Usuário ${form.full_name} criado com sucesso!`);
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      console.error('Error creating user:', err);
      toast.error(err.message || 'Erro ao criar usuário');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Adicionar Usuário
          </DialogTitle>
          <DialogDescription>
            Crie um novo usuário no sistema com perfis de acesso.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome Completo *</Label>
            <Input
              id="full_name"
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              placeholder="João da Silva"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="joao@email.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Mínimo 6 caracteres"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={form.cpf}
                onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))}
                placeholder="000.000.000-00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Perfis de Acesso</Label>
            <div className="grid grid-cols-2 gap-2">
              {PROFILES.map(p => (
                <div key={p.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`profile-${p.value}`}
                    checked={selectedProfiles.includes(p.value)}
                    onCheckedChange={() => toggleProfile(p.value)}
                  />
                  <Label htmlFor={`profile-${p.value}`} className="text-sm cursor-pointer">
                    {p.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
            Criar Usuário
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
