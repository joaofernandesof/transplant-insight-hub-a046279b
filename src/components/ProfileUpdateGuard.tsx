/**
 * ProfileUpdateGuard - Exige atualização cadastral obrigatória
 * Campos obrigatórios: nome completo, e-mail, CPF, data de nascimento, endereço
 * Bloqueia navegação até que o usuário preencha todos os campos
 */

import { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { UserCog, Loader2, MapPin } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ProfileData {
  full_name: string;
  email: string;
  cpf: string;
  birth_date: string;
  phone: string;
  address_cep: string;
  address_street: string;
  address_number: string;
  address_complement: string;
  address_neighborhood: string;
  address_city: string;
  address_state: string;
}

function isProfileComplete(data: Partial<ProfileData>): boolean {
  return !!(
    data.full_name?.trim() &&
    data.email?.trim() &&
    data.cpf?.trim() &&
    data.birth_date?.trim() &&
    data.address_cep?.trim() &&
    data.address_street?.trim() &&
    data.address_number?.trim() &&
    data.address_neighborhood?.trim() &&
    data.address_city?.trim() &&
    data.address_state?.trim()
  );
}

function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatCEP(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function ProfileUpdateGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, refreshUser } = useUnifiedAuth();
  const isMobile = useIsMobile();
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetchingCep, setFetchingCep] = useState(false);
  const [form, setForm] = useState<ProfileData>({
    full_name: '',
    email: '',
    cpf: '',
    birth_date: '',
    phone: '',
    address_cep: '',
    address_street: '',
    address_number: '',
    address_complement: '',
    address_neighborhood: '',
    address_city: '',
    address_state: '',
  });

  // Check if profile is complete when user loads
  useEffect(() => {
    if (!isAuthenticated || !user || isLoading) return;

    const checkProfile = async () => {
      const { data, error } = await supabase
        .from('neohub_users')
        .select('full_name, email, cpf, birth_date, phone, address_cep, address_street, address_number, address_complement, address_neighborhood, address_city, address_state')
        .eq('user_id', user.authUserId)
        .maybeSingle();

      if (error || !data) return;

      // Check if dismissed today (admin can skip temporarily)
      const dismissedKey = `profile-update-dismissed-${user.authUserId}`;
      const dismissed = sessionStorage.getItem(dismissedKey);

      if (!isProfileComplete(data) && !dismissed) {
        setForm({
          full_name: data.full_name || user.fullName || '',
          email: data.email || user.email || '',
          cpf: data.cpf || '',
          birth_date: data.birth_date || '',
          phone: data.phone || '',
          address_cep: data.address_cep || '',
          address_street: data.address_street || '',
          address_number: data.address_number || '',
          address_complement: data.address_complement || '',
          address_neighborhood: data.address_neighborhood || '',
          address_city: data.address_city || '',
          address_state: data.address_state || '',
        });
        setShowModal(true);
      }
    };

    checkProfile();
  }, [isAuthenticated, user, isLoading]);

  const handleCepLookup = async (cep: string) => {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) return;

    setFetchingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm(prev => ({
          ...prev,
          address_street: data.logradouro || prev.address_street,
          address_neighborhood: data.bairro || prev.address_neighborhood,
          address_city: data.localidade || prev.address_city,
          address_state: data.uf || prev.address_state,
        }));
      }
    } catch {
      // silently fail
    } finally {
      setFetchingCep(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate
    if (!form.full_name.trim()) return toast.error('Nome completo é obrigatório');
    if (!form.cpf.replace(/\D/g, '') || form.cpf.replace(/\D/g, '').length < 11) return toast.error('CPF inválido');
    if (!form.birth_date) return toast.error('Data de nascimento é obrigatória');
    if (!form.address_cep.replace(/\D/g, '') || form.address_cep.replace(/\D/g, '').length < 8) return toast.error('CEP é obrigatório');
    if (!form.address_street.trim()) return toast.error('Rua é obrigatória');
    if (!form.address_number.trim()) return toast.error('Número é obrigatório');
    if (!form.address_neighborhood.trim()) return toast.error('Bairro é obrigatório');
    if (!form.address_city.trim()) return toast.error('Cidade é obrigatória');
    if (!form.address_state.trim()) return toast.error('Estado é obrigatório');

    setSaving(true);
    try {
      const { error } = await supabase
        .from('neohub_users')
        .update({
          full_name: form.full_name.trim(),
          cpf: form.cpf.replace(/\D/g, ''),
          birth_date: form.birth_date,
          phone: form.phone.replace(/\D/g, '') || null,
          address_cep: form.address_cep.replace(/\D/g, ''),
          address_street: form.address_street.trim(),
          address_number: form.address_number.trim(),
          address_complement: form.address_complement.trim() || null,
          address_neighborhood: form.address_neighborhood.trim(),
          address_city: form.address_city.trim(),
          address_state: form.address_state.trim(),
        })
        .eq('user_id', user.authUserId);

      if (error) throw error;

      toast.success('Cadastro atualizado com sucesso!');
      setShowModal(false);
      await refreshUser();
    } catch (err: any) {
      toast.error('Erro ao salvar: ' + (err.message || 'Tente novamente'));
    } finally {
      setSaving(false);
    }
  };

  const handleDismiss = () => {
    if (user?.isAdmin) {
      sessionStorage.setItem(`profile-update-dismissed-${user.authUserId}`, 'true');
      setShowModal(false);
    }
  };

  return (
    <>
      {children}
      <Dialog open={showModal} onOpenChange={(v) => { if (!v && user?.isAdmin) handleDismiss(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => { if (!user?.isAdmin) e.preventDefault(); }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <UserCog className="h-5 w-5 text-primary" />
              Atualização Cadastral Obrigatória
            </DialogTitle>
            <DialogDescription>
              Para continuar usando o sistema, preencha todos os campos abaixo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Nome completo */}
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Nome Completo *</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => setForm(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Seu nome completo"
              />
            </div>

            {/* E-mail (readonly) */}
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                value={form.email}
                disabled
                className="opacity-60"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* CPF */}
              <div className="space-y-1.5">
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  value={form.cpf}
                  onChange={(e) => setForm(prev => ({ ...prev, cpf: formatCPF(e.target.value) }))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>

              {/* Data de Nascimento */}
              <div className="space-y-1.5">
                <Label htmlFor="birth_date">Data de Nascimento *</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={form.birth_date}
                  onChange={(e) => setForm(prev => ({ ...prev, birth_date: e.target.value }))}
                />
              </div>
            </div>

            {/* Telefone */}
            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefone / WhatsApp</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>

            {/* Endereço */}
            <div className="border-t pt-4 mt-4">
              <p className="text-sm font-semibold flex items-center gap-1.5 mb-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Endereço *
              </p>

              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="cep">CEP *</Label>
                  <Input
                    id="cep"
                    value={form.address_cep}
                    onChange={(e) => {
                      const val = formatCEP(e.target.value);
                      setForm(prev => ({ ...prev, address_cep: val }));
                      if (val.replace(/\D/g, '').length === 8) handleCepLookup(val);
                    }}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                </div>
                <div className="flex items-end">
                  {fetchingCep && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mb-3" />}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="street">Rua *</Label>
                  <Input
                    id="street"
                    value={form.address_street}
                    onChange={(e) => setForm(prev => ({ ...prev, address_street: e.target.value }))}
                    placeholder="Rua / Avenida"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="number">Nº *</Label>
                  <Input
                    id="number"
                    value={form.address_number}
                    onChange={(e) => setForm(prev => ({ ...prev, address_number: e.target.value }))}
                    placeholder="123"
                  />
                </div>
              </div>

              <div className="space-y-1.5 mb-3">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  value={form.address_complement}
                  onChange={(e) => setForm(prev => ({ ...prev, address_complement: e.target.value }))}
                  placeholder="Apto, Sala, etc."
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="neighborhood">Bairro *</Label>
                  <Input
                    id="neighborhood"
                    value={form.address_neighborhood}
                    onChange={(e) => setForm(prev => ({ ...prev, address_neighborhood: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city">Cidade *</Label>
                  <Input
                    id="city"
                    value={form.address_city}
                    onChange={(e) => setForm(prev => ({ ...prev, address_city: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="state">UF *</Label>
                  <Input
                    id="state"
                    value={form.address_state}
                    onChange={(e) => setForm(prev => ({ ...prev, address_state: e.target.value.toUpperCase().slice(0, 2) }))}
                    placeholder="CE"
                    maxLength={2}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            {user?.isAdmin ? (
              <Button variant="ghost" size="sm" onClick={handleDismiss} className="text-muted-foreground text-xs">
                Pular por agora
              </Button>
            ) : (
              <div />
            )}
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvar Cadastro
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
