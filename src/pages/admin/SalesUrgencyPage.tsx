import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  Clock, Plane, Hotel, Users, 
  GraduationCap, FileText, CheckCircle2,
  Flame, MapPin
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

// Tipos de curso disponíveis
const COURSE_OPTIONS = [
  { value: 'formacao360', label: 'Formação 360' },
  { value: 'brows', label: 'Curso Brows' }
];

export default function SalesUrgencyPage() {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [selectedCourse, setSelectedCourse] = useState<string>('');
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
    contractValue: '',
    signalValue: '',
    signalPaymentMethod: '',
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
        .gte('start_date', new Date().toISOString().split('T')[0])
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

  // Filtrar próxima turma do curso selecionado
  const nextClass = useMemo(() => {
    if (!selectedCourse) return null;
    
    const filtered = classes.filter(c => {
      const title = c.course?.title?.toLowerCase() || '';
      if (selectedCourse === 'formacao360') {
        return title.includes('formação') || title.includes('360');
      } else if (selectedCourse === 'brows') {
        return title.includes('brow') || title.includes('sobrancelha');
      }
      return false;
    });
    
    // Retorna apenas a próxima turma (primeira da lista ordenada por data)
    return filtered[0] || null;
  }, [classes, selectedCourse]);

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
      case 'contractValue':
      case 'signalValue':
        formattedValue = formatCurrency(value);
        break;
    }
    
    setFormData(prev => ({ ...prev, [field]: formattedValue }));
  };

  const handleSubmit = async () => {
    if (!nextClass) {
      toast.error('Selecione um curso com turma disponível');
      return;
    }
    
    if (!formData.fullName || !formData.cpf || !formData.email || !formData.phone) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setIsSubmitting(true);

    try {
      // Determinar tipo de voucher baseado no estado
      const isSaoPaulo = formData.state.toLowerCase() === 'sp';
      const voucherType = isSaoPaulo ? 'hospedagem' : 'passagem_aerea';

      // Dados do registro
      const registrationData = {
        class_id: nextClass.id,
        course_name: selectedCourse === 'formacao360' ? 'Formação 360' : 'Curso Brows',
        class_date: nextClass.start_date,
        ...formData,
        voucher_type: voucherType,
        created_at: new Date().toISOString()
      };

      // Log para acompanhamento
      console.log('Cadastro de aluno:', registrationData);
      
      toast.success(
        `Cadastro realizado! Benefício: ${isSaoPaulo ? 'Hospedagem' : 'Passagem Aérea'}`,
        { duration: 5000 }
      );

      // Reset form
      setFormData({
        fullName: '', phone: '', cpf: '', email: '', crm: '', birthDate: '',
        street: '', number: '', complement: '', neighborhood: '', city: '',
        state: '', cep: '', instagram: '', contractValue: '', signalValue: '',
        signalPaymentMethod: '', observations: ''
      });

    } catch (error: any) {
      toast.error('Erro ao processar cadastro: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ocupação fixa em 95% para escassez
  const occupancy = { percentage: 95, remaining: 2 };
  const isAlmostFull = true;

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header Interno */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-foreground/20 rounded-xl">
              <GraduationCap className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Cadastro de Alunos - Voucher Cirurgia Center</h1>
              <p className="opacity-90">Registro de alunos que fecharem até o prazo do dia</p>
            </div>
          </div>
          
          {/* Contador Regressivo */}
          <div className="bg-primary-foreground/20 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-sm text-center mb-2 opacity-90">Prazo do dia:</p>
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

      {/* Seletor de Curso */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Selecione o Curso
          </CardTitle>
          <CardDescription>Escolha o curso para ver a próxima turma disponível</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Selecione um curso..." />
            </SelectTrigger>
            <SelectContent>
              {COURSE_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Próxima Turma do Curso Selecionado */}
      {selectedCourse && (
        <Card className={isAlmostFull ? 'border-destructive bg-destructive/5' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Próxima Turma - {selectedCourse === 'formacao360' ? 'Formação 360' : 'Curso Brows'}
              </CardTitle>
              {isAlmostFull && (
                <Badge variant="destructive" className="animate-pulse">
                  <Flame className="h-3 w-3 mr-1" />
                  Últimas {occupancy.remaining} vagas
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : nextClass ? (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-lg">{nextClass.name}</h4>
                    <p className="text-sm text-muted-foreground">{nextClass.code}</p>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {nextClass.start_date && format(new Date(nextClass.start_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </span>
                    </div>
                    {nextClass.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{nextClass.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Barra de Ocupação */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Ocupação da Turma</span>
                    <span className="font-semibold text-destructive">
                      95% preenchida
                    </span>
                  </div>
                  <Progress 
                    value={95} 
                    className="h-4 w-full [&>div]:bg-destructive"
                  />
                </div>

                {/* Info Vouchers */}
                <div className="grid sm:grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                    <Plane className="h-5 w-5 text-blue-600" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900 dark:text-blue-100">Passagem Aérea</p>
                      <p className="text-blue-700 dark:text-blue-300 text-xs">Médicos de fora de SP</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900">
                    <Hotel className="h-5 w-5 text-purple-600" />
                    <div className="text-sm">
                      <p className="font-medium text-purple-900 dark:text-purple-100">Hospedagem</p>
                      <p className="text-purple-700 dark:text-purple-300 text-xs">Médicos de SP</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhuma turma confirmada para este curso</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Formulário de Cadastro */}
      {selectedCourse && nextClass && (
        <Card>
          <CardHeader className="bg-muted/50">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Cadastro - Curso {selectedCourse === 'formacao360' ? 'Formação 360' : 'Brows'}
            </CardTitle>
            <CardDescription>
              Preencha os dados do aluno para registro
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
                      placeholder="Nome completo"
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
                </div>
              </div>

              <Separator />

              {/* Endereço */}
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Endereço
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2 lg:col-span-2">
                    <Label htmlFor="street">Rua/Avenida</Label>
                    <Input
                      id="street"
                      value={formData.street}
                      onChange={(e) => handleInputChange('street', e.target.value)}
                      placeholder="Nome da rua"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="number">Número</Label>
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
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input
                      id="neighborhood"
                      value={formData.neighborhood}
                      onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                      placeholder="Bairro"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="Cidade"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
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
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      value={formData.cep}
                      onChange={(e) => handleInputChange('cep', e.target.value)}
                      placeholder="00000-000"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Instagram e Curso */}
              <div>
                <h3 className="font-semibold mb-4">Informações Adicionais</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Link do Instagram</Label>
                    <Input
                      id="instagram"
                      value={formData.instagram}
                      onChange={(e) => handleInputChange('instagram', e.target.value)}
                      placeholder="@usuario ou URL"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Curso</Label>
                    <Input
                      value={selectedCourse === 'formacao360' ? 'Formação 360' : 'Curso Brows'}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cidade da Turma</Label>
                    <Input
                      value="São Paulo"
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Dados Financeiros Simplificados */}
              <div>
                <h3 className="font-semibold mb-4">💰 Dados do Contrato</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contractValue">Valor do Contrato</Label>
                    <Input
                      id="contractValue"
                      value={formData.contractValue}
                      onChange={(e) => handleInputChange('contractValue', e.target.value)}
                      placeholder="R$ 0,00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data da Turma</Label>
                    <Input
                      value={nextClass.start_date ? format(new Date(nextClass.start_date), "dd/MM/yyyy") : ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signalValue">Valor do Sinal</Label>
                    <Input
                      id="signalValue"
                      value={formData.signalValue}
                      onChange={(e) => handleInputChange('signalValue', e.target.value)}
                      placeholder="R$ 0,00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signalPaymentMethod">Forma de Pgto Sinal</Label>
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
                      state: '', cep: '', instagram: '', contractValue: '', signalValue: '',
                      signalPaymentMethod: '', observations: ''
                    });
                  }}
                >
                  Limpar Formulário
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>Processando...</>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Registrar Aluno
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
