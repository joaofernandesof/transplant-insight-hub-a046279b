import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, ArrowLeft, ArrowRight, Building2, DollarSign, Users2, ClipboardList, Target, UserCheck, CheckCircle2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface JobDescriptionData {
  cargo: string;
  empresa: string;
  local: string;
  modeloContratacao: string;
  salarioFixo: string;
  salarioVariavel: string;
  expectativaGanhos: string;
  descricaoEmpresa: string;
  segmentoEmpresa: string;
  tamanhoEmpresa: string;
  areaCargo: string;
  respondePara: string;
  gerenciaEquipe: string;
  qtdEquipe: string;
  responsabilidades: string;
  kpis: string;
  perfilIdeal: string;
  requisitosObrigatorios: string;
  diferenciais: string;
  resultadoEsperado: string;
}

const initialData: JobDescriptionData = {
  cargo: '', empresa: '', local: '', modeloContratacao: '',
  salarioFixo: '', salarioVariavel: '', expectativaGanhos: '',
  descricaoEmpresa: '', segmentoEmpresa: '', tamanhoEmpresa: '',
  areaCargo: '', respondePara: '', gerenciaEquipe: '', qtdEquipe: '',
  responsabilidades: '', kpis: '', perfilIdeal: '',
  requisitosObrigatorios: '', diferenciais: '', resultadoEsperado: '',
};

type Step = 1 | 2 | 3;

function generateMissionText(data: JobDescriptionData): string {
  const area = data.areaCargo ? ` na área de ${data.areaCargo}` : '';
  const equipe = data.gerenciaEquipe === 'sim'
    ? `, liderando uma equipe de ${data.qtdEquipe || 'X'} pessoas`
    : '';
  return `O(A) ${data.cargo} será responsável por impulsionar resultados estratégicos${area} na ${data.empresa}${equipe}. Este profissional terá papel fundamental no crescimento e consolidação da operação, reportando-se diretamente a ${data.respondePara || 'liderança da empresa'}.`;
}

function splitLines(text: string): string[] {
  return text.split('\n').map(l => l.trim()).filter(Boolean);
}

function generatePDF(data: JobDescriptionData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentW = pw - margin * 2;
  let y = 20;

  const checkPage = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = 20;
    }
  };

  // Header bar
  doc.setFillColor(55, 48, 163); // indigo-800
  doc.rect(0, 0, pw, 36, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('JOB DESCRIPTION', margin, 16);
  doc.setFontSize(14);
  doc.text(data.cargo.toUpperCase(), margin, 28);
  y = 46;

  const sectionTitle = (icon: string, title: string) => {
    checkPage(16);
    doc.setFillColor(238, 242, 255); // indigo-50
    doc.rect(margin, y - 5, contentW, 10, 'F');
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(0.8);
    doc.line(margin, y - 5, margin, y + 5);
    doc.setTextColor(55, 48, 163);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${icon}  ${title}`, margin + 4, y + 2);
    y += 14;
  };

  const labelValue = (label: string, value: string) => {
    checkPage(10);
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin + 2, y);
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(value || '—', margin + 2, y + 5);
    y += 12;
  };

  const bulletList = (items: string[]) => {
    items.forEach(item => {
      checkPage(8);
      doc.setTextColor(99, 102, 241);
      doc.setFontSize(10);
      doc.text('●', margin + 4, y);
      doc.setTextColor(31, 41, 55);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(item, contentW - 14);
      doc.text(lines, margin + 10, y);
      y += lines.length * 5 + 3;
    });
  };

  const paragraph = (text: string) => {
    checkPage(12);
    doc.setTextColor(55, 65, 81);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(text, contentW - 4);
    doc.text(lines, margin + 2, y);
    y += lines.length * 5 + 4;
  };

  // Basic Info
  sectionTitle('🏢', 'EMPRESA');
  labelValue('Empresa', data.empresa);
  labelValue('Segmento', data.segmentoEmpresa);
  labelValue('Porte', data.tamanhoEmpresa);

  sectionTitle('📍', 'LOCAL & CONTRATAÇÃO');
  labelValue('Local', data.local);
  labelValue('Modelo', data.modeloContratacao);

  sectionTitle('💰', 'REMUNERAÇÃO');
  labelValue('Salário Fixo', data.salarioFixo);
  labelValue('Salário Variável', data.salarioVariavel);
  labelValue('Expectativa de Ganhos', data.expectativaGanhos);

  // About company
  if (data.descricaoEmpresa) {
    sectionTitle('🧠', 'SOBRE A EMPRESA');
    paragraph(data.descricaoEmpresa);
  }

  // Mission
  sectionTitle('🎯', 'MISSÃO DO CARGO');
  paragraph(generateMissionText(data));

  // Structure
  sectionTitle('📋', 'ESTRUTURA DO CARGO');
  labelValue('Área', data.areaCargo);
  labelValue('Reporta-se a', data.respondePara);
  if (data.gerenciaEquipe === 'sim') {
    labelValue('Equipe sob gestão', `${data.qtdEquipe || '—'} pessoas`);
  }

  // Responsibilities
  if (data.responsabilidades) {
    sectionTitle('📌', 'PRINCIPAIS RESPONSABILIDADES');
    bulletList(splitLines(data.responsabilidades));
  }

  // KPIs
  if (data.kpis) {
    sectionTitle('📊', 'INDICADORES DE PERFORMANCE (KPIs)');
    bulletList(splitLines(data.kpis));
  }

  // Profile
  if (data.perfilIdeal) {
    sectionTitle('👤', 'PERFIL IDEAL');
    bulletList(splitLines(data.perfilIdeal));
  }

  // Requirements
  if (data.requisitosObrigatorios) {
    sectionTitle('📚', 'REQUISITOS');
    bulletList(splitLines(data.requisitosObrigatorios));
  }

  // Differentials
  if (data.diferenciais) {
    sectionTitle('🚀', 'DIFERENCIAIS');
    bulletList(splitLines(data.diferenciais));
  }

  // Expected result
  if (data.resultadoEsperado) {
    sectionTitle('📈', 'RESULTADO ESPERADO');
    paragraph(data.resultadoEsperado);
  }

  // Footer
  const ph = doc.internal.pageSize.getHeight();
  doc.setFillColor(55, 48, 163);
  doc.rect(0, ph - 14, pw, 14, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Documento gerado em ${new Date().toLocaleDateString('pt-BR')}  •  ${data.empresa}`, margin, ph - 5);

  return doc;
}

export default function NeoRHJobDescription() {
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<JobDescriptionData>(initialData);

  const set = (key: keyof JobDescriptionData, value: string) =>
    setData(prev => ({ ...prev, [key]: value }));

  const canGenerate = data.cargo && data.empresa;

  const handleGenerate = () => {
    if (!canGenerate) {
      toast.error('Preencha pelo menos o Cargo e a Empresa.');
      return;
    }
    setStep(2);
  };

  const handleDownload = () => {
    try {
      const doc = generatePDF(data);
      doc.save(`job-description-${data.cargo.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      toast.success('PDF gerado com sucesso!');
      setStep(3);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao gerar PDF.');
    }
  };

  // ─── Step 1: Form ────────────────────────────────
  if (step === 1) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium">
            <FileText className="h-4 w-4" />
            NeoRH
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Gerador de Job Description</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Preencha as informações da vaga e gere automaticamente um Job Description profissional em PDF.
          </p>
        </div>

        {/* Basic Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-primary" /> Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Cargo *</Label>
              <Input value={data.cargo} onChange={e => set('cargo', e.target.value)} placeholder="Ex: Gerente Comercial" />
            </div>
            <div className="space-y-1.5">
              <Label>Empresa *</Label>
              <Input value={data.empresa} onChange={e => set('empresa', e.target.value)} placeholder="Nome da empresa" />
            </div>
            <div className="space-y-1.5">
              <Label>Local da vaga</Label>
              <Input value={data.local} onChange={e => set('local', e.target.value)} placeholder="São Paulo - SP" />
            </div>
            <div className="space-y-1.5">
              <Label>Modelo de contratação</Label>
              <Select value={data.modeloContratacao} onValueChange={v => set('modeloContratacao', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLT">CLT</SelectItem>
                  <SelectItem value="PJ">PJ</SelectItem>
                  <SelectItem value="CLT ou PJ">CLT ou PJ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Compensation */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4 text-primary" /> Remuneração
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Salário fixo</Label>
              <Input value={data.salarioFixo} onChange={e => set('salarioFixo', e.target.value)} placeholder="R$ 10.000" />
            </div>
            <div className="space-y-1.5">
              <Label>Salário variável</Label>
              <Input value={data.salarioVariavel} onChange={e => set('salarioVariavel', e.target.value)} placeholder="R$ 5.000" />
            </div>
            <div className="space-y-1.5">
              <Label>Expectativa de ganhos</Label>
              <Input value={data.expectativaGanhos} onChange={e => set('expectativaGanhos', e.target.value)} placeholder="R$ 15.000/mês" />
            </div>
          </CardContent>
        </Card>

        {/* About Company */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-primary" /> Sobre a Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Descrição da empresa</Label>
              <Textarea value={data.descricaoEmpresa} onChange={e => set('descricaoEmpresa', e.target.value)} placeholder="Descreva a empresa, cultura e momento atual..." rows={3} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Segmento</Label>
                <Input value={data.segmentoEmpresa} onChange={e => set('segmentoEmpresa', e.target.value)} placeholder="Tecnologia, Saúde..." />
              </div>
              <div className="space-y-1.5">
                <Label>Tamanho da empresa</Label>
                <Input value={data.tamanhoEmpresa} onChange={e => set('tamanhoEmpresa', e.target.value)} placeholder="50-100 colaboradores" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Structure */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users2 className="h-4 w-4 text-primary" /> Estrutura do Cargo
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Área do cargo</Label>
              <Input value={data.areaCargo} onChange={e => set('areaCargo', e.target.value)} placeholder="Comercial, Marketing..." />
            </div>
            <div className="space-y-1.5">
              <Label>Reporta-se a</Label>
              <Input value={data.respondePara} onChange={e => set('respondePara', e.target.value)} placeholder="Diretor Comercial" />
            </div>
            <div className="space-y-1.5">
              <Label>Gerencia equipe?</Label>
              <Select value={data.gerenciaEquipe} onValueChange={v => set('gerenciaEquipe', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="nao">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {data.gerenciaEquipe === 'sim' && (
              <div className="space-y-1.5">
                <Label>Quantidade de pessoas</Label>
                <Input value={data.qtdEquipe} onChange={e => set('qtdEquipe', e.target.value)} placeholder="5" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Responsibilities & KPIs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4 text-primary" /> Responsabilidades & KPIs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Responsabilidades principais</Label>
              <Textarea value={data.responsabilidades} onChange={e => set('responsabilidades', e.target.value)} placeholder="Uma responsabilidade por linha..." rows={5} />
            </div>
            <div className="space-y-1.5">
              <Label>Indicadores de performance (KPIs)</Label>
              <Textarea value={data.kpis} onChange={e => set('kpis', e.target.value)} placeholder="Um KPI por linha..." rows={4} />
            </div>
          </CardContent>
        </Card>

        {/* Profile & Requirements */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-primary" /> Perfil & Requisitos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Perfil ideal</Label>
              <Textarea value={data.perfilIdeal} onChange={e => set('perfilIdeal', e.target.value)} placeholder="Características comportamentais desejadas..." rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Requisitos obrigatórios</Label>
              <Textarea value={data.requisitosObrigatorios} onChange={e => set('requisitosObrigatorios', e.target.value)} placeholder="Requisitos mínimos para a vaga..." rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Diferenciais (opcional)</Label>
              <Textarea value={data.diferenciais} onChange={e => set('diferenciais', e.target.value)} placeholder="Diferenciais desejados..." rows={3} />
            </div>
          </CardContent>
        </Card>

        {/* Result */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" /> Resultado Esperado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Label>Impacto esperado do cargo na empresa</Label>
              <Textarea value={data.resultadoEsperado} onChange={e => set('resultadoEsperado', e.target.value)} placeholder="Descreva o impacto que este profissional deve causar..." rows={3} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button size="lg" onClick={handleGenerate} disabled={!canGenerate} className="gap-2">
            Gerar Job Description <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // ─── Step 2: Preview & Download ────────────────────
  const mission = generateMissionText(data);

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => setStep(1)} className="gap-2 mb-2">
        <ArrowLeft className="h-4 w-4" /> Voltar ao formulário
      </Button>

      <Card className="border-primary/20">
        <CardContent className="p-6 md:p-8 space-y-6">
          {/* Header */}
          <div className="border-b border-primary/20 pb-4">
            <h2 className="text-xl md:text-2xl font-bold text-primary">📋 JOB DESCRIPTION</h2>
            <p className="text-lg font-semibold text-foreground mt-1">{data.cargo}</p>
          </div>

          {/* Quick info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">🏢 Empresa:</span> <span className="font-medium text-foreground">{data.empresa}</span></div>
            <div><span className="text-muted-foreground">📍 Local:</span> <span className="font-medium text-foreground">{data.local || '—'}</span></div>
            <div><span className="text-muted-foreground">📄 Contratação:</span> <span className="font-medium text-foreground">{data.modeloContratacao || '—'}</span></div>
            <div><span className="text-muted-foreground">💰 Salário Fixo:</span> <span className="font-medium text-foreground">{data.salarioFixo || '—'}</span></div>
            {data.salarioVariavel && <div><span className="text-muted-foreground">💰 Variável:</span> <span className="font-medium text-foreground">{data.salarioVariavel}</span></div>}
            {data.expectativaGanhos && <div><span className="text-muted-foreground">💰 Ganhos:</span> <span className="font-medium text-foreground">{data.expectativaGanhos}</span></div>}
          </div>

          {/* Sections */}
          {data.descricaoEmpresa && (
            <Section title="🧠 SOBRE A EMPRESA">
              <p className="text-sm text-muted-foreground">{data.descricaoEmpresa}</p>
            </Section>
          )}

          <Section title="🎯 MISSÃO DO CARGO">
            <p className="text-sm text-muted-foreground">{mission}</p>
          </Section>

          {data.responsabilidades && (
            <Section title="📌 PRINCIPAIS RESPONSABILIDADES">
              <BulletList text={data.responsabilidades} />
            </Section>
          )}

          {data.kpis && (
            <Section title="📊 INDICADORES DE PERFORMANCE (KPIs)">
              <BulletList text={data.kpis} />
            </Section>
          )}

          {data.perfilIdeal && (
            <Section title="👤 PERFIL IDEAL">
              <BulletList text={data.perfilIdeal} />
            </Section>
          )}

          {data.requisitosObrigatorios && (
            <Section title="📚 REQUISITOS">
              <BulletList text={data.requisitosObrigatorios} />
            </Section>
          )}

          {data.diferenciais && (
            <Section title="🚀 DIFERENCIAIS">
              <BulletList text={data.diferenciais} />
            </Section>
          )}

          {data.resultadoEsperado && (
            <Section title="📈 RESULTADO ESPERADO">
              <p className="text-sm text-muted-foreground">{data.resultadoEsperado}</p>
            </Section>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button size="lg" onClick={handleDownload} className="gap-2">
          <Download className="h-4 w-4" /> Baixar PDF
        </Button>
      </div>

      {step === 3 && (
        <div className="flex items-center justify-center gap-2 text-sm text-green-600">
          <CheckCircle2 className="h-4 w-4" /> PDF baixado com sucesso!
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-foreground text-sm">{title}</h3>
      {children}
    </div>
  );
}

function BulletList({ text }: { text: string }) {
  return (
    <ul className="space-y-1.5">
      {splitLines(text).map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
          <span className="text-primary mt-0.5">●</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
