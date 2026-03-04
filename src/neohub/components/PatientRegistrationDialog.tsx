import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, UserPlus, Mail, MessageSquare, User, FileText, DollarSign, CalendarDays, CalendarOff, CalendarCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ProcedureCheckboxField } from '@/clinic/components/ProcedureCheckboxField';
import { useNavigate } from 'react-router-dom';

interface PatientRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// Branches are loaded dynamically from neoteam_branches (managed in /neoteam/settings)
const CATEGORIES = [
  'Categoria A - Hygor',
  'Categoria A - Patrick',
  'Categoria B',
  'Categoria C',
  'Categoria D',
  'A DEFINIR',
  'RETOUCHING',
];
const LEAD_SOURCES = ['INDICAÇÃO', 'GOOGLE', 'INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'YOUTUBE', 'SITE', 'EVENTO', 'OUTROS'];
const CONTRACT_STATUS = ['PENDENTE', 'ASSINADO', 'CANCELADO', 'EM_ANALISE'];

type DateOption = 'none' | 'no-date' | 'with-date';

export function PatientRegistrationDialog({ 
  open, 
  onOpenChange, 
  onSuccess 
}: PatientRegistrationDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [branches, setBranches] = useState<string[]>([]);
  const [dateOption, setDateOption] = useState<DateOption>('none');
  const [surgeryDate, setSurgeryDate] = useState('');
  const [surgeryTime, setSurgeryTime] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch branches from database
  useEffect(() => {
    const fetchBranches = async () => {
      const { data } = await supabase
        .from('neoteam_branches')
        .select('name')
        .eq('is_active', true)
        .order('name');
      if (data && data.length > 0) {
        setBranches(data.map(d => d.name));
      }
    };
    fetchBranches();
  }, []);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    cpf: '',
    birth_date: '',
    branch: '',
    category: '',
    service_type: '',
    seller: '',
    consultant: '',
    lead_source: '',
    vgv: '',
    down_payment: '',
    balance_due: '',
    contract_status: '',
    notes: '',
    send_email: true,
    send_whatsapp: true,
  });

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return '';
    const amount = parseInt(numbers) / 100;
    return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const parseCurrency = (value: string): number | null => {
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return null;
    return parseInt(numbers) / 100;
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.phone) {
      toast.error('Preencha pelo menos o nome e telefone');
      return;
    }

    if (dateOption === 'none') {
      toast.error('Selecione uma opção de agenda');
      return;
    }

    if (dateOption === 'with-date' && !surgeryDate) {
      toast.error('Preencha a data da cirurgia');
      return;
    }

    setIsLoading(true);

    try {
      let sendVia: 'email' | 'whatsapp' | 'both' | undefined;
      if (formData.send_email && formData.send_whatsapp) sendVia = 'both';
      else if (formData.send_email) sendVia = 'email';
      else if (formData.send_whatsapp) sendVia = 'whatsapp';

      // 1. Create patient
      const { data, error } = await supabase.functions.invoke('create-patient-account', {
        body: {
          email: formData.email || undefined,
          full_name: formData.full_name,
          phone: formData.phone,
          cpf: formData.cpf || undefined,
          birth_date: formData.birth_date || undefined,
          send_credentials_via: sendVia,
          branch: formData.branch || undefined,
          category: formData.category || undefined,
          service_type: formData.service_type || undefined,
          seller: formData.seller || undefined,
          consultant: formData.consultant || undefined,
          lead_source: formData.lead_source || undefined,
          vgv: parseCurrency(formData.vgv),
          down_payment: parseCurrency(formData.down_payment),
          balance_due: parseCurrency(formData.balance_due),
          contract_status: formData.contract_status || undefined,
          notes: formData.notes || undefined,
        }
      });

      if (error) throw error;
      if (data.error) {
        toast.error(data.error);
        return;
      }

      // 2. Create surgery record
      const user = (await supabase.auth.getUser()).data.user;
      const withDate = dateOption === 'with-date';

      const insertData: Record<string, any> = {
        patient_name: formData.full_name,
        branch: formData.branch || branches[0] || '',
        procedure: formData.service_type || null,
        category: formData.category || null,
        schedule_status: withDate ? 'agendado' : 'sem_data',
        notes: formData.notes || null,
        created_by: user?.id,
      };

      if (data.clinic_patient_id) {
        insertData.patient_id = data.clinic_patient_id;
      }

      if (withDate && surgeryDate) {
        insertData.surgery_date = surgeryDate;
        insertData.surgery_time = surgeryTime || null;
      }

      const { error: surgeryError } = await supabase
        .from('clinic_surgeries')
        .insert(insertData as any);

      if (surgeryError) throw surgeryError;

      // Invalidate all related queries so both views stay in sync
      queryClient.invalidateQueries({ queryKey: ['clinic-surgeries'] });
      queryClient.invalidateQueries({ queryKey: ['no-date-patients'] });
      queryClient.invalidateQueries({ queryKey: ['clinic-patients'] });

      toast.success(
        withDate 
          ? 'Paciente cadastrado e cirurgia agendada!' 
          : 'Paciente cadastrado e adicionado à fila sem data.'
      );
      
      onSuccess?.();
      handleClose();
      
      // Navigate to appropriate tab
      if (withDate) {
        navigate('/neoteam/agenda-cirurgica?tab=agenda');
      } else {
        navigate('/neoteam/agenda-cirurgica?tab=sem-data');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao cadastrar paciente');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setDateOption('none');
    setSurgeryDate('');
    setSurgeryTime('');
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      cpf: '',
      birth_date: '',
      branch: '',
      category: '',
      service_type: '',
      seller: '',
      consultant: '',
      lead_source: '',
      vgv: '',
      down_payment: '',
      balance_due: '',
      contract_status: '',
      notes: '',
      send_email: true,
      send_whatsapp: true,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Cadastrar Novo Paciente
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do paciente. Campos com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <form onSubmit={handleSubmitForm} className="space-y-6">
            {/* Dados Pessoais */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <User className="h-4 w-4" />
                Dados Pessoais
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="full_name">Nome Completo *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Nome completo do paciente"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">WhatsApp *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birth_date">Data de Nascimento</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Dados Comerciais */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <FileText className="h-4 w-4" />
                Dados Comerciais
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="branch">Filial</Label>
                  <Select
                    value={formData.branch}
                    onValueChange={(value) => setFormData({ ...formData, branch: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a filial" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map(branch => (
                        <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <ProcedureCheckboxField
                    value={formData.service_type}
                    onChange={(val) => setFormData({ ...formData, service_type: val })}
                    label="Procedimento/Serviço"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seller">Vendedor</Label>
                  <Input
                    id="seller"
                    value={formData.seller}
                    onChange={(e) => setFormData({ ...formData, seller: e.target.value })}
                    placeholder="Nome do vendedor"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="consultant">Consultor</Label>
                  <Input
                    id="consultant"
                    value={formData.consultant}
                    onChange={(e) => setFormData({ ...formData, consultant: e.target.value })}
                    placeholder="Nome do consultor"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lead_source">Fonte do Lead</Label>
                  <Select
                    value={formData.lead_source}
                    onValueChange={(value) => setFormData({ ...formData, lead_source: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Como conheceu?" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_SOURCES.map(source => (
                        <SelectItem key={source} value={source}>{source}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contract_status">Status do Contrato</Label>
                  <Select
                    value={formData.contract_status}
                    onValueChange={(value) => setFormData({ ...formData, contract_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTRACT_STATUS.map(status => (
                        <SelectItem key={status} value={status}>{status.replace('_', ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Agenda / Data da Cirurgia */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <CalendarDays className="h-4 w-4" />
                Agenda Cirúrgica
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Sem Data */}
                <div
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    dateOption === 'no-date'
                      ? 'border-destructive bg-destructive/10'
                      : 'border-border hover:border-destructive/40 hover:bg-destructive/5'
                  }`}
                  onClick={() => {
                    setDateOption('no-date');
                    setSurgeryDate('');
                    setSurgeryTime('');
                  }}
                >
                  <div className="flex items-center gap-2">
                    <CalendarOff className="h-4 w-4 text-destructive" />
                    <span className="font-medium text-sm">Sem Data Definida</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Paciente vai para fila de espera
                  </p>
                </div>

                {/* Com Data */}
                <div
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    dateOption === 'with-date'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/40 hover:bg-primary/5'
                  }`}
                  onClick={() => setDateOption('with-date')}
                >
                  <div className="flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">Com Data Definida</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Agendar diretamente na agenda
                  </p>
                </div>
              </div>

              {/* Date/time inputs when "with-date" is selected */}
              {dateOption === 'with-date' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-1">
                  <div className="space-y-2">
                    <Label htmlFor="surgery_date">Data da Cirurgia *</Label>
                    <Input
                      id="surgery_date"
                      type="date"
                      value={surgeryDate}
                      onChange={(e) => setSurgeryDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="surgery_time">Horário</Label>
                    <Input
                      id="surgery_time"
                      type="time"
                      value={surgeryTime}
                      onChange={(e) => setSurgeryTime(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Dados Financeiros */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <DollarSign className="h-4 w-4" />
                Dados Financeiros
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vgv">VGV (Valor Total)</Label>
                  <Input
                    id="vgv"
                    value={formData.vgv}
                    onChange={(e) => setFormData({ ...formData, vgv: formatCurrency(e.target.value) })}
                    placeholder="R$ 0,00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="down_payment">Entrada</Label>
                  <Input
                    id="down_payment"
                    value={formData.down_payment}
                    onChange={(e) => setFormData({ ...formData, down_payment: formatCurrency(e.target.value) })}
                    placeholder="R$ 0,00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="balance_due">Saldo Devedor</Label>
                  <Input
                    id="balance_due"
                    value={formData.balance_due}
                    onChange={(e) => setFormData({ ...formData, balance_due: formatCurrency(e.target.value) })}
                    placeholder="R$ 0,00"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Observações */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observações adicionais sobre o paciente..."
                  rows={3}
                />
              </div>
            </div>

            <Separator />

            {/* Configurações de Envio */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Enviar credenciais via:</p>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={formData.send_email}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, send_email: checked as boolean })
                    }
                  />
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">Email</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={formData.send_whatsapp}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, send_whatsapp: checked as boolean })
                    }
                  />
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-sm">WhatsApp</span>
                </label>
              </div>
            </div>
          </form>
        </ScrollArea>

        <DialogFooter className="gap-2 pt-4">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmitForm} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cadastrando...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Cadastrar Paciente
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
