import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePatients } from '../hooks/usePatients';
import { useClinicSales, ContractStatus } from '../hooks/useClinicSales';
import { useClinicAuth } from '../contexts/ClinicAuthContext';
import { useBranches } from '../hooks/useBranches';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Plus, Loader2, CheckCircle2, ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const SERVICE_TYPES = [
  'Transplante Capilar FUE',
  'Transplante Capilar FUT',
  'Transplante de Barba',
  'Transplante de Sobrancelha',
  'Micropigmentação',
  'Mesoterapia',
  'PRP Capilar',
];

const CATEGORIES = ['FUE', 'FUT', 'Barba', 'Sobrancelha', 'Estética'];
const LEAD_SOURCES = ['Google', 'Instagram', 'Facebook', 'Indicação', 'TV', 'Rádio', 'Outro'];

const saleSchema = z.object({
  saleDate: z.string().min(1, 'Data obrigatória'),
  patientId: z.string().min(1, 'Paciente obrigatório'),
  branch: z.string().min(1, 'Filial obrigatória'),
  serviceType: z.string().min(1, 'Serviço obrigatório'),
  seller: z.string().optional(),
  consultant: z.string().optional(),
  category: z.string().optional(),
  leadSource: z.string().optional(),
  vgv: z.coerce.number().min(0, 'VGV inválido'),
  downPayment: z.coerce.number().min(0, 'Sinal inválido'),
  contractStatus: z.enum(['ativo', 'pendente', 'quitado', 'cancelado']),
  notes: z.string().optional(),
});

type SaleFormData = z.infer<typeof saleSchema>;

export default function NewSale() {
  const { user, currentBranch, canCreateSales, isAdmin, isGestao } = useClinicAuth();
  const { patients, createPatient } = usePatients();
  const { createSale } = useClinicSales();
  const { branches } = useBranches();
  const [showSuccess, setShowSuccess] = useState(false);
  const [patientOpen, setPatientOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');

  const form = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      saleDate: new Date().toISOString().split('T')[0],
      patientId: '',
      branch: currentBranch || '',
      serviceType: '',
      seller: '',
      consultant: '',
      category: '',
      leadSource: '',
      vgv: 0,
      downPayment: 0,
      contractStatus: 'pendente',
      notes: '',
    },
  });

  const vgv = form.watch('vgv');
  const downPayment = form.watch('downPayment');
  const balanceDue = useMemo(() => (vgv || 0) - (downPayment || 0), [vgv, downPayment]);

  const filteredPatients = useMemo(() => {
    if (!patientSearch) return patients.slice(0, 20);
    const search = patientSearch.toLowerCase();
    return patients.filter(p =>
      p.fullName.toLowerCase().includes(search) ||
      p.cpf?.includes(patientSearch) ||
      p.phone?.includes(patientSearch)
    ).slice(0, 20);
  }, [patients, patientSearch]);

  const selectedPatient = patients.find(p => p.id === form.watch('patientId'));

  const onSubmit = async (data: SaleFormData) => {
    try {
      await createSale.mutateAsync({
        saleDate: data.saleDate,
        patientId: data.patientId,
        branch: data.branch,
        serviceType: data.serviceType,
        seller: data.seller,
        consultant: data.consultant,
        category: data.category,
        leadSource: data.leadSource,
        vgv: data.vgv,
        downPayment: data.downPayment,
        contractStatus: data.contractStatus as ContractStatus,
        notes: data.notes,
      });

      setShowSuccess(true);
      form.reset({
        saleDate: new Date().toISOString().split('T')[0],
        patientId: '',
        branch: currentBranch || '',
        serviceType: '',
        seller: '',
        consultant: '',
        category: '',
        leadSource: '',
        vgv: 0,
        downPayment: 0,
        contractStatus: 'pendente',
        notes: '',
      });

      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (!canCreateSales) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Você não tem permissão para registrar vendas.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Nova Venda</h1>
        <p className="text-muted-foreground">Registrar uma nova venda no sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Registrar Venda
          </CardTitle>
          <CardDescription>
            Preencha os dados da venda. Campos com * são obrigatórios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showSuccess && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              Venda registrada com sucesso!
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="saleDate"
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
                  name="branch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Filial *</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!isAdmin && !isGestao}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a filial" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {branches.map(branch => (
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
              </div>

              {/* Patient selector with autocomplete */}
              <FormField
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paciente *</FormLabel>
                    <Popover open={patientOpen} onOpenChange={setPatientOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {selectedPatient?.fullName || "Selecione o paciente"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder="Buscar paciente..."
                            value={patientSearch}
                            onValueChange={setPatientSearch}
                          />
                          <CommandList>
                            <CommandEmpty>
                              Nenhum paciente encontrado.
                            </CommandEmpty>
                            <CommandGroup>
                              {filteredPatients.map(patient => (
                                <CommandItem
                                  key={patient.id}
                                  value={patient.id}
                                  onSelect={() => {
                                    field.onChange(patient.id);
                                    setPatientOpen(false);
                                    setPatientSearch('');
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === patient.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div>
                                    <p>{patient.fullName}</p>
                                    {patient.cpf && (
                                      <p className="text-xs text-muted-foreground">{patient.cpf}</p>
                                    )}
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serviço *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o serviço" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SERVICE_TYPES.map(type => (
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
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORIES.map(cat => (
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
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="seller"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendedor</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do vendedor" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="consultant"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Consultor</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do consultor" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="leadSource"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origem do Lead</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Como o paciente chegou?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LEAD_SOURCES.map(source => (
                          <SelectItem key={source} value={source}>
                            {source}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Financial Section */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                <h3 className="font-medium">Valores</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="vgv"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>VGV (R$) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0,00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="downPayment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sinal (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0,00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Saldo</label>
                    <div className="h-10 px-3 py-2 bg-background border rounded-md flex items-center">
                      <span className={balanceDue > 0 ? 'text-yellow-600' : 'text-green-600'}>
                        {formatCurrency(balanceDue)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="contractStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Situação do Contrato *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="quitado">Quitado</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observações sobre a venda (opcional)"
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={createSale.isPending}
                  className="flex-1"
                >
                  {createSale.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Registrar Venda
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                >
                  Limpar
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
