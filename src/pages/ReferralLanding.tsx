import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  GraduationCap, 
  CheckCircle2, 
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  BookOpen,
  ArrowRight,
  Award,
  Users,
  Star,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const COURSE_INTERESTS = [
  'Transplante Capilar FUE',
  'Micropigmentação Capilar',
  'Tricologia Avançada',
  'PRP e Mesoterapia',
  'Formação 360 Completa',
  'Outro'
];

const formSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(100),
  email: z.string().email('Email inválido').max(255),
  phone: z.string().min(10, 'Telefone inválido').max(20),
  city: z.string().min(2, 'Cidade é obrigatória').max(100),
  state: z.string().length(2, 'Selecione um estado'),
  interest: z.string().min(1, 'Selecione uma área de interesse'),
  selectedClass: z.string().min(1, 'Selecione uma turma')
});

export default function ReferralLanding() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  
  const [referrerName, setReferrerName] = useState<string>('');
  const [referrerUserId, setReferrerUserId] = useState<string>('');
  const [isValidCode, setIsValidCode] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [availableClasses, setAvailableClasses] = useState<Array<{id: string; name: string; start_date: string}>>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    interest: '',
    selectedClass: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (code) {
      validateReferralCode();
    }
  }, [code]);

  // Fetch available classes with confirmed dates
  useEffect(() => {
    const fetchClasses = async () => {
      const { data } = await supabase
        .from('course_classes')
        .select('id, name, start_date')
        .not('start_date', 'is', null)
        .gte('start_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: true });
      
      if (data) {
        setAvailableClasses(data);
      }
    };
    fetchClasses();
  }, []);

  const validateReferralCode = async () => {
    try {
      const upperCode = code?.toUpperCase();
      
      // Try neohub_users first
      const { data: neohubUser } = await supabase
        .from('neohub_users')
        .select('user_id, full_name')
        .eq('referral_code', upperCode)
        .maybeSingle();
      
      if (neohubUser) {
        setReferrerName(neohubUser.full_name);
        setReferrerUserId(neohubUser.user_id);
        setIsValidCode(true);
        return;
      }
      
      // Fallback to profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, name')
        .eq('referral_code', upperCode)
        .maybeSingle();

      if (profile) {
        setReferrerName(profile.name);
        setReferrerUserId(profile.user_id);
        setIsValidCode(true);
        return;
      }
      
      setIsValidCode(false);
    } catch (error) {
      console.error('Error validating referral code:', error);
      setIsValidCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const result = formSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    if (!referrerUserId) {
      toast.error('Código de indicação inválido');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('referral_leads')
        .insert({
          referrer_user_id: referrerUserId,
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          city: formData.city.trim(),
          state: formData.state,
          interest: formData.interest,
          status: 'pending'
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Este email já foi cadastrado');
        } else {
          throw error;
        }
        return;
      }

      // Notify admin about new referral (fire and forget)
      try {
        await supabase.functions.invoke('notify-referral', {
          body: {
            name: formData.name.trim(),
            email: formData.email.trim().toLowerCase(),
            phone: formData.phone.trim(),
            referrer_name: referrerName,
            type: 'referral_lead',
            city: formData.city.trim(),
            state: formData.state,
            interest: formData.interest,
          }
        });
      } catch (notifyError) {
        console.error('Error notifying admin:', notifyError);
        // Don't throw - notification is not critical
      }

      setIsSubmitted(true);
      toast.success('Cadastro realizado com sucesso!');
    } catch (error) {
      console.error('Error submitting referral:', error);
      toast.error('Erro ao enviar cadastro. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isValidCode === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  // Invalid code
  if (!isValidCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="p-4 rounded-full bg-destructive/10 w-fit mx-auto mb-4">
              <GraduationCap className="h-12 w-12 text-destructive" />
            </div>
            <h2 className="text-xl font-bold mb-2">Link Inválido</h2>
            <p className="text-muted-foreground mb-4">
              Este link de indicação não é válido ou expirou.
            </p>
            <Button onClick={() => navigate('/')}>
              Ir para o site
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="p-4 rounded-full bg-green-500/10 w-fit mx-auto mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Cadastro Realizado!</h2>
            <p className="text-muted-foreground mb-4">
              Obrigado pelo seu interesse! Nossa equipe entrará em contato em breve para apresentar nossos cursos e condições especiais.
            </p>
            <div className="p-4 bg-muted rounded-lg text-sm">
              <p className="font-medium">Você foi indicado por:</p>
              <p className="text-primary">{referrerName}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center text-white mb-12">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm mb-6">
            <Star className="h-4 w-4 text-yellow-400" />
            Indicação de {referrerName}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Cursos de Transplante Capilar
          </h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto">
            Formação completa com os melhores profissionais do mercado. 
            Transforme sua carreira e domine as técnicas mais avançadas.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center text-white">
            <Award className="h-10 w-10 mx-auto mb-3 text-yellow-400" />
            <h3 className="font-semibold mb-2">Certificação Reconhecida</h3>
            <p className="text-sm text-blue-100">Certificado válido em todo território nacional</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center text-white">
            <Users className="h-10 w-10 mx-auto mb-3 text-yellow-400" />
            <h3 className="font-semibold mb-2">Turmas Reduzidas</h3>
            <p className="text-sm text-blue-100">Atenção personalizada para cada aluno</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center text-white">
            <BookOpen className="h-10 w-10 mx-auto mb-3 text-yellow-400" />
            <h3 className="font-semibold mb-2">Prática Intensiva</h3>
            <p className="text-sm text-blue-100">Aprenda fazendo com casos reais</p>
          </div>
        </div>


        {/* Form */}
        <Card className="max-w-lg mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              Quero Saber Mais
            </CardTitle>
            <CardDescription>
              Preencha seus dados e nossa equipe entrará em contato
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={`pl-10 ${errors.name ? 'border-destructive' : ''}`}
                    placeholder="Seu nome completo"
                  />
                </div>
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                    placeholder="seu@email.com"
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">WhatsApp *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className={`pl-10 ${errors.phone ? 'border-destructive' : ''}`}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      className={`pl-10 ${errors.city ? 'border-destructive' : ''}`}
                      placeholder="Sua cidade"
                    />
                  </div>
                  {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado *</Label>
                  <Select 
                    value={formData.state} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, state: value }))}
                  >
                    <SelectTrigger className={errors.state ? 'border-destructive' : ''}>
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRAZILIAN_STATES.map((state) => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="interest">Área de Interesse *</Label>
                <Select 
                  value={formData.interest} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, interest: value }))}
                >
                  <SelectTrigger className={errors.interest ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Selecione uma área" />
                  </SelectTrigger>
                  <SelectContent>
                    {COURSE_INTERESTS.map((interest) => (
                      <SelectItem key={interest} value={interest}>{interest}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.interest && <p className="text-xs text-destructive">{errors.interest}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="selectedClass" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Qual turma deseja participar? *
                </Label>
                <Select 
                  value={formData.selectedClass} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, selectedClass: value }))}
                >
                  <SelectTrigger className={errors.selectedClass ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Selecione a turma" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableClasses.map((cls) => {
                      const date = new Date(cls.start_date + 'T12:00:00');
                      const formattedDate = date.toLocaleDateString('pt-BR', { 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric' 
                      });
                      return (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name} - {formattedDate}
                        </SelectItem>
                      );
                    })}
                    <SelectItem value="undecided">
                      Ainda não sei qual turma vou participar
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.selectedClass && <p className="text-xs text-destructive">{errors.selectedClass}</p>}
              </div>

              <Button 
                type="submit" 
                className="w-full gap-2" 
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    Quero Receber Informações
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Ao enviar, você concorda em receber contato sobre nossos cursos.
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-blue-200 text-sm mt-12">
          <p>© {new Date().getFullYear()} IBRAMEC - Instituto Brasileiro de Medicina Capilar</p>
        </div>
      </div>
    </div>
  );
}
