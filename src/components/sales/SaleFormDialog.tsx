import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Loader2 } from "lucide-react";
import { useSales, SaleInsert } from "@/hooks/useSales";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

const saleSchema = z.object({
  patient_name: z.string().min(2, "Nome do paciente é obrigatório"),
  sale_date: z.string().min(1, "Data da venda é obrigatória"),
  service_type: z.string().min(1, "Tipo de serviço é obrigatório"),
  vgv_initial: z.coerce.number().min(0, "Valor deve ser positivo"),
  deposit_paid: z.coerce.number().min(0).optional(),
  category: z.string().optional(),
  branch: z.string().optional(),
  sold_by: z.string().optional(),
  patient_origin: z.string().optional(),
  contract_status: z.string().optional(),
  baldness_grade: z.string().optional(),
  patient_email: z.string().email().optional().or(z.literal("")),
  patient_cpf: z.string().optional(),
  medical_record: z.string().optional(),
  observations: z.string().optional(),
});

type SaleFormData = z.infer<typeof saleSchema>;

const SERVICE_TYPES = [
  "Transplante Capilar",
  "Transplante Aluno",
  "Transplante Sobrancelhas",
  "Tratamento Capilar",
  "Formação 360 - Avançado",
  "Formação 360 - Completo",
  "Licenciamento",
];

const CATEGORIES = [
  "CATEGORIA A - TRANSPLANTE (DR HYGOR)",
  "CATEGORIA B - TRANSPLANTE (MÉDICO EQUIPE)",
  "CATEGORIA C - TRANSPLANTE MODELO VIP",
  "CATEGORIA D - TRANSPLANTE MODELO NORMAL",
];

const BRANCHES = ["Brasília", "Salvador", "Goiânia"];

const SELLERS = ["Alessandro", "Gabriela", "Jade", "Julia", "Letícia"];

const CONTRACT_STATUS = [
  "Em análise",
  "Aprovado",
  "Assinado",
  "Pendente assinatura",
  "Cancelado",
  "Distrato",
];

const ORIGINS = [
  "Instagram",
  "Google",
  "Indicação",
  "YouTube",
  "Facebook",
  "TikTok",
  "Outro",
];

interface SaleFormDialogProps {
  trigger?: React.ReactNode;
}

export function SaleFormDialog({ trigger }: SaleFormDialogProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { createSale } = useSales();

  const form = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      patient_name: "",
      sale_date: format(new Date(), "yyyy-MM-dd"),
      service_type: "",
      vgv_initial: 0,
      deposit_paid: 0,
      category: "",
      branch: "",
      sold_by: "",
      patient_origin: "",
      contract_status: "",
      baldness_grade: "",
      patient_email: "",
      patient_cpf: "",
      medical_record: "",
      observations: "",
    },
  });

  const onSubmit = async (data: SaleFormData) => {
    if (!user) return;

    const saleDate = new Date(data.sale_date);
    const monthYear = format(saleDate, "yyyy-MM");

    const saleData: SaleInsert = {
      user_id: user.id,
      patient_name: data.patient_name,
      sale_date: data.sale_date,
      month_year: monthYear,
      service_type: data.service_type,
      vgv_initial: data.vgv_initial,
      deposit_paid: data.deposit_paid || 0,
      category: data.category || null,
      branch: data.branch || null,
      sold_by: data.sold_by || null,
      patient_origin: data.patient_origin || null,
      contract_status: data.contract_status || null,
      baldness_grade: data.baldness_grade || null,
      patient_email: data.patient_email || null,
      patient_cpf: data.patient_cpf || null,
      medical_record: data.medical_record || null,
      observations: data.observations || null,
    };

    await createSale.mutateAsync(saleData);
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Venda
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Nova Venda</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Paciente */}
              <FormField
                control={form.control}
                name="patient_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Paciente *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sale_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Venda *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="service_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Serviço *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o serviço" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SERVICE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vgv_initial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor VGV (R$) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0,00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deposit_paid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entrada Paga (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0,00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="branch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Filial</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a filial" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BRANCHES.map((branch) => (
                          <SelectItem key={branch} value={branch}>
                            {branch}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sold_by"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendedor</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o vendedor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SELLERS.map((seller) => (
                          <SelectItem key={seller} value={seller}>
                            {seller}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="patient_origin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origem</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a origem" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ORIGINS.map((origin) => (
                          <SelectItem key={origin} value={origin}>
                            {origin}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contract_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status do Contrato</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CONTRACT_STATUS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="baldness_grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grau de Calvície</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 3, 4, 5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="medical_record"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prontuário</FormLabel>
                    <FormControl>
                      <Input placeholder="Número do prontuário" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="patient_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="patient_cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <Input placeholder="000.000.000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Observações adicionais..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createSale.isPending}>
                {createSale.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar Venda
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
