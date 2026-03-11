/**
 * Formulário de Solicitação de Pagamento
 * Acessível a todos os funcionários
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Send,
  Loader2,
  AlertTriangle,
  Building,
  User,
  CreditCard,
  Calendar,
  DollarSign,
  CheckCircle2,
} from "lucide-react";
import { addDays } from "date-fns";
import { usePayables, PayableInsert } from "@/pages/ipromed/hooks/usePayables";
import { useAuth } from "@/contexts/UnifiedAuthContext";
import { toast } from "sonner";

const categories = [
  { value: 'prolabore', label: 'Pró-labore' },
  { value: 'folha', label: 'Folha de Pagamento' },
  { value: 'estagiarios', label: 'Estagiários' },
  { value: 'correspondente', label: 'Correspondente Jurídico' },
  { value: 'perito', label: 'Peritos' },
  { value: 'custas', label: 'Custas Processuais' },
  { value: 'diligencias', label: 'Diligências' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'software', label: 'Softwares' },
  { value: 'aluguel', label: 'Aluguel' },
  { value: 'impostos', label: 'Impostos' },
  { value: 'servicos', label: 'Serviços Terceirizados' },
  { value: 'material', label: 'Material de Escritório' },
  { value: 'viagem', label: 'Viagem / Deslocamento' },
  { value: 'outros', label: 'Outros' },
];

const costCenters = [
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'operacional', label: 'Operacional' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'ti', label: 'TI' },
  { value: 'rh', label: 'RH' },
  { value: 'diretoria', label: 'Diretoria' },
  { value: 'outros', label: 'Outros' },
];

interface PaymentRequestFormProps {
  onSuccess?: () => void;
}

export default function PaymentRequestForm({ onSuccess }: PaymentRequestFormProps) {
  const { user } = useAuth();
  const { createPayable, isCreating } = usePayables();
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    description: '',
    supplier: '',
    amount: '',
    due_date: addDays(new Date(), 30).toISOString().split('T')[0],
    category: '',
    cost_center: '',
    bank_data: '',
    notes: '',
    is_urgent: false,
    requester_name: user?.fullName || '',
    requester_department: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.description.trim()) errs.description = 'Descrição é obrigatória';
    if (!form.supplier.trim()) errs.supplier = 'Fornecedor é obrigatório';
    if (!form.amount || Number(form.amount) <= 0) errs.amount = 'Valor deve ser maior que zero';
    if (!form.due_date) errs.due_date = 'Data de vencimento é obrigatória';
    if (!form.category) errs.category = 'Categoria é obrigatória';
    if (!form.requester_name.trim()) errs.requester_name = 'Nome do solicitante é obrigatório';
    if (!form.requester_department) errs.requester_department = 'Departamento é obrigatório';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      await createPayable({
        description: form.description,
        supplier: form.supplier,
        amount: Number(form.amount),
        due_date: form.due_date,
        category: form.category,
        cost_center: form.cost_center,
        bank_data: form.bank_data,
        notes: form.notes,
        status: 'pendente',
        is_urgent: form.is_urgent,
        requester_name: form.requester_name,
        requester_department: form.requester_department,
        workflow_stage: 'solicitacao_pendente',
      } as any);

      setSubmitted(true);
      onSuccess?.();
    } catch (err) {
      // Error handled by hook
    }
  };

  if (submitted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-semibold">Solicitação Enviada!</h3>
          <p className="text-muted-foreground">
            Sua solicitação de pagamento {form.is_urgent ? <Badge className="bg-rose-100 text-rose-700 ml-1">URGENTE</Badge> : ''} foi 
            enviada para o setor financeiro e será analisada em breve.
          </p>
          <Button onClick={() => { setSubmitted(false); setForm(prev => ({ ...prev, description: '', supplier: '', amount: '', notes: '', bank_data: '' })); }}>
            Nova Solicitação
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Solicitar Pagamento
            </CardTitle>
            <CardDescription>
              Preencha o formulário para solicitar um novo pagamento
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="urgent-toggle" className="text-sm font-medium text-rose-600">
              Urgente
            </Label>
            <Switch
              id="urgent-toggle"
              checked={form.is_urgent}
              onCheckedChange={(v) => setForm(prev => ({ ...prev, is_urgent: v }))}
            />
          </div>
        </div>
        {form.is_urgent && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 mt-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <p className="text-xs text-rose-700">
              Pagamentos urgentes seguem fluxo acelerado com aprovação via diretoria.
            </p>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Solicitante */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> Solicitante *
            </Label>
            <Input
              placeholder="Seu nome completo"
              value={form.requester_name}
              onChange={e => setForm(prev => ({ ...prev, requester_name: e.target.value }))}
              className={errors.requester_name ? 'border-destructive' : ''}
            />
            {errors.requester_name && <p className="text-xs text-destructive">{errors.requester_name}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Departamento *</Label>
            <Select value={form.requester_department} onValueChange={v => setForm(prev => ({ ...prev, requester_department: v }))}>
              <SelectTrigger className={errors.requester_department ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {costCenters.map(cc => (
                  <SelectItem key={cc.value} value={cc.value}>{cc.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.requester_department && <p className="text-xs text-destructive">{errors.requester_department}</p>}
          </div>
        </div>

        {/* Descrição */}
        <div className="space-y-1.5">
          <Label className="text-sm">Descrição do Pagamento *</Label>
          <Input
            placeholder="Ex: Pagamento de serviço de consultoria - Projeto X"
            value={form.description}
            onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
            className={errors.description ? 'border-destructive' : ''}
          />
          {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
        </div>

        {/* Fornecedor */}
        <div className="space-y-1.5">
          <Label className="text-sm flex items-center gap-1.5">
            <Building className="h-3.5 w-3.5" /> Fornecedor / Beneficiário *
          </Label>
          <Input
            placeholder="Nome do fornecedor ou beneficiário"
            value={form.supplier}
            onChange={e => setForm(prev => ({ ...prev, supplier: e.target.value }))}
            className={errors.supplier ? 'border-destructive' : ''}
          />
          {errors.supplier && <p className="text-xs text-destructive">{errors.supplier}</p>}
        </div>

        {/* Valor + Vencimento */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5" /> Valor (R$) *
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0,00"
              value={form.amount}
              onChange={e => setForm(prev => ({ ...prev, amount: e.target.value }))}
              className={errors.amount ? 'border-destructive' : ''}
            />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Data Desejada de Pagamento *
            </Label>
            <Input
              type="date"
              value={form.due_date}
              onChange={e => setForm(prev => ({ ...prev, due_date: e.target.value }))}
              className={errors.due_date ? 'border-destructive' : ''}
            />
            {errors.due_date && <p className="text-xs text-destructive">{errors.due_date}</p>}
          </div>
        </div>

        {/* Categoria + Centro de Custo */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm">Categoria *</Label>
            <Select value={form.category} onValueChange={v => setForm(prev => ({ ...prev, category: v }))}>
              <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Centro de Custo</Label>
            <Select value={form.cost_center} onValueChange={v => setForm(prev => ({ ...prev, cost_center: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {costCenters.map(cc => (
                  <SelectItem key={cc.value} value={cc.value}>{cc.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Dados Bancários */}
        <div className="space-y-1.5">
          <Label className="text-sm flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5" /> Dados Bancários / PIX
          </Label>
          <Textarea
            placeholder="Banco, agência, conta, tipo (CC/CP), CNPJ/CPF, chave PIX..."
            value={form.bank_data}
            onChange={e => setForm(prev => ({ ...prev, bank_data: e.target.value }))}
            rows={2}
          />
        </div>

        {/* Observações */}
        <div className="space-y-1.5">
          <Label className="text-sm">Observações / Justificativa</Label>
          <Textarea
            placeholder="Informações adicionais, justificativa para o pagamento..."
            value={form.notes}
            onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-2">
          <Button 
            onClick={handleSubmit} 
            disabled={isCreating}
            size="lg"
            className={form.is_urgent ? 'bg-rose-600 hover:bg-rose-700' : ''}
          >
            {isCreating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {form.is_urgent ? 'Enviar Solicitação Urgente' : 'Enviar Solicitação'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
