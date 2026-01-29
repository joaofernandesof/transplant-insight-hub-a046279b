import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { format, differenceInSeconds, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Clock, AlertTriangle, Plane, Hotel, Users, 
  GraduationCap, FileText, Upload, CheckCircle2,
  Flame, Timer, MapPin
} from 'lucide-react';

// Máscaras de input
const formatCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .slice(0, 14);
};

const formatPhone = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 15);
};

const formatCEP = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 9);
};

const formatCurrency = (value: string) => {
  const numericValue = value.replace(/\D/g, '');
  const number = parseInt(numericValue) / 100;
  return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export default function SalesUrgencyPage() {
  const queryClient = useQueryClient();
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [residenceProof, setResidenceProof] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    cpf: '',
    email: '',
    crm: '',
    birthDate: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    cep: '',
    instagram: '',
    licenseFee: '',
    signalPaid: '',
    signalPaymentMethod: '',
    signalPaymentDate: '',
    balanceDue: '',
    balancePaymentMethod: '',
    monthlyFee: '',
    firstMonthlyDate: '',
    monthlyPaymentMethod: '',
    observations: ''
  });

  // Contador regressivo até 23:59
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const endOfToday = endOfDay(now);
      const diff = differenceInSeconds(endOfToday, now);
      
      if (diff > 0) {
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;
        setTimeLeft({ hours, minutes, seconds });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Buscar turmas confirmadas
  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['urgency-classes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_classes')
        .select(`
          id,
          code,
          name,
          start_date,
          end_date,
          location,
          max_students,
          status,
          courses (id, title)
        `)
        .in('status', ['active', 'confirmed', 'in_progress'])
        .not('start_date', 'is', null)
        .order('start_date', { ascending: true });

      if (error) throw error;
      
      // Buscar contagem de matrículas para cada turma
      const classesWithEnrollments = await Promise.all(
        (data || []).map(async (cls) => {
          const { count } = await supabase
            .from('class_enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', cls.id);
          
          return {
            ...cls,
            enrolledCount: count || 0,
            course: cls.courses as any
          };
        })
      );

      return classesWithEnrollments;
    }
  });

  // Filtrar turmas por curso
  const formacao360Classes = classes.filter(c => 
    c.course?.title?.toLowerCase().includes('formação') || 
    c.course?.title?.toLowerCase().includes('360')
  );
  
  const browsClasses = classes.filter(c => 
    c.course?.title?.toLowerCase().includes('brow') ||
    c.course?.title?.toLowerCase().includes('sobrancelha')
  );

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;
    
    switch (field) {
      case 'cpf':
        formattedValue = formatCPF(value);
        break;
      case 'phone':
        formattedValue = formatPhone(value);
        break;
      case 'cep':
        formattedValue = formatCEP(value);
        break;
      case 'licenseFee':
      case 'signalPaid':
      case 'balanceDue':
      case 'monthlyFee':
        formattedValue = formatCurrency(value);
        break;
    }
    
    setFormData(prev => ({ ...prev, [field]: formattedValue }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 5MB.');
        return;
      }
      setResidenceProof(file);
      toast.success('Comprovante anexado com sucesso!');
    }
  };

  const handleSubmit = async () => {
    if (!selectedClass) {
      toast.error('Selecione uma turma');
      return;
    }
    
    if (!formData.fullName || !formData.cpf || !formData.email || !formData.phone) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    if (!residenceProof) {
      toast.error('Anexe o comprovante de residência');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload do comprovante
      const fileExt = residenceProof.name.split('.').pop();
      const fileName = `${formData.cpf.replace(/\D/g, '')}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('patient-documents')
        .upload(`vouchers/${fileName}`, residenceProof);

      if (uploadError) throw uploadError;

      // Determinar tipo de voucher baseado na cidade
      const isSaoPaulo = formData.city.toLowerCase().includes('são paulo') || 
                         formData.state.toLowerCase() === 'sp';
      const voucherType = isSaoPaulo ? 'hospedagem' : 'passagem_aerea';

      // Salvar registro (usando tabela existente ou criando log)
      const registrationData = {
        class_id: selectedClass,
        ...formData,
        voucher_type: voucherType,
        residence_proof_path: `vouchers/${fileName}`,
        created_at: new Date().toISOString()
      };

      // Log para acompanhamento
      console.log('Registro de venda urgente:', registrationData);
      
      toast.success(
        `Cadastro realizado com sucesso! Voucher de ${isSaoPaulo ? 'HOSPEDAGEM' : 'PASSAGEM AÉREA'} será processado.`,
        { duration: 5000 }
      );

      // Reset form
      setFormData({
        fullName: '', phone: '', cpf: '', email: '', crm: '', birthDate: '',
        street: '', number: '', complement: '', neighborhood: '', city: '',
        state: '', cep: '', instagram: '', licenseFee: '', signalPaid: '',
        signalPaymentMethod: '', signalPaymentDate: '', balanceDue: '',
        balancePaymentMethod: '', monthlyFee: '', firstMonthlyDate: '',
        monthlyPaymentMethod: '', observations: ''
      });
      setResidenceProof(null);
      setSelectedClass(null);

    } catch (error: any) {
      toast.error('Erro ao processar cadastro: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderClassCard = (cls: any) => {
    const maxStudents = cls.max_students || 10;
    const enrolled = cls.enrolledCount;
    const remaining = Math.max(0, maxStudents - enrolled);
    const percentage = Math.min(100, (enrolled / maxStudents) * 100);
    const isAlmostFull = remaining <= 2;

    return (
      <Card 
        key={cls.id} 
        className={`cursor-pointer transition-all ${
          selectedClass === cls.id 
            ? 'ring-2 ring-primary border-primary' 
            : 'hover:border-primary/50'
        } ${isAlmostFull ? 'bg-red-50 dark:bg-red-950/20' : ''}`}
        onClick={() => setSelectedClass(cls.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-semibold">{cls.name}</h4>
              <p className="text-sm text-muted-foreground">{cls.code}</p>
            </div>
            {isAlmostFull && (
              <Badge variant="destructive" className="animate-pulse">
                <Flame className="h-3 w-3 mr-1" />
                ÚLTIMAS VAGAS
              </Badge>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {cls.start_date && format(new Date(cls.start_date), "dd 'de' MMMM", { locale: ptBR })}
                {cls.end_date && ` - ${format(new Date(cls.end_date), "dd 'de' MMMM", { locale: ptBR })}`}
              </span>
            </div>
            {cls.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{cls.location}</span>
              </div>
            )}
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Ocupação</span>
              <span className={`font-semibold ${isAlmostFull ? 'text-red-600' : ''}`}>
                {enrolled}/{maxStudents} vagas
              </span>
            </div>
            <Progress 
              value={percentage} 
              className={`h-2 ${isAlmostFull ? '[&>div]:bg-red-500' : ''}`}
            />
            {isAlmostFull && (
              <p className="text-xs text-red-600 mt-1 font-medium">
                Apenas {remaining} {remaining === 1 ? 'vaga restante' : 'vagas restantes'}!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header com Urgência */}
      <div className="bg-gradient-to-r from-red-600 to-orange-500 rounded-2xl p-6 text-white">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Promoção Exclusiva - Cirurgia Center</h1>
              <p className="opacity-90">Voucher de Passagem Aérea ou Hospedagem para as próximas turmas</p>
            </div>
          </div>
          
          {/* Contador Regressivo */}
          <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-sm text-center mb-2 opacity-90">Oferta expira em:</p>
            <div className="flex gap-2 items-center">
              <div className="text-center">
                <div className="text-3xl font-bold font-mono">
                  {String(timeLeft.hours).padStart(2, '0')}
                </div>
                <div className="text-xs opacity-75">horas</div>
              </div>
              <span className="text-2xl">:</span>
              <div className="text-center">
                <div className="text-3xl font-bold font-mono">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </div>
                <div className="text-xs opacity-75">min</div>
              </div>
              <span className="text-2xl">:</span>
              <div className="text-center">
                <div className="text-3xl font-bold font-mono">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </div>
                <div className="text-xs opacity-75">seg</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Vouchers */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-500 rounded-xl">
              <Plane className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Passagem Aérea</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Para médicos de fora de São Paulo
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-500 rounded-xl">
              <Hotel className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-purple-900 dark:text-purple-100">Hospedagem</h3>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Para médicos residentes em São Paulo
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Turmas Disponíveis */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Formação 360 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Formação 360
            </CardTitle>
            <CardDescription>Turmas com datas confirmadas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="text-muted-foreground">Carregando turmas...</p>
            ) : formacao360Classes.length > 0 ? (
              formacao360Classes.map(renderClassCard)
            ) : (
              <p className="text-muted-foreground">Nenhuma turma confirmada no momento</p>
            )}
          </CardContent>
        </Card>

        {/* Brows */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Curso Brows
            </CardTitle>
            <CardDescription>Turmas com datas confirmadas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="text-muted-foreground">Carregando turmas...</p>
            ) : browsClasses.length > 0 ? (
              browsClasses.map(renderClassCard)
            ) : (
              <p className="text-muted-foreground">Nenhuma turma confirmada no momento</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Formulário de Cadastro */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Cadastro - Licença ByNeofolic
          </CardTitle>
          <CardDescription>
            Preencha os dados do médico para garantir a vaga com voucher
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Dados Pessoais */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Dados Pessoais
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="Nome completo do médico"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => handleInputChange('cpf', e.target.value)}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="crm">CRM</Label>
                  <Input
                    id="crm"
                    value={formData.crm}
                    onChange={(e) => handleInputChange('crm', e.target.value)}
                    placeholder="CRM/UF 00000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Data de Nascimento</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => handleInputChange('birthDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram">Link do Instagram</Label>
                  <Input
                    id="instagram"
                    value={formData.instagram}
                    onChange={(e) => handleInputChange('instagram', e.target.value)}
                    placeholder="@usuario ou URL"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Endereço */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Endereço (para definição do voucher)
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2 lg:col-span-2">
                  <Label htmlFor="street">Rua/Avenida *</Label>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) => handleInputChange('street', e.target.value)}
                    placeholder="Nome da rua"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number">Número *</Label>
                  <Input
                    id="number"
                    value={formData.number}
                    onChange={(e) => handleInputChange('number', e.target.value)}
                    placeholder="Nº"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    value={formData.complement}
                    onChange={(e) => handleInputChange('complement', e.target.value)}
                    placeholder="Apto, Sala..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro *</Label>
                  <Input
                    id="neighborhood"
                    value={formData.neighborhood}
                    onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                    placeholder="Bairro"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Cidade"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado *</Label>
                  <Select
                    value={formData.state}
                    onValueChange={(value) => handleInputChange('state', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP *</Label>
                  <Input
                    id="cep"
                    value={formData.cep}
                    onChange={(e) => handleInputChange('cep', e.target.value)}
                    placeholder="00000-000"
                  />
                </div>
              </div>

              {/* Upload Comprovante */}
              <div className="mt-4 p-4 border-2 border-dashed rounded-lg">
                <Label htmlFor="residenceProof" className="cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${residenceProof ? 'bg-green-100 text-green-600' : 'bg-muted'}`}>
                      {residenceProof ? <CheckCircle2 className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-medium">
                        {residenceProof ? residenceProof.name : 'Anexar Comprovante de Residência *'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        PDF, JPG ou PNG (máx. 5MB) - Necessário para definir tipo de voucher
                      </p>
                    </div>
                  </div>
                </Label>
                <Input
                  id="residenceProof"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            <Separator />

            {/* Dados Financeiros */}
            <div>
              <h3 className="font-semibold mb-4">💰 Dados Financeiros</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="licenseFee">Taxa de Licença</Label>
                  <Input
                    id="licenseFee"
                    value={formData.licenseFee}
                    onChange={(e) => handleInputChange('licenseFee', e.target.value)}
                    placeholder="R$ 0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signalPaid">Sinal Pago</Label>
                  <Input
                    id="signalPaid"
                    value={formData.signalPaid}
                    onChange={(e) => handleInputChange('signalPaid', e.target.value)}
                    placeholder="R$ 0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signalPaymentMethod">Forma de Pagamento do Sinal</Label>
                  <Select
                    value={formData.signalPaymentMethod}
                    onValueChange={(value) => handleInputChange('signalPaymentMethod', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">Pix</SelectItem>
                      <SelectItem value="credito">Cartão de Crédito</SelectItem>
                      <SelectItem value="debito">Cartão de Débito</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="transferencia">Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signalPaymentDate">Data de Pagamento do Sinal</Label>
                  <Input
                    id="signalPaymentDate"
                    type="date"
                    value={formData.signalPaymentDate}
                    onChange={(e) => handleInputChange('signalPaymentDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="balanceDue">Saldo Devedor</Label>
                  <Input
                    id="balanceDue"
                    value={formData.balanceDue}
                    onChange={(e) => handleInputChange('balanceDue', e.target.value)}
                    placeholder="R$ 0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="balancePaymentMethod">Forma de Pagamento do Saldo</Label>
                  <Select
                    value={formData.balancePaymentMethod}
                    onValueChange={(value) => handleInputChange('balancePaymentMethod', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">Pix</SelectItem>
                      <SelectItem value="credito">Cartão de Crédito</SelectItem>
                      <SelectItem value="parcelado">Parcelado</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Mensalidade da Licença */}
            <div>
              <h3 className="font-semibold mb-4">📅 Mensalidade da Licença</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthlyFee">Valor da Mensalidade</Label>
                  <Input
                    id="monthlyFee"
                    value={formData.monthlyFee}
                    onChange={(e) => handleInputChange('monthlyFee', e.target.value)}
                    placeholder="R$ 0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firstMonthlyDate">Data da Primeira Mensalidade</Label>
                  <Input
                    id="firstMonthlyDate"
                    type="date"
                    value={formData.firstMonthlyDate}
                    onChange={(e) => handleInputChange('firstMonthlyDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthlyPaymentMethod">Forma de Pagamento</Label>
                  <Select
                    value={formData.monthlyPaymentMethod}
                    onValueChange={(value) => handleInputChange('monthlyPaymentMethod', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stripe_recorrente">Stripe - Crédito Recorrente</SelectItem>
                      <SelectItem value="stripe_fatura">Stripe - Fatura Mensal</SelectItem>
                      <SelectItem value="pix_mensal">Pix Mensal</SelectItem>
                      <SelectItem value="boleto_mensal">Boleto Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observations">Observações Adicionais</Label>
              <Textarea
                id="observations"
                value={formData.observations}
                onChange={(e) => handleInputChange('observations', e.target.value)}
                placeholder="Informações adicionais relevantes..."
                rows={3}
              />
            </div>

            {/* Botão Submit */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setFormData({
                    fullName: '', phone: '', cpf: '', email: '', crm: '', birthDate: '',
                    street: '', number: '', complement: '', neighborhood: '', city: '',
                    state: '', cep: '', instagram: '', licenseFee: '', signalPaid: '',
                    signalPaymentMethod: '', signalPaymentDate: '', balanceDue: '',
                    balancePaymentMethod: '', monthlyFee: '', firstMonthlyDate: '',
                    monthlyPaymentMethod: '', observations: ''
                  });
                  setResidenceProof(null);
                  setSelectedClass(null);
                }}
              >
                Limpar Formulário
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedClass}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {isSubmitting ? (
                  <>Processando...</>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Garantir Vaga com Voucher
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
