/**
 * IPROMED - Jurisprudências
 * Pesquisa de jurisprudências integrada ao Jusbrasil
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Search,
  ExternalLink,
  BookOpen,
  Scale,
  FileText,
  Clock,
  Building,
  Filter,
  Bookmark,
  Copy,
  Share2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

// Legal matters relevant to medical professionals
const legalMatters = [
  { id: 'civel', label: 'Cível', description: 'Responsabilidade civil médica, danos morais e materiais' },
  { id: 'penal', label: 'Criminal/Penal', description: 'Crimes contra a vida, lesão corporal, exercício ilegal' },
  { id: 'trabalho', label: 'Trabalhista', description: 'Relações de trabalho, vínculos, rescisões' },
  { id: 'consumidor', label: 'Consumidor', description: 'CDC aplicado à saúde, inversão do ônus' },
  { id: 'etico', label: 'Ético-Disciplinar', description: 'CRM, CFM, processos éticos' },
  { id: 'administrativo', label: 'Administrativo', description: 'ANVISA, planos de saúde, SUS' },
  { id: 'previdenciario', label: 'Previdenciário', description: 'Aposentadoria, benefícios' },
];

// Common subjects in medical law
const commonSubjects = [
  'Erro médico',
  'Dano estético',
  'Perda de uma chance',
  'Consentimento informado',
  'Prontuário médico',
  'Sigilo profissional',
  'Responsabilidade hospitalar',
  'Cirurgia plástica',
  'Infecção hospitalar',
  'Diagnóstico tardio',
  'Morte encefálica',
  'Tratamento experimental',
  'Recusa de tratamento',
  'Transfusão de sangue',
  'Aborto legal',
  'Reprodução assistida',
];

// Courts and jurisdictions
const courts = [
  { id: 'stf', label: 'STF - Supremo Tribunal Federal' },
  { id: 'stj', label: 'STJ - Superior Tribunal de Justiça' },
  { id: 'tst', label: 'TST - Tribunal Superior do Trabalho' },
  { id: 'trf1', label: 'TRF 1ª Região' },
  { id: 'trf2', label: 'TRF 2ª Região' },
  { id: 'trf3', label: 'TRF 3ª Região' },
  { id: 'trf4', label: 'TRF 4ª Região' },
  { id: 'trf5', label: 'TRF 5ª Região' },
  { id: 'tjsp', label: 'TJSP - São Paulo' },
  { id: 'tjrj', label: 'TJRJ - Rio de Janeiro' },
  { id: 'tjmg', label: 'TJMG - Minas Gerais' },
  { id: 'tjrs', label: 'TJRS - Rio Grande do Sul' },
  { id: 'tjpr', label: 'TJPR - Paraná' },
  { id: 'tjsc', label: 'TJSC - Santa Catarina' },
  { id: 'tjba', label: 'TJBA - Bahia' },
  { id: 'tjpe', label: 'TJPE - Pernambuco' },
  { id: 'tjce', label: 'TJCE - Ceará' },
  { id: 'tjdf', label: 'TJDF - Distrito Federal' },
];

interface SearchFilters {
  tema: string;
  materia: string;
  assunto: string;
  tribunal: string;
  dataInicio: string;
  dataFim: string;
  relator: string;
  numeroProcesso: string;
}

interface JurisprudenciaResult {
  id: string;
  titulo: string;
  ementa: string;
  tribunal: string;
  relator: string;
  dataJulgamento: string;
  numeroProcesso: string;
  materia: string;
  tema: string;
  link: string;
}

// Sample results for demonstration
const sampleResults: JurisprudenciaResult[] = [
  {
    id: '1',
    titulo: 'Responsabilidade Civil Médica - Cirurgia Plástica Estética',
    ementa: 'APELAÇÃO CÍVEL. RESPONSABILIDADE CIVIL. ERRO MÉDICO. CIRURGIA PLÁSTICA ESTÉTICA. OBRIGAÇÃO DE RESULTADO. DANOS MORAIS E ESTÉTICOS. A cirurgia plástica estética, por ser procedimento eletivo e com finalidade de melhorar a aparência do paciente, configura obrigação de resultado. Demonstrada a falha no procedimento e o dano estético sofrido pela autora, cabível a reparação.',
    tribunal: 'TJSP',
    relator: 'Des. Maria Helena Silva',
    dataJulgamento: '2024-03-15',
    numeroProcesso: '1234567-89.2023.8.26.0100',
    materia: 'Cível',
    tema: 'Erro Médico - Cirurgia Plástica',
    link: 'https://www.jusbrasil.com.br/jurisprudencia/1'
  },
  {
    id: '2',
    titulo: 'Dano Moral - Perda de uma Chance de Cura',
    ementa: 'RECURSO ESPECIAL. RESPONSABILIDADE CIVIL. ERRO DE DIAGNÓSTICO. PERDA DE UMA CHANCE. DANOS MORAIS. O atraso no diagnóstico que diminui as chances de cura do paciente configura dano moral indenizável pela teoria da perda de uma chance. A quantificação do dano deve considerar a probabilidade de sucesso do tratamento se realizado tempestivamente.',
    tribunal: 'STJ',
    relator: 'Min. João Carlos Santos',
    dataJulgamento: '2024-01-20',
    numeroProcesso: '1.234.567 - SP',
    materia: 'Cível',
    tema: 'Perda de uma Chance',
    link: 'https://www.jusbrasil.com.br/jurisprudencia/2'
  },
  {
    id: '3',
    titulo: 'Consentimento Informado - Nulidade de Termo Genérico',
    ementa: 'APELAÇÃO CÍVEL. RESPONSABILIDADE MÉDICA. CONSENTIMENTO INFORMADO. TERMO GENÉRICO. NULIDADE. O Termo de Consentimento Livre e Esclarecido deve conter informações específicas sobre o procedimento, riscos e alternativas. Termo genérico e padronizado não supre o dever de informação, ensejando responsabilidade por violação do direito à autodeterminação do paciente.',
    tribunal: 'TJRS',
    relator: 'Des. Ana Paula Ferreira',
    dataJulgamento: '2023-11-28',
    numeroProcesso: '0987654-32.2022.8.21.0001',
    materia: 'Cível',
    tema: 'Consentimento Informado',
    link: 'https://www.jusbrasil.com.br/jurisprudencia/3'
  },
];

export default function JurisprudenciasPage() {
  const [filters, setFilters] = useState<SearchFilters>({
    tema: '',
    materia: '',
    assunto: '',
    tribunal: '',
    dataInicio: '',
    dataFim: '',
    relator: '',
    numeroProcesso: '',
  });
  const [results, setResults] = useState<JurisprudenciaResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [savedSearches, setSavedSearches] = useState<string[]>([]);

  const handleSearch = async () => {
    if (!filters.tema && !filters.assunto && !filters.numeroProcesso) {
      toast.error('Informe ao menos um termo de busca');
      return;
    }

    setIsSearching(true);
    
    // Simulate search delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // In production, this would call the Jusbrasil API or web scraping service
    setResults(sampleResults);
    setIsSearching(false);
    
    toast.success(`${sampleResults.length} resultados encontrados`);
  };

  const handleJusbrasilSearch = () => {
    const searchTerm = filters.tema || filters.assunto || 'erro médico';
    const url = `https://www.jusbrasil.com.br/jurisprudencia/busca?q=${encodeURIComponent(searchTerm)}`;
    window.open(url, '_blank');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência');
  };

  const saveSearch = () => {
    const searchKey = `${filters.materia} - ${filters.tema || filters.assunto}`;
    if (!savedSearches.includes(searchKey)) {
      setSavedSearches([...savedSearches, searchKey]);
      toast.success('Pesquisa salva');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Scale className="h-6 w-6 text-primary" />
            Jurisprudências
          </h1>
          <p className="text-sm text-muted-foreground">
            Pesquise decisões judiciais e precedentes relevantes para Direito Médico
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleJusbrasilSearch}>
          <ExternalLink className="h-4 w-4" />
          Abrir no Jusbrasil
        </Button>
      </div>

      {/* Quick Search by Subject */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Temas Frequentes em Direito Médico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {commonSubjects.map(subject => (
              <Badge 
                key={subject}
                variant="outline"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => {
                  setFilters(prev => ({ ...prev, assunto: subject }));
                  toast.info(`Filtro aplicado: ${subject}`);
                }}
              >
                {subject}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search Form */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Pesquisa de Jurisprudências
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showAdvanced ? 'Ocultar Filtros' : 'Mais Filtros'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Search */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tema / Palavra-chave</Label>
              <Input
                value={filters.tema}
                onChange={(e) => setFilters(prev => ({ ...prev, tema: e.target.value }))}
                placeholder="Ex: erro médico, dano estético..."
              />
            </div>
            <div className="space-y-2">
              <Label>Matéria</Label>
              <Select
                value={filters.materia}
                onValueChange={(v) => setFilters(prev => ({ ...prev, materia: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas</SelectItem>
                  {legalMatters.map(matter => (
                    <SelectItem key={matter.id} value={matter.id}>
                      {matter.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tribunal</Label>
              <Select
                value={filters.tribunal}
                onValueChange={(v) => setFilters(prev => ({ ...prev, tribunal: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos</SelectItem>
                  {courts.map(court => (
                    <SelectItem key={court.id} value={court.id}>
                      {court.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvanced && (
            <div className="grid grid-cols-4 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>Número do Processo</Label>
                <Input
                  value={filters.numeroProcesso}
                  onChange={(e) => setFilters(prev => ({ ...prev, numeroProcesso: e.target.value }))}
                  placeholder="0000000-00.0000.0.00.0000"
                />
              </div>
              <div className="space-y-2">
                <Label>Relator</Label>
                <Input
                  value={filters.relator}
                  onChange={(e) => setFilters(prev => ({ ...prev, relator: e.target.value }))}
                  placeholder="Nome do relator"
                />
              </div>
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={filters.dataInicio}
                  onChange={(e) => setFilters(prev => ({ ...prev, dataInicio: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={filters.dataFim}
                  onChange={(e) => setFilters(prev => ({ ...prev, dataFim: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-2">
              <Button onClick={handleSearch} disabled={isSearching} className="gap-2">
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Pesquisar
              </Button>
              <Button variant="outline" onClick={saveSearch}>
                <Bookmark className="h-4 w-4 mr-2" />
                Salvar Pesquisa
              </Button>
            </div>
            <Button 
              variant="ghost" 
              onClick={() => setFilters({
                tema: '',
                materia: '',
                assunto: '',
                tribunal: '',
                dataInicio: '',
                dataFim: '',
                relator: '',
                numeroProcesso: '',
              })}
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Legal Matters Reference */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Matérias Jurídicas - Profissionais de Saúde
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {legalMatters.map(matter => (
              <div 
                key={matter.id}
                className="p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
                onClick={() => setFilters(prev => ({ ...prev, materia: matter.id }))}
              >
                <div className="font-medium">{matter.label}</div>
                <div className="text-sm text-muted-foreground">{matter.description}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                Resultados ({results.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="space-y-3">
              {results.map(result => (
                <AccordionItem key={result.id} value={result.id} className="border rounded-lg">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-start gap-3 text-left">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Scale className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold">{result.titulo}</div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <Badge variant="outline">{result.tribunal}</Badge>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(result.dataJulgamento).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {result.relator}
                          </span>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">EMENTA</Label>
                        <p className="text-sm mt-1">{result.ementa}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <Label className="text-xs text-muted-foreground">NÚMERO DO PROCESSO</Label>
                          <p className="font-mono mt-1">{result.numeroProcesso}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">MATÉRIA</Label>
                          <p className="mt-1">{result.materia}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">TEMA</Label>
                          <p className="mt-1">{result.tema}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(result.link, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Ver Inteiro Teor
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => copyToClipboard(result.ementa)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar Ementa
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => copyToClipboard(`${result.titulo}\n${result.tribunal} - ${result.numeroProcesso}\n${result.ementa}`)}
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Compartilhar
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {results.length === 0 && !isSearching && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Pesquise Jurisprudências</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Use os filtros acima para encontrar decisões judiciais relevantes para seus casos.
              Você também pode clicar nos temas frequentes para busca rápida.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bookmark className="h-4 w-4" />
              Pesquisas Salvas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {savedSearches.map((search, idx) => (
                <Badge 
                  key={idx}
                  variant="secondary"
                  className="cursor-pointer"
                >
                  {search}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
