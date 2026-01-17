import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ImageCropper } from '@/components/ImageCropper';
import { 
  ArrowLeft, 
  User, 
  Camera,
  Save,
  Loader2,
  Building2,
  MapPin,
  Phone,
  Mail,
  Instagram,
  MessageCircle,
  Image as ImageIcon,
  Plus,
  X,
  Briefcase
} from 'lucide-react';
import logoByNeofolic from '@/assets/logo-byneofolic.png';
import { toast } from 'sonner';

// Predefined services for hair transplant clinics
const PREDEFINED_SERVICES = [
  'Transplante Capilar FUE',
  'Transplante Capilar FUT',
  'Transplante de Barba',
  'Transplante de Sobrancelha',
  'Micropigmentação Capilar',
  'Mesoterapia Capilar',
  'PRP Capilar',
  'Tratamento com Laser',
  'Consulta Tricológica',
  'Tratamento para Alopecia'
];

interface ProfileData {
  name: string;
  email: string;
  clinic_name: string;
  city: string;
  state: string;
  phone: string;
  avatar_url: string | null;
  instagram_personal: string;
  whatsapp_personal: string;
  instagram_clinic: string;
  whatsapp_clinic: string;
  clinic_logo_url: string | null;
  services: string[];
}

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    email: '',
    clinic_name: '',
    city: '',
    state: '',
    phone: '',
    avatar_url: null,
    instagram_personal: '',
    whatsapp_personal: '',
    instagram_clinic: '',
    whatsapp_clinic: '',
    clinic_logo_url: null,
    services: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [newService, setNewService] = useState('');
  
  // Image cropper state
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [cropType, setCropType] = useState<'avatar' | 'logo'>('avatar');

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setProfile({
          name: data.name || '',
          email: data.email || '',
          clinic_name: data.clinic_name || '',
          city: data.city || '',
          state: data.state || '',
          phone: data.phone || '',
          avatar_url: data.avatar_url,
          instagram_personal: data.instagram_personal || '',
          whatsapp_personal: data.whatsapp_personal || '',
          instagram_clinic: data.instagram_clinic || '',
          whatsapp_clinic: data.whatsapp_clinic || '',
          clinic_logo_url: data.clinic_logo_url,
          services: data.services || []
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Erro ao carregar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: profile.name,
          clinic_name: profile.clinic_name,
          city: profile.city,
          state: profile.state,
          phone: profile.phone,
          instagram_personal: profile.instagram_personal,
          whatsapp_personal: profile.whatsapp_personal,
          instagram_clinic: profile.instagram_clinic,
          whatsapp_clinic: profile.whatsapp_clinic,
          services: profile.services
        })
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Erro ao salvar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'logo') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 10MB');
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
    setCropType(type);
    setCropperOpen(true);
    
    if (type === 'avatar' && fileInputRef.current) {
      fileInputRef.current.value = '';
    } else if (type === 'logo' && logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!user?.id) return;

    const isAvatar = cropType === 'avatar';
    if (isAvatar) {
      setIsUploading(true);
    } else {
      setIsUploadingLogo(true);
    }

    try {
      const bucket = isAvatar ? 'avatars' : 'clinic-logos';
      const fileName = `${user.id}/${isAvatar ? 'avatar' : 'logo'}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, croppedBlob, { 
          upsert: true,
          contentType: 'image/jpeg'
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      const imageUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const updateField = isAvatar ? 'avatar_url' : 'clinic_logo_url';
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ [updateField]: imageUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, [updateField]: imageUrl }));
      toast.success(isAvatar ? 'Foto atualizada com sucesso!' : 'Logo atualizada com sucesso!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(isAvatar ? 'Erro ao enviar foto' : 'Erro ao enviar logo');
    } finally {
      if (isAvatar) {
        setIsUploading(false);
      } else {
        setIsUploadingLogo(false);
      }
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage);
        setSelectedImage(null);
      }
    }
  };

  const toggleService = (service: string) => {
    setProfile(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const addCustomService = () => {
    if (!newService.trim()) return;
    if (profile.services.includes(newService.trim())) {
      toast.error('Este serviço já está na lista');
      return;
    }
    setProfile(prev => ({
      ...prev,
      services: [...prev.services, newService.trim()]
    }));
    setNewService('');
  };

  const removeService = (service: string) => {
    setProfile(prev => ({
      ...prev,
      services: prev.services.filter(s => s !== service)
    }));
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden w-full">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <img src={logoByNeofolic} alt="ByNeofolic" className="h-10 object-contain" />
            </div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <User className="h-6 w-6 text-primary" />
              Meu Perfil
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl overflow-x-hidden">
        {/* Avatar Section */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <div className="relative">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                    {getInitials(profile.name || 'U')}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  className="absolute bottom-0 right-0 rounded-full h-10 w-10"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, 'avatar')}
                />
              </div>
              <h2 className="mt-4 text-xl font-bold">{profile.name}</h2>
              <p className="text-muted-foreground">{profile.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Image Cropper Modal */}
        {selectedImage && (
          <ImageCropper
            open={cropperOpen}
            onClose={() => {
              setCropperOpen(false);
              if (selectedImage) {
                URL.revokeObjectURL(selectedImage);
                setSelectedImage(null);
              }
            }}
            imageSrc={selectedImage}
            onCropComplete={handleCropComplete}
          />
        )}

        {/* Personal Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>Seus dados de contato pessoais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  value={profile.email}
                  disabled
                  className="pl-10 bg-muted"
                />
              </div>
              <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone Pessoal</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                  className="pl-10"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="instagram_personal">Instagram Pessoal</Label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="instagram_personal"
                    value={profile.instagram_personal}
                    onChange={(e) => setProfile(prev => ({ ...prev, instagram_personal: e.target.value }))}
                    className="pl-10"
                    placeholder="@seuinstagram"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp_personal">WhatsApp Pessoal</Label>
                <div className="relative">
                  <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="whatsapp_personal"
                    value={profile.whatsapp_personal}
                    onChange={(e) => setProfile(prev => ({ ...prev, whatsapp_personal: e.target.value }))}
                    className="pl-10"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clinic Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informações da Clínica</CardTitle>
            <CardDescription>Dados de contato e redes sociais da sua clínica</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Clinic Logo */}
            <div className="space-y-2">
              <Label>Logo da Clínica</Label>
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted">
                  {profile.clinic_logo_url ? (
                    <img 
                      src={profile.clinic_logo_url} 
                      alt="Logo da clínica" 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isUploadingLogo}
                >
                  {isUploadingLogo ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4 mr-2" />
                      {profile.clinic_logo_url ? 'Alterar Logo' : 'Enviar Logo'}
                    </>
                  )}
                </Button>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, 'logo')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clinic">Nome da Clínica</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="clinic"
                  value={profile.clinic_name}
                  onChange={(e) => setProfile(prev => ({ ...prev, clinic_name: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="city"
                    value={profile.city}
                    onChange={(e) => setProfile(prev => ({ ...prev, city: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={profile.state}
                  onChange={(e) => setProfile(prev => ({ ...prev, state: e.target.value.toUpperCase().slice(0, 2) }))}
                  maxLength={2}
                  placeholder="UF"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="instagram_clinic">Instagram da Clínica</Label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="instagram_clinic"
                    value={profile.instagram_clinic}
                    onChange={(e) => setProfile(prev => ({ ...prev, instagram_clinic: e.target.value }))}
                    className="pl-10"
                    placeholder="@clinicainstagram"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp_clinic">WhatsApp da Clínica</Label>
                <div className="relative">
                  <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="whatsapp_clinic"
                    value={profile.whatsapp_clinic}
                    onChange={(e) => setProfile(prev => ({ ...prev, whatsapp_clinic: e.target.value }))}
                    className="pl-10"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Serviços Oferecidos
            </CardTitle>
            <CardDescription>Selecione os serviços que sua clínica oferece ou adicione novos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selected Services */}
            {profile.services.length > 0 && (
              <div className="space-y-2">
                <Label>Serviços selecionados</Label>
                <div className="flex flex-wrap gap-2">
                  {profile.services.map((service) => (
                    <Badge key={service} variant="secondary" className="pl-3 pr-1 py-1.5 flex items-center gap-1">
                      {service}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 hover:bg-destructive/20"
                        onClick={() => removeService(service)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Predefined Services */}
            <div className="space-y-2">
              <Label>Serviços disponíveis</Label>
              <div className="flex flex-wrap gap-2">
                {PREDEFINED_SERVICES.filter(s => !profile.services.includes(s)).map((service) => (
                  <Badge
                    key={service}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10 transition-colors"
                    onClick={() => toggleService(service)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {service}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Add Custom Service */}
            <div className="space-y-2">
              <Label>Adicionar outro serviço</Label>
              <div className="flex gap-2">
                <Input
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  placeholder="Nome do serviço"
                  onKeyDown={(e) => e.key === 'Enter' && addCustomService()}
                />
                <Button variant="outline" onClick={addCustomService}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button 
          className="w-full" 
          size="lg"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
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
      </main>
    </div>
  );
}
