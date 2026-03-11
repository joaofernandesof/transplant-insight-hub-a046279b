/**
 * Formulário de Solicitação de Pagamento
 * Vinculado ao usuário logado no portal NeoTeam
 */

import { useState, useRef } from "react";
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
  User,
  CreditCard,
  Calendar,
  DollarSign,
  CheckCircle2,
  Paperclip,
  X,
  RefreshCw,
} from "lucide-react";
import { addDays } from "date-fns";
import { usePayables } from "@/pages/ipromed/hooks/usePayables";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  useContaAzulCategorias,
  useContaAzulCentrosDeCusto,
  useContaAzulContasFinanceiras,
} from "../hooks/useContaAzul";

const departamentos = [
  'Administrativo', 'Comercial', 'Operacional', 'Financeiro',
  'Marketing', 'TI', 'RH', 'Diretoria', 'Outros',
];

const formasPagamento = [
  'PIX', 'Transferência Bancária', 'Boleto', 'Cartão de Crédito',
  'Cartão de Débito', 'Dinheiro', 'Cheque', 'Outros',
];

interface PaymentRequestFormProps {
  onSuccess?: () => void;
}

export default function PaymentRequestForm({ onSuccess }: PaymentRequestFormProps) {
  const { user, session } = useUnifiedAuth();
  const { createPayable, isCreating } = usePayables();
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; url: string }[]>([]);

  const [form, setForm] = useState({
    description: '',
    supplier: '',
    amount: '',
    due_date: addDays(new Date(), 30).toISOString().split('T')[0],
    category: '',
    cost_center: '',
    financial_account: '',
    payment_method: '',
    bank_data: '',
    notes: '',
    is_urgent: false,
    requester_name: user?.fullName || '',
    requester_department: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Conta Azul data
  const { data: categorias, isLoading: loadingCategorias, refetch: refetchCategorias } = useContaAzulCategorias();
  const { data: centrosCusto, isLoading: loadingCentros, refetch: refetchCentros } = useContaAzulCentrosDeCusto();
  const { data: contasFinanceiras, isLoading: loadingContas, refetch: refetchContas } = useContaAzulContasFinanceiras();

  // Gate: user must be logged in
  if (!user || !session) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-12 text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
          <h3 className="text-xl font-semibold">Acesso Restrito</h3>
          <p className="text-muted-foreground">
            Você precisa estar logado no sistema para solicitar pagamentos.
          </p>
        </CardContent>
      </Card>
    );
  }

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.description.trim()) errs.description = 'Descrição é obrigatória';
    if (!form.supplier.trim()) errs.supplier = 'Favorecido é obrigatório';
    const parsedAmount = parseFloat(form.amount.replace(/\./g, '').replace(',', '.'));
    if (!form.amount || isNaN(parsedAmount) || parsedAmount <= 0) errs.amount = 'Valor deve ser maior que zero';
    if (!form.due_date) errs.due_date = 'Data de vencimento é obrigatória';
    if (!form.category) errs.category = 'Categoria é obrigatória';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFiles(true);
    const uploaded: { name: string; url: string }[] = [];

    try {
      for (const file of Array.from(files)) {
        const path = `${user.authUserId}/${Date.now()}-${file.name}`;

        const { error } = await supabase.storage
          .from('payment-attachments')
          .upload(path, file);

        if (error) {
          toast.error(`Erro ao anexar ${file.name}: ${error.message}`);
          continue;
        }

        uploaded.push({ name: file.name, url: path });
      }

      setAttachedFiles(prev => [...prev, ...uploaded]);
      if (uploaded.length > 0) toast.success(`${uploaded.length} arquivo(s) anexado(s)`);
    } finally {
      setUploadingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
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
        payment_method: form.payment_method,
        bank_data: form.bank_data,
        notes: form.notes,
        status: 'pendente',
        is_urgent: form.is_urgent,
        requester_name: form.requester_name,
        requester_department: form.requester_department,
        workflow_stage: 'solicitacao_pendente',
        attachments: attachedFiles,
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
          <Button onClick={() => {
            setSubmitted(false);
            setAttachedFiles([]);
            setForm(prev => ({
              ...prev,
              description: '', supplier: '', amount: '', notes: '',
              bank_data: '', category: '', cost_center: '', financial_account: '',
              payment_method: '',
            }));
          }}>
            Nova Solicitação
          </Button>
        </CardContent>
      </Card>
    );
  }

  const ContaAzulSelect = ({
    label,
    value,
    onChange,
    items,
    isLoading,
    onRefetch,
    placeholder,
    error,
    required,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    items: any[] | undefined;
    isLoading: boolean;
    onRefetch: () => void;
    placeholder?: string;
    error?: string;
    required?: boolean;
  }) => (
    <div className="space-y-1.5">
      <Label className="text-sm">
        {label} {required && '*'}
        <button
          type="button"
          onClick={onRefetch}
          className="ml-1.5 text-muted-foreground hover:text-foreground inline-flex"
          title="Atualizar lista"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={error ? 'border-destructive' : ''}>
          <SelectValue placeholder={isLoading ? 'Carregando...' : (placeholder || 'Selecione')} />
        </SelectTrigger>
        <SelectContent>
          {items?.map((item: any) => (
            <SelectItem key={item.id} value={item.nome || item.name || item.id}>
              {item.nome || item.name || item.id}
            </SelectItem>
          ))}
          {(!items || items.length === 0) && !isLoading && (
            <SelectItem value="__empty" disabled>Nenhum item encontrado</SelectItem>
          )}
        </SelectContent>
      </Select>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );

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
            <Label htmlFor="urgent-toggle" className="text-sm font-medium text-destructive">
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
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 mt-2">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-xs text-destructive">
              Pagamentos urgentes seguem fluxo acelerado com aprovação via diretoria.
            </p>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Solicitante (automático) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> Nome do Solicitante
            </Label>
            <Input
              value={form.requester_name}
              disabled
              className="bg-muted"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Departamento *</Label>
            <Select value={form.requester_department} onValueChange={v => setForm(prev => ({ ...prev, requester_department: v }))}>
              <SelectTrigger className={errors.requester_department ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {departamentos.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Categoria (Conta Azul) */}
        <ContaAzulSelect
          label="Categoria do Pagamento"
          value={form.category}
          onChange={v => setForm(prev => ({ ...prev, category: v }))}
          items={categorias}
          isLoading={loadingCategorias}
          onRefetch={() => refetchCategorias()}
          error={errors.category}
          required
        />

        {/* Valor + Vencimento */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5" /> Valor (R$) *
            </Label>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={form.amount}
              onChange={e => {
                // Allow only digits, dots and commas
                let raw = e.target.value.replace(/[^\d.,]/g, '');
                // Format as Brazilian currency: 1.000,00
                // Remove all formatting first
                let digits = raw.replace(/\./g, '').replace(',', '.');
                // If there's a valid number, format it
                if (digits === '' || digits === '.') {
                  setForm(prev => ({ ...prev, amount: raw }));
                  return;
                }
                // Split integer and decimal parts
                const parts = digits.split('.');
                const intPart = parts[0].replace(/^0+(?=\d)/, '');
                const decPart = parts[1] !== undefined ? parts[1].slice(0, 2) : undefined;
                // Add thousand separators
                const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                const result = decPart !== undefined ? `${formatted},${decPart}` : formatted;
                setForm(prev => ({ ...prev, amount: result }));
              }}
              className={errors.amount ? 'border-destructive' : ''}
            />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Data de Vencimento *
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

        {/* Conta Financeira (Conta Azul) */}
        <ContaAzulSelect
          label="Conta Financeira"
          value={form.financial_account}
          onChange={v => setForm(prev => ({ ...prev, financial_account: v }))}
          items={contasFinanceiras}
          isLoading={loadingContas}
          onRefetch={() => refetchContas()}
        />

        {/* Favorecido */}
        <div className="space-y-1.5">
          <Label className="text-sm">Favorecido *</Label>
          <Input
            placeholder="Nome do favorecido"
            value={form.supplier}
            onChange={e => setForm(prev => ({ ...prev, supplier: e.target.value }))}
            className={errors.supplier ? 'border-destructive' : ''}
          />
          {errors.supplier && <p className="text-xs text-destructive">{errors.supplier}</p>}
        </div>

        {/* Centro de Custo (Conta Azul) */}
        <ContaAzulSelect
          label="Centro de Custo"
          value={form.cost_center}
          onChange={v => setForm(prev => ({ ...prev, cost_center: v }))}
          items={centrosCusto}
          isLoading={loadingCentros}
          onRefetch={() => refetchCentros()}
        />

        {/* Descrição do pagamento */}
        <div className="space-y-1.5">
          <Label className="text-sm">Descrição do Pagamento *</Label>
          <Textarea
            placeholder="Descreva o motivo e detalhes do pagamento..."
            value={form.description}
            onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
            className={errors.description ? 'border-destructive' : ''}
            rows={3}
          />
          {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
        </div>

        {/* Anexo */}
        <div className="space-y-1.5">
          <Label className="text-sm flex items-center gap-1.5">
            <Paperclip className="h-3.5 w-3.5" /> Anexo (Recibo, Nota Fiscal, etc.)
          </Label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFiles}
            >
              {uploadingFiles ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Paperclip className="h-4 w-4 mr-1" />}
              Anexar Arquivo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
              onChange={handleFileUpload}
            />
          </div>
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {attachedFiles.map((f, i) => (
                <Badge key={i} variant="secondary" className="gap-1 pr-1">
                  {f.name}
                  <button onClick={() => removeFile(i)} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Forma de pagamento */}
        <div className="space-y-1.5">
          <Label className="text-sm">Forma de Pagamento</Label>
          <Select value={form.payment_method} onValueChange={v => setForm(prev => ({ ...prev, payment_method: v }))}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {formasPagamento.map(f => (
                <SelectItem key={f} value={f}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Chave PIX / Conta Bancária */}
        <div className="space-y-1.5">
          <Label className="text-sm flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5" /> Chave PIX / Conta Bancária do Favorecido
          </Label>
          <Textarea
            placeholder="Chave PIX, banco, agência, conta, tipo (CC/CP), CNPJ/CPF..."
            value={form.bank_data}
            onChange={e => setForm(prev => ({ ...prev, bank_data: e.target.value }))}
            rows={2}
          />
        </div>

        {/* Observação */}
        <div className="space-y-1.5">
          <Label className="text-sm">Observação</Label>
          <Textarea
            placeholder="Informações adicionais, justificativa..."
            value={form.notes}
            onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
            rows={2}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSubmit}
            disabled={isCreating}
            size="lg"
            className={form.is_urgent ? 'bg-destructive hover:bg-destructive/90' : ''}
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
