/**
 * Formulário completo de cadastro/edição de Processos
 * 9 seções, 44 campos, campos condicionais
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarIcon,
  Loader2,
  Gavel,
  Users,
  Briefcase,
  MapPin,
  FileText,
  DollarSign,
  BookOpen,
  Scale,
  FolderOpen,
} from "lucide-react";

export interface ProcessCaseData {
  id?: string;
  numero_processo: string;
  natureza_acao: string;
  tipo_acao: string;
  polo_processo: string;
  cliente_representado: string;
  cpf_cnpj_cliente: string;
  parte_contraria: string;
  cpf_cnpj_parte_contraria: string;
  advogado_responsavel: string;
  escritorio_responsavel: string;
  area_juridica: string;
  orgao_vara: string;
  tribunal: string;
  estado_uf: string;
  cidade: string;
  sistema_plataforma: string;
  fase_processual: string;
  situacao_atual: string;
  data_distribuicao: Date | null;
  data_citacao: Date | null;
  data_ultima_movimentacao: Date | null;
  proximo_prazo: Date | null;
  tipo_prazo: string;
  responsavel_prazo: string;
  valor_causa: string;
  valor_risco: string;
  probabilidade_exito: string;
  impacto_financeiro: string;
  status_financeiro: string;
  tipo_honorario: string;
  valor_honorarios: string;
  objeto_processo: string;
  resumo_caso: string;
  estrategia_juridica: string;
  observacoes_gerais: string;
  possui_audiencia: string;
  data_audiencia: Date | null;
  tipo_audiencia: string;
  possui_acordo: string;
  valor_acordo: string;
  documentos_anexados: string;
  link_documentos: string;
  data_encerramento: Date | null;
  motivo_encerramento: string;
}

const emptyForm: ProcessCaseData = {
  numero_processo: '', natureza_acao: '', tipo_acao: '', polo_processo: '',
  cliente_representado: '', cpf_cnpj_cliente: '', parte_contraria: '', cpf_cnpj_parte_contraria: '',
  advogado_responsavel: '', escritorio_responsavel: '', area_juridica: '',
  orgao_vara: '', tribunal: '', estado_uf: '', cidade: '', sistema_plataforma: '',
  fase_processual: '', situacao_atual: '', data_distribuicao: null, data_citacao: null,
  data_ultima_movimentacao: null, proximo_prazo: null, tipo_prazo: '', responsavel_prazo: '',
  valor_causa: '', valor_risco: '', probabilidade_exito: '', impacto_financeiro: '',
  status_financeiro: '', tipo_honorario: '', valor_honorarios: '',
  objeto_processo: '', resumo_caso: '', estrategia_juridica: '', observacoes_gerais: '',
  possui_audiencia: 'Não', data_audiencia: null, tipo_audiencia: '',
  possui_acordo: 'Não', valor_acordo: '',
  documentos_anexados: 'Não', link_documentos: '', data_encerramento: null, motivo_encerramento: '',
};

interface Props {
  initialData?: Partial<ProcessCaseData>;
  onSubmit: (data: ProcessCaseData) => void;
  onCancel: () => void;
  isPending?: boolean;
  isEdit?: boolean;
}

// Helper for date picker fields
function DatePickerField({ label, value, onChange }: { label: string; value: Date | null; onChange: (d: Date | undefined) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={value || undefined} onSelect={onChange} initialFocus className="p-3 pointer-events-auto" />
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Helper for select fields
function SelectField({ label, value, onChange, options, placeholder = "Selecione" }: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[]; placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>
          {options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

// Helper for currency input
function CurrencyField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    if (!raw) { onChange(''); return; }
    const num = (parseInt(raw) / 100).toFixed(2);
    onChange(num);
  };
  const displayValue = value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(value)) : '';
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={displayValue} onChange={handleChange} placeholder="R$ 0,00" />
    </div>
  );
}

function SectionHeader({ icon: Icon, number, title }: { icon: any; number: number; title: string }) {
  return (
    <div className="flex items-center gap-3 pt-4 pb-2">
      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary text-sm font-bold">{number}</div>
      <Icon className="h-5 w-5 text-primary" />
      <h3 className="font-semibold text-base">{title}</h3>
    </div>
  );
}

export default function ProcessCaseForm({ initialData, onSubmit, onCancel, isPending, isEdit }: Props) {
  const [form, setForm] = useState<ProcessCaseData>({ ...emptyForm, ...initialData });

  const set = (field: keyof ProcessCaseData) => (value: any) => setForm(prev => ({ ...prev, [field]: value }));
  const setInput = (field: keyof ProcessCaseData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = () => {
    // Basic validation
    if (!form.numero_processo.trim()) return;
    if (!form.natureza_acao) return;
    if (!form.cliente_representado.trim()) return;
    if (!form.situacao_atual) return;
    onSubmit(form);
  };

  const NATUREZA_OPTIONS = ['Cível', 'Trabalhista', 'Criminal', 'Administrativo', 'Tributário', 'Empresarial', 'Consumidor', 'Família e Sucessões', 'Previdenciário', 'Ambiental', 'Eleitoral', 'Constitucional', 'Juizados Especiais', 'Saúde/Médico-Hospitalar', 'PEP', 'Sindicância'];
  const TIPO_ACAO_OPTIONS = ['Cobrança', 'Indenizatória', 'Execução', 'Obrigação de Fazer', 'Obrigação de Não Fazer', 'Revisional', 'Declaratória', 'Anulatória', 'Mandado de Segurança', 'Reclamação Trabalhista', 'Ação Penal', 'Outro'];
  const POLO_OPTIONS = ['Autor', 'Réu', 'Requerente', 'Requerido', 'Exequente', 'Executado', 'Impetrante', 'Impetrado', 'Assistente', 'Terceiro Interessado'];
  const AREA_JURIDICA_OPTIONS = ['Consultivo', 'Contencioso Judicial', 'Contencioso Administrativo', 'Preventivo', 'Regulatório'];
  const TRIBUNAL_OPTIONS = ['TJ', 'TRF', 'TRT', 'STJ', 'STF', 'Juizado Especial', 'Ministério Público', 'Conselho Profissional', 'Outro'];
  const UF_OPTIONS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
  const SISTEMA_OPTIONS = ['PJe', 'Eproc', 'Projudi', 'ESAJ', 'Creta', 'SEEU', 'E-SAJ', 'Outro'];
  const FASE_OPTIONS = ['Inicial', 'Citação', 'Contestação', 'Réplica', 'Saneamento', 'Instrução', 'Sentença', 'Recursos', 'Cumprimento de Sentença', 'Execução', 'Arquivado', 'Suspenso'];
  const SITUACAO_OPTIONS = ['Em andamento', 'Aguardando citação', 'Aguardando decisão', 'Aguardando prazo', 'Em recurso', 'Suspenso', 'Arquivado', 'Encerrado'];
  const TIPO_PRAZO_OPTIONS = ['Contestação', 'Réplica', 'Recurso', 'Manifestação', 'Audiência', 'Cumprimento de decisão', 'Pagamento', 'Outro'];
  const PROB_EXITO_OPTIONS = ['Alta', 'Média', 'Baixa'];
  const IMPACTO_OPTIONS = ['Baixo', 'Médio', 'Alto', 'Crítico'];
  const STATUS_FIN_OPTIONS = ['Sem custo', 'Honorários em dia', 'Honorários pendentes', 'Custas pendentes', 'Acordo financeiro'];
  const TIPO_HONORARIO_OPTIONS = ['Fixo', 'Êxito', 'Misto', 'Mensal', 'Avulso'];
  const TIPO_AUDIENCIA_OPTIONS = ['Conciliação', 'Instrução', 'Julgamento', 'UNA', 'Mediação'];
  const MOTIVO_ENCERRAMENTO_OPTIONS = ['Sentença favorável', 'Sentença desfavorável', 'Acordo', 'Desistência', 'Arquivamento', 'Prescrição', 'Outro'];
  const SIM_NAO = ['Sim', 'Não'];

  return (
    <>
      <ScrollArea className="max-h-[70vh] pr-4">
        <div className="space-y-2 py-4">
          {/* SEÇÃO 1 */}
          <SectionHeader icon={Gavel} number={1} title="Identificação do Processo" />
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label>Número do Processo *</Label>
              <Input value={form.numero_processo} onChange={setInput('numero_processo')} placeholder="0000000-00.0000.0.00.0000" />
            </div>
            <SelectField label="Natureza da Ação *" value={form.natureza_acao} onChange={set('natureza_acao')} options={NATUREZA_OPTIONS} />
            <SelectField label="Tipo da Ação" value={form.tipo_acao} onChange={set('tipo_acao')} options={TIPO_ACAO_OPTIONS} />
            <SelectField label="Polo no Processo" value={form.polo_processo} onChange={set('polo_processo')} options={POLO_OPTIONS} />
          </div>

          {/* SEÇÃO 2 */}
          <SectionHeader icon={Users} number={2} title="Partes Envolvidas" />
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label>Cliente / Parte Representada *</Label>
              <Input value={form.cliente_representado} onChange={setInput('cliente_representado')} placeholder="Nome do cliente" />
            </div>
            <div className="space-y-2">
              <Label>CPF/CNPJ Cliente</Label>
              <Input value={form.cpf_cnpj_cliente} onChange={setInput('cpf_cnpj_cliente')} placeholder="000.000.000-00" />
            </div>
            <div className="space-y-2">
              <Label>Parte Contrária</Label>
              <Input value={form.parte_contraria} onChange={setInput('parte_contraria')} placeholder="Nome da parte contrária" />
            </div>
            <div className="space-y-2">
              <Label>CPF/CNPJ Parte Contrária</Label>
              <Input value={form.cpf_cnpj_parte_contraria} onChange={setInput('cpf_cnpj_parte_contraria')} placeholder="000.000.000-00" />
            </div>
          </div>

          {/* SEÇÃO 3 */}
          <SectionHeader icon={Briefcase} number={3} title="Responsáveis" />
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label>Advogado Responsável</Label>
              <Input value={form.advogado_responsavel} onChange={setInput('advogado_responsavel')} placeholder="Nome do advogado" />
            </div>
            <div className="space-y-2">
              <Label>Escritório Responsável</Label>
              <Input value={form.escritorio_responsavel} onChange={setInput('escritorio_responsavel')} placeholder="Nome do escritório" />
            </div>
            <SelectField label="Área Jurídica" value={form.area_juridica} onChange={set('area_juridica')} options={AREA_JURIDICA_OPTIONS} />
          </div>

          {/* SEÇÃO 4 */}
          <SectionHeader icon={MapPin} number={4} title="Localização Processual" />
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label>Órgão / Vara</Label>
              <Input value={form.orgao_vara} onChange={setInput('orgao_vara')} placeholder="Ex: 3ª Vara Cível" />
            </div>
            <SelectField label="Tribunal" value={form.tribunal} onChange={set('tribunal')} options={TRIBUNAL_OPTIONS} />
            <SelectField label="Estado (UF)" value={form.estado_uf} onChange={set('estado_uf')} options={UF_OPTIONS} />
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input value={form.cidade} onChange={setInput('cidade')} placeholder="Cidade" />
            </div>
            <SelectField label="Sistema / Plataforma" value={form.sistema_plataforma} onChange={set('sistema_plataforma')} options={SISTEMA_OPTIONS} />
          </div>

          {/* SEÇÃO 5 */}
          <SectionHeader icon={FileText} number={5} title="Status Processual" />
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <SelectField label="Fase Processual" value={form.fase_processual} onChange={set('fase_processual')} options={FASE_OPTIONS} />
            <SelectField label="Situação Atual *" value={form.situacao_atual} onChange={set('situacao_atual')} options={SITUACAO_OPTIONS} />
            <DatePickerField label="Data de Distribuição" value={form.data_distribuicao} onChange={(d) => set('data_distribuicao')(d || null)} />
            <DatePickerField label="Data de Citação" value={form.data_citacao} onChange={(d) => set('data_citacao')(d || null)} />
            <DatePickerField label="Data da Última Movimentação" value={form.data_ultima_movimentacao} onChange={(d) => set('data_ultima_movimentacao')(d || null)} />
            <DatePickerField label="Próximo Prazo" value={form.proximo_prazo} onChange={(d) => set('proximo_prazo')(d || null)} />
            <SelectField label="Tipo de Prazo" value={form.tipo_prazo} onChange={set('tipo_prazo')} options={TIPO_PRAZO_OPTIONS} />
            <div className="space-y-2">
              <Label>Responsável pelo Prazo</Label>
              <Input value={form.responsavel_prazo} onChange={setInput('responsavel_prazo')} placeholder="Nome do responsável" />
            </div>
          </div>

          {/* SEÇÃO 6 */}
          <SectionHeader icon={DollarSign} number={6} title="Dados Financeiros" />
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <CurrencyField label="Valor da Causa" value={form.valor_causa} onChange={set('valor_causa')} />
            <CurrencyField label="Valor em Risco" value={form.valor_risco} onChange={set('valor_risco')} />
            <SelectField label="Probabilidade de Êxito" value={form.probabilidade_exito} onChange={set('probabilidade_exito')} options={PROB_EXITO_OPTIONS} />
            <SelectField label="Impacto Financeiro" value={form.impacto_financeiro} onChange={set('impacto_financeiro')} options={IMPACTO_OPTIONS} />
            <SelectField label="Status Financeiro" value={form.status_financeiro} onChange={set('status_financeiro')} options={STATUS_FIN_OPTIONS} />
            <SelectField label="Tipo de Honorário" value={form.tipo_honorario} onChange={set('tipo_honorario')} options={TIPO_HONORARIO_OPTIONS} />
            <CurrencyField label="Valor dos Honorários" value={form.valor_honorarios} onChange={set('valor_honorarios')} />
          </div>

          {/* SEÇÃO 7 */}
          <SectionHeader icon={BookOpen} number={7} title="Descrição e Estratégia" />
          <Separator />
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Objeto do Processo</Label>
              <Textarea value={form.objeto_processo} onChange={setInput('objeto_processo')} placeholder="Descreva o objeto do processo..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Resumo do Caso</Label>
              <Textarea value={form.resumo_caso} onChange={setInput('resumo_caso')} placeholder="Resuma o caso..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Estratégia Jurídica</Label>
              <Textarea value={form.estrategia_juridica} onChange={setInput('estrategia_juridica')} placeholder="Descreva a estratégia jurídica..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Observações Gerais</Label>
              <Textarea value={form.observacoes_gerais} onChange={setInput('observacoes_gerais')} placeholder="Observações adicionais..." rows={3} />
            </div>
          </div>

          {/* SEÇÃO 8 */}
          <SectionHeader icon={Scale} number={8} title="Audiências e Acordos" />
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <SelectField label="Possui Audiência" value={form.possui_audiencia} onChange={set('possui_audiencia')} options={SIM_NAO} />
            {form.possui_audiencia === 'Sim' && (
              <>
                <DatePickerField label="Data da Audiência" value={form.data_audiencia} onChange={(d) => set('data_audiencia')(d || null)} />
                <SelectField label="Tipo de Audiência" value={form.tipo_audiencia} onChange={set('tipo_audiencia')} options={TIPO_AUDIENCIA_OPTIONS} />
              </>
            )}
            <SelectField label="Possui Acordo" value={form.possui_acordo} onChange={set('possui_acordo')} options={SIM_NAO} />
            {form.possui_acordo === 'Sim' && (
              <CurrencyField label="Valor do Acordo" value={form.valor_acordo} onChange={set('valor_acordo')} />
            )}
          </div>

          {/* SEÇÃO 9 */}
          <SectionHeader icon={FolderOpen} number={9} title="Documentos e Encerramento" />
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <SelectField label="Documentos Anexados" value={form.documentos_anexados} onChange={set('documentos_anexados')} options={SIM_NAO} />
            <div className="space-y-2">
              <Label>Link da Pasta / Documentos</Label>
              <Input value={form.link_documentos} onChange={setInput('link_documentos')} placeholder="https://..." />
            </div>
            {form.situacao_atual === 'Encerrado' && (
              <>
                <DatePickerField label="Data do Encerramento" value={form.data_encerramento} onChange={(d) => set('data_encerramento')(d || null)} />
                <SelectField label="Motivo do Encerramento" value={form.motivo_encerramento} onChange={set('motivo_encerramento')} options={MOTIVO_ENCERRAMENTO_OPTIONS} />
              </>
            )}
          </div>
        </div>
      </ScrollArea>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isEdit ? 'ATUALIZAR' : 'SALVAR'}
        </Button>
      </div>
    </>
  );
}
