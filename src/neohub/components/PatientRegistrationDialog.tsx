import React, { useState } from 'react';
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
import { Loader2, UserPlus, Mail, MessageSquare, Check, User, FileText, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PatientRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const BRANCHES = ['FORTALEZA', 'SOBRAL', 'JUAZEIRO', 'TERESINA', 'SÃO LUÍS'];
const CATEGORIES = ['CAPILAR', 'ESTÉTICA', 'BARBA', 'SOBRANCELHA'];
const LEAD_SOURCES = ['INDICAÇÃO', 'GOOGLE', 'INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'YOUTUBE', 'SITE', 'EVENTO', 'OUTROS'];
const CONTRACT_STATUS = ['PENDENTE', 'ASSINADO', 'CANCELADO', 'EM_ANALISE'];

export function PatientRegistrationDialog({ 
  open, 
  onOpenChange, 
  onSuccess 
}: PatientRegistrationDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
  
  const [formData, setFormData] = useState({
    // Dados Pessoais
    full_name: '',
    email: '',
    phone: '',
    cpf: '',
    birth_date: '',
    
    // Dados Comerciais
    branch: '',
    category: '',
    service_type: '',
    seller: '',
    consultant: '',
    lead_source: '',
    
    // Dados Financeiros
    vgv: '',
    down_payment: '',
    balance_due: '',
    contract_status: '',
    
    // Observações
    notes: '',
    
    // Configurações de envio
    send_email: true,
    send_whatsapp: true,
  });

  // Formatadores
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.phone) {
      toast.error('Preencha pelo menos o nome e telefone');
      return;
    }

    setIsLoading(true);

    try {
      let sendVia: 'email' | 'whatsapp' | 'both' | undefined;
      if (formData.send_email && formData.send_whatsapp) sendVia = 'both';
      else if (formData.send_email) sendVia = 'email';
      else if (formData.send_whatsapp) sendVia = 'whatsapp';

      const { data, error } = await supabase.functions.invoke('create-patient-account', {
        body: {
          email: formData.email || undefined,
          full_name: formData.full_name,
          phone: formData.phone,
          cpf: formData.cpf || undefined,
          birth_date: formData.birth_date || undefined,
          send_credentials_via: sendVia,
          // Dados comerciais para criar venda associada
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

      setCredentials({
        email: formData.email,
        password: '(enviada por email/WhatsApp)'
      });
      setStep('success');
      toast.success('Paciente cadastrado com sucesso!');
      onSuccess?.();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao cadastrar paciente');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('form');
    setCredentials(null);
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
        {step === 'form' ? (
          <>
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
              <form onSubmit={handleSubmit} className="space-y-6">
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
                          {BRANCHES.map(branch => (
                            <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="service_type">Procedimento/Serviço</Label>
                      <Input
                        id="service_type"
                        value={formData.service_type}
                        onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                        placeholder="Ex: Transplante Capilar FUE"
                      />
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
              <Button onClick={handleSubmit} disabled={isLoading}>
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
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                Paciente Cadastrado!
              </DialogTitle>
              <DialogDescription>
                As credenciais foram enviadas para o paciente.
              </DialogDescription>
            </DialogHeader>

            <div className="bg-muted rounded-lg p-4 space-y-2">
              <p className="text-sm"><strong>Nome:</strong> {formData.full_name}</p>
              {formData.email && <p className="text-sm"><strong>Email:</strong> {formData.email}</p>}
              <p className="text-sm"><strong>WhatsApp:</strong> {formData.phone}</p>
              {formData.branch && <p className="text-sm"><strong>Filial:</strong> {formData.branch}</p>}
              {formData.service_type && <p className="text-sm"><strong>Procedimento:</strong> {formData.service_type}</p>}
              {formData.vgv && <p className="text-sm"><strong>Valor:</strong> {formData.vgv}</p>}
              <div className="border-t pt-2 mt-2">
                <p className="text-xs text-muted-foreground">
                  {formData.send_email || formData.send_whatsapp 
                    ? `A senha temporária foi enviada via ${formData.send_email && formData.send_whatsapp ? 'email e WhatsApp' : formData.send_email ? 'email' : 'WhatsApp'}.`
                    : 'Nenhum método de envio de credenciais foi selecionado.'
                  }
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>Fechar</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
