import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, User, DollarSign, CheckSquare, FileText, ShieldAlert } from "lucide-react";
import { SurgerySchedule } from "@/hooks/useSurgerySchedule";
import { useValidateScheduleRotation, CIDADES, MEDICOS, TIPOS_AGENDAMENTO, CATEGORIAS_RODIZIO, getSemanaDOMes } from "@/hooks/useWeeklyScheduleRules";

const formSchema = z.object({
  surgery_date: z.string().min(1, "Data obrigatória"),
  surgery_time: z.string().optional(),
  patient_name: z.string().min(1, "Nome do paciente obrigatório"),
  patient_phone: z.string().optional(),
  medical_record: z.string().optional(),
  category: z.string().optional(),
  procedure_type: z.string().optional(),
  grade: z.coerce.number().optional(),
  cidade: z.string().optional(),
  medico: z.string().optional(),
  tipo_agendamento: z.string().optional(),
  categoria_rodizio: z.string().optional(),
  initial_value: z.coerce.number().default(0),
  referral_bonus: z.coerce.number().default(0),
  upgrade_value: z.coerce.number().default(0),
  upsell_value: z.coerce.number().default(0),
  final_value: z.coerce.number().default(0),
  deposit_paid: z.coerce.number().default(0),
  remaining_paid: z.coerce.number().default(0),
  balance_due: z.coerce.number().default(0),
  companion_name: z.string().optional(),
  companion_phone: z.string().optional(),
  contract_signed: z.boolean().default(false),
  exams_in_system: z.boolean().default(false),
  exams_sent: z.boolean().default(false),
  confirmed: z.boolean().default(false),
  d7_contact: z.boolean().default(false),
  d2_contact: z.boolean().default(false),
  d1_contact: z.boolean().default(false),
  checkin_sent: z.boolean().default(false),
  scheduling_form: z.boolean().default(false),
  d0_discharge_form: z.boolean().default(false),
  d1_gpi: z.boolean().default(false),
  observations: z.string().optional(),
  financial_verification: z.string().optional(),
  post_sale_notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface SurgeryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surgery?: SurgerySchedule | null;
  onSave: (data: FormData) => Promise<void>;
  isLoading: boolean;
}

const categories = [
  { value: "CATEGORIA A - INDICAÇÃO", label: "Cat A - Indicação" },
  { value: "CATEGORIA B - MÉDICO DA EQUIPE", label: "Cat B - Médico da Equipe" },
  { value: "CATEGORIA C - PACIENTE MODELO VIP", label: "Cat C - Modelo VIP" },
  { value: "CATEGORIA D - PACIENTE MODELO NORMAL", label: "Cat D - Modelo Normal" },
  { value: "RETOQUE", label: "Retoque" },
];

const procedures = [
  "CABELO",
  "BARBA",
  "SOBRANCELHA",
  "CABELO + BARBA",
  "CABELO + SOBRANCELHA",
  "CABELO + BARBA + SOBRANCELHA",
];

export function SurgeryDialog({ open, onOpenChange, surgery, onSave, isLoading }: SurgeryDialogProps) {
  const { validate } = useValidateScheduleRotation();
  const [blockMessage, setBlockMessage] = useState<string | null>(null);
  const [currentSemana, setCurrentSemana] = useState<number | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      surgery_date: "",
      patient_name: "",
      initial_value: 0,
      referral_bonus: 0,
      upgrade_value: 0,
      upsell_value: 0,
      final_value: 0,
      deposit_paid: 0,
      remaining_paid: 0,
      balance_due: 0,
      contract_signed: false,
      exams_in_system: false,
      exams_sent: false,
      confirmed: false,
      d7_contact: false,
      d2_contact: false,
      d1_contact: false,
      checkin_sent: false,
      scheduling_form: false,
      d0_discharge_form: false,
      d1_gpi: false,
    },
  });

  useEffect(() => {
    if (surgery) {
      form.reset({
        surgery_date: surgery.surgery_date,
        surgery_time: surgery.surgery_time || "",
        patient_name: surgery.patient_name,
        patient_phone: surgery.patient_phone || "",
        medical_record: surgery.medical_record || "",
        category: surgery.category || "",
        procedure_type: surgery.procedure_type || "",
        grade: surgery.grade || undefined,
        cidade: surgery.cidade || "",
        medico: surgery.medico || "",
        tipo_agendamento: surgery.tipo_agendamento || "",
        categoria_rodizio: surgery.categoria_rodizio || "",
        initial_value: surgery.initial_value || 0,
        referral_bonus: surgery.referral_bonus || 0,
        upgrade_value: surgery.upgrade_value || 0,
        upsell_value: surgery.upsell_value || 0,
        final_value: surgery.final_value || 0,
        deposit_paid: surgery.deposit_paid || 0,
        remaining_paid: surgery.remaining_paid || 0,
        balance_due: surgery.balance_due || 0,
        companion_name: surgery.companion_name || "",
        companion_phone: surgery.companion_phone || "",
        contract_signed: surgery.contract_signed,
        exams_in_system: surgery.exams_in_system,
        exams_sent: surgery.exams_sent,
        confirmed: surgery.confirmed,
        d7_contact: surgery.d7_contact,
        d2_contact: surgery.d2_contact,
        d1_contact: surgery.d1_contact,
        checkin_sent: surgery.checkin_sent,
        scheduling_form: surgery.scheduling_form,
        d0_discharge_form: surgery.d0_discharge_form,
        d1_gpi: surgery.d1_gpi,
        observations: surgery.observations || "",
        financial_verification: surgery.financial_verification || "",
        post_sale_notes: surgery.post_sale_notes || "",
      });
    } else {
      form.reset({
        surgery_date: "",
        patient_name: "",
        initial_value: 0,
        referral_bonus: 0,
        upgrade_value: 0,
        upsell_value: 0,
        final_value: 0,
        deposit_paid: 0,
        remaining_paid: 0,
        balance_due: 0,
        contract_signed: false,
        exams_in_system: false,
        exams_sent: false,
        confirmed: false,
        d7_contact: false,
        d2_contact: false,
        d1_contact: false,
        checkin_sent: false,
        scheduling_form: false,
        d0_discharge_form: false,
        d1_gpi: false,
      });
    }
    setBlockMessage(null);
  }, [surgery, form]);

  // Auto-calculate final value and balance
  const watchValues = form.watch(["initial_value", "upgrade_value", "upsell_value", "deposit_paid", "remaining_paid"]);
  
  useEffect(() => {
    const [initial, upgrade, upsell, deposit, remaining] = watchValues;
    const finalValue = (initial || 0) + (upgrade || 0) + (upsell || 0);
    const balance = finalValue - (deposit || 0) - (remaining || 0);
    form.setValue("final_value", finalValue);
    form.setValue("balance_due", balance);
  }, [watchValues, form]);

  // Watch rotation fields to show semana and run validation
  const watchDate = form.watch("surgery_date");
  const watchCidade = form.watch("cidade");
  const watchTipo = form.watch("tipo_agendamento");
  const watchCatRodizio = form.watch("categoria_rodizio");
  const watchMedico = form.watch("medico");

  useEffect(() => {
    if (watchDate) {
      setCurrentSemana(getSemanaDOMes(new Date(watchDate + 'T12:00:00')));
    } else {
      setCurrentSemana(null);
    }
  }, [watchDate]);

  // Get available categories for selected city
  const availableCategories = watchCidade ? (CATEGORIAS_RODIZIO[watchCidade] || []) : [];

  const handleSubmit = async (data: FormData) => {
    // Validate rotation rules if rotation fields are filled
    if (data.cidade && data.surgery_date && data.tipo_agendamento) {
      const result = await validate({
        cidade: data.cidade,
        surgery_date: data.surgery_date,
        tipo: data.tipo_agendamento,
        categoria: data.categoria_rodizio || undefined,
        medico: data.medico || undefined,
      });

      if (!result.permitido) {
        setBlockMessage(result.mensagem);
        return;
      }
    }

    setBlockMessage(null);
    await onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {surgery ? "Editar Cirurgia" : "Nova Cirurgia"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <Tabs defaultValue="patient" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="patient" className="gap-1 text-xs sm:text-sm">
                    <User className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Paciente</span>
                  </TabsTrigger>
                  <TabsTrigger value="financial" className="gap-1 text-xs sm:text-sm">
                    <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Financeiro</span>
                  </TabsTrigger>
                  <TabsTrigger value="checklist" className="gap-1 text-xs sm:text-sm">
                    <CheckSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Checklist</span>
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="gap-1 text-xs sm:text-sm">
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Notas</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="patient" className="space-y-4 mt-4">
                  {/* Block message */}
                  {blockMessage && (
                    <Alert variant="destructive">
                      <ShieldAlert className="h-4 w-4" />
                      <AlertDescription>{blockMessage}</AlertDescription>
                    </Alert>
                  )}

                  {/* Semana badge */}
                  {currentSemana && watchCidade && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                        Semana {currentSemana} do mês
                      </span>
                      {watchCidade && (
                        <span className="bg-muted px-3 py-1 rounded-full">
                          {watchCidade}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Rotation fields */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 border rounded-lg bg-muted/30">
                    <FormField
                      control={form.control}
                      name="cidade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CIDADES.map(c => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tipo_agendamento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TIPOS_AGENDAMENTO.map(t => (
                                <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {watchTipo === 'consulta' && (
                      <FormField
                        control={form.control}
                        name="medico"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Médico</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {MEDICOS.map(m => (
                                  <SelectItem key={m} value={m}>{m}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    {(watchTipo === 'transplante' || watchTipo === 'retorno') && availableCategories.length > 0 && (
                      <FormField
                        control={form.control}
                        name="categoria_rodizio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoria Rodízio</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableCategories.map(c => (
                                  <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="surgery_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data da Cirurgia *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="surgery_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Horário</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="patient_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone do Paciente</FormLabel>
                          <FormControl>
                            <Input placeholder="(11) 99999-9999" {...field} />
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
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat.value} value={cat.value}>
                                  {cat.label}
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
                      name="procedure_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Procedimento</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {procedures.map((proc) => (
                                <SelectItem key={proc} value={proc}>
                                  {proc}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="grade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grau (1-7)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="7" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Acompanhante</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="companion_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome do acompanhante" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="companion_phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input placeholder="(11) 99999-9999" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="financial" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="initial_value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>VGV Inicial (R$)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="referral_bonus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Indicação (R$)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="upgrade_value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Upgrade (R$)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="upsell_value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Upsell (R$)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <FormField
                      control={form.control}
                      name="final_value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-bold">VGV Final (R$)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              {...field} 
                              readOnly 
                              className="text-lg font-bold bg-green-100 text-green-700"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="deposit_paid"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sinal Pago (R$)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="remaining_paid"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Restante Pago (R$)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="balance_due"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Saldo Devedor (R$)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              {...field} 
                              readOnly
                              className={field.value > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="financial_verification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Verificação Financeiro</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Notas sobre verificação financeira..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="checklist" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <h4 className="font-medium">Documentação</h4>
                      <FormField
                        control={form.control}
                        name="confirmed"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="!mt-0">Confirmou Cirurgia</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="exams_sent"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="!mt-0">Exames Enviados</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="contract_signed"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="!mt-0">Contrato Assinado</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="exams_in_system"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="!mt-0">Exames no SHOSP</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Follow-up</h4>
                      <FormField
                        control={form.control}
                        name="d7_contact"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="!mt-0">D-7 Contato</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="d2_contact"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="!mt-0">D-2 Contato</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="d1_contact"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="!mt-0">D-1 Contato</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="checkin_sent"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="!mt-0">Check-in Enviado</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="scheduling_form"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="!mt-0">Termo Marcação</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="d0_discharge_form"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="!mt-0">D-0 Termo Alta</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="d1_gpi"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="!mt-0">D+1 GPI</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="observations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações Gerais</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Observações sobre a cirurgia, paciente, etc..." 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="post_sale_notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas Pós-Venda</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Notas do pós-venda..." 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {surgery ? "Salvar Alterações" : "Agendar Cirurgia"}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
