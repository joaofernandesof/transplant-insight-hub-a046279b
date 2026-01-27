/**
 * IPROMED - Onboarding Form Component
 * Captures client mapping data (specialty, risks, liabilities)
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Stethoscope,
  AlertTriangle,
  Scale,
  FileCheck,
  Building2,
  MapPin,
  User,
  Save,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

const onboardingSchema = z.object({
  // Professional Profile
  specialty: z.string().min(1, "Especialidade é obrigatória"),
  secondarySpecialties: z.string().optional(),
  crmNumber: z.string().min(1, "CRM é obrigatório"),
  crmState: z.string().min(2, "Estado do CRM é obrigatório"),
  
  // Procedures
  procedures: z.string().min(1, "Descreva os procedimentos realizados"),
  surgicalProcedures: z.boolean().default(false),
  aestheticProcedures: z.boolean().default(false),
  clinicalProcedures: z.boolean().default(true),
  
  // Practice Locations
  hasOwnClinic: z.boolean().default(false),
  clinicAddress: z.string().optional(),
  worksAtThirdPartyClinic: z.boolean().default(false),
  thirdPartyClinicName: z.string().optional(),
  worksAtHospital: z.boolean().default(false),
  hospitalName: z.string().optional(),
  
  // Risk Assessment
  crmRisks: z.string().optional(),
  civilRisks: z.string().optional(),
  criminalRisks: z.string().optional(),
  advertisingRisks: z.string().optional(),
  
  // Legal Liabilities
  hasActiveLawsuits: z.boolean().default(false),
  activeLawsuitsDetails: z.string().optional(),
  hasEthicsProceedings: z.boolean().default(false),
  ethicsProceedingsDetails: z.string().optional(),
  hasAdminNotifications: z.boolean().default(false),
  adminNotificationsDetails: z.string().optional(),
  
  // Additional Notes
  observations: z.string().optional(),
  urgencyLevel: z.enum(["low", "medium", "high"]).default("low"),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

interface OnboardingFormProps {
  clientId: string;
  clientName: string;
  onSubmit?: (data: OnboardingFormData) => void;
  initialData?: Partial<OnboardingFormData>;
}

const specialties = [
  "Cardiologia",
  "Cirurgia Plástica",
  "Dermatologia",
  "Ginecologia e Obstetrícia",
  "Medicina Estética",
  "Neurologia",
  "Oftalmologia",
  "Ortopedia",
  "Pediatria",
  "Psiquiatria",
  "Transplante Capilar",
  "Tricologia",
  "Urologia",
  "Outra",
];

export default function OnboardingForm({
  clientId,
  clientName,
  onSubmit,
  initialData,
}: OnboardingFormProps) {
  const [activeTab, setActiveTab] = useState("profile");

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      specialty: "",
      secondarySpecialties: "",
      crmNumber: "",
      crmState: "",
      procedures: "",
      surgicalProcedures: false,
      aestheticProcedures: false,
      clinicalProcedures: true,
      hasOwnClinic: false,
      clinicAddress: "",
      worksAtThirdPartyClinic: false,
      thirdPartyClinicName: "",
      worksAtHospital: false,
      hospitalName: "",
      crmRisks: "",
      civilRisks: "",
      criminalRisks: "",
      advertisingRisks: "",
      hasActiveLawsuits: false,
      activeLawsuitsDetails: "",
      hasEthicsProceedings: false,
      ethicsProceedingsDetails: "",
      hasAdminNotifications: false,
      adminNotificationsDetails: "",
      observations: "",
      urgencyLevel: "low",
      ...initialData,
    },
  });

  const handleSubmit = (data: OnboardingFormData) => {
    onSubmit?.(data);
    toast.success("Onboarding salvo com sucesso!", {
      description: "Os dados do cliente foram registrados.",
    });
  };

  const tabs = [
    { id: "profile", label: "Perfil", icon: User },
    { id: "procedures", label: "Procedimentos", icon: Stethoscope },
    { id: "locations", label: "Locais", icon: Building2 },
    { id: "risks", label: "Riscos", icon: AlertTriangle },
    { id: "liabilities", label: "Passivos", icon: Scale },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-primary" />
          Formulário de Onboarding
        </CardTitle>
        <CardDescription>
          Mapeamento jurídico de {clientName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                {tabs.map(tab => (
                  <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                    <tab.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="specialty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Especialidade Principal *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a especialidade" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {specialties.map(spec => (
                              <SelectItem key={spec} value={spec}>
                                {spec}
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
                    name="secondarySpecialties"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Especialidades Secundárias</FormLabel>
                        <FormControl>
                          <Input placeholder="Outras especialidades" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="crmNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número do CRM *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 123456" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="crmState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado do CRM *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: SP" maxLength={2} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Procedures Tab */}
              <TabsContent value="procedures" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="procedures"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Procedimentos Realizados *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva todos os procedimentos clínicos e cirúrgicos que o médico executa..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Liste todos os procedimentos para mapeamento de riscos
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="clinicalProcedures"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Procedimentos Clínicos</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="surgicalProcedures"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Procedimentos Cirúrgicos</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="aestheticProcedures"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Procedimentos Estéticos</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Locations Tab */}
              <TabsContent value="locations" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="hasOwnClinic"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="flex-1">
                        <FormLabel>Possui clínica própria</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch("hasOwnClinic") && (
                  <FormField
                    control={form.control}
                    name="clinicAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço da Clínica</FormLabel>
                        <FormControl>
                          <Input placeholder="Endereço completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="worksAtThirdPartyClinic"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="flex-1">
                        <FormLabel>Atua em clínica terceirizada</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch("worksAtThirdPartyClinic") && (
                  <FormField
                    control={form.control}
                    name="thirdPartyClinicName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Clínica Terceirizada</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome da clínica" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="worksAtHospital"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="flex-1">
                        <FormLabel>Atua em hospital</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch("worksAtHospital") && (
                  <FormField
                    control={form.control}
                    name="hospitalName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Hospital</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do hospital" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </TabsContent>

              {/* Risks Tab */}
              <TabsContent value="risks" className="space-y-4 mt-4">
                <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg mb-4">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-medium">Mapeamento de Riscos Jurídicos</span>
                  </div>
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                    Avalie os riscos relacionados à atuação profissional do médico
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="crmRisks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Riscos Éticos perante o CRM</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Riscos relacionados à publicidade, conduta profissional e documentação..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="civilRisks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Riscos Cíveis e Consumeristas</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Exposição a ações indenizatórias e reclamações de pacientes..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="criminalRisks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Riscos Criminais</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Riscos penais relacionados a procedimentos e condutas..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="advertisingRisks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Riscos de Publicidade Médica</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Práticas de marketing e divulgação que geram risco ético..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="urgencyLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nível de Urgência</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a urgência" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-green-100 text-green-700">Baixo</Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="medium">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-amber-100 text-amber-700">Médio</Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="high">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-rose-100 text-rose-700">Alto</Badge>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Liabilities Tab */}
              <TabsContent value="liabilities" className="space-y-4 mt-4">
                <div className="bg-rose-50 dark:bg-rose-950/30 p-4 rounded-lg mb-4">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
                    <Scale className="h-5 w-5" />
                    <span className="font-medium">Levantamento de Passivos Jurídicos</span>
                  </div>
                  <p className="text-sm text-rose-600 dark:text-rose-400 mt-1">
                    Identifique processos e demandas em andamento (não cobertos pelo plano)
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="hasActiveLawsuits"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="flex-1">
                        <FormLabel>Possui processos judiciais em andamento</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch("hasActiveLawsuits") && (
                  <FormField
                    control={form.control}
                    name="activeLawsuitsDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Detalhes dos Processos</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descreva os processos cíveis ou criminais em curso..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="hasEthicsProceedings"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="flex-1">
                        <FormLabel>Possui sindicâncias ou processos ético-profissionais</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch("hasEthicsProceedings") && (
                  <FormField
                    control={form.control}
                    name="ethicsProceedingsDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Detalhes dos Processos Éticos</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descreva procedimentos ativos no CRM ou CFM..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="hasAdminNotifications"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="flex-1">
                        <FormLabel>Possui notificações administrativas</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch("hasAdminNotifications") && (
                  <FormField
                    control={form.control}
                    name="adminNotificationsDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Detalhes das Notificações</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Notificações da vigilância sanitária ou outros órgãos..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="observations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações Gerais</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Outras informações relevantes para o dossiê jurídico..."
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
              <Button type="submit" className="gap-2">
                <Save className="h-4 w-4" />
                Salvar Onboarding
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
