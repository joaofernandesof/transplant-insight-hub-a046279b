import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Lock, Palette, ArrowLeft, Loader2, Save, Moon, Sun, Monitor, Users, Eye, EyeOff, Instagram, Phone } from 'lucide-react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

export function AcademySettings() {
  const navigate = useNavigate();
  const { user, refreshUser } = useUnifiedAuth();
  const { theme, setTheme } = useTheme();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingCommunity, setIsSavingCommunity] = useState(false);
  
  // Profile form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [addressCep, setAddressCep] = useState('');
  const [addressStreet, setAddressStreet] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [addressComplement, setAddressComplement] = useState('');
  const [addressNeighborhood, setAddressNeighborhood] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressState, setAddressState] = useState('');

  // Community/Privacy form
  const [profilePublic, setProfilePublic] = useState(false);
  const [bio, setBio] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [instagramPersonal, setInstagramPersonal] = useState('');
  const [whatsappPersonal, setWhatsappPersonal] = useState('');

  // Password form
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
      setCpf(user.cpf || '');
      setBirthDate(user.birthDate || '');
      setAddressCep(user.addressCep || '');
      setAddressStreet(user.addressStreet || '');
      setAddressNumber(user.addressNumber || '');
      setAddressComplement(user.addressComplement || '');
      setAddressNeighborhood(user.addressNeighborhood || '');
      setAddressCity(user.addressCity || '');
      setAddressState(user.addressState || '');
      
      // Load community settings from DB
      loadCommunitySettings();
    }
  }, [user]);

  const loadCommunitySettings = async () => {
    if (!user?.id) return;
    
    const { data } = await supabase
      .from('neohub_users')
      .select('profile_public, bio, clinic_name, instagram_personal, whatsapp_personal')
      .eq('id', user.id)
      .single();
    
    if (data) {
      setProfilePublic(data.profile_public || false);
      setBio(data.bio || '');
      setClinicName(data.clinic_name || '');
      setInstagramPersonal(data.instagram_personal || '');
      setWhatsappPersonal(data.whatsapp_personal || '');
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsLoading(true);

    const { error } = await supabase
      .from('neohub_users')
      .update({
        full_name: fullName,
        phone,
        cpf,
        birth_date: birthDate || null,
        address_cep: addressCep,
        address_street: addressStreet,
        address_number: addressNumber,
        address_complement: addressComplement,
        address_neighborhood: addressNeighborhood,
        address_city: addressCity,
        address_state: addressState,
      })
      .eq('id', user.id);

    setIsLoading(false);

    if (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao salvar perfil');
    } else {
      toast.success('Perfil atualizado com sucesso!');
      refreshUser();
    }
  };

  const handleSaveCommunity = async () => {
    if (!user) return;
    
    setIsSavingCommunity(true);

    const { error } = await supabase
      .from('neohub_users')
      .update({
        profile_public: profilePublic,
        bio,
        clinic_name: clinicName,
        instagram_personal: instagramPersonal,
        whatsapp_personal: whatsappPersonal,
      })
      .eq('id', user.id);

    setIsSavingCommunity(false);

    if (error) {
      console.error('Error updating community settings:', error);
      toast.error('Erro ao salvar configurações');
    } else {
      toast.success('Configurações de comunidade salvas!');
      refreshUser();
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsSavingPassword(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    setIsSavingPassword(false);

    if (error) {
      toast.error('Erro ao alterar senha: ' + error.message);
    } else {
      toast.success('Senha alterada com sucesso!');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="p-4 pt-16 lg:pt-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/academy')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">Gerencie seu perfil e preferências</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="community" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Comunidade</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Segurança</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Aparência</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>Atualize seus dados cadastrais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user?.avatarUrl} />
                  <AvatarFallback className="text-lg bg-primary/10 text-primary">
                    {user?.fullName ? getInitials(user.fullName) : '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user?.fullName}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              {/* Form */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Data de Nascimento</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <h4 className="font-medium">Endereço</h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      value={addressCep}
                      onChange={(e) => setAddressCep(e.target.value)}
                      placeholder="00000-000"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="street">Rua</Label>
                    <Input
                      id="street"
                      value={addressStreet}
                      onChange={(e) => setAddressStreet(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="number">Número</Label>
                    <Input
                      id="number"
                      value={addressNumber}
                      onChange={(e) => setAddressNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="complement">Complemento</Label>
                    <Input
                      id="complement"
                      value={addressComplement}
                      onChange={(e) => setAddressComplement(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input
                      id="neighborhood"
                      value={addressNeighborhood}
                      onChange={(e) => setAddressNeighborhood(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={addressCity}
                      onChange={(e) => setAddressCity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      value={addressState}
                      onChange={(e) => setAddressState(e.target.value)}
                      maxLength={2}
                      placeholder="SP"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Community Tab */}
        <TabsContent value="community">
          <div className="space-y-6">
            {/* Visibility Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {profilePublic ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                  Visibilidade do Perfil
                </CardTitle>
                <CardDescription>
                  Controle o que outros alunos podem ver sobre você na Comunidade IBRAMEC
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                  <div className="space-y-0.5">
                    <Label htmlFor="profile-public" className="font-medium">Perfil Público</Label>
                    <p className="text-sm text-muted-foreground">
                      {profilePublic 
                        ? "Outros alunos podem ver suas informações detalhadas" 
                        : "Apenas seu nome e localização são visíveis"}
                    </p>
                  </div>
                  <Switch
                    id="profile-public"
                    checked={profilePublic}
                    onCheckedChange={setProfilePublic}
                  />
                </div>

                {profilePublic && (
                  <div className="text-xs text-muted-foreground bg-primary/5 p-3 rounded-lg">
                    <strong>Informações visíveis quando o perfil é público:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-0.5">
                      <li>Nome e localização (sempre visíveis)</li>
                      <li>Bio/descrição</li>
                      <li>Nome da clínica</li>
                      <li>Instagram e WhatsApp pessoal</li>
                      <li>Serviços oferecidos</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Profile Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>Informações da Comunidade</CardTitle>
                <CardDescription>
                  Dados que aparecerão no seu perfil público (se ativado)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio / Descrição</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Conte um pouco sobre você e sua experiência..."
                    rows={3}
                    maxLength={300}
                  />
                  <p className="text-xs text-muted-foreground text-right">{bio.length}/300</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinicName">Nome da Clínica</Label>
                  <Input
                    id="clinicName"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    placeholder="Clínica Exemplo"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="instagramPersonal" className="flex items-center gap-2">
                      <Instagram className="h-4 w-4" />
                      Instagram Pessoal
                    </Label>
                    <Input
                      id="instagramPersonal"
                      value={instagramPersonal}
                      onChange={(e) => setInstagramPersonal(e.target.value)}
                      placeholder="@seuusuario"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsappPersonal" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      WhatsApp Pessoal
                    </Label>
                    <Input
                      id="whatsappPersonal"
                      value={whatsappPersonal}
                      onChange={(e) => setWhatsappPersonal(e.target.value)}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={handleSaveCommunity} disabled={isSavingCommunity}>
                    {isSavingCommunity ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Configurações
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Alterar Senha</CardTitle>
              <CardDescription>Mantenha sua conta segura</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleChangePassword} disabled={isSavingPassword || !newPassword}>
                  {isSavingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Alterando...
                    </>
                  ) : (
                    'Alterar Senha'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Tema</CardTitle>
              <CardDescription>Personalize a aparência do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  className="h-24 flex-col gap-2"
                  onClick={() => setTheme('light')}
                >
                  <Sun className="h-6 w-6" />
                  Claro
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  className="h-24 flex-col gap-2"
                  onClick={() => setTheme('dark')}
                >
                  <Moon className="h-6 w-6" />
                  Escuro
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  className="h-24 flex-col gap-2"
                  onClick={() => setTheme('system')}
                >
                  <Monitor className="h-6 w-6" />
                  Sistema
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AcademySettings;